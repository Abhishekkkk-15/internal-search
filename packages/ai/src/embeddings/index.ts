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

    async searchDocuments(query: string, organizationId: string, sources: string[] = [], limit: number = 5, mode: 'hybrid' | 'semantic' | 'keyword' = 'hybrid'){
        const apiKey = process.env.INVDIA_API_KEY;
        let queryEmbedding: number[] = [];

        // 1. Only get embeddings if needed (hybrid or semantic)
        if (mode !== 'keyword') {
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
            try {
                const result = JSON.parse(text);
                if (!response.ok) throw new Error(JSON.stringify(result));
                queryEmbedding = result.data[0].embedding;
            } catch (e) {
                console.error(`[EmbeddingService] Failed to generate embeddings: ${text}`);
                throw new Error(`Embedding failed: ${text.substring(0, 100)}`);
            }
        }

        const embeddingString = queryEmbedding.length > 0 ? `[${queryEmbedding.join(',')}]` : '[]';
        const sourceFilter = sources.length > 0 
            ? Prisma.raw(`AND source IN (${sources.map(s => `'${s}'`).join(',')})`) 
            : Prisma.raw('');

        // 2. Perform Search based on Mode
        if (mode === 'semantic') {
            return await prisma.$queryRaw`
                SELECT id, title, content, source, url, author, 
                       1 - (embedding <=> ${embeddingString}::vector) as semantic_score,
                       0.0 as keyword_score,
                       1.0 / (60 + ROW_NUMBER() OVER (ORDER BY embedding <=> ${embeddingString}::vector)) as rrf_score
                FROM "Document"
                WHERE "organizationId" = ${organizationId}
                ${sourceFilter}
                ORDER BY embedding <=> ${embeddingString}::vector
                LIMIT ${limit};
            ` as any[];
        }

        if (mode === 'keyword') {
            return await prisma.$queryRaw`
                SELECT id, title, content, source, url, author, 
                       0.0 as semantic_score,
                       ts_rank_cd(to_tsvector('english', title || ' ' || content), websearch_to_tsquery('english', ${query})) as keyword_score,
                       1.0 / (60 + ROW_NUMBER() OVER (ORDER BY ts_rank_cd(to_tsvector('english', title || ' ' || content), websearch_to_tsquery('english', ${query})) DESC)) as rrf_score
                FROM "Document"
                WHERE "organizationId" = ${organizationId}
                ${sourceFilter}
                AND to_tsvector('english', title || ' ' || content) @@ websearch_to_tsquery('english', ${query})
                ORDER BY keyword_score DESC
                LIMIT ${limit};
            ` as any[];
        }

        // Hybrid (Default)
        const documents = await prisma.$queryRaw`
            WITH semantic_search AS (
                SELECT id, 
                       ROW_NUMBER() OVER (ORDER BY embedding <=> ${embeddingString}::vector) as rank,
                       1 - (embedding <=> ${embeddingString}::vector) as similarity
                FROM "Document"
                WHERE "organizationId" = ${organizationId}
                ${sourceFilter}
                ORDER BY embedding <=> ${embeddingString}::vector
                LIMIT 50
            ),
            keyword_search AS (
                SELECT id,
                       ROW_NUMBER() OVER (ORDER BY ts_rank_cd(to_tsvector('english', title || ' ' || content), websearch_to_tsquery('english', ${query})) DESC) as rank,
                       ts_rank_cd(to_tsvector('english', title || ' ' || content), websearch_to_tsquery('english', ${query})) as score
                FROM "Document"
                WHERE "organizationId" = ${organizationId}
                ${sourceFilter}
                AND to_tsvector('english', title || ' ' || content) @@ websearch_to_tsquery('english', ${query})
                ORDER BY score DESC
                LIMIT 50
            )
            SELECT d.id, d.title, d.content, d.source, d.url, d.author,
                   COALESCE(1.0 / (60 + s.rank), 0.0) + COALESCE(1.0 / (60 + k.rank), 0.0) as rrf_score,
                   COALESCE(s.similarity, 0.0) as semantic_score,
                   COALESCE(k.score, 0.0) as keyword_score
            FROM "Document" d
            LEFT JOIN semantic_search s ON d.id = s.id
            LEFT JOIN keyword_search k ON d.id = k.id
            WHERE s.id IS NOT NULL OR k.id IS NOT NULL
            ORDER BY rrf_score DESC
            LIMIT ${limit};
        `;

        return documents as any[];
    }

}

export const embeddingService = new EmbeddingService();