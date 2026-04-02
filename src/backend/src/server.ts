import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { briefingRouter } from './api/briefing.router';
import { feedRouter } from './api/feed.router';
import { topicsRouter } from './api/topics.router';
import { userRouter } from './api/user.router';
import { startProcessingWorker } from './infrastructure/queue/workers/processing.worker';
import { startIngestionScheduler } from './infrastructure/queue/workers/ingestion.worker';
import { startBriefingScheduler } from './infrastructure/queue/workers/briefing.worker';

const app = express();
const PORT = process.env.PORT ?? 3001;

// Middleware
app.use(helmet());
app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', ts: new Date().toISOString() }));

// API routes
app.use('/api/briefing', briefingRouter);
app.use('/api/feed', feedRouter);
app.use('/api/topics', topicsRouter);
app.use('/api/user', userRouter);

// 404 handler
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// Start background workers
startProcessingWorker();
startIngestionScheduler();
startBriefingScheduler();

app.listen(PORT, () => {
  console.log(`[Server] AI Insight Hub backend running on port ${PORT}`);
});

export default app;
