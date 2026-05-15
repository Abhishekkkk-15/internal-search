import { config } from "dotenv";
import { ChatOpenAI } from "@langchain/openai";
config();
export const CHAT_MODELS = {
  FAST: "meta/llama-3.1-8b-instruct",

  SMART: "meta/llama-3.1-70b-instruct",

  CHEAP: "mistralai/mistral-7b-instruct",

  CODER: "deepseek-ai/deepseek-coder",
} as const;

export type ChatModel = (typeof CHAT_MODELS)[keyof typeof CHAT_MODELS];
let clientInstance: ChatOpenAI | null = null;
export const getInvdiaClient = (model: ChatModel): ChatOpenAI => {
  const apiKey = process.env.INVDIA_API_KEY;
  if (!apiKey) {
    throw new Error("INVDIA_API_KEY environment variable is not set");
  }
  if (!clientInstance) {
    clientInstance = new ChatOpenAI({
      model,
      apiKey,
      temperature: 0.7,
      configuration: {
        baseURL: "https://integrate.api.nvidia.com/v1",
      },
    });
  }
  return clientInstance;
};
