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

      // 1. Fetch Org Settings for Tool Enforcement
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
      });

      const enabledTools = (organization?.enabledTools as any) || {
        jira: true,
        slack: true,
        notion: false,
        drive: false
      };

      // 2. Filter available tools
      const { createJiraTicketTool, sendSlackMessageTool, updateNotionPageTool } = require("@nexus/ai");
      const availableTools: any[] = [];
      if (enabledTools.jira) availableTools.push(createJiraTicketTool);
      if (enabledTools.slack) availableTools.push(sendSlackMessageTool);
      if (enabledTools.notion) availableTools.push(updateNotionPageTool);

      // Bind tools to the client
      const agentWithTools = availableTools.length > 0 
        ? this.agent.bindTools(availableTools)
        : this.agent;

      // 3. Get or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { userId, title: "New Chat" },
        });
      }

      // 4. Extract user query & RAG
      const userQuery = messages[messages.length - 1].content;
      const contextDocs = await embeddingService.searchDocuments(userQuery, organizationId, scope || [], 3);
      
      const contextText = contextDocs.length > 0 
        ? contextDocs.map((doc: any) => `Source: ${doc.title}\nContent: ${doc.content}`).join("\n\n")
        : "No relevant documents found.";

      // 5. Streaming setup
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');

      const systemPrompt = `You are Nexus Assistant, a premium AI expert. 
Answer the user's question based ONLY on the following context.
If the user asks to create a ticket, send a message, or update a page, use the provided tools if they are available.
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
          relevanceScore: d.similarity || 0,
          author: d.author || "System"
        })) 
      }) + "\n");

      // 6. Execute Agent Call
      const response = await agentWithTools.invoke([
        { role: "system", content: systemPrompt },
        ...messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
        }))
      ]);

      let fullContent = "";

      // Handle Tool Calls
      if (response.tool_calls && response.tool_calls.length > 0) {
        for (const toolCall of response.tool_calls) {
          res.write(JSON.stringify({ 
            type: 'text', 
            content: `\n\n> 🛠️ **Nexus Action Triggered:** ${toolCall.name}\n> Parameters: ${JSON.stringify(toolCall.args)}\n\n` 
          }) + "\n");
          
          // Execute actual tool (Mock)
          let toolResult = "";
          if (toolCall.name === "create_jira_ticket") toolResult = `Successfully created Jira ticket: ${toolCall.args.title}`;
          if (toolCall.name === "send_slack_message") toolResult = `Sent Slack message to #${toolCall.args.channel}`;
          if (toolCall.name === "update_notion_page") toolResult = `Updated Notion page ${toolCall.args.pageId}`;

          fullContent += `\n[Tool Executed: ${toolCall.name} - ${toolResult}]\n`;
          res.write(JSON.stringify({ type: 'text', content: `✅ ${toolResult}\n\n` }) + "\n");
        }
      }

      // Handle Text Response
      if (response.content) {
        const content = response.content as string;
        fullContent += content;
        res.write(JSON.stringify({ type: 'text', content }) + "\n");
      }

      // 7. Persist messages
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
            relevanceScore: d.similarity || 0, author: d.author || "System"
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
      const { query, scope, mode } = req.body;
      const organizationId = req.headers['x-organization-id'] as string || req.user?.organizationId;

      if (!query) {
        return res.status(400).json({ message: "Query is required" });
      }

      const results = await embeddingService.searchDocuments(query, organizationId, scope || [], 10, mode || 'hybrid');

      return res.status(200).json({
        data: results,
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
