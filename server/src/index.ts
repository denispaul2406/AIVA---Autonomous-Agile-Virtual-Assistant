import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import agent1Routes from './routes/agent1.js';
import agent2Routes from './routes/agent2.js';
import agent3Routes from './routes/agent3.js';
import agent4Routes from './routes/agent4.js';
import projectRoutes from './routes/projects.js';
import userRoutes from './routes/users.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: [
        process.env.CLIENT_URL || '',
        'https://aiva-agile.netlify.app',
        'http://localhost:3000',
        'http://localhost:5173'
    ].filter(Boolean),
    credentials: true,
}));
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
});

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            gemini: !!process.env.GEMINI_API_KEY,
            firebase: !!process.env.FIREBASE_PROJECT_ID,
            googleCalendar:
                !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_REFRESH_TOKEN) ||
                !!process.env.GOOGLE_CALENDAR_CLIENT_EMAIL,
            googleMeet: !!(process.env.GOOGLE_OAUTH_CLIENT_ID && process.env.GOOGLE_OAUTH_REFRESH_TOKEN),
            slack: !!process.env.SLACK_BOT_TOKEN,
        },
    });
});

// Routes
app.use('/api/agent1', agent1Routes);
app.use('/api/agent2', agent2Routes);
app.use('/api/agent3', agent3Routes);
app.use('/api/agent4', agent4Routes);
app.use('/api/projects', projectRoutes);
app.use('/api/users', userRoutes);

// Error handler
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
    console.log(`\n🚀 AIVA Server running on http://localhost:${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/api/health\n`);

    // ─── Keep-Alive: Prevent Render free tier from sleeping ───
    // Set KEEP_ALIVE=true and RENDER_EXTERNAL_URL in your Render env vars
    if (process.env.KEEP_ALIVE === 'true') {
        const INTERVAL = 4 * 60 * 1000; // 4 minutes
        const url = process.env.RENDER_EXTERNAL_URL
            ? `${process.env.RENDER_EXTERNAL_URL}/api/health`
            : `http://localhost:${PORT}/api/health`;

        setInterval(async () => {
            try {
                const res = await fetch(url);
                console.log(`[Keep-Alive] Pinged ${url} — ${res.status}`);
            } catch (err) {
                console.warn('[Keep-Alive] Ping failed:', (err as Error).message);
            }
        }, INTERVAL);

        console.log(`🔄 Keep-alive enabled: pinging every ${INTERVAL / 1000}s → ${url}`);
    }
});

export default app;
