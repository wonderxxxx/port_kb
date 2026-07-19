import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

export const maritimeRouter = Router();
const ships = JSON.parse(readFileSync(join(__dirname, '../../mock-data/ships.json'), 'utf-8'));

// GET /api/south/ais/ship — real-time AIS ship positions
maritimeRouter.get('/ship', (_req, res) => {
  const positions = ships.positions.map((p: Record<string, unknown>) => {
    const ship = ships.ships.find((s: { id: string }) => s.id === p.shipId);
    return {
      ...p,
      shipName: ship?.name || '未知',
      shipType: ship?.type || '未知',
      shipLength: ship?.length || 0,
      shipTonnage: ship?.tonnage || 0,
      lat: (p.lat as number) + (Math.random() - 0.5) * 0.005,
      lng: (p.lng as number) + (Math.random() - 0.5) * 0.005,
      heading: (p.heading as number) + (Math.random() - 0.5) * 10,
      speed: Math.max(0, (p.speed as number) + (Math.random() - 0.5) * 2),
      updateTime: new Date().toISOString(),
    };
  });
  res.json({ code: 200, data: positions, total: positions.length });
});

// GET /api/south/ais/info — ship registration info
maritimeRouter.get('/info', (_req, res) => {
  res.json({ code: 200, data: ships.ships });
});

// GET /api/south/ais/plan — ship voyage plans
maritimeRouter.get('/plan', (_req, res) => {
  const plans = ships.positions
    .filter((p: { destination: string | null }) => p.destination)
    .map((p: Record<string, unknown>) => ({
      shipId: p.shipId,
      shipName: ships.ships.find((s: { id: string }) => s.id === p.shipId)?.name,
      from: '兰溪港区',
      to: p.destination,
      eta: p.eta,
      status: p.status,
    }));
  res.json({ code: 200, data: plans });
});

// GET /api/south/maritime/ships
maritimeRouter.get('/ships', (_req, res) => {
  res.json({ code: 200, data: ships.ships });
});
