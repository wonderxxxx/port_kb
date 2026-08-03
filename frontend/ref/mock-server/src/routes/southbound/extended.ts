import { Router } from 'express';
export const extendedRouter = Router();

const now = () => new Date().toISOString();

// ========== MODEL MANAGEMENT ==========
const models = [
  { id:'M001', name:'船舶检测模型', type:'目标检测', framework:'YOLOv8', version:'v2.3.1', status:'running', accuracy:0.942, recall:0.918, fps:32, size:'128MB', gpuMemory:'2.1GB', deployTime:'2026-06-15', author:'算法团队A', description:'内河船舶实时检测与定位' },
  { id:'M002', name:'船舶分类模型', type:'图像分类', framework:'ResNet50', version:'v1.8.0', status:'running', accuracy:0.896, recall:0.871, fps:45, size:'94MB', gpuMemory:'1.2GB', deployTime:'2026-06-10', author:'算法团队A', description:'船舶类型细粒度分类（客船/货船/工程船等）' },
  { id:'M003', name:'行为异常分析', type:'时序分析', framework:'BiLSTM', version:'v1.5.2', status:'running', accuracy:0.873, recall:0.845, fps:28, size:'156MB', gpuMemory:'3.4GB', deployTime:'2026-06-12', author:'算法团队B', description:'超速/逆行/违规停靠等异常行为检测' },
  { id:'M004', name:'智能问答模型', type:'NLP', framework:'Qwen-7B-LoRA', version:'v2.1.0', status:'running', accuracy:0.917, recall:0.892, fps:18, size:'4.2GB', gpuMemory:'8.6GB', deployTime:'2026-06-14', author:'算法团队B', description:'港航领域知识问答与语义理解' },
  { id:'M005', name:'水线检测模型', type:'目标检测', framework:'YOLOv8-seg', version:'v1.2.0', status:'running', accuracy:0.861, recall:0.833, fps:25, size:'142MB', gpuMemory:'2.8GB', deployTime:'2026-06-16', author:'算法团队A', description:'船舶吃水线检测与超载判断' },
  { id:'M006', name:'船舶识别(旧)', type:'目标检测', framework:'YOLOv5', version:'v1.0.0', status:'stopped', accuracy:0.891, recall:0.862, fps:22, size:'118MB', gpuMemory:'1.8GB', deployTime:'2026-05-01', author:'算法团队A', description:'旧版船舶检测模型(已停用)' },
];

const modelVersions = [
  { modelId:'M001', versions:[
    { version:'v2.3.1', status:'production', date:'2026-06-15', accuracy:0.942, recall:0.918, precision:0.935, f1:0.926, fps:32, modelSize:'128MB', gpuMemory:'2.1GB', inferenceTime:'18ms', changes:'优化夜间识别；新增小型渔船检测；Backbone: EfficientNet-B3；Head: Decoupled Head；损失函数: Focal Loss + CIOU', author:'算法团队A', dataset:'ship-det-v4(6000张)', reviewed:true },
    { version:'v2.3.0', status:'gray', date:'2026-06-08', accuracy:0.938, recall:0.912, precision:0.928, f1:0.920, fps:28, modelSize:'145MB', gpuMemory:'2.5GB', inferenceTime:'24ms', changes:'更换backbone为EfficientNet-B2；新增attention模块；训练数据扩充至5000张', author:'算法团队A', dataset:'ship-det-v3(5000张)', reviewed:true },
    { version:'v2.2.1', status:'archived', date:'2026-05-20', accuracy:0.931, recall:0.905, precision:0.918, f1:0.911, fps:35, modelSize:'118MB', gpuMemory:'1.9GB', inferenceTime:'15ms', changes:'增加数据增强策略(Mosaic+MixUp)；优化anchor尺寸适配内河船舶', author:'算法团队A', dataset:'ship-det-v2(3500张)', reviewed:true },
    { version:'v2.2.0', status:'archived', date:'2026-05-10', accuracy:0.925, recall:0.895, precision:0.908, f1:0.901, fps:38, modelSize:'110MB', gpuMemory:'1.8GB', inferenceTime:'13ms', changes:'初始训练版本；Backbone: YOLOv8n；基础数据标注2500张', author:'算法团队A', dataset:'ship-det-v1(2500张)', reviewed:true },
  ]},
  { modelId:'M003', versions:[
    { version:'v1.5.2', status:'production', date:'2026-06-12', accuracy:0.873, recall:0.845, precision:0.861, f1:0.853, fps:28, modelSize:'156MB', gpuMemory:'3.4GB', inferenceTime:'35ms', changes:'优化BiLSTM层数；新增桥区越界检测；时序窗口扩展至30帧', author:'算法团队B', dataset:'behavior-v3(1200条)', reviewed:true },
    { version:'v1.5.0', status:'archived', date:'2026-05-25', accuracy:0.858, recall:0.821, precision:0.838, f1:0.829, fps:25, modelSize:'168MB', gpuMemory:'3.8GB', inferenceTime:'42ms', changes:'引入Transformer时序编码器；增加异常停泊检测', author:'算法团队B', dataset:'behavior-v2(800条)', reviewed:true },
    { version:'v1.4.0', status:'archived', date:'2026-05-10', accuracy:0.835, recall:0.798, precision:0.812, f1:0.805, fps:22, modelSize:'142MB', gpuMemory:'3.2GB', inferenceTime:'48ms', changes:'初始BiLSTM模型；支持超速和逆行检测', author:'算法团队B', dataset:'behavior-v1(500条)', reviewed:true },
  ]},
];

