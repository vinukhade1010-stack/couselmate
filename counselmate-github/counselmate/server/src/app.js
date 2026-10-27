import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { apiLimiter, csrfGuard, notFound, errorHandler } from './middleware/security.js';

const app = express();

app.disable('x-powered-by');                 // do not advertise the framework
if (env.isProd) app.set('trust proxy', 1);   // behind a host's proxy, so rate limits see real IPs

app.use(helmet());                           // sets many safe HTTP headers at once
app.use(cors({ origin: env.clientUrl, credentials: true }));   // only our own frontend may call the API
app.use(express.json({ limit: '10kb' }));    // small bodies only
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api', apiLimiter, csrfGuard, routes);

app.use(notFound);
app.use(errorHandler);

export default app;
