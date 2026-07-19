import { Router } from 'express';
export const gapRouter = Router();
const now = () => new Date().toISOString();

// ========== KNOWLEDGE BASE CRUD ==========
let knowledge: {id:string;title:string;category:string;content:string;tags:string[];status:string;author:string;createdAt:string;updatedAt:string}[] = [
  {id:'K001',title:'《内河交通安全管理条例》第三章',category:'法规',content:'船舶航行、停泊和作业必须遵守本条例规定...',tags:['航行','停泊','作业安全'],status:'published',author:'管理员',createdAt:'2026-05-01',updatedAt:'2026-05-01'},
  {id:'K002',title:'桥区水域禁止追越规定',category:'法规',content:'桥区水域（上游500米至下游300米）禁止船舶追越...',tags:['桥区','追越','安全'],status:'published',author:'管理员',createdAt:'2026-05-10',updatedAt:'2026-06-01'},
  {id:'K003',title:'未穿救生衣处罚案例(2025)',category:'案例',content:'2025年7月金华航区查处未穿救生衣案件，处罚500元...',tags:['救生衣','处罚','案例'],status:'published',author:'张管理',createdAt:'2026-04-15',updatedAt:'2026-04-15'},
  {id:'K004',title:'暴雨黄色预警应急处置流程',category:'预案',content:'当气象局发布暴雨黄色预警后...',tags:['暴雨','应急','预案'],status:'draft',author:'李执法',createdAt:'2026-06-10',updatedAt:'2026-06-10'},
  {id:'K005',title:'船舶超载判定标准',category:'标准',content:'根据吃水线判定超载...',tags:['超载','吃水线','标准'],status:'review',author:'王运维',createdAt:'2026-06-12',updatedAt:'2026-06-12'},
];

gapRouter.get('/knowledge', (req, res) => {
  const { category, status, keyword } = req.query as Record<string,string>;
  let list = [...knowledge];
  if (category && category !== 'all') list = list.filter(k => k.category === category);
  if (status && status !== 'all') list = list.filter(k => k.status === status);
  if (keyword) list = list.filter(k => k.title.includes(keyword) || k.content.includes(keyword) || k.tags.join(',').includes(keyword));
  res.json({ code:200, data:list, total:list.length, categories:['法规','案例','预案','标准','文书','常见问题'] });
});

gapRouter.post('/knowledge', (req, res) => {
  const { title, category, content, tags } = req.body;
  const entry = { id:`K${String(knowledge.length+1).padStart(3,'0')}`, title, category:category||'法规', content:content||'', tags:tags||[], status:'draft', author:'当前用户', createdAt:now().slice(0,10), updatedAt:now().slice(0,10) };
  knowledge.unshift(entry);
  res.json({ code:200, message:'知识条目录入成功，待审核后上线', data:entry });
});

gapRouter.put('/knowledge/:id', (req, res) => {
  const idx = knowledge.findIndex(k => k.id === req.params.id);
  if (idx === -1) return res.status(404).json({ code:404 });
  knowledge[idx] = { ...knowledge[idx], ...req.body, updatedAt: now().slice(0,10) };
  res.json({ code:200, message:'更新成功', data:knowledge[idx] });
});

gapRouter.delete('/knowledge/:id', (req, res) => {
  knowledge = knowledge.filter(k => k.id !== req.params.id);
  res.json({ code:200, message:'已删除' });
});

gapRouter.post('/knowledge/:id/review', (req, res) => {
  const k = knowledge.find(e => e.id === req.params.id);
  if (!k) return res.status(404).json({ code:404 });
  k.status = req.body.status || 'published';
  k.updatedAt = now().slice(0,10);
  res.json({ code:200, message:`知识条目已${k.status==='published'?'发布':'审核'}` });
});

// ========== Q&A FEEDBACK ==========
const feedbacks: {id:string;question:string;answer:string;rating:'up'|'down';time:string}[] = [];
gapRouter.post('/feedback', (req, res) => {
  const { question, answer, rating } = req.body;
  feedbacks.unshift({ id:`FB${Date.now()}`, question, answer, rating, time: now() });
  res.json({ code:200, message:'反馈已记录' });
});
gapRouter.get('/feedback/stats', (_req, res) => {
  const ups = feedbacks.filter(f => f.rating === 'up').length;
  const downs = feedbacks.filter(f => f.rating === 'down').length;
  res.json({ code:200, data:{ total:feedbacks.length, up:ups, down:downs, rate:feedbacks.length?Math.round(ups/feedbacks.length*100):100, recent:feedbacks.slice(0,10) } });
});

