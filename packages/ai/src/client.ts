import { config } from "dotenv";
import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";
config();
export const CHAT_MODELS = {
  FAST: "meta/llama-3.1-8b-instruct",
  SMART: "meta/llama-3.1-70b-instruct",
  SMART_EXTRA: "meta/llama-3.1-405b-instruct",
  CHEAP: "mistralai/mistral-7b-instruct",
  CODER: "deepseek-ai/deepseek-coder",
  EMBED: "nemotron-3-embed-1b",
} as const;

export type ChatModel = (typeof CHAT_MODELS)[keyof typeof CHAT_MODELS];

let chatClientInstance: ChatOpenAI | null = null;
let embedClientInstance: OpenAIEmbeddings | null = null;

export const getNvidiaChatClient = (
  model: Exclude<ChatModel, "nvidia/nv-embedqa-e5-v5">,
): ChatOpenAI => {
  const apiKey = process.env.INVDIA_API_KEY || "dummy_api_key_for_build";

  if (!chatClientInstance) {
    chatClientInstance = new ChatOpenAI({
      model,
      apiKey,
      temperature: 0.7,
      configuration: {
        baseURL: "https://integrate.api.nvidia.com/v1",
      },
    });
  }
  return chatClientInstance;
};

export const getNvidiaEmbedClient = (
  model: "nemotron-3-embed-1b" = CHAT_MODELS.EMBED,
): OpenAIEmbeddings => {
  const apiKey = process.env.INVDIA_API_KEY || "dummy_api_key_for_build";

  if (!embedClientInstance) {
    embedClientInstance = new OpenAIEmbeddings({
      modelName: model,
      apiKey,
      configuration: {
        baseURL: "https://integrate.api.nvidia.com/v1",
      },
    });
  }
  return embedClientInstance;
};
