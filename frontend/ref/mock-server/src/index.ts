import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer } from './ws';
import { hydrologyRouter } from './routes/southbound/hydrology';
import { weatherRouter } from './routes/southbound/weather';
import { maritimeRouter } from './routes/southbound/maritime';
import { videoRouter } from './routes/southbound/video';
import { lockRouter } from './routes/southbound/lock';
import { trafficRouter } from './routes/southbound/traffic';
import { reportsRouter } from './routes/northbound/reports';
import { operationsRouter } from './routes/southbound/operations';
import { extendedRouter } from './routes/southbound/extended';
import { gapRouter } from './routes/southbound/gap';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Southbound APIs - data ingested from external platforms
app.use('/api/south/hydrology', hydrologyRouter);
app.use('/api/south/weather', weatherRouter);
app.use('/api/south/ais', maritimeRouter);
app.use('/api/south/maritime', maritimeRouter);
app.use('/api/south/video', videoRouter);
app.use('/api/south/lock', lockRouter);
app.use('/api/south/traffic', trafficRouter);

// Operations APIs - scheduling, detection review, drone, RAG, dashboard
app.use('/api/ops', operationsRouter);

// Extended APIs - models, inference, annotation, logs, voice, reports
app.use('/api/ops', extendedRouter);

// Gap features - knowledge, feedback, cross-modal, warning rules, orchestration, training
app.use('/api/ops', gapRouter);

// Northbound APIs - reports to superiors
app.use('/api/north', reportsRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// API overview
app.get('/api', (_req, res) => {
  res.json({
    name: '港航智能业务系统 API',
    version: '1.0.0',
    northbound: [
      'POST /api/north/warning/report',
      'POST /api/north/control/report',
      'POST /api/north/ship/report',
      'POST /api/north/flood/report',
      'POST /api/north/rainfall/report',
      'POST /api/north/daily/report',
      'POST /api/north/emergency/report',
      'POST /api/north/ship-list/report',
    ],
    southbound: [
      'GET /api/south/hydrology/level',
      'GET /api/south/hydrology/velocity',
      'GET /api/south/hydrology/flood-forecast',
      'GET /api/south/hydrology/flood-release',
      'GET /api/south/hydrology/reservoir',
      'GET /api/south/weather/rainfall',
      'GET /api/south/weather/forecast',
      'GET /api/south/weather/warning',
      'GET /api/south/weather/wind',
      'GET /api/south/ais/ship',
      'GET /api/south/ais/info',
      'GET /api/south/ais/plan',
      'GET /api/south/video/stream',
      'GET /api/south/video/playback',
      'POST /api/south/video/ptz',
      'GET /api/south/lock/status',
      'GET /api/south/lock/plan',
      'GET /api/south/lock/sequence',
      'GET /api/south/traffic/flow',
      'GET /api/south/traffic/control',
      'GET /api/south/traffic/accident',
    ],
    websocket: 'ws://localhost:3001/ws',
  });
});

const server = http.createServer(app);
new WebSocketServer(server);

server.listen(PORT, () => {
  console.log(`🚢 港航智能业务系统 API Server running on http://localhost:${PORT}`);
  console.log(`📡 WebSocket server ready on ws://localhost:${PORT}/ws`);
});
