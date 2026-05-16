import { Router } from 'express';
import { getIntegrations, connectIntegration, integrationCallback, disconnectIntegration, triggerSync } from '../controllers/integrations/integration.controller';
import { authmiddleware } from '../middleware/auth';

const router: Router = Router();

// List all integrations (Protected)
router.get('/', authmiddleware, getIntegrations);

// Trigger manual sync (Protected)
router.post('/sync', authmiddleware, triggerSync);

// OAuth Handshake start (Public - accessed via browser redirect)
router.get('/:source/connect', connectIntegration);

// OAuth Callback from external provider (Public - accessed by provider)
router.get('/:source/callback', integrationCallback);

// Revoke access (Protected)
router.post('/:source/disconnect', authmiddleware, disconnectIntegration);

export default router;
