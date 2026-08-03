import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

export const weatherRouter = Router();
const data = JSON.parse(readFileSync(join(__dirname, '../../mock-data/weather.json'), 'utf-8'));

// GET /api/south/weather/rainfall?region=quzhou&period=24h
weatherRouter.get('/rainfall', (_req, res) => {
  res.json({ code: 200, data: data.current.rainfall });
});

// GET /api/south/weather/forecast
weatherRouter.get('/forecast', (_req, res) => {
  res.json({ code: 200, data: data.forecast24h });
});

// GET /api/south/weather/warning
weatherRouter.get('/warning', (_req, res) => {
  res.json({ code: 200, data: data.current.warning });
});

// GET /api/south/weather/wind
weatherRouter.get('/wind', (_req, res) => {
  res.json({ code: 200, data: data.current.wind });
});

// GET /api/south/weather/current
weatherRouter.get('/current', (_req, res) => {
  res.json({ code: 200, data: data.current });
});
