export type SourceType = 'slack' | 'notion' | 'github' | 'drive' | 'jira';

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  source: SourceType;
  relevanceScore: number;
  url: string;
  createdAt: string;
  author: string;
}

export interface Action {
  type: 'jira_ticket' | 'slack_message' | 'notion_page' | 'github_issue';
  status: 'pending' | 'completed' | 'failed';
  result: any;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  actions?: Action[];
  searchResults?: SearchResult[];
}

export interface Connection {
  id: string;
  source: string;
  status: 'connected' | 'disconnected' | 'syncing';
  lastSync: string | null;
  indexedCount: number;
}
