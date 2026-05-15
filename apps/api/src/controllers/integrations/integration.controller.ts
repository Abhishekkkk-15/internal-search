import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { ConnectorConfigs } from '../../connectors';
import axios from 'axios';

// 0. Fetch all integrations for an org
export const getIntegrations = async (req: Request, res: Response): Promise<void> => {
  const organizationId = req.headers['x-organization-id'] as string;
  if (!organizationId) {
    res.status(400).json({ error: 'Missing X-Organization-Id header' });
    return;
  }

  const connections = await prisma.connection.findMany({
    where: { organizationId }
  });

  res.json({ data: connections });
};

// 1. Redirect to Provider's OAuth Consent Screen
export const connectIntegration = async (req: Request, res: Response): Promise<void> => {
  const source = req.params.source as keyof typeof ConnectorConfigs;
  const config = ConnectorConfigs[source];

  if (!config) {
    res.status(404).json({ error: 'Unsupported integration source' });
    return;
  }

  // The organization ID should be attached to the query string since this is a browser redirect
  const organizationId = req.query.orgId as string || req.headers['x-organization-id'] as string;
  if (!organizationId) {
    res.status(400).json({ error: 'Missing organizationId parameter' });
    return;
  }

  // Generate state parameter to prevent CSRF and pass the orgId through the redirect
  const state = Buffer.from(JSON.stringify({ organizationId, source })).toString('base64');
  
  const clientId = process.env[`${source.toUpperCase()}_CLIENT_ID`];
  const redirectUri = process.env[`${source.toUpperCase()}_REDIRECT_URI`];

  if (!clientId || !redirectUri) {
    res.status(500).json({ error: `OAuth credentials missing for ${source}` });
    return;
  }

  const queryParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: config.oauth.scopes.join(' '),
    state,
  });

  // Redirect user to the provider
  res.redirect(`${config.oauth.authorizationUrl}?${queryParams.toString()}`);
};

// 2. Handle OAuth Callback and Token Exchange
export const integrationCallback = async (req: Request, res: Response): Promise<void> => {
  const source = req.params.source as keyof typeof ConnectorConfigs;
  const config = ConnectorConfigs[source];
  const code = req.query.code as string;
  const stateStr = req.query.state as string;

  if (!code || !stateStr || !config) {
    res.status(400).json({ error: 'Invalid callback parameters' });
    return;
  }

  try {
    const stateObj = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf-8'));
    const { organizationId } = stateObj;

    const clientId = process.env[`${source.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${source.toUpperCase()}_CLIENT_SECRET`];
    const redirectUri = process.env[`${source.toUpperCase()}_REDIRECT_URI`];

    // Exchange code for access token
    const tokenResponse = await axios.post(config.oauth.tokenUrl, {
      client_id: clientId,
      client_secret: clientSecret,
      code,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code'
    }, {
      headers: { 'Accept': 'application/json' }
    });

    const { access_token, refresh_token } = tokenResponse.data;

    // Upsert the connection in the database
    const existingConnection = await prisma.connection.findFirst({
      where: { organizationId, source }
    });

    if (existingConnection) {
      await prisma.connection.update({
        where: { id: existingConnection.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token || existingConnection.refreshToken,
          status: 'connected',
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.connection.create({
        data: {
          organizationId,
          source,
          status: 'connected',
          accessToken: access_token,
          refreshToken: refresh_token || null
        }
      });
    }

    // Redirect back to frontend connections page
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/connections?success=true&source=${source}`);
  } catch (error: any) {
    console.error(`[OAuth Callback Error] - ${source}:`, error?.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/connections?error=auth_failed`);
  }
};

// 3. Disconnect Integration
export const disconnectIntegration = async (req: Request, res: Response): Promise<void> => {
  const source = req.params.source as string;
  const organizationId = req.headers['x-organization-id'] as string;

  if (!organizationId) {
    res.status(400).json({ error: 'Missing X-Organization-Id header' });
    return;
  }

  const existingConnection = await prisma.connection.findFirst({
    where: { organizationId, source }
  });

  if (existingConnection) {
    await prisma.connection.update({
      where: { id: existingConnection.id },
      data: {
        status: 'disconnected',
        accessToken: null,
        refreshToken: null
      }
    });
  }

  res.json({ success: true, message: `Disconnected ${source}` });
};

// 4. Trigger Manual Sync
export const triggerSync = async (req: Request, res: Response): Promise<void> => {
  const { runSyncJob } = require('../../queues/workers/sync.worker');
  
  // We run this in the background (don't await) so the UI doesn't hang
  runSyncJob().catch((err: any) => console.error('[Manual Sync Error]:', err));
  
  res.json({ success: true, message: 'Sync job started in the background' });
};

