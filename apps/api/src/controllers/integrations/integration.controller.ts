import { Request, Response } from 'express';
import { prisma } from '../../lib/prisma';
import { ConnectorConfigs } from '../../connectors';
import axios from 'axios';

interface AuthenticatedRequest extends Request {
  user?: any;
}

// 0. Fetch all integrations for a user (slack, notion, github)
export const getIntegrations = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string);
  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const connections = await prisma.connection.findMany({
    where: {
      userId,
      source: { in: ['slack', 'notion', 'github'] }
    }
  });

  res.json({ data: connections });
};

// 1. Redirect to Provider's OAuth Consent Screen
export const connectIntegration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const source = req.params.source as keyof typeof ConnectorConfigs;
  const config = ConnectorConfigs[source];

  if (!config || !['slack', 'notion', 'github'].includes(source)) {
    res.status(404).json({ error: 'Unsupported integration source. Allowed: slack, notion, github' });
    return;
  }

  const userId = req.user?.id || (req.query.userId as string) || (req.headers['x-user-id'] as string);
  if (!userId) {
    res.status(401).json({ error: 'Missing userId parameter' });
    return;
  }

  const state = Buffer.from(JSON.stringify({ userId, source })).toString('base64');

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

  res.redirect(`${config.oauth.authorizationUrl}?${queryParams.toString()}`);
};

// 2. Handle OAuth Callback and Token Exchange
export const integrationCallback = async (req: Request, res: Response): Promise<void> => {
  const source = req.params.source as keyof typeof ConnectorConfigs;
  const config = ConnectorConfigs[source];
  const code = req.query.code as string;
  const stateStr = req.query.state as string;

  if (!code || !stateStr || !config || !['slack', 'notion', 'github'].includes(source)) {
    res.status(400).json({ error: 'Invalid callback parameters' });
    return;
  }

  try {
    const stateObj = JSON.parse(Buffer.from(stateStr, 'base64').toString('utf-8'));
    const { userId } = stateObj;

    const clientId = process.env[`${source.toUpperCase()}_CLIENT_ID`];
    const clientSecret = process.env[`${source.toUpperCase()}_CLIENT_SECRET`];
    const redirectUri = process.env[`${source.toUpperCase()}_REDIRECT_URI`];

    let tokenResponse;
    if (source === 'notion') {
      tokenResponse = await axios.post(config.oauth.tokenUrl, {
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }, {
        headers: {
          'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
          'Notion-Version': '2022-06-28',
          'Content-Type': 'application/json'
        }
      });
    } else {
      tokenResponse = await axios.post(config.oauth.tokenUrl, {
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      }, {
        headers: { 'Accept': 'application/json' }
      });
    }

    const { access_token, refresh_token } = tokenResponse.data;

    // Ensure user exists
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId }
    });

    const existingConn = await prisma.connection.findFirst({
      where: { userId, source }
    });

    if (existingConn) {
      await prisma.connection.update({
        where: { id: existingConn.id },
        data: {
          accessToken: access_token,
          refreshToken: refresh_token || undefined,
          status: 'connected',
          updatedAt: new Date()
        }
      });
    } else {
      await prisma.connection.create({
        data: {
          userId,
          source,
          status: 'connected',
          accessToken: access_token,
          refreshToken: refresh_token || null
        }
      });
    }

    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/connections?success=true&source=${source}`);
  } catch (error: any) {
    console.error(`[OAuth Callback Error] - ${source}:`, error?.response?.data || error.message);
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/connections?error=auth_failed`);
  }
};

// 3. Disconnect Integration
export const disconnectIntegration = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const source = req.params.source as string;
  const userId = req.user?.id || (req.headers['x-user-id'] as string);

  if (!userId || !source) {
    res.status(400).json({ error: 'Missing userId or source' });
    return;
  }

  // 1. Delete all indexed document vectors & text records for this user and source
  const deletedDocs = await prisma.document.deleteMany({
    where: { userId, source }
  });

  // 2. Reset connection status, clear tokens, and reset indexedCount
  const existingConnection = await prisma.connection.findFirst({
    where: { userId, source }
  });

  if (existingConnection) {
    await prisma.connection.update({
      where: { id: existingConnection.id },
      data: {
        status: 'disconnected',
        accessToken: null,
        refreshToken: null,
        indexedCount: 0,
        lastSync: null,
        syncSchedule: null
      }
    });
  }

  // 3. Remove active BullMQ repeatable cron job if present
  try {
    const { syncQueue } = require('../../queues/sync.queue');
    const repeatableJobs = await syncQueue.getRepeatableJobs();
    const existingJob = repeatableJobs.find((j: any) => j.name === `sync-${userId}-${source}`);
    if (existingJob) {
      await syncQueue.removeRepeatableByKey(existingJob.key);
    }
  } catch (qErr) {
    console.error(`[Disconnect] Failed to remove repeatable cron job for ${source}:`, qErr);
  }

  res.json({
    success: true,
    message: `Disconnected ${source} and deleted ${deletedDocs.count} indexed documents`,
    deletedCount: deletedDocs.count
  });
};

// 4. Trigger Manual Sync (via BullMQ)
export const triggerSync = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string);
  const { syncQueue } = require('../../queues/sync.queue');

  if (!userId) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  await syncQueue.add(`sync-${userId}`, { userId }, {
    priority: 1,
    removeOnComplete: true
  });

  res.json({ success: true, message: `Sync job queued for user` });
};

// 5. Update Sync Schedule
export const updateSchedule = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const userId = req.user?.id || (req.headers['x-user-id'] as string);
  const { source, schedule } = req.body;
  const { syncQueue } = require('../../queues/sync.queue');

  if (!userId || !source) {
    res.status(400).json({ error: 'Missing userId or source' });
    return;
  }

  await prisma.connection.updateMany({
    where: { userId, source },
    data: { syncSchedule: schedule }
  });

  const repeatableJobs = await syncQueue.getRepeatableJobs();
  const existingJob = repeatableJobs.find((j: any) => j.name === `sync-${userId}-${source}`);
  if (existingJob) {
    await syncQueue.removeRepeatableByKey(existingJob.key);
  }

  if (schedule) {
    await syncQueue.add(
      `sync-${userId}-${source}`,
      { userId, source },
      {
        repeat: { pattern: schedule },
        removeOnComplete: true
      }
    );
  }

  res.json({ success: true, message: schedule ? `Schedule updated to ${schedule}` : 'Schedule removed' });
};
