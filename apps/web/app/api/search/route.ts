import { NextRequest, NextResponse } from 'next/server';
import { SearchResult } from '@nexus/types';

// Extended preview interface for search expansion
export interface ExtendedSearchResult extends SearchResult {
  fullContent: string;
}

const mockDatabase: ExtendedSearchResult[] = [
  {
    id: 'doc-slack-101',
    title: 'Slack Thread: API Gateway Migrations',
    snippet: 'Discussing the new rate limiting layers and header injection specifications for upstream proxies.',
    source: 'slack',
    relevanceScore: 0.96,
    url: 'https://slack.com/archives/api-gateway',
    createdAt: 'Today, 10:15 AM',
    author: 'DevOps Automaton',
    fullContent: 'Thread summary starts:\n- User A: Are we deprecating the v1 auth signatures?\n- User B: Yes, starting next quarter. Make sure to pass the organization tokens in standard auth headers.\n- Resolution: Team created tracking board items to synchronize client apps.',
  },
  {
    id: 'doc-notion-202',
    title: 'Enterprise Single Sign-On (SSO) Architecture Blueprint',
    snippet: 'Technical mappings for Okta/SAML2 identity providers integration inside the Next.js App Router layer.',
    source: 'notion',
    relevanceScore: 0.91,
    url: 'https://notion.so/acme/SSO-Blueprint',
    createdAt: '2 days ago',
    author: 'David Chen',
    fullContent: '# Single Sign-On Specification\n\nThis document tracks client session verification steps.\n\n```javascript\n// Token Decoder Verification Example\nexport function verifyTokenSignature(token) {\n  return jwt.verify(token, process.env.CERT_PUBLIC);\n}\n```\n\nEnsure absolute path cookies carry Secure flags.',
  },
  {
    id: 'doc-github-303',
    title: 'GitHub PR #412: Support vector search relevance filters',
    snippet: 'Introduced cosine distance score threshold filtering inside packages/ui data selector hooks.',
    source: 'github',
    relevanceScore: 0.85,
    url: 'https://github.com/acme/internal-search/pull/412',
    createdAt: 'Last week',
    author: 'Marcus Vance',
    fullContent: 'Pull request description: Added optimized vector lookups leveraging Pinecone caching buffers. Resolves memory bottlenecks during multi-tenant lookups.\n\nFiles modified:\n- `packages/ui/src/components/SearchBar.tsx`\n- `apps/web/app/api/search/route.ts`',
  },
  {
    id: 'doc-drive-404',
    title: 'Quarterly OKRs & Product Roadmap Slide Deck',
    snippet: 'High level business objectives tracking natural language interface usage target metrics.',
    source: 'drive',
    relevanceScore: 0.79,
    url: 'https://drive.google.com/presentation/d/mock-deck-id/edit',
    createdAt: 'Last month',
    author: 'Sarah Jenkins',
    fullContent: 'Slide 1: Vision Overview\nEmpower all non-technical roles with unified deep query automation models.\n\nSlide 2: Deliverables\n- Sub-second vector search returns.\n- Slack auto-summaries integration.\n- One-click triggerable actions feedback loops.',
  },
  {
    id: 'doc-jira-505',
    title: 'Jira Task NEX-908: Optimize Webhook Retries',
    snippet: 'Failing Slack webhook dispatches require exponential backoff delay queue policies.',
    source: 'jira',
    relevanceScore: 0.72,
    url: 'https://jira.acme.corp/browse/NEX-908',
    createdAt: '3 weeks ago',
    author: 'System Admin',
    fullContent: 'Task Description:\nObserved intermittent dropouts during peak concurrent Slack synchronizations. Propose injecting Redis-based task queues to re-attempt delivery 3 times prior to flagging as failed action status.',
  },
  {
    id: 'doc-notion-606',
    title: 'Tailwind CSS Custom Design Tokens Reference',
    snippet: 'Hex palette variables map configurations for slate background orbs and primary violet contrast buttons.',
    source: 'notion',
    relevanceScore: 0.68,
    url: 'https://notion.so/acme/Design-Tokens',
    createdAt: 'Yesterday',
    author: 'Elena Rostova',
    fullContent: 'Design instructions guide: Use rich aesthetic parameters to impress corporate operators.\n- Primary button backgrounds: `#4f46e5`\n- Glassmorphic panels: `rgba(255, 255, 255, 0.6)` on light layouts, `rgba(15, 23, 42, 0.6)` on dark surfaces.',
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query = '', sources = [], author = '', dateRange = 'all', page = 1, limit = 10 } = body;

    // Simulate realistic latency (300-800ms)
    const delay = Math.floor(Math.random() * 500) + 300;
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Filter logic
    let filtered = [...mockDatabase];

    if (query.trim()) {
      const q = query.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.snippet.toLowerCase().includes(q) ||
          doc.fullContent.toLowerCase().includes(q)
      );
    }

    if (sources && sources.length > 0) {
      filtered = filtered.filter((doc) => sources.includes(doc.source));
    }

    if (author.trim()) {
      filtered = filtered.filter((doc) => doc.author.toLowerCase().includes(author.toLowerCase()));
    }

    // Apply basic mock date filtering
    if (dateRange !== 'all') {
      if (dateRange === 'today') {
        filtered = filtered.filter((doc) => doc.createdAt.toLowerCase().includes('today') || doc.createdAt.toLowerCase().includes('mins') || doc.createdAt.toLowerCase().includes('hours'));
      } else if (dateRange === 'week') {
        filtered = filtered.filter((doc) => !doc.createdAt.toLowerCase().includes('month') && !doc.createdAt.toLowerCase().includes('weeks'));
      }
    }

    // Sort by relevance score descending
    filtered.sort((a, b) => b.relevanceScore - a.relevanceScore);

    // Pagination
    const startIndex = (page - 1) * limit;
    const paginatedItems = filtered.slice(startIndex, startIndex + limit);

    return NextResponse.json({
      results: paginatedItems,
      totalCount: filtered.length,
      page,
      totalPages: Math.ceil(filtered.length / limit),
      queryProcessed: query,
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed executing document search payload' }, { status: 500 });
  }
}
