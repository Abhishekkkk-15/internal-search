import axios from 'axios';
import { ConnectorConfigs } from '../../connectors';

export class SlackService {
  private accessToken: string;
  private baseUrl = ConnectorConfigs.slack.api.baseUrl;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    };
  }

  async fetchRecentMessages() {
    // 1. Fetch channels
    const channelsRes = await axios.get(`${this.baseUrl}${ConnectorConfigs.slack.api.endpoints.conversationsList}`, { headers: this.headers });
    const channels = channelsRes.data.channels || [];

    let allMessages: Array<{ text: string, user: string, ts: string, channel: string }> = [];

    // 2. Fetch history for the first few channels (simplified for demo)
    for (const channel of channels.slice(0, 5)) {
      try {
        const historyRes = await axios.get(`${this.baseUrl}/conversations.history?channel=${channel.id}&limit=50`, { headers: this.headers });
        const messages = historyRes.data.messages || [];
        allMessages.push(...messages.map((m: any) => ({ ...m, channel: channel.name })));
      } catch (err) {
        console.error(`Failed to fetch slack history for channel ${channel.id}`);
      }
    }

    return allMessages.map(m => ({
      title: `Slack Message in #${m.channel}`,
      content: m.text,
      author: m.user,
      url: `slack://message?ts=${m.ts}`,
      source: 'slack'
    }));
  }
}
