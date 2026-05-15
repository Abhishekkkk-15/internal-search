import { config } from "dotenv";
import OpenAI from "openai";
config();

let clientInstance: OpenAI | null = null;
export const getInvdiaClient = (): OpenAI => {
  const baseURL = "https://integrate.api.nvidia.com/v1";
  const apiKey = process.env.INVDIA_API_KEY;
  if (!apiKey) {
    throw new Error("INVDIA_API_KEY environment variable is not set");
  }
  if (!clientInstance) {
    clientInstance = new OpenAI({
      baseURL,
      apiKey,
    });
  }
  return clientInstance;
};
