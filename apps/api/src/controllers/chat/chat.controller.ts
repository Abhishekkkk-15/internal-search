import type { Request, Response } from "express";
import { getNvidiaChatClient, CHAT_MODELS, embeddingService } from "@nexus/ai";
import { ChatOpenAI } from "@langchain/openai";
import { prisma } from "@nexus/database";

interface AuthenticatedRequest extends Request {
  user?: any;
}

export class ChatController {
  agent: ChatOpenAI;
  constructor() {
    this.agent = getNvidiaChatClient(CHAT_MODELS.SMART);
  }

  async handleChat(req: AuthenticatedRequest, res: Response) {
    try {
      const { messages, scope } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Ensure User record exists in DB to prevent foreign key constraint P2003
      await prisma.user.upsert({
        where: { id: userId },
        update: {},
        create: {
          id: userId,
          email: req.user?.email || `${userId}@user.local`,
          name: req.user?.name || "Nexus User"
        }
      });

      // 1. Get or create conversation for user
      let conversation = await prisma.conversation.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { userId, title: "New Chat" },
        });
      }

      // 2. Extract user query & perform RAG search by userId for slack, notion, github
      const userQuery = messages[messages.length - 1].content;
      const activeScope = (scope && scope.length > 0) ? scope : ['slack', 'notion', 'github'];
      const rawContextDocs = await embeddingService.searchDocuments(userQuery, userId, activeScope, 5);
      console.log(rawContextDocs)
      // Filter search results: exclude documents with less than similarity score threshold
      const contextDocs = rawContextDocs.filter((d: any) => {
        const score = d.similarity ?? d.semantic_score ?? 0;
        return score >= 0.2;
      });

      const contextText = contextDocs.length > 0
        ? contextDocs.map((doc: any, i: number) => `[Source ${i + 1} - ${doc.source.toUpperCase()}]: ${doc.title}\nContent: ${doc.content}\nURL: ${doc.url || 'N/A'}`).join("\n\n---\n\n")
        : "No relevant documents found in your connected Slack, Notion, or GitHub sources.";

      // 3. Streaming setup
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      const systemPrompt = `You are Nexus Internal Knowledge Assistant.
Your goal is to answer the user's question accurately and concisely based ONLY on the provided context from their connected Slack, Notion, and GitHub documents.

Guidelines:
- If the answer is present in the context, answer directly and cite sources using [Source X].
- If the answer is NOT in the context, state: "I couldn't find relevant information on that in your connected Slack, Notion, or GitHub sources."
- Do not attempt to execute actions or pretend to trigger tools.

CONTEXT:
${contextText}`;

      // Send search results first
      res.write(JSON.stringify({
        type: 'searchResults',
        data: contextDocs.map((d: any) => ({
          id: d.id,
          title: d.title,
          url: d.url,
          source: d.source,
          snippet: d.content?.substring(0, 200) + "...",
          relevanceScore: d.similarity ?? d.semantic_score ?? 0,
          author: d.author || "System"
        }))
      }) + "\n");

      // 4. Execute LLM Call (Pure RAG, No Tools)
      const response = await this.agent.invoke([
        { role: "system", content: systemPrompt },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
        }))
      ]);

      const fullContent = (response.content as string) || "";
      res.write(JSON.stringify({ type: 'text', content: fullContent }) + "\n");

      // 5. Persist messages in DB
      await prisma.message.create({
        data: { conversationId: conversation.id, role: "user", content: userQuery },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: fullContent,
          searchResults: contextDocs.map((d: any) => ({
            id: d.id, title: d.title, url: d.url, source: d.source,
            snippet: d.content?.substring(0, 200) + "...",
            relevanceScore: d.similarity ?? d.semantic_score ?? 0, author: d.author || "System"
          })),
        },
      });

      res.end();
    } catch (error) {
      console.error("Error handling chat request:", error);
      if (!res.headersSent) {
        res.status(500).json({ message: "Internal server error" });
      } else {
        res.end();
      }
    }
  }

  async getConversations(req: AuthenticatedRequest, res: Response) {
    const user = req.user;
    const conversations = await prisma.conversation.findMany({
      where: {
        userId: user?.id
      },
      include: {
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const pay = conversations ? conversations : [];
    return res.status(200).json({ pay });
  }

  async handleSearch(req: AuthenticatedRequest, res: Response) {
    try {
      const { query, scope, sources, mode } = req.body;
      const userId = req.user?.id || (req.headers['x-user-id'] as string);

      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      const activeScope = (scope && scope.length > 0) ? scope : (sources && sources.length > 0) ? sources : ['slack', 'notion', 'github'];
      const rawResults = await embeddingService.searchDocuments(query, userId, activeScope, 20, mode || 'hybrid');

      const results = rawResults.filter((d: any) => {
        if (mode === 'keyword') return true;
        const score = d.similarity ?? d.semantic_score ?? 0;
        return score >= 0.2;
      });

      return res.status(200).json({
        data: results.map((d: any) => ({
          ...d,
          snippet: (d.content && d.content.trim().length > 0)
            ? (d.content.length > 200 ? d.content.substring(0, 200) + "..." : d.content)
            : `Notion Document: ${d.title}`,
          fullContent: (d.content && d.content.trim().length > 0) ? d.content : `Notion Document: ${d.title}`,
          relevanceScore: d.similarity ?? d.semantic_score ?? 0
        })),
        metadata: {
          count: results.length,
          query,
          mode: mode || 'hybrid',
          method: mode === 'hybrid' ? "Hybrid (pgvector + tsvector via RRF)" : mode === 'semantic' ? "Semantic (pgvector)" : "Keyword (tsvector)"
        }
      });
    } catch (error) {
      console.error("Error in hybrid search:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
}
