export const SlackConfig = {
  id: 'slack',
  name: 'Slack',
  oauth: {
    authorizationUrl: 'https://slack.com/oauth/v2/authorize',
    tokenUrl: 'https://slack.com/api/oauth.v2.access',
    scopes: [
      'channels:history',
      'channels:read',
      'chat:write',
      'groups:history',
      'im:history',
      'users:read',
      'users:read.email'
    ]
  },
  api: {
    baseUrl: 'https://slack.com/api',
    endpoints: {
      search: '/search.messages',
      postMessage: '/chat.postMessage',
      conversationsList: '/conversations.list'
    }
  }
};
