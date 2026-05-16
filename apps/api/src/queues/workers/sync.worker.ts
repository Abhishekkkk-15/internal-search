import { Worker, Job } from 'bullmq';
import { prisma } from '../../lib/prisma';
import { SlackService, NotionService, GitHubService } from '../../lib/connectors';
import { embeddingService } from '@nexus/ai';
import { redisConnection } from '../../config/redis';

export const syncWorker = new Worker(
  'sync-documents',
  async (job: Job) => {
    const { organizationId } = job.data;
    console.log(`[Sync Worker] Processing sync for Org ${organizationId}...`);

    // 1. Find all active connections for this org
    const connections = await prisma.connection.findMany({
      where: { 
        organizationId,
        status: 'connected', 
        accessToken: { not: null } 
      }
    });

    if (connections.length === 0) {
      console.log(`[Sync Worker] No active connections found for Org ${organizationId}`);
      return;
    }

    for (const connection of connections) {
      console.log(`[Sync Worker] Syncing ${connection.source} for Org ${organizationId}...`);
      
      let rawDocuments: any[] = [];

      try {
        // 2. Fetch data based on the source platform
        switch (connection.source) {
          case 'slack':
            const slack = new SlackService(connection.accessToken!);
            rawDocuments = await slack.fetchRecentMessages();
            break;
          case 'notion':
            const notion = new NotionService(connection.accessToken!);
            rawDocuments = await notion.fetchRecentPages();
            break;
          case 'github':
            const github = new GitHubService(connection.accessToken!);
            rawDocuments = await github.fetchRecentIssues();
            break;
          default:
            console.log(`[Sync Worker] No extraction service configured for ${connection.source}`);
        }

        // 3. Process and embed documents
        for (const doc of rawDocuments) {
          if (!doc.content || doc.content.trim().length === 0) {
            console.log(`[Sync Worker] Skipping empty document: ${doc.title}`);
            continue;
          }
          try {
            // Truncate content to avoid token limits (512 tokens is roughly 1000 characters for safety)
            const truncatedContent = doc.content.length > 1000 ? doc.content.substring(0, 1000) + "..." : doc.content;

            // Generate embedding for the content
            const embeddings = await embeddingService.generateEmbeddings([truncatedContent]);
            if (!embeddings || embeddings.length === 0) continue;
            
            const embedding = embeddings[0];
            const embeddingString = `[${embedding.join(',')}]`;

            // Insert into DB with vector
            await prisma.$executeRaw`
              INSERT INTO "Document" ("id", "organizationId", "source", "title", "content", "author", "url", "embedding")
              VALUES (
                gen_random_uuid(), 
                ${organizationId}, 
                ${doc.source}, 
                ${doc.title}, 
                ${truncatedContent}, 
                ${doc.author}, 
                ${doc.url}, 
                ${embeddingString}::vector
              )
            `;
          } catch (embedError: any) {
            console.error(`[Sync Worker] Failed to embed document: ${doc.title}`, embedError.message);
          }
        }

        // 4. Update sync stats
        await prisma.connection.update({
          where: { id: connection.id },
          data: { 
            lastSync: new Date(),
            indexedCount: { increment: rawDocuments.length }
          }
        });

        console.log(`[Sync Worker] Completed ${connection.source} for Org ${organizationId}`);

      } catch (error: any) {
        console.error(`[Sync Worker] Error syncing ${connection.source}:`, error.message);
      }
    }
  },
  { connection: redisConnection }
);

syncWorker.on('completed', (job: Job) => {
  console.log(`[Sync Worker] Job ${job.id} completed successfully`);
});

syncWorker.on('failed', (job: Job | undefined, err: Error) => {
  console.error(`[Sync Worker] Job ${job?.id} failed:`, err.message);
});
