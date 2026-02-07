import Stripe from 'stripe';
import { config } from '../config';
import { logger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentIntentRequest {
    amount: number;
    currency: string;
    customerId?: string;
    paymentMethodId?: string;
    metadata?: Record<string, string>;
    idempotencyKey?: string;
}

export interface PaymentResult {
    id: string;
    status: string;
    clientSecret?: string;
    amount: number;
    currency: string;
}

export class PaymentService {
    private stripe: Stripe;

    constructor() {
        this.stripe = new Stripe(config.stripe.secretKey, {
            apiVersion: config.stripe.apiVersion,
        });
    }

    async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentResult> {
        const idempotencyKey = request.idempotencyKey || uuidv4();

        logger.info('Creating payment intent', {
            amount: request.amount,
            currency: request.currency,
            idempotencyKey
        });

        const params: Stripe.PaymentIntentCreateParams = {
            amount: request.amount,
            currency: request.currency,
            automatic_payment_methods: { enabled: true },
            metadata: { ...request.metadata, idempotencyKey },
        };

        if (request.customerId) {
            params.customer = request.customerId;
        }

        if (request.paymentMethodId) {
            params.payment_method = request.paymentMethodId;
        }

        const intent = await this.stripe.paymentIntents.create(params, {
            idempotencyKey,
        });

        logger.info('Payment intent created', { id: intent.id, status: intent.status });

        return {
            id: intent.id,
            status: intent.status,
            clientSecret: intent.client_secret || undefined,
            amount: intent.amount,
            currency: intent.currency,
        };
    }

    async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
        const intent = await this.stripe.paymentIntents.confirm(paymentIntentId);

        return {
            id: intent.id,
            status: intent.status,
            amount: intent.amount,
            currency: intent.currency,
        };
    }

    async capturePayment(paymentIntentId: string): Promise<PaymentResult> {
        const intent = await this.stripe.paymentIntents.capture(paymentIntentId);

        return {
            id: intent.id,
            status: intent.status,
            amount: intent.amount,
            currency: intent.currency,
        };
    }

    async refundPayment(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
        logger.info('Processing refund', { paymentIntentId, amount });

        const refund = await this.stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount,
        });

        logger.info('Refund completed', { refundId: refund.id, status: refund.status });
        return refund;
    }

    async getPayment(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
        return this.stripe.paymentIntents.retrieve(paymentIntentId);
    }

    async listPayments(customerId?: string, limit = 10): Promise<Stripe.PaymentIntent[]> {
        const params: Stripe.PaymentIntentListParams = { limit };
        if (customerId) params.customer = customerId;

        const result = await this.stripe.paymentIntents.list(params);
        return result.data;
    }
}

export const paymentService = new PaymentService();
