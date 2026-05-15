export * from './slack.config';
export * from './notion.config';
export * from './github.config';
export * from './drive.config';
export * from './jira.config';

// Aggregate map for easy dynamic access
import { SlackConfig } from './slack.config';
import { NotionConfig } from './notion.config';
import { GitHubConfig } from './github.config';
import { GoogleDriveConfig } from './drive.config';
import { JiraConfig } from './jira.config';

export const ConnectorConfigs = {
  slack: SlackConfig,
  notion: NotionConfig,
  github: GitHubConfig,
  drive: GoogleDriveConfig,
  jira: JiraConfig,
};