// ========== CROSS-MODAL SEARCH ==========
gapRouter.post('/cross-modal/search', (req, res) => {
  const { query } = req.body;
  const results = [
    { type:'image', title:'龙游港区-1号摄像头截图', url:'/api/ops/cross-modal/file/img001', time:'2026-06-17 09:15', relevance:0.94 },
    { type:'video', title:'衢江大桥监控片段(30s)', url:'/api/ops/cross-modal/file/vid001', time:'2026-06-17 08:30', relevance:0.89 },
    { type:'image', title:'无人机航拍-锚地全景', url:'/api/ops/cross-modal/file/img003', time:'2026-06-16 14:00', relevance:0.82 },
    { type:'image', title:'船舶超载对比图', url:'/api/ops/cross-modal/file/img005', time:'2026-06-15 10:00', relevance:0.76 },
    { type:'document', title:'桥区管理规范.pdf', url:'/api/ops/cross-modal/file/doc001', time:'2026-06-01', relevance:0.68 },
  ];
  res.json({ code:200, data:results, query });
});
gapRouter.get('/cross-modal/file/:id', (_req, res) => {
  res.json({ code:200, message:'文件数据流（模拟）', id:_req.params.id, note:'生产环境返回实际文件流' });
});

// ========== WARNING RULES CONFIG ==========
let warningRules = [
  { id:'WR001', name:'水位-黄色', conditions:[{field:'waterLevel',op:'>=',value:27.9}], level:'yellow', enabled:true, pushMethod:'platform', receivers:['值班员','辖区队长'] },
  { id:'WR002', name:'水位-橙色', conditions:[{field:'waterLevel',op:'>=',value:31.0}], level:'orange', enabled:true, pushMethod:'both', receivers:['值班员','辖区队长','分管领导'] },
  { id:'WR003', name:'降雨+水位', conditions:[{field:'rainfall',op:'>=',value:50},{field:'waterLevel',op:'>=',value:28.0}], level:'orange', enabled:true, pushMethod:'both', receivers:['值班员','分管领导'] },
  { id:'WR004', name:'流速超限', conditions:[{field:'velocity',op:'>=',value:3.0}], level:'yellow', enabled:true, pushMethod:'platform', receivers:['值班员'] },
];

let dynamicThresholds = [
  { id:'TH001', stationId:'H001', stationName:'兰溪水文站', field:'waterLevel', defaultWarning:31.0, dynamicWarning:30.5, defaultDanger:33.5, dynamicDanger:32.8, autoAdjust:true },
  { id:'TH002', stationId:'H002', stationName:'衢江阶梯枢纽', field:'waterLevel', defaultWarning:28.0, dynamicWarning:27.5, defaultDanger:30.0, dynamicDanger:29.2, autoAdjust:false },
];

let pushRecords = [
  { id:'PR001', warningId:'W001', title:'兰溪水位预警', level:'yellow', method:'平台推送', time:'2026-06-17 09:45', status:'已送达', receivers:3, readCount:2 },
  { id:'PR002', warningId:'W002', title:'暴雨黄色预警', level:'yellow', method:'平台+短信', time:'2026-06-17 09:30', status:'已送达', receivers:8, readCount:6 },
  { id:'PR003', warningId:'W003', title:'泄洪橙色预警', level:'orange', method:'平台+短信', time:'2026-06-17 08:00', status:'已送达', receivers:5, readCount:5 },
];

gapRouter.get('/warning/rules', (_req, res) => res.json({ code:200, data:warningRules }));
gapRouter.post('/warning/rules', (req, res) => { const r = { ...req.body, id:`WR${String(warningRules.length+1).padStart(3,'0')}` }; warningRules.push(r); res.json({code:200,data:r}); });
gapRouter.put('/warning/rules/:id', (req, res) => { const i = warningRules.findIndex(r=>r.id===req.params.id); if(i===-1)return res.status(404).json({code:404}); warningRules[i]={...warningRules[i],...req.body}; res.json({code:200,data:warningRules[i]}); });
gapRouter.delete('/warning/rules/:id', (req, res) => { warningRules = warningRules.filter(r=>r.id!==req.params.id); res.json({code:200,message:'已删除'}); });