extendedRouter.get('/models', (_req, res) => res.json({ code:200, data:models, total:models.length }));
extendedRouter.get('/models/:id/versions', (req, res) => {
  const mv = modelVersions.find(m => m.modelId === req.params.id);
  res.json({ code:200, data: mv?.versions || [] });
});
extendedRouter.post('/models/:id/deploy', (req, res) => {
  const model = models.find(m => m.id === req.params.id);
  if (!model) return res.status(404).json({ code:404 });
  const { version } = req.body;
  model.version = version || model.version;
  model.status = 'running';
  model.deployTime = now().slice(0,10);
  res.json({ code:200, message:`模型 ${model.name} ${model.version} 已发布至生产环境`, data:model });
});
extendedRouter.post('/models/:id/rollback', (req, res) => {
  const model = models.find(m => m.id === req.params.id);
  if (!model) return res.status(404).json({ code:404 });
  const mv = modelVersions.find(m => m.modelId === req.params.id);
  const prev = mv?.versions.find(v => v.status === 'archived' || v.status === 'gray');
  model.version = prev?.version || model.version;
  res.json({ code:200, message:`模型已回滚至 ${model.version}`, data:model });
});

// ========== INFERENCE SERVICE ==========
const services = [
  { id:'SVC001', name:'船舶检测服务', models:['M001','M002'], status:'healthy', uptime:'14d 6h', qps:128, avgLatency:'18ms', p99Latency:'45ms', gpuUtil:'62%', memUtil:'4.2/8GB', replicas:3, errors24h:2 },
  { id:'SVC002', name:'行为分析服务', models:['M003'], status:'healthy', uptime:'12d 3h', qps:85, avgLatency:'35ms', p99Latency:'82ms', gpuUtil:'78%', memUtil:'6.8/8GB', replicas:2, errors24h:0 },
  { id:'SVC003', name:'智能问答服务', models:['M004'], status:'healthy', uptime:'10d 8h', qps:42, avgLatency:'120ms', p99Latency:'350ms', gpuUtil:'91%', memUtil:'14.2/16GB', replicas:1, errors24h:1 },
  { id:'SVC004', name:'水线检测服务', models:['M005'], status:'degraded', uptime:'5d 2h', qps:56, avgLatency:'28ms', p99Latency:'120ms', gpuUtil:'85%', memUtil:'5.1/8GB', replicas:2, errors24h:15 },
];

extendedRouter.get('/inference/services', (_req, res) => res.json({ code:200, data:services }));
extendedRouter.post('/inference/services/:id/scale', (req, res) => {
  const svc = services.find(s => s.id === req.params.id);
  if (!svc) return res.status(404).json({ code:404 });
  svc.replicas = Math.max(1, Math.min(8, svc.replicas + (req.body.delta || 1)));
  res.json({ code:200, message:`服务 ${svc.name} 已扩缩容至 ${svc.replicas} 副本`, data:svc });
});
extendedRouter.get('/inference/metrics', (_req, res) => {
  const history = Array.from({length:24}, (_,i) => ({
    time: `${String(i).padStart(2,'0')}:00`,
    qps: 60 + Math.floor(Math.random()*80),
    gpuUtil: 55 + Math.floor(Math.random()*35),
    latency: 15 + Math.floor(Math.random()*30),
  }));
  res.json({ code:200, data:{ totalQPS: services.reduce((s,svc)=>s+svc.qps,0), totalGPUs:4, avgGpuUtil:'79%', history } });
});

