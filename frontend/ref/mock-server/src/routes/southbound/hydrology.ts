import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

export const hydrologyRouter = Router();
const data = JSON.parse(readFileSync(join(__dirname, '../../mock-data/hydrology.json'), 'utf-8'));

// GET /api/south/hydrology/level?station=lanxi
hydrologyRouter.get('/level', (_req, res) => {
  res.json({ code: 200, data: data.currentData, total: data.currentData.length });
});

// GET /api/south/hydrology/velocity
hydrologyRouter.get('/velocity', (_req, res) => {
  const velocityData = data.currentData.map((d: { stationId: string; velocity: number; flow: number; time: string }) => ({
    stationId: d.stationId,
    stationName: data.stations.find((s: { id: string }) => s.id === d.stationId)?.name,
    velocity: d.velocity + (Math.random() - 0.5) * 0.3,
    time: new Date().toISOString(),
  }));
  res.json({ code: 200, data: velocityData });
});

// GET /api/south/hydrology/flood-forecast?hours=4
hydrologyRouter.get('/flood-forecast', (_req, res) => {
  res.json({ code: 200, data: data.floodForecast });
});

// GET /api/south/hydrology/flood-release
hydrologyRouter.get('/flood-release', (_req, res) => {
  res.json({
    code: 200,
    data: {
      stations: ['衢江阶梯枢纽', '塔底电站'],
      releases: [
        { station: '衢江阶梯枢纽', currentFlow: data.currentData[1].flow, gateOpen: 3, maxFlow: 3500, time: new Date().toISOString() },
        { station: '塔底电站', currentFlow: data.currentData[3].flow, gateOpen: 2, maxFlow: 2500, time: new Date().toISOString() },
      ],
    },
  });
});

// GET /api/south/hydrology/reservoir
hydrologyRouter.get('/reservoir', (_req, res) => {
  res.json({
    code: 200,
    data: {
      reservoirs: [
        { name: '铜山源水库', capacity: 1.72e8, current: 1.45e8, percent: 84.3, releaseFlow: 450 },
        { name: '湖南镇水库', capacity: 2.06e8, current: 1.88e8, percent: 91.2, releaseFlow: 680 },
        { name: '黄坛口水库', capacity: 0.85e8, current: 0.72e8, percent: 84.7, releaseFlow: 320 },
      ],
    },
  });
});

// GET /api/south/hydrology/stations
hydrologyRouter.get('/stations', (_req, res) => {
  res.json({ code: 200, data: data.stations });
});
