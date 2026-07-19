import { Router } from 'express';

export const lockRouter = Router();

// GET /api/south/lock/status
lockRouter.get('/status', (_req, res) => {
  res.json({
    code: 200,
    data: [
      { id: 'LOCK01', name: '姚家船闸', status: '运行中', direction: '上行', currentShip: '浙海通008', queueLength: 8, nextLockTime: '2026-06-17T11:30:00' },
      { id: 'LOCK02', name: '衢江阶梯枢纽船闸', status: '运行中', direction: '下行', currentShip: '浙海油002', queueLength: 5, nextLockTime: '2026-06-17T11:00:00' },
      { id: 'LOCK03', name: '小溪滩船闸', status: '维护中', direction: null, currentShip: null, queueLength: 0, nextLockTime: null },
    ],
  });
});

// GET /api/south/lock/plan
lockRouter.get('/plan', (_req, res) => {
  res.json({
    code: 200,
    data: {
      lockId: 'LOCK01',
      lockName: '姚家船闸',
      plans: [
        { time: '2026-06-17T10:00:00', ships: ['浙海通008'], direction: '上行', status: '已完成' },
        { time: '2026-06-17T11:00:00', ships: ['衢江货0188', '龙游拖001'], direction: '上行', status: '待执行' },
        { time: '2026-06-17T11:30:00', ships: ['浙西客001'], direction: '下行', status: '待执行' },
        { time: '2026-06-17T12:00:00', ships: ['富春江货012', '桐庐砂石005'], direction: '上行', status: '待执行' },
      ],
    },
  });
});

// GET /api/south/lock/sequence
lockRouter.get('/sequence', (_req, res) => {
  res.json({
    code: 200,
    data: {
      lockId: 'LOCK01',
      currentSequence: [
        { order: 1, shipName: '衢江货0188', shipId: 'S003', status: '等待进闸', estimatedEnter: '2026-06-17T10:50:00' },
        { order: 2, shipName: '龙游拖001', shipId: 'S004', status: '等待进闸', estimatedEnter: '2026-06-17T10:55:00' },
        { order: 3, shipName: '浙西客001', shipId: 'S007', status: '排队中', estimatedEnter: '2026-06-17T11:25:00' },
      ],
    },
  });
});