// ========== DATA ANNOTATION ==========
const annotationTasks = [
  { id:'ANN001', name:'船舶类型标注(6月批次)', type:'图片分类', total:2500, completed:1850, annotators:3, status:'in-progress', dataset:'ship-classification-jun', created:'2026-06-01', deadline:'2026-06-30' },
  { id:'ANN002', name:'异常行为标注-桥区越界', type:'视频标注', total:800, completed:800, annotators:4, status:'completed', dataset:'bridge-violation', created:'2026-06-05', deadline:'2026-06-20' },
  { id:'ANN003', name:'吃水线标注', type:'图片分割', total:1200, completed:320, annotators:2, status:'in-progress', dataset:'waterline-seg', created:'2026-06-10', deadline:'2026-07-10' },
  { id:'ANN004', name:'夜间船舶标注', type:'图片标注', total:1500, completed:0, annotators:0, status:'pending', dataset:'night-ship-det', created:'2026-06-17', deadline:'2026-07-17' },
];

const annotationSamples = Array.from({length:20}, (_,i) => ({
  id:`IMG${String(i+1).padStart(4,'0')}`,
  taskId: i < 8 ? 'ANN001' : i < 14 ? 'ANN003' : 'ANN002',
  fileName: i < 8 ? `ship_060${i+1}.jpg` : i < 14 ? `waterline_00${i-7}.jpg` : `bridge_00${i-13}.mp4`,
  status: i < 10 ? '已标注' : i < 14 ? '标注中' : '待标注',
  labels: i < 8 ? [['货船'],['集装箱船']][i%2] : i < 14 ? [['水线'],['船体']][i%2] : ['桥区越界'],
  annotator: i < 10 ? ['张三','李四','王五'][i%3] : null,
  time: i < 10 ? `2026-06-${String(10+i).padStart(2,'0')}T09:${String(i*3%60).padStart(2,'0')}:00` : null,
  thumbnail: null,
}));

extendedRouter.get('/annotation/tasks', (_req, res) => res.json({ code:200, data:annotationTasks }));
extendedRouter.get('/annotation/samples', (req, res) => {
  const { taskId } = req.query;
  const filtered = taskId ? annotationSamples.filter(s => s.taskId === taskId) : annotationSamples;
  res.json({ code:200, data:filtered, total:filtered.length });
});
extendedRouter.post('/annotation/samples/:id/label', (req, res) => {
  const sample = annotationSamples.find(s => s.id === req.params.id);
  if (!sample) return res.status(404).json({ code:404 });
  sample.status = '已标注';
  sample.labels = req.body.labels || sample.labels;
  sample.annotator = req.body.annotator || '当前用户';
  sample.time = now();
  res.json({ code:200, message:'标注已保存', data:sample });
});
extendedRouter.get('/annotation/stats', (_req, res) => {
  res.json({ code:200, data:{
    totalSamples: 6000, annotated: 4200, pending: 1500, inProgress: 300,
    annotators: 5, tasksActive: 3,
    byLabel: [{label:'货船',count:1850},{label:'集装箱船',count:620},{label:'工程船',count:480},{label:'客船',count:350},{label:'危险品船',count:280},{label:'渔船',count:180},{label:'桥区越界',count:800},{label:'超速',count:420}],
    trend: [{date:'06-11',count:180},{date:'06-12',count:220},{date:'06-13',count:310},{date:'06-14',count:280},{date:'06-15',count:350},{date:'06-16',count:420},{date:'06-17',count:150}],
  }});
});

// ========== SYSTEM LOGS ==========
const logEntries = Array.from({length:50}, (_,i) => ({
  id:`LOG${String(i+1).padStart(5,'0')}`,
  time: `2026-06-17T${String(8+i/4|0).padStart(2,'0')}:${String((i*7)%60).padStart(2,'0')}:${String((i*13)%60).padStart(2,'0')}`,
  category: ['用户操作','系统运行','模型推理','数据交互','预警推送'][i%5],
  level: i%10===0 ? 'ERROR' : i%7===0 ? 'WARN' : 'INFO',
  operator: i%3===0 ? null : ['张管理','李执法','王运维','赵算法'][i%4],
  module: ['预警管控','船舶调度','违法行为识别','智能问答','模型管理','系统管理'][i%6],
  action: ['登录系统','查询水位','提交调度','审核线索','发布模型','推送预警','生成报告','检索知识','标注数据','导出日志'][i%10],
  detail: `操作详情记录 #${i+1}`,
  ip: `192.168.1.${100+i}`,
  result: i%10===0 ? '失败' : '成功',
  duration: `${(Math.random()*500+10).toFixed(0)}ms`,
}));