gapRouter.get('/warning/thresholds', (_req, res) => res.json({ code:200, data:dynamicThresholds }));
gapRouter.put('/warning/thresholds/:id', (req, res) => { const i = dynamicThresholds.findIndex(t=>t.id===req.params.id); if(i===-1)return res.status(404).json({code:404}); dynamicThresholds[i]={...dynamicThresholds[i],...req.body}; res.json({code:200,data:dynamicThresholds[i]}); });

gapRouter.get('/warning/push-records', (req, res) => {
  const { method, level } = req.query as Record<string,string>;
  let list = [...pushRecords];
  if (method && method !== 'all') list = list.filter(r => r.method.includes(method));
  if (level && level !== 'all') list = list.filter(r => r.level === level);
  res.json({ code:200, data:list, total:list.length });
});

// ========== INFERENCE ORCHESTRATION ==========
let pipelines = [
  { id:'PL001', name:'视频流智能分析', steps:['船舶检测','船舶分类','行为分析','预警生成'], status:'running', qps:42, description:'视频流接入-船舶定位-类型识别-行为判断-预警生成' },
  { id:'PL002', name:'智能问答+报告', steps:['语义理解','知识检索','报告生成'], status:'running', qps:18, description:'自然语言理解-知识匹配-答案生成/报告输出' },
];

let trainingJobs = [
  { id:'TR001', model:'船舶检测模型', status:'running', progress:67, epoch:'45/60', accuracy:0.938, loss:0.124, dataset:'ship-det-jun(2500张)', startedAt:'2026-06-16 14:00', eta:'2026-06-17 16:00' },
  { id:'TR002', model:'行为分析模型', status:'running', progress:34, epoch:'18/50', accuracy:0.862, loss:0.218, dataset:'behavior-jun(1200条)', startedAt:'2026-06-17 08:00', eta:'2026-06-18 08:00' },
  { id:'TR003', model:'船舶分类模型', status:'queued', progress:0, epoch:'0/40', accuracy:0, loss:0, dataset:'ship-cls-jun(800张)', startedAt:'-', eta:'排队中' },
];

gapRouter.get('/inference/pipelines', (_req, res) => res.json({ code:200, data:pipelines }));
gapRouter.post('/inference/pipelines', (req, res) => {
  const p = { id:`PL${String(pipelines.length+1).padStart(3,'0')}`, ...req.body, status:'stopped', qps:0 };
  pipelines.push(p);
  res.json({ code:200, message:'编排已保存', data:p });
});

gapRouter.get('/inference/training', (_req, res) => res.json({ code:200, data:trainingJobs }));
gapRouter.post('/inference/training', (req, res) => {
  const job = { id:`TR${String(trainingJobs.length+1).padStart(3,'0')}`, ...req.body, status:'running', progress:0, startedAt:now() };
  trainingJobs.unshift(job);
  res.json({ code:200, message:'训练任务已启动', data:job });
});
gapRouter.post('/inference/training/:id/pause', (req, res) => {
  const job = trainingJobs.find(j => j.id === req.params.id);
  if (job) job.status = 'paused';
  res.json({ code:200, message:'训练已暂停' });
});
gapRouter.post('/inference/training/:id/resume', (req, res) => {
  const job = trainingJobs.find(j => j.id === req.params.id);
  if (job) job.status = 'running';
  res.json({ code:200, message:'训练已继续' });
});

// ========== FILE PARSE ==========
gapRouter.post('/knowledge/parse', (req, res) => {
  // Simulate parsing binary documents (Word/PDF)
  const fileName = 'uploaded_file';
  const text = `[${fileName}] 文件内容解析结果（模拟）。\n\n生产环境通过 Apache Tika / python-docx / PyPDF2 等库提取文本内容，支持 .doc .docx .pdf 等格式的全文提取与检索。\n\n解析后的文本自动进行向量化处理，存入 ChromaDB 向量数据库，支持语义检索。`;
  res.json({ code:200, data:{ text, fileName, parsedAt: now() } });
});

// ========== KNOWLEDGE BASE ==========
// Also serve categories
gapRouter.get('/knowledge/categories', (_req, res) => res.json({ code:200, data:['法规','案例','预案','标准','文书','常见问题'] }));
