export const GoogleDriveConfig = {
  id: 'drive',
  name: 'Google Drive',
  oauth: {
    authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    scopes: [
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/drive.metadata.readonly'
    ]
  },
  api: {
    baseUrl: 'https://www.googleapis.com/drive/v3',
    endpoints: {
      files: '/files',
      about: '/about'
    }
  }
};
