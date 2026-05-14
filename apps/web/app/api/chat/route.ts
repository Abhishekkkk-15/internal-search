import { NextRequest } from 'next/server';
import { SearchResult, Action } from '@nexus/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, scope } = body;
    const lastMessage = messages?.[messages.length - 1]?.content || '';
    const query = lastMessage.toLowerCase();

    // Determine simulated payload mapping based on user query keywords
    let responseText = "I've processed your request using the standard Nexus knowledge graph. Let me know if you need deeper analytics or targeted automated actions.";
    let searchResults: SearchResult[] = [];
    let actions: Action[] = [];

    if (query.includes('slack') || query.includes('jira') || query.includes('summarize') || query.includes('ticket')) {
      responseText = "I analyzed your unread internal Slack channels (#product-strategy, #engineering-leads) and identified 2 blocked threads regarding authentication flows. I have successfully summarized the key decisions and generated tracking Jira tasks.";
      searchResults = [
        {
          id: 'res-slack-1',
          title: 'Slack Thread: #product-strategy',
          snippet: 'Discussed timeline constraints for the Nexus dashboard overhaul. Decision: push mock backends live for staging preview.',
          source: 'slack',
          relevanceScore: 0.94,
          url: 'https://slack.com/app_redirect?channel=product-strategy',
          createdAt: '10 mins ago',
          author: 'Sarah Jenkins (PM)',
        },
        {
          id: 'res-notion-2',
          title: 'Nexus Assistant v2 Spec Document',
          snippet: 'RAG embeddings matrix require realistic mock response latency simulation (300ms - 800ms) to evaluate loading states.',
          source: 'notion',
          relevanceScore: 0.88,
          url: 'https://notion.so/acme/Nexus-v2-Spec',
          createdAt: '2 hours ago',
          author: 'David Chen (Architect)',
        },
      ];
      actions = [
        {
          type: 'jira_ticket',
          status: 'completed',
          result: {
            message: 'Created Ticket NEX-1042: Implement Glassmorphic Frontend Shell',
            details: 'Sprint 4 • Assigned to Frontend Team • Priority: Critical',
            url: 'https://jira.acme.corp/browse/NEX-1042',
          },
        },
        {
          type: 'slack_message',
          status: 'completed',
          result: {
            message: 'Dispatched broadcast notification to #engineering-leads',
            details: 'Summary broadcast payload uploaded successfully.',
          },
        },
      ];
    } else if (query.includes('design') || query.includes('drive') || query.includes('file') || query.includes('doc')) {
      responseText = "I scanned the connected Google Drive volumes and primary Notion databases. Here are the active UI design assets and user documentation blueprints modified during the last work week:\n\n```typescript\n// Sample Extracted Metadata Interface\nexport interface ScannedAsset {\n  filename: string;\n  byteSize: number;\n  sharedPermissions: string[];\n}\n```\n\nFeel free to prompt me to trigger automated access requests or dispatch updates.";
      searchResults = [
        {
          id: 'res-drive-1',
          title: 'Figma Assets Export - Sprint Layouts',
          snippet: 'Includes high-fidelity preview exports of the sidebar navigation system, glowing ambient backdrop gradients, and interactive charts.',
          source: 'drive',
          relevanceScore: 0.98,
          url: 'https://drive.google.com/file/d/mock-figma-file-id/view',
          createdAt: 'Yesterday',
          author: 'Elena Rostova (Lead Designer)',
        },
        {
          id: 'res-github-3',
          title: 'packages/ui component catalog',
          snippet: 'Shared component specification housing SearchBar.tsx, MessageBubble.tsx, and StatusBadge.tsx using Tailwind CSS utilities.',
          source: 'github',
          relevanceScore: 0.82,
          url: 'https://github.com/acme/nexus-monorepo/tree/main/packages/ui',
          createdAt: '3 days ago',
          author: 'Marcus Vance (Staff Eng)',
        },
      ];
      actions = [
        {
          type: 'notion_page',
          status: 'pending',
          result: {
            message: 'Pending Authorization: Index new Google Drive links into Notion HQ Hub',
            details: 'Target space: Enterprise Architecture / Documentations',
          },
        },
      ];
    } else {
      // General question fallback with sample code block
      responseText = "Hello! I am **Nexus Assistant**, your enterprise multi-modal agent connected across Notion, Slack, GitHub, Google Drive, and Jira.\n\nHere is a quick overview of how you can query my intelligence matrix:\n\n```bash\n# Sample queries you can execute directly:\n1. \"Summarize unread Slack threads and create Jira tickets\"\n2. \"Show me design files updated last week in Drive\"\n3. \"Scan documentation for API errors\"\n```\n\nI automatically augment answers with active enterprise context references below.";
      searchResults = [
        {
          id: 'res-notion-base',
          title: 'Nexus Platform Onboarding Manual',
          snippet: 'Complete starter instructions for mapping multi-tenant integrations, customizing memory buffers, and setting global token limits.',
          source: 'notion',
          relevanceScore: 0.75,
          url: 'https://notion.so/acme/Onboarding',
          createdAt: 'Last week',
          author: 'System Admin',
        },
      ];
    }

    // Simulate realistic 300-800ms initial network latency
    const initialDelay = Math.floor(Math.random() * 500) + 300;
    await new Promise((resolve) => setTimeout(resolve, initialDelay));

    // Prepare streaming controller encoding JSON-lines
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        // Stream the text content chunks
        const words = responseText.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunkObj = {
            type: 'text',
            content: words[i] + (i < words.length - 1 ? ' ' : ''),
          };
          controller.enqueue(encoder.encode(JSON.stringify(chunkObj) + '\n'));
          // Simulate short stream intervals
          await new Promise((r) => setTimeout(r, 20));
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
          await new Promise((r) => setTimeout(r, 50));
        }

        // Stream automation actions if available
        if (actions.length > 0) {
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                type: 'actions',
                data: actions,
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
    return new Response(JSON.stringify({ error: 'Internal server error processing stream' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
