import { config } from "dotenv";
import { ChatOpenAI ,OpenAIEmbeddings} from "@langchain/openai";
config();
export const CHAT_MODELS = {
  FAST: "meta/llama-3.1-8b-instruct",
  SMART: "meta/llama-3.1-70b-instruct",
  SMART_EXTRA: "meta/llama-3.1-405b-instruct",
  CHEAP: "mistralai/mistral-7b-instruct",
  CODER: "deepseek-ai/deepseek-coder",
  EMBED: "nvidia/nv-embed-v1"
} as const;

export type ChatModel = (typeof CHAT_MODELS)[keyof typeof CHAT_MODELS];

let chatClientInstance: ChatOpenAI | null = null;
let embedClientInstance: OpenAIEmbeddings | null = null;

export const getNvidiaChatClient = (model: Exclude<ChatModel, 'nvidia/nv-embedqa-e5-v5'>): ChatOpenAI => {
  const apiKey = process.env.INVDIA_API_KEY;
  if (!apiKey) {
    throw new Error("INVDIA_API_KEY environment variable is not set");
  }

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

export const getNvidiaEmbedClient = (model: 'nvidia/nv-embed-v1' = CHAT_MODELS.EMBED): OpenAIEmbeddings => {
  const apiKey = process.env.INVDIA_API_KEY;
  if (!apiKey) {
    throw new Error("INVDIA_API_KEY environment variable is not set");
  }

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
