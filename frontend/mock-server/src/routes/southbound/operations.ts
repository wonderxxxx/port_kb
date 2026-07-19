import { Router } from 'express';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

export const operationsRouter = Router();
const warningsPath = join(__dirname, '../../mock-data/warnings.json');
const berthsPath = join(__dirname, '../../mock-data/berths.json');

// ---- Berth Management ----
operationsRouter.get('/berths', (_req, res) => {
  const data = JSON.parse(readFileSync(berthsPath, 'utf-8'));
  res.json({ code: 200, data: data.berths });
});

operationsRouter.post('/berths/:id/update', (req, res) => {
  const { id } = req.params;
  const { occupiedSlots } = req.body;
  const data = JSON.parse(readFileSync(berthsPath, 'utf-8'));
  const berth = data.berths.find((b: { id: string }) => b.id === id);
  if (!berth) return res.status(404).json({ code: 404, message: '锚地未找到' });
  if (occupiedSlots !== undefined) berth.occupiedSlots = Math.max(0, Math.min(berth.totalSlots, occupiedSlots));
  berth.riskLevel = berth.occupiedSlots / berth.totalSlots > 0.8 ? 'high' : berth.occupiedSlots / berth.totalSlots > 0.6 ? 'medium' : 'low';
  writeFileSync(berthsPath, JSON.stringify(data, null, 2));
  res.json({ code: 200, data: berth, message: '锚地更新成功' });
});

// ---- Schedule Submission ----
let schedules: Record<string, unknown>[] = [];
operationsRouter.get('/schedule/today', (_req, res) => {
  const today = schedules.find(s => (s as { date: string }).date === '2026-06-17') || {
    id: 'DD-20260617', date: '2026-06-17', totalRequested: 32, totalApproved: 32,
    districts: [
      { district: '龙游', requestedCount: 10, approvedCount: 10, shipIds: ['S001','S007','S013'], status: 'approved' },
      { district: '衢江', requestedCount: 15, approvedCount: 15, shipIds: ['S003','S005','S010','S014'], status: 'approved' },
      { district: '兰溪（罗阳）', requestedCount: 7, approvedCount: 7, shipIds: ['S002','S012'], status: 'approved' },
    ],
    lanxiAdditional: [
      { shipId: 'S006', shipName: '金航工003', reason: '航道疏浚工程' },
      { shipId: 'S011', shipName: '富春江货012', reason: '紧急物资运输' },
    ],
    status: 'approved',
  };
  res.json({ code: 200, data: today });
});

