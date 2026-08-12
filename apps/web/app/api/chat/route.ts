import { NextRequest } from 'next/server';
import { prisma } from '@nexus/database';
import { SearchResult } from '@nexus/types';
import { ragService } from '@nexus/ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, scope } = body;
    const lastMessage = messages?.[messages.length - 1]?.content || '';

    // Query relevant documents from database
    const where: any = {};
    if (scope && scope.length > 0) {
      where.source = { in: scope };
    }
    if (lastMessage.trim()) {
      where.OR = [
        { title: { contains: lastMessage, mode: 'insensitive' } },
        { content: { contains: lastMessage, mode: 'insensitive' } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    let ragResponseText = "";
    try {
      const ragResult = await ragService.generateResponse(lastMessage);
      ragResponseText = ragResult.text as string;
    } catch (e) {
      if (documents.length > 0) {
        ragResponseText = `Found ${documents.length} relevant document(s) in the internal database:\n\n` +
          documents.map((d, i) => `**[Source ${i + 1}]: ${d.title}**\n${d.content}`).join('\n\n');
      } else {
        ragResponseText = "No relevant internal documents found in the database for your query.";
      }
    }

    const searchResults: SearchResult[] = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      snippet: doc.content.length > 200 ? `${doc.content.substring(0, 200)}...` : doc.content,
      source: doc.source as any,
      relevanceScore: 1.0,
      url: doc.url || undefined,
      createdAt: doc.createdAt.toISOString(),
      author: doc.author || 'System',
    }));

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Stream text response
        const words = ragResponseText.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunkObj = {
            type: 'text',
            content: words[i] + (i < words.length - 1 ? ' ' : ''),
          };
          controller.enqueue(encoder.encode(JSON.stringify(chunkObj) + '\n'));
          await new Promise((r) => setTimeout(r, 15));
        }

        // Stream search results if available
        if (searchResults.length > 0) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'searchResults',
                data: searchResults,
              }) + '\n'
            )
          );
        }

        controller.close();
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/x-ndjson',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error('Error processing chat stream:', error);
    return new Response(JSON.stringify({ error: 'Internal server error processing stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
