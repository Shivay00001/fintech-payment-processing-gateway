import { Router, Request, Response, NextFunction } from 'express';
import express from 'express';
import { webhookService } from '../../services/WebhookService';
import { logger } from '../../utils/logger';

export const webhooksRouter = Router();

// Stripe webhooks need raw body
webhooksRouter.post(
    '/stripe',
    express.raw({ type: 'application/json' }),
    async (req: Request, res: Response, next: NextFunction) => {
        const signature = req.headers['stripe-signature'] as string;

        try {
            const event = webhookService.verifySignature(req.body, signature);
            await webhookService.processEvent(event);
            res.json({ received: true });
        } catch (error: any) {
            logger.error('Webhook processing failed', { error: error.message });
            res.status(400).json({ error: 'Webhook verification failed' });
        }
    }
);