operationsRouter.post('/schedule/submit', (req, res) => {
  const { districts } = req.body;
  if (!districts || !Array.isArray(districts)) {
    return res.status(400).json({ code: 400, message: '请提供各区调度数据' });
  }
  const total = districts.reduce((sum: number, d: { count: number }) => sum + (d.count || 0), 0);
  if (total > 40) {
    return res.json({ code: 400, success: false, message: `三区合计申请 ${total} 艘，超过上限 40 艘，请调整后重新提交。` });
  }
  const dispatch = {
    id: `DD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    date: new Date().toISOString().slice(0, 10),
    totalRequested: total,
    totalApproved: total,
    districts: districts.map((d: { district: string; count: number }) => ({
      district: d.district, requestedCount: d.count, approvedCount: d.count, shipIds: [], status: 'approved',
    })),
    lanxiAdditional: [{ shipId: 'S006', shipName: '金航工003', reason: '航道疏浚工程' }],
    status: 'approved',
  };
  schedules.push(dispatch);
  res.json({ code: 200, success: true, message: `调度计划已生成，批准 ${total} 艘`, data: dispatch });
});

// ---- Detection Review ----
operationsRouter.post('/detection/:id/review', (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  const data = JSON.parse(readFileSync(warningsPath, 'utf-8'));
  const detection = data.aiDetections.find((d: { id: string }) => d.id === id);
  if (!detection) return res.status(404).json({ code: 404, message: '未找到该检测记录' });
  detection.status = status;
  if (note) detection.reviewNote = note;
  detection.reviewTime = new Date().toISOString();
  detection.reviewer = '值班员';
  writeFileSync(warningsPath, JSON.stringify(data, null, 2));
  res.json({ code: 200, success: true, message: '审核完成', data: detection });
});

operationsRouter.get('/detections', (_req, res) => {
  const data = JSON.parse(readFileSync(warningsPath, 'utf-8'));
  const detections = data.aiDetections;
  res.json({
    code: 200,
    data: detections,
    stats: {
      total: detections.length,
      pending: detections.filter((d: { status: string }) => d.status === '待审核').length,
      confirmed: detections.filter((d: { status: string }) => d.status === '已确认').length,
      rejected: detections.filter((d: { status: string }) => d.status === '已驳回').length,
      byType: ['救生衣违规','超载嫌疑','桥区追越','AIS信号异常','未授权进入'].map(type => ({
        type, count: detections.filter((d: { type: string }) => d.type === type).length,
      })),
      trend: [
        { date: '06-11', count: 8 }, { date: '06-12', count: 12 }, { date: '06-13', count: 5 },
        { date: '06-14', count: 15 }, { date: '06-15', count: 10 }, { date: '06-16', count: 7 }, { date: '06-17', count: 5 },
      ],
    },
  });
});

// ---- Drone Commands ----
operationsRouter.post('/drone/command', (req, res) => {
  const { command } = req.body;
  const validCommands = ['patrol', 'hover', 'return', 'emergency', 'photo', 'speaker'];
  if (!validCommands.includes(command)) {
    return res.status(400).json({ code: 400, message: '无效指令' });
  }
  const responses: Record<string, string> = {
    patrol: '无人机继续巡逻任务',
    hover: '无人机悬停中',
    return: '无人机正在返航，预计2分钟后降落',
    emergency: '应急起飞已激活，飞往指定坐标',
    photo: '已拍摄照片并保存',
    speaker: '喊话器已激活，播放预设语音',
  };
  res.json({ code: 200, success: true, message: responses[command] || '指令已执行', command, time: new Date().toISOString() });
});

// ---- Report Generation ----
operationsRouter.post('/report/generate', (req, res) => {
  const { type, shipName, violationType } = req.body;
  const report = {
    id: `ZGHF-${Date.now()}`,
    type: type || '处罚建议书',
    title: type === '不予处罚' ? '不予处罚建议书' : '行政处罚建议书',
    caseNumber: `浙港航罚〔2026〕第 ${String(Math.floor(Math.random() * 900) + 100)} 号`,
    shipName: shipName || '浙海通008',
    violationType: violationType || '未穿救生衣',
    time: new Date().toISOString(),
    generatedBy: '智能执法辅助系统',
    content: '详见报告正文...',
  };
  res.json({ code: 200, success: true, message: '报告生成成功', data: report });
});

// ---- RAG Query Simulation ----
operationsRouter.post('/rag/query', (req, res) => {
  const { question } = req.body;
  const qa: Record<string, string> = {
    '桥区追越': '根据《内河交通安全管理条例》第X条及《浙江省水上交通安全管理办法》第Y条，桥区水域（桥梁上游500米至下游300米）禁止船舶追越。违反规定将处2000元以上10000元以下罚款。',
    '救生衣': '根据《内河交通安全管理条例》第X条，船舶作业人员未按规定穿着救生衣，可处警告或500元以上2000元以下罚款。',
    '超载': '根据《内河交通安全管理条例》第X条，船舶超载航行，可暂扣或吊销相关证书，并处5000元以上50000元以下罚款。',
    'AIS': '根据相关规定，船舶AIS设备必须保持24小时开机状态。故意关闭AIS设备可处2000元以上10000元以下罚款。',
    'default': '根据现行法规，该行为由属地海事管理机构依法处理。具体适用条款建议查阅最新版《内河交通安全管理条例》及相关地方性法规。',
  };
  const matched = Object.keys(qa).find(k => question?.includes(k));
  res.json({ code: 200, data: { question, answer: qa[matched || 'default'], sources: ['《内河交通安全管理条例》', '《浙江省水上交通安全管理办法》'] } });
});

// ---- Dashboard Summary ----
operationsRouter.get('/dashboard/summary', (_req, res) => {
  const warnings = JSON.parse(readFileSync(warningsPath, 'utf-8'));
  const hydrology = JSON.parse(readFileSync(join(__dirname, '../../mock-data/hydrology.json'), 'utf-8'));
  const weather = JSON.parse(readFileSync(join(__dirname, '../../mock-data/weather.json'), 'utf-8'));
  const ships = JSON.parse(readFileSync(join(__dirname, '../../mock-data/ships.json'), 'utf-8'));
  res.json({
    code: 200,
    data: {
      waterLevel: hydrology.currentData[0].level,
      velocity: hydrology.currentData[0].velocity,
      flow: hydrology.currentData[1].flow,
      rainfall: weather.current.rainfall.value,
      windSpeed: weather.current.wind.speed,
      shipCount: ships.positions.length,
      activeShips: ships.positions.filter((p: { status: string }) => p.status === '航行中').length,
      atAnchor: ships.positions.filter((p: { status: string }) => p.status === '锚泊').length,
      warningCount: warnings.warnings.filter((w: { status: string }) => w.status === '待审核').length,
      detectionCount: warnings.aiDetections.filter((d: { status: string }) => d.status === '待审核').length,
      weatherWarning: weather.current.warning,
    },
  });
});
