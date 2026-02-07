import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../../utils/logger';

export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public isOperational = true
    ) {
        super(message);
        Object.setPrototypeOf(this, AppError.prototype);
    }
}

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    next: NextFunction
): void {
    logger.error('Error occurred', {
        error: err.message,
        stack: err.stack,
        path: req.path,
    });

    // Zod validation errors
    if (err instanceof ZodError) {
        res.status(400).json({
            error: 'Validation error',
            details: err.errors,
        });
        return;
    }

    // Stripe errors
    if (err.name === 'StripeError' || (err as any).type?.startsWith('Stripe')) {
        res.status(400).json({
            error: 'Payment error',
            message: err.message,
        });
        return;
    }

    // Custom app errors
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            error: err.message,
        });
        return;
    }

    // Default error
    res.status(500).json({
        error: 'Internal server error',
    });
}
