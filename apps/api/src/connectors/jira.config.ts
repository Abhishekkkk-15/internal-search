export const JiraConfig = {
  id: 'jira',
  name: 'Jira',
  oauth: {
    authorizationUrl: 'https://auth.atlassian.com/authorize',
    tokenUrl: 'https://auth.atlassian.com/oauth/token',
    scopes: [
      'read:jira-work',
      'read:jira-user',
      'write:jira-work'
    ]
  },
  api: {
    baseUrl: 'https://api.atlassian.com/ex/jira',
    endpoints: {
      search: '/rest/api/3/search',
      issue: '/rest/api/3/issue',
      myself: '/rest/api/3/myself'
    }
  }
};
