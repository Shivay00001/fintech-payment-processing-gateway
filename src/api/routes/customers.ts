import { Router, Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import { config } from '../../config';

export const customersRouter = Router();

const stripe = new Stripe(config.stripe.secretKey, {
    apiVersion: config.stripe.apiVersion,
});

// Create customer
customersRouter.post('/', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { email, name, metadata } = req.body;
        const customer = await stripe.customers.create({ email, name, metadata });
        res.status(201).json(customer);
    } catch (error) {
        next(error);
    }
});

// Get customer
customersRouter.get('/:customerId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await stripe.customers.retrieve(req.params.customerId);
        res.json(customer);
    } catch (error) {
        next(error);
    }
});

// Update customer
customersRouter.patch('/:customerId', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const customer = await stripe.customers.update(req.params.customerId, req.body);
        res.json(customer);
    } catch (error) {
        next(error);
    }
});

// List payment methods
customersRouter.get('/:customerId/payment-methods', async (req: Request, res: Response, next: NextFunction) => {
    try {
        const methods = await stripe.paymentMethods.list({
            customer: req.params.customerId,
            type: 'card',
        });
        res.json(methods.data);
    } catch (error) {
        next(error);
    }
});
