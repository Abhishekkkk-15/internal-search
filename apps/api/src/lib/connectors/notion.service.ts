import axios from 'axios';
import { ConnectorConfigs } from '../../connectors';

function extractBlockText(b: any): string {
  if (!b || !b.type) return '';
  const blockData = b[b.type];
  if (!blockData) return '';

  if (Array.isArray(blockData.rich_text)) {
    return blockData.rich_text.map((rt: any) => rt.plain_text || '').join('');
  }

  return '';
}

function extractPageTitle(page: any): string {
  if (!page || !page.properties) return 'Untitled Document';
  
  for (const key of Object.keys(page.properties)) {
    const prop = page.properties[key];
    if (prop && prop.type === 'title' && Array.isArray(prop.title) && prop.title.length > 0) {
      const titleText = prop.title.map((t: any) => t.plain_text || '').join('').trim();
      if (titleText) return titleText;
    }
  }

  return 'Untitled Document';
}

function extractPropertyTexts(page: any): string {
  if (!page || !page.properties) return '';
  const parts: string[] = [];

  for (const key of Object.keys(page.properties)) {
    const prop = page.properties[key];
    if (!prop) continue;

    if (prop.type === 'rich_text' && Array.isArray(prop.rich_text)) {
      const val = prop.rich_text.map((t: any) => t.plain_text || '').join('').trim();
      if (val) parts.push(`${key}: ${val}`);
    } else if (prop.type === 'select' && prop.select?.name) {
      parts.push(`${key}: ${prop.select.name}`);
    } else if (prop.type === 'multi_select' && Array.isArray(prop.multi_select)) {
      const names = prop.multi_select.map((s: any) => s.name).filter(Boolean).join(', ');
      if (names) parts.push(`${key}: ${names}`);
    }
  }

  return parts.join('\n');
}

export class NotionService {
  private accessToken: string;
  private baseUrl = ConnectorConfigs.notion.api.baseUrl;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Notion-Version': ConnectorConfigs.notion.api.version,
      'Content-Type': 'application/json',
    };
  }

  async fetchRecentPages() {
    // Search for all pages & database items shared with the integration
    const searchRes = await axios.post(`${this.baseUrl}${ConnectorConfigs.notion.api.endpoints.search}`, {
      page_size: 100,
      sort: { direction: 'descending', timestamp: 'last_edited_time' }
    }, { headers: this.headers });

    const results = searchRes.data.results || [];
    // Filter only page objects (standard pages and database pages)
    const pages = results.filter((item: any) => item.object === 'page');
    let normalizedDocuments = [];

    for (const page of pages) {
      try {
        const title = extractPageTitle(page);
        const propTexts = extractPropertyTexts(page);

        // Fetch top-level block content
        let extractedText = '';
        try {
          const blocksRes = await axios.get(`${this.baseUrl}${ConnectorConfigs.notion.api.endpoints.blocks}/${page.id}/children`, { headers: this.headers });
          const blocks = blocksRes.data.results || [];
          
          extractedText = blocks
            .map(extractBlockText)
            .filter(Boolean)
            .join('\n\n');
        } catch (bErr) {
          // Block reading permission ignored if restricted
        }

        const bodyParts = [propTexts, extractedText].filter(Boolean).join('\n\n');
        const content = bodyParts.trim().length > 0 ? bodyParts : `Notion Document: ${title}`;

        normalizedDocuments.push({
          title,
          content,
          author: page.last_edited_by?.id || 'Notion User',
          url: page.url,
          source: 'notion'
        });
      } catch (err) {
        console.error(`Failed to fetch notion blocks for page ${page.id}`);
      }
    }

    return normalizedDocuments;
  }
}
