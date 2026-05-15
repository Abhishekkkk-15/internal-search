import type { Request, Response } from "express";
import { getInvdiaClient } from "@nexus/ai";
import { ChatOpenAI } from "@langchain/openai";

export class ChatController {
  agent: ChatOpenAI;
  constructor() {
    this.agent = getInvdiaClient("meta/llama-3.1-8b-instruct");
  }

  async handleChat(req: Request, res: Response) {
    console.log("got here");

    try {
      const { messages } = req.body;

      const response = await this.agent.invoke(
        messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
          options: {},
        })),
      );
      console.log("after llm");

      console.log(response);

      return res.status(200).json(response);
    } catch (error) {
      console.error("Error handling chat request:", error);

      return res.status(500).json({
        message: "Internal server error",
      });
    }
  }
}
