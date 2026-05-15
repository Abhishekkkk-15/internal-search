import axios from 'axios';
import { ConnectorConfigs } from '../../connectors';

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
    // Search for all pages shared with the integration
    const searchRes = await axios.post(`${this.baseUrl}${ConnectorConfigs.notion.api.endpoints.search}`, {
      filter: { value: 'page', property: 'object' },
      page_size: 20
    }, { headers: this.headers });

    const pages = searchRes.data.results || [];
    let normalizedDocuments = [];

    for (const page of pages) {
      try {
        // Fetch blocks for the page
        const blocksRes = await axios.get(`${this.baseUrl}${ConnectorConfigs.notion.api.endpoints.blocks}/${page.id}/children`, { headers: this.headers });
        const blocks = blocksRes.data.results || [];
        
        // Very basic block text extraction
        const content = blocks
          .map((b: any) => b.paragraph?.rich_text?.[0]?.plain_text || '')
          .filter(Boolean)
          .join('\n');

        normalizedDocuments.push({
          title: page.properties?.title?.title?.[0]?.plain_text || 'Untitled Document',
          content,
          author: page.last_edited_by?.id || 'Unknown',
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
