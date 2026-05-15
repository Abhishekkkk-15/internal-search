import { prisma } from '../../lib/prisma';
import { SlackService, NotionService, GitHubService } from '../../lib/connectors';
import { embeddingService } from '@nexus/ai';

export const runSyncJob = async () => {
  console.log('[Sync Worker] Starting background data ingestion job...');
  
  // 1. Find all active connections
  const connections = await prisma.connection.findMany({
    where: { status: 'connected', accessToken: { not: null } }
  });

  for (const connection of connections) {
    console.log(`[Sync Worker] Syncing ${connection.source} for Org ${connection.organizationId}...`);
    
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
        // Generate embedding for the content
        const [embedding] = await embeddingService.generateEmbeddings([doc.content]);
        const embeddingString = `[${embedding.join(',')}]`;

        // We use a raw query because Prisma's Unsupported type for pgvector 
        // doesn't support standard .create() for the vector column yet.
        await prisma.$executeRaw`
          INSERT INTO "Document" ("id", "organizationId", "source", "title", "content", "author", "url", "embedding", "updatedAt")
          VALUES (
            gen_random_uuid(), 
            ${connection.organizationId}, 
            ${doc.source}, 
            ${doc.title}, 
            ${doc.content}, 
            ${doc.author}, 
            ${doc.url}, 
            ${embeddingString}::vector,
            now()
          )
        `;
      }

      // 4. Update sync timestamp and count
      await prisma.connection.update({
        where: { id: connection.id },
        data: { 
          lastSync: new Date(),
          indexedCount: { increment: rawDocuments.length }
        }
      });

      console.log(`[Sync Worker] Successfully ingested and embedded ${rawDocuments.length} documents from ${connection.source}`);

    } catch (error: any) {
      console.error(`[Sync Worker] Error syncing ${connection.source}:`, error.message);
    }
  }

  console.log('[Sync Worker] Job completed.');
};

    } catch (error: any) {
      console.error(`[Sync Worker] Error syncing ${connection.source}:`, error.message);
    }
  }

  console.log('[Sync Worker] Job completed.');
};
