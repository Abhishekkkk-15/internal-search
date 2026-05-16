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
    this.agent = getNvidiaChatClient(CHAT_MODELS.FAST);
  }

  async handleChat(req: AuthenticatedRequest, res: Response) {
    try {
      const { messages, scope } = req.body;
      const userId = req.user?.id;
      const organizationId = req.headers['x-organization-id'] as string || req.user?.organizationId;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // 1. Get or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { userId, title: "New Chat" },
        });
      }

      // 2. Extract user query
      const userQuery = messages[messages.length - 1].content;
      
      // 3. Search Context (RAG) with Source Filtering
      const contextDocs = await embeddingService.searchDocuments(userQuery, organizationId, scope || [], 3);
      
      const contextText = contextDocs.length > 0 
        ? contextDocs.map((doc: any) => `Source: ${doc.title}\nContent: ${doc.content}`).join("\n\n")
        : "No relevant documents found.";

      // 4. Set Headers for Streaming
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      // 5. Stream the response
      const systemPrompt = `You are Nexus Assistant, a premium AI expert. 
Answer the user's question based ONLY on the following context.
CONTEXT:
${contextText}`;

      const stream = await this.agent.stream([
        { role: "system", content: systemPrompt },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
        }))
      ]);

      let fullContent = "";

      // Send search results first
      res.write(JSON.stringify({ 
        type: 'searchResults', 
        data: contextDocs.map((d: any) => ({ 
          id: d.id,
          title: d.title, 
          url: d.url,
          source: d.source,
          snippet: d.content?.substring(0, 200) + "...",
          relevanceScore: d.similarity || 0,
          author: d.author || "System"
        })) 
      }) + "\n");

      for await (const chunk of stream) {
        const content = chunk.content as string;
        fullContent += content;
        res.write(JSON.stringify({ type: 'text', content }) + "\n");
      }

      // 6. Persist final messages in background
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "user",
          content: userQuery,
        },
      });

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: fullContent,
          searchResults: contextDocs.map((d: any) => ({ 
            id: d.id,
            title: d.title, 
            url: d.url,
            source: d.source,
            snippet: d.content?.substring(0, 200) + "...",
            relevanceScore: d.similarity || 0,
            author: d.author || "System"
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

  async getConversations(req: AuthenticatedRequest, res: Response){
    const user = req.user 
    const conversations = await prisma.conversation.findMany({
      where:{
        userId: user?.id
      },
      include:{
        messages: {
          orderBy: { timestamp: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    const pay = conversations ? conversations : []
    return res.status(200).json({pay})
  }

  async handleSearch(req: AuthenticatedRequest, res: Response) {
    try {
      const { query, scope } = req.body;
      const organizationId = req.headers['x-organization-id'] as string || req.user?.organizationId;

      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      const results = await embeddingService.searchDocuments(query, organizationId, scope || [], 10);

      return res.status(200).json({
        data: results,
        metadata: {
          count: results.length,
          query,
          method: "Hybrid (pgvector + tsvector via RRF)"
        }
      });
    } catch (error) {
      console.error("Error in hybrid search:", error);
      return res.status(500).json({ message: "Internal server error" });
    }
  }

}
