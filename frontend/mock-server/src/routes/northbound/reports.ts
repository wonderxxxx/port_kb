import { Router } from 'express';
import { readFileSync } from 'fs';
import { join } from 'path';

export const reportsRouter = Router();
const warnings = JSON.parse(readFileSync(join(__dirname, '../../mock-data/warnings.json'), 'utf-8'));
const hydrology = JSON.parse(readFileSync(join(__dirname, '../../mock-data/hydrology.json'), 'utf-8'));
const weather = JSON.parse(readFileSync(join(__dirname, '../../mock-data/weather.json'), 'utf-8'));

// POST /api/north/warning/report
reportsRouter.post('/warning/report', (req, res) => {
  res.json({ code: 200, message: '预警信息已上报', reportId: `RPT-${Date.now()}`, data: req.body });
});

// POST /api/north/control/report
reportsRouter.post('/control/report', (req, res) => {
  res.json({ code: 200, message: '管控措施已上报', reportId: `RPT-${Date.now()}`, data: req.body });
});

// POST /api/north/ship/report
reportsRouter.post('/ship/report', (req, res) => {
  res.json({ code: 200, message: '船舶动态已上报', reportId: `RPT-${Date.now()}`, data: req.body });
});

// POST /api/north/flood/report
reportsRouter.post('/flood/report', (req, res) => {
  res.json({ code: 200, message: '泄洪信息已上报', reportId: `RPT-${Date.now()}`, data: req.body });
});

// POST /api/north/rainfall/report
reportsRouter.post('/rainfall/report', (req, res) => {
  res.json({ code: 200, message: '雨情数据已上报', reportId: `RPT-${Date.now()}`, data: req.body });
});

// POST /api/north/daily/report
reportsRouter.post('/daily/report', (req, res) => {
  res.json({ code: 200, message: '日报数据已上报', reportId: `RPT-${Date.now()}`, data: req.body });
});

// POST /api/north/emergency/report
reportsRouter.post('/emergency/report', (req, res) => {
  res.json({ code: 200, message: '险情报告已上报', reportId: `RPT-${Date.now()}`, data: req.body });
});

// POST /api/north/ship-list/report
reportsRouter.post('/ship-list/report', (req, res) => {
  res.json({ code: 200, message: '船舶清单已上报', reportId: `RPT-${Date.now()}`, data: req.body });
});

// GET /api/north/report-history — convenience endpoint to browse existing data
reportsRouter.get('/report-history', (_req, res) => {
  res.json({
    code: 200,
    data: {
      warnings: warnings.warnings,
      hydrology: hydrology.currentData,
      weather: weather.current,
    },
  });
});
