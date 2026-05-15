import { OpenAIEmbeddings } from "@langchain/openai";
import { getNvidiaEmbedClient } from "../client";
import { prisma } from "@nexus/database";

class EmbeddingService {
    private openai: OpenAIEmbeddings;

    constructor() {
        this.openai = getNvidiaEmbedClient();
    }

    async generateEmbeddings(texts: string[]) {
        const embeddings = await this.openai.embedDocuments(texts);
        return embeddings;
    }

    async searchDocuments(query: string, limit: number = 5){
        // 1. Convert the query text into a vector
        const queryEmbedding = await this.openai.embedQuery(query);
        const embeddingString = `[${queryEmbedding.join(',')}]`;

        // 2. Perform a cosine distance (<=>) search against our PostgreSQL database
        const documents = await prisma.$queryRaw`
            SELECT id, title, content, source, url, author, 
                   1 - (embedding <=> ${embeddingString}::vector) as similarity
            FROM "Document"
            ORDER BY embedding <=> ${embeddingString}::vector
            LIMIT ${limit};
        `;

        return documents;
    }

}

export const embeddingService = new EmbeddingService();