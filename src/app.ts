import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { paymentsRouter } from './api/routes/payments';
import { webhooksRouter } from './api/routes/webhooks';
import { customersRouter } from './api/routes/customers';
import { errorHandler } from './api/middleware/errorHandler';
import { requestLogger } from './api/middleware/requestLogger';
import { config } from './config';
import { logger } from './utils/logger';

const app = express();

// Security
app.use(helmet());
app.use(cors({ origin: config.corsOrigins }));

// Rate limiting
app.use(rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: 'Too many requests'
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));

// Request logging
app.use(requestLogger);

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/webhooks', webhooksRouter);
app.use('/api/v1/customers', customersRouter);

// Error handling
app.use(errorHandler);

// Start server
const PORT = config.port || 3000;
app.listen(PORT, () => {
    logger.info(`Payment Gateway running on port ${PORT}`);
});

export { app };
