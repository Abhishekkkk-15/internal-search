import { OpenAIEmbeddings } from "@langchain/openai";
import { getNvidiaEmbedClient, CHAT_MODELS } from "../client";
import { prisma, Prisma } from "@nexus/database";

class EmbeddingService {
    private openai: OpenAIEmbeddings;

    constructor() {
        this.openai = getNvidiaEmbedClient();
    }

    async generateEmbeddings(texts: string[]) {
        const apiKey = process.env.INVDIA_API_KEY;
        
        // NVIDIA NIM requires 'input_type' for e5-v5 and other models
        const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                input: texts,
                model: CHAT_MODELS.EMBED,
                input_type: "passage",
                encoding_format: "float"
            })
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error(`[EmbeddingService] Failed to parse JSON. Raw response: "${text}"`);
            throw new Error(`Invalid JSON response from NVIDIA: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
            throw new Error(JSON.stringify(result));
        }

        return result.data.map((item: any) => item.embedding);
    }

    async searchDocuments(query: string, organizationId: string, sources: string[] = [], limit: number = 5){
        const apiKey = process.env.INVDIA_API_KEY;

        // 1. Convert the query text into a vector using 'query' input_type
        const response = await fetch("https://integrate.api.nvidia.com/v1/embeddings", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                input: [query],
                model: CHAT_MODELS.EMBED,
                input_type: "query",
                encoding_format: "float"
            })
        });

        const text = await response.text();
        let result;
        try {
            result = JSON.parse(text);
        } catch (e) {
            console.error(`[EmbeddingService] Failed to parse JSON in search. Raw response: "${text}"`);
            throw new Error(`Invalid JSON response from NVIDIA: ${text.substring(0, 100)}`);
        }

        if (!response.ok) {
            throw new Error(JSON.stringify(result));
        }

        const queryEmbedding = result.data[0].embedding;
        const embeddingString = `[${queryEmbedding.join(',')}]`;


        // 2. Perform a cosine distance (<=>) search against our PostgreSQL database
        // We filter by organizationId AND optionally by source list
        const documents = await prisma.$queryRaw`
            SELECT id, title, content, source, url, author, 
                   1 - (embedding <=> ${embeddingString}::vector) as similarity
            FROM "Document"
            WHERE "organizationId" = ${organizationId}
            ${sources.length > 0 ? Prisma.raw(`AND source IN (${sources.map(s => `'${s}'`).join(',')})`) : Prisma.raw('')}
            ORDER BY embedding <=> ${embeddingString}::vector
            LIMIT ${limit};
        `;

        return documents as any[];
    }

}

export const embeddingService = new EmbeddingService();