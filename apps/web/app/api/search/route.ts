import { NextRequest, NextResponse } from 'next/server';
import { SearchResult } from '@nexus/types';
import { prisma } from '@nexus/database';

export interface ExtendedSearchResult extends SearchResult {
  fullContent: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query = '', sources = [], author = '', page = 1, limit = 10 } = body;

    const where: any = {};

    if (query.trim()) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { content: { contains: query, mode: 'insensitive' } },
      ];
    }

    const activeSources = (sources && sources.length > 0) ? sources : ['slack', 'notion', 'github'];
    where.source = { in: activeSources };

    if (author.trim()) {
      where.author = { contains: author, mode: 'insensitive' };
    }

    const [documents, totalCount] = await Promise.all([
      prisma.document.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.document.count({ where }),
    ]);

    const results: ExtendedSearchResult[] = documents.map((doc) => ({
      id: doc.id,
      title: doc.title,
      snippet: doc.content.length > 200 ? `${doc.content.substring(0, 200)}...` : doc.content,
      source: doc.source as any,
      relevanceScore: 1.0,
      url: doc.url || '',
      createdAt: doc.createdAt.toISOString(),
      author: doc.author || 'System',
      fullContent: doc.content,
    }));

    return NextResponse.json({
      results,
      totalCount,
      page,
      totalPages: Math.ceil(totalCount / limit) || 1,
      queryProcessed: query,
    });
  } catch (err) {
    console.error('Error executing document search:', err);
    return NextResponse.json({ error: 'Failed executing document search payload' }, { status: 500 });
  }
}
