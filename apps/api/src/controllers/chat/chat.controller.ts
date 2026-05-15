import OpenAI from "openai";
import type { Request, Response } from "express";

export class ChatController {
  constructor(private openai: OpenAI) {}

  async handleChat(req: Request, res: Response) {
    console.log("got here");

    try {
      const { messages } = req.body;

      const response = await this.openai.chat.completions.create({
        model: "meta/llama-3.1-8b-instruct",
        messages: messages.map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content,
        })),
      });
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
