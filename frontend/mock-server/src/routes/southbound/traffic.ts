import { Router } from 'express';

export const trafficRouter = Router();

// GET /api/south/traffic/flow
trafficRouter.get('/flow', (_req, res) => {
  res.json({
    code: 200,
    data: {
      currentFlow: { total: 42, upbound: 18, downbound: 24 },
      hourly: [
        { hour: '06:00', count: 8 }, { hour: '07:00', count: 15 }, { hour: '08:00', count: 22 },
        { hour: '09:00', count: 18 }, { hour: '10:00', count: 12 },
      ],
      dailyTrend: [
        { date: '06-11', count: 85 }, { date: '06-12', count: 92 }, { date: '06-13', count: 78 },
        { date: '06-14', count: 105 }, { date: '06-15', count: 88 }, { date: '06-16', count: 95 },
        { date: '06-17', count: 42 },
      ],
    },
  });
});

// GET /api/south/traffic/control
trafficRouter.get('/control', (_req, res) => {
  res.json({
    code: 200,
    data: {
      notices: [
        { id: 'N001', type: '交通管制', title: '衢江大桥水域限速', content: '因桥区施工，衢江大桥上游500m至下游300m水域限速4节，禁止追越。', effectiveTime: '2026-06-17T08:00:00', expireTime: '2026-06-18T18:00:00', status: '生效中' },
        { id: 'N002', type: '航道通告', title: '兰溪水文站水位预警', content: '兰溪水文站水位持续上涨，建议吃水超过3.5m的船舶暂停通航。', effectiveTime: '2026-06-17T09:00:00', expireTime: '2026-06-18T09:00:00', status: '生效中' },
      ],
    },
  });
});

// GET /api/south/traffic/accident
trafficRouter.get('/accident', (_req, res) => {
  res.json({
    code: 200,
    data: {
      accidents: [
        { id: 'A001', type: '船舶碰撞', location: '衢江大桥下游500m', time: '2026-06-16T14:30:00', ships: ['浙海通008', '金航客渡008'], severity: '轻微', status: '已处置' },
      ],
      stats: {
        thisMonth: 1,
        lastMonth: 3,
        thisYear: 8,
      },
    },
  });
});