extendedRouter.get('/logs', (req, res) => {
  const { category, level, keyword, page='1', pageSize='20' } = req.query as Record<string,string>;
  let filtered = [...logEntries];
  if (category && category !== 'all') filtered = filtered.filter(l => l.category === category);
  if (level && level !== 'all') filtered = filtered.filter(l => l.level === level);
  if (keyword) filtered = filtered.filter(l => l.action.includes(keyword) || l.detail.includes(keyword) || l.module.includes(keyword));
  const p = parseInt(page), ps = parseInt(pageSize);
  res.json({ code:200, data:filtered.slice((p-1)*ps, p*ps), total:filtered.length, page:p, pageSize:ps });
});
extendedRouter.get('/logs/stats', (_req, res) => {
  res.json({ code:200, data:{
    todayTotal: 1247, errors24h: 18, warnings24h: 35,
    byCategory: [{category:'用户操作',count:520},{category:'系统运行',count:280},{category:'模型推理',count:210},{category:'数据交互',count:145},{category:'预警推送',count:92}],
    byHour: Array.from({length:12},(_,i)=>({hour:`${String(i+8).padStart(2,'0')}:00`,count:40+Math.floor(Math.random()*80)})),
    topErrors: [{action:'模型推理超时',count:8},{action:'GPU显存不足',count:5},{action:'数据接口异常',count:3}],
  }});
});

// ========== VOICE INTERACTION ==========
extendedRouter.post('/voice/asr', (_req, res) => {
  res.json({ code:200, data:{ text:'兰溪水文站当前水位28.65米，接近警戒水位31米', confidence:0.95, duration:'3.2s', language:'zh-CN' } });
});
extendedRouter.post('/voice/tts', (req, res) => {
  const { text } = req.body;
  const audioUrl = `/api/ops/voice/audio?text=${encodeURIComponent(text || '语音合成测试')}`;
  res.json({ code:200, data:{ audioUrl, duration:'4.5s', format:'mp3', text: text || '语音合成测试' } });
});
extendedRouter.get('/voice/audio', (req, res) => {
  res.json({ code:200, message:'TTS音频流（模拟）', text: req.query.text, note:'生产环境返回 audio/mpeg 流' });
});
extendedRouter.get('/voice/history', (_req, res) => {
  res.json({ code:200, data:[
    { id:'V001', type:'ASR', time:'2026-06-17 10:15', input:'语音输入 3.2s', output:'兰溪水位28.65米' },
    { id:'V002', type:'TTS', time:'2026-06-17 09:30', input:'暴雨黄色预警已发布', output:'语音播报 4.5s' },
    { id:'V003', type:'ASR', time:'2026-06-17 08:45', input:'语音输入 5.1s', output:'查询姚家船闸待闸船舶数量' },
  ]});
});

// ========== REPORT GENERATION ==========
const reportTemplates = [
  { id:'TPL001', name:'水上交通安全运行日报', category:'安全运行', format:'Word', period:'每日', fields:['日期','水位','船舶流量','事故数','预警数','处置情况'] },
  { id:'TPL002', name:'三防预警分析报告', category:'预警分析', format:'Word', period:'按需', fields:['预警等级','触发条件','影响范围','推送情况','处置结果'] },
  { id:'TPL003', name:'水路经济运行分析报告', category:'经济分析', format:'Excel', period:'每月', fields:['货运量','周转量','船舶艘次','同比环比'] },
  { id:'TPL004', name:'执法工单统计报告', category:'执法统计', format:'Excel', period:'每周', fields:['工单数','办结率','违法类型','处罚金额'] },
  { id:'TPL005', name:'航道养护统计报告', category:'航道养护', format:'PDF', period:'每季', fields:['养护里程','工程量','完成率','质量评估'] },
  { id:'TPL006', name:'应急处置总结报告', category:'应急管理', format:'Word', period:'按需', fields:['事件概述','响应过程','资源投入','处置评估','改进建议'] },
];

extendedRouter.get('/reports/templates', (_req, res) => res.json({ code:200, data:reportTemplates }));
extendedRouter.post('/reports/generate', (req, res) => {
  const { templateId, period, region } = req.body;
  const tpl = reportTemplates.find(t => t.id === templateId) || reportTemplates[0];
  res.json({ code:200, success:true, message:`${tpl.name} 生成成功`, data:{
    id:`RPT-${Date.now()}`,
    templateName: tpl.name,
    format: tpl.format,
    period: period || tpl.period,
    region: region || '金华',
    generatedAt: now(),
    downloadUrl: `/api/ops/reports/download/${tpl.id}`,
  }});
});
