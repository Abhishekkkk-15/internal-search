import axios from 'axios';
import { ConnectorConfigs } from '../../connectors';

export class GitHubService {
  private accessToken: string;
  private baseUrl = ConnectorConfigs.github.api.baseUrl;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private get headers() {
    return {
      Authorization: `token ${this.accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
    };
  }

  async fetchRecentIssues() {
    // 1. Fetch user to get their scoped access context
    const userRes = await axios.get(`${this.baseUrl}/user`, { headers: this.headers });
    const username = userRes.data.login;

    // 2. Fetch issues assigned to or created by the user across orgs
    const issuesRes = await axios.get(`${this.baseUrl}/search/issues?q=author:${username}&sort=updated&order=desc`, { headers: this.headers });
    const issues = issuesRes.data.items || [];

    return issues.map((issue: any) => ({
      title: issue.title,
      content: issue.body || '',
      author: issue.user?.login || 'Unknown',
      url: issue.html_url,
      source: 'github'
    }));
  }
}
