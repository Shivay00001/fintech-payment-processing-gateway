import dotenv from 'dotenv';
dotenv.config();

export const config = {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development',

    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
        apiVersion: '2023-10-16' as const,
    },

    corsOrigins: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],

    database: {
        url: process.env.DATABASE_URL || 'postgresql://localhost:5432/payments',
    },

    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
};
