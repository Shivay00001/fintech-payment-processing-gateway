import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { paymentService } from '../../services/PaymentService';
import { logger } from '../../utils/logger';

export const paymentsRouter = Router();

const CreatePaymentSchema = z.object({
    amount: z.number().int().positive().max(99999999),
    currency: z.string().length(3).toLowerCase(),
    customerId: z.string().optional(),
    paymentMethodId: z.string().optional(),
    metadata: z.record(z.string()).optional(),
    idempotencyKey: z.string().uuid().optional(),
});

// Create payment intent
paymentsRouter.post('/intent', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const validated = CreatePaymentSchema.parse(req.body);
        const result = await paymentService.createPaymentIntent(validated);
        res.status(201).json(result);
    } catch (error) {
        next(error);
    }
});

// Get payment
paymentsRouter.get('/:paymentId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const payment = await paymentService.getPayment(req.params.paymentId);
        res.json(payment);
    } catch (error) {
        next(error);
    }
});

// Confirm payment
paymentsRouter.post('/:paymentId/confirm', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await paymentService.confirmPayment(req.params.paymentId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Capture payment
paymentsRouter.post('/:paymentId/capture', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const result = await paymentService.capturePayment(req.params.paymentId);
        res.json(result);
    } catch (error) {
        next(error);
    }
});

// Refund payment
paymentsRouter.post('/:paymentId/refund', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { amount } = req.body;
        const refund = await paymentService.refundPayment(req.params.paymentId, amount);
        res.json(refund);
    } catch (error) {
        next(error);
    }
});

// List payments
paymentsRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { customerId, limit } = req.query;
        const payments = await paymentService.listPayments(
            customerId as string | undefined,
            limit ? parseInt(limit as string) : 10
        );
        res.json({ payments });
    } catch (error) {
        next(error);
    }
});
