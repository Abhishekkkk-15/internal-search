import { getNvidiaChatClient, CHAT_MODELS } from "../client";
import { embeddingService } from "../embeddings";

export class RagService {
  /**
   * Generates a response based on the query and retrieved context from documents.
   */
  async generateResponse(query: string) {
    // 1. Retrieve relevant documents using the embedding service
    const documents = await embeddingService.searchDocuments(query, 5);

    // 2. Extract content from documents to build the context
    const context = (documents as any[])
      .map(
        (doc, index) =>
          `[Source ${index + 1}]: ${doc.title}\nContent: ${doc.content}\nURL: ${doc.url}`
      )
      .join("\n\n---\n\n");

    // 3. Prepare the chat client
    const chatClient = getNvidiaChatClient(CHAT_MODELS.SMART_EXTRA);

    // 4. Construct the prompt
    const systemPrompt = `
      You are Nexus Assistant, a high-performance internal knowledge expert.
      Your goal is to answer the user's query based ONLY on the provided context from internal documents.
      
      Guidelines:
      - Be concise and professional.
      - If the answer is not in the context, say "I couldn't find specific information on that in our internal knowledge base."
      - Always cite your sources using [Source X] format.
      - Mention the URL if relevant for the user to follow up.
      
      Context:
      ${context || "No relevant internal documents found."}
    `;

    // 5. Get completion
    const response = await chatClient.invoke([
      { role: "system", content: systemPrompt },
      { role: "user", content: query },
    ]);

    return {
      text: response.content,
      sources: documents,
    };
  }
}

export const ragService = new RagService();
