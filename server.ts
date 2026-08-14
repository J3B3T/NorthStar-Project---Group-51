import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initEnvValidation } from './config/env';
import ordersRouter from './routes/orders';
import analyticsRouter from './routes/analytics';
import chatRouter from './routes/chat';
import resetRouter from './routes/reset';

// Initialize environment validation
initEnvValidation();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10kb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/orders', ordersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/reset', resetRouter);

// Start Server
async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Northstar Support Applet server running at http://0.0.0.0:${PORT}`);
  });
}

start();
