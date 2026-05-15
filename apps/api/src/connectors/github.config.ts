export const GitHubConfig = {
  id: 'github',
  name: 'GitHub',
  oauth: {
    authorizationUrl: 'https://github.com/login/oauth/authorize',
    tokenUrl: 'https://github.com/login/oauth/access_token',
    scopes: [
      'repo',
      'read:org',
      'read:user'
    ]
  },
  api: {
    baseUrl: 'https://api.github.com',
    endpoints: {
      searchIssues: '/search/issues',
      searchCode: '/search/code',
      user: '/user'
    }
  }
};
