import { Router } from 'express';
import { getIntegrations, connectIntegration, integrationCallback, disconnectIntegration, triggerSync } from '../controllers/integrations/integration.controller';

const router: Router = Router();

// List all integrations
router.get('/', getIntegrations);

// Trigger manual sync
router.post('/sync', triggerSync);

// OAuth Handshake start
router.get('/:source/connect', connectIntegration);

// OAuth Callback from external provider
router.get('/:source/callback', integrationCallback);

// Revoke access
router.post('/:source/disconnect', disconnectIntegration);

export default router;
