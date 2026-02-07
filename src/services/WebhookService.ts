import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';

export interface WebhookEvent {
    type: string;
    data: any;
    id: string;
}

type WebhookHandler = (event: WebhookEvent) => Promise<void>;

export class WebhookService {
    private stripe: Stripe;
    private handlers: Map<string, WebhookHandler[]> = new Map();

    constructor() {
        this.stripe = new Stripe(config.stripe.secretKey, {
            apiVersion: config.stripe.apiVersion,
        });
        this.registerDefaultHandlers();
    }

    verifySignature(payload: Buffer, signature: string): Stripe.Event {
        return this.stripe.webhooks.constructEvent(
            payload,
            signature,
            config.stripe.webhookSecret
        );
    }

    registerHandler(eventType: string, handler: WebhookHandler): void {
        const existing = this.handlers.get(eventType) || [];
        this.handlers.set(eventType, [...existing, handler]);
    }

    async processEvent(event: Stripe.Event): Promise<void> {
        logger.info('Processing webhook event', { type: event.type, id: event.id });

        const handlers = this.handlers.get(event.type) || [];
        const wildcardHandlers = this.handlers.get('*') || [];

        const webhookEvent: WebhookEvent = {
            type: event.type,
            data: event.data.object,
            id: event.id,
        };

        for (const handler of [...handlers, ...wildcardHandlers]) {
            try {
                await handler(webhookEvent);
            } catch (error) {
                logger.error('Webhook handler failed', { type: event.type, error });
                throw error;
            }
        }
    }

    private registerDefaultHandlers(): void {
        this.registerHandler('payment_intent.succeeded', async (event) => {
            logger.info('Payment succeeded', { paymentId: event.data.id });
        });

        this.registerHandler('payment_intent.payment_failed', async (event) => {
            logger.warn('Payment failed', {
                paymentId: event.data.id,
                error: event.data.last_payment_error?.message
            });
        });

        this.registerHandler('charge.refunded', async (event) => {
            logger.info('Charge refunded', { chargeId: event.data.id });
        });

        this.registerHandler('charge.dispute.created', async (event) => {
            logger.warn('Dispute created', { chargeId: event.data.charge });
        });
    }
}

export const webhookService = new WebhookService();
