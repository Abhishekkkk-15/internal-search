import type { Request, Response } from "express";
import { getInvdiaClient } from "@nexus/ai";
import { ChatOpenAI } from "@langchain/openai";
import { prisma } from "@nexus/database";
export class ChatController {
  agent: ChatOpenAI;
  constructor() {
    this.agent = getInvdiaClient("meta/llama-3.1-8b-instruct");
  }

  async handleChat(req: Request, res: Response) {
    console.log("got here");

    try {
      const { messages } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      // Get or create conversation
      let conversation = await prisma.conversation.findFirst({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });

      if (!conversation) {
        conversation = await prisma.conversation.create({
          data: { userId, title: "New Chat" },
        });
      }

      const response = await this.agent.invoke(
        messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
          options: {},
        })),
      );

      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: "assistant",
          content: response.text,
        },
      });

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error handling chat request:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }

  async getConversations(req: Request, res: Response){
    const user = req.user 
    const conversations = await prisma.conversation.findMany({
      where:{
        userId: user?.id
      },
      include:{
        messages: true
      }
    })

    const pay = conversations ? conversations : []
    return res.status(200).json({pay})
  }


}
