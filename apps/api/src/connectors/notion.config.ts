export const NotionConfig = {
  id: 'notion',
  name: 'Notion',
  oauth: {
    authorizationUrl: 'https://api.notion.com/v1/oauth/authorize',
    tokenUrl: 'https://api.notion.com/v1/oauth/token',
    scopes: [] // Notion uses integration scopes set in the developer portal instead of granular OAuth scopes
  },
  api: {
    baseUrl: 'https://api.notion.com/v1',
    version: '2022-06-28',
    endpoints: {
      search: '/search',
      databases: '/databases',
      pages: '/pages',
      blocks: '/blocks'
    }
  }
};
