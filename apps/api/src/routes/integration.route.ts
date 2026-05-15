import { Router } from 'express';
import { connectIntegration, integrationCallback, disconnectIntegration } from '../controllers/integrations/integration.controller';

const router: Router = Router();

// OAuth Handshake start
router.get('/:source/connect', connectIntegration);

// OAuth Callback from external provider
router.get('/:source/callback', integrationCallback);

// Revoke access
router.post('/:source/disconnect', disconnectIntegration);

export default router;
