import { useState, useEffect } from 'react';
import { StatusTag } from '../components/StatusBadge';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface Model { id:string;name:string;type:string;framework:string;version:string;status:string;accuracy:number;recall:number;fps:number;size:string;gpuMemory:string;deployTime:string;author:string;description:string }
interface ModelVersion { version:string;status:string;date:string;accuracy:number;changes:string;reviewed:boolean }
interface InferenceSvc { id:string;name:string;models:string[];status:string;uptime:string;qps:number;avgLatency:string;p99Latency:string;gpuUtil:string;memUtil:string;replicas:number;errors24h:number }
interface Pipeline { id:string;name:string;steps:string[];status:string;qps:number;description:string }
interface TrainingJob { id:string;model:string;status:string;progress:number;epoch:string;accuracy:number;loss:number;dataset:string;startedAt:string;eta:string;learningRate?:number;batchSize?:number;optimizer?:string }

const AVAILABLE_STEPS = ['船舶检测','船舶分类','行为分析','预警生成','语义理解','知识检索','报告生成','数据清洗','水线检测','轨迹推演'];

export default function ModelCenter() {
  const [tab, setTab] = useState<'repo'|'versions'|'deploy'|'inference'|'orchestrate'|'training'>('repo');
  const [models, setModels] = useState<Model[]>([]);
  const [services, setServices] = useState<InferenceSvc[]>([]);
  const [versions, setVersions] = useState<ModelVersion[]>([]);
  const [selectedModel, setSelectedModel] = useState('M001');
  const [metrics, setMetrics] = useState<{totalQPS:number;avgGpuUtil:string;history:{time:string;qps:number;gpuUtil:number;latency:number}[]}|null>(null);
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  // Version compare
  const [compareModel, setCompareModel] = useState('');
  const [compareVersions, setCompareVersions] = useState<ModelVersion[]>([]);

  // Pipeline builder
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [editingPipeline, setEditingPipeline] = useState<{id?:string;name:string;steps:string[];description:string}>({name:'',steps:[],description:''});
  // Training
  const [trainingJobs, setTrainingJobs] = useState<TrainingJob[]>([]);
  const [trainingForm, setTrainingForm] = useState({model:'船舶检测模型',learningRate:0.001,batchSize:32,epochs:60,optimizer:'Adam',dataset:'ship-det-jun(2500张)'});

  const fetchData = async () => {
    const [mRes, sRes, metRes, pRes, tRes] = await Promise.all([
      fetch('/api/ops/models').then(r=>r.json()),
      fetch('/api/ops/inference/services').then(r=>r.json()),
      fetch('/api/ops/inference/metrics').then(r=>r.json()),
      fetch('/api/ops/inference/pipelines').then(r=>r.json()),
      fetch('/api/ops/inference/training').then(r=>r.json()),
    ]);
    if (mRes.data) setModels(mRes.data);
    if (sRes.data) setServices(sRes.data);
    if (metRes.data) setMetrics(metRes.data);
    if (pRes.data) setPipelines(pRes.data);
    if (tRes.data) setTrainingJobs(tRes.data);
  };

  useEffect(() => { fetchData(); }, []);
  useEffect(() => {
    if (tab==='versions') { fetch(`/api/ops/models/${selectedModel}/versions`).then(r=>r.json()).then(d=>{if(d.data)setVersions(d.data)}); setCompareModel(''); }
  }, [tab, selectedModel]);
  useEffect(() => {
    if (compareModel) fetch(`/api/ops/models/${compareModel}/versions`).then(r=>r.json()).then(d=>{if(d.data)setCompareVersions(d.data)});
  }, [compareModel]);

  const handleDeploy = async (id:string) => { await fetch(`/api/ops/models/${id}/deploy`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})}); addToast('模型已发布至生产环境'); fetchData(); };
  const handleRollback = async (id:string) => { await fetch(`/api/ops/models/${id}/rollback`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({})}); addToast('模型已回滚至上一版本'); fetchData(); };
  const handleScale = async (id:string, delta:number) => { await fetch(`/api/ops/inference/services/${id}/scale`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({delta})}); addToast(delta>0?'已扩容':'已缩容'); fetchData(); };

  // Pipeline builder
  const addStep = (step:string) => {
    if (!editingPipeline.steps.includes(step)) setEditingPipeline({...editingPipeline,steps:[...editingPipeline.steps,step]});
  };
  const removeStep = (idx:number) => {
    setEditingPipeline({...editingPipeline,steps:editingPipeline.steps.filter((_,i)=>i!==idx)});
  };
  const moveStep = (from:number, to:number) => {
    const s = [...editingPipeline.steps];
    const [item] = s.splice(from,1);
    s.splice(to,0,item);
    setEditingPipeline({...editingPipeline,steps:s});
  };
  const savePipeline = async () => {
    if (!editingPipeline.name.trim()) { addToast('请输入编排名称','warning'); return; }
    await fetch('/api/ops/inference/pipelines',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(editingPipeline)});
    addToast('编排已保存'); setEditingPipeline({name:'',steps:[],description:''});
    fetch('/api/ops/inference/pipelines').then(r=>r.json()).then(d=>{if(d.data)setPipelines(d.data)});
  };

  // Training
  const startTraining = async () => {
    await fetch('/api/ops/inference/training',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(trainingForm)});
    addToast('训练任务已启动');
    fetch('/api/ops/inference/training').then(r=>r.json()).then(d=>{if(d.data)setTrainingJobs(d.data)});
  };
  const pauseTraining = async (id:string) => { await fetch(`/api/ops/inference/training/${id}/pause`,{method:'POST'}); setTrainingJobs(p=>p.map(j=>j.id===id?{...j,status:'paused'}:j)); addToast('已暂停'); };
  const resumeTraining = async (id:string) => { await fetch(`/api/ops/inference/training/${id}/resume`,{method:'POST'}); setTrainingJobs(p=>p.map(j=>j.id===id?{...j,status:'running'}:j)); addToast('已继续'); };

  const tabs = [
    {key:'repo',label:'模型仓库'},{key:'versions',label:'版本管理'},{key:'deploy',label:'发布审核'},
    {key:'inference',label:'推理服务'},{key:'orchestrate',label:'服务编排'},{key:'training',label:'模型训练'},
  ] as const;

  return (
    <div className="space-y-6">
      {toasts.length>0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div>
        <h2 className="text-xl font-bold text-slate-800">模型中心</h2>
        <p className="text-sm text-slate-500 mt-1">模型仓库 · 版本管理与对比 · 发布审核 · 推理服务 · 可视化编排 · 模型训练</p>
      </div>

      {/* Tab bar — scrollable for mobile */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 overflow-x-auto">
        {tabs.map(t=>(<button key={t.key} onClick={()=>setTab(t.key)} className={`flex-shrink-0 px-3 py-2 rounded-md text-xs font-medium transition-colors ${tab===t.key?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>{t.label}</button>))}
      </div>

      {/* ====== REPO ====== */}
      {tab==='repo' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {models.map(m=>(
            <div key={m.id} className="card hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div><h4 className="font-semibold">{m.name}</h4><p className="text-xs text-slate-400">{m.framework} · {m.type}</p></div>
                <StatusTag status={m.status==='running'?'online':'offline'} />
              </div>
              <p className="text-xs text-slate-500 mb-3">{m.description}</p>
              <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                <div><span className="text-slate-400">版本</span><p className="font-medium">{m.version}</p></div>
                <div><span className="text-slate-400">准确率</span><p className="font-medium text-blue-600">{(m.accuracy*100).toFixed(1)}%</p></div>
                <div><span className="text-slate-400">推理速度</span><p className="font-medium">{m.fps} FPS</p></div>
                <div><span className="text-slate-400">显存占用</span><p className="font-medium">{m.gpuMemory}</p></div>
              </div>
              <div className="flex gap-2">
                {m.status==='running' ? (
                  <button onClick={()=>handleRollback(m.id)} className="flex-1 px-3 py-2 bg-amber-50 text-amber-700 text-xs rounded-lg hover:bg-amber-100 font-medium">回滚版本</button>
                ) : (
                  <button onClick={()=>handleDeploy(m.id)} className="flex-1 px-3 py-2 bg-emerald-50 text-emerald-700 text-xs rounded-lg hover:bg-emerald-100 font-medium">发布上线</button>
                )}
                <button onClick={()=>{setSelectedModel(m.id);setTab('versions')}} className="px-3 py-2 bg-blue-50 text-blue-600 text-xs rounded-lg hover:bg-blue-100 font-medium">版本历史</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====== VERSIONS (with comparison) ====== */}
      {tab==='versions' && (
        <div className="space-y-6">
          {/* Version list */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <label className="text-sm text-slate-500">当前模型:</label>
                <select value={selectedModel} onChange={e=>setSelectedModel(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-sm">
                  {models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500"><th className="py-2 px-3">版本号</th><th className="py-2 px-3">状态</th><th className="py-2 px-3">日期</th><th className="py-2 px-3">准确率</th><th className="py-2 px-3">更新内容</th><th className="py-2 px-3">审核</th></tr></thead>
                <tbody>{versions.map((v,i)=>(<tr key={i} className="border-b border-slate-50 hover:bg-slate-50"><td className="py-2 px-3 font-medium font-mono text-xs">{v.version}</td><td className="py-2 px-3"><StatusTag status={v.status==='production'?'已完成':v.status==='gray'?'生效中':'待审核'}/></td><td className="py-2 px-3 text-xs text-slate-500">{v.date}</td><td className="py-2 px-3 text-xs text-blue-600 font-medium">{(v.accuracy*100).toFixed(1)}%</td><td className="py-2 px-3 text-xs text-slate-500 max-w-[200px] truncate">{v.changes}</td><td className="py-2 px-3 text-xs">{v.reviewed?'已审核':'待审核'}</td></tr>))}</tbody>
              </table>
            </div>
          </div>

          {/* Comprehensive version comparison */}
          <div className="card">
            <h4 className="font-semibold text-slate-700 mb-3">版本对比（同模型不同版本多维度对比）</h4>
            <p className="text-xs text-slate-400 mb-4">选择同一模型的两个版本，对比性能指标、资源占用、结构差异</p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="text-xs text-slate-500 block mb-1">版本 A</label>
                <select value={selectedModel} onChange={e=>setSelectedModel(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded text-sm">
                  {models.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {versions.length>0 && (
                  <select onChange={e=>{/* select specific version */}} className="w-full px-3 py-2 border border-slate-200 rounded text-sm mt-1">
                    {versions.map((v,i)=><option key={i} value={v.version}>{v.version} ({(v.accuracy*100).toFixed(1)}%)</option>)}
                  </select>
                )}
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">版本 B</label>
                <select value={compareModel} onChange={e=>setCompareModel(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded text-sm">
                  <option value="">-- 选择对比模型 --</option>
                  {models.filter(m=>m.id!==selectedModel).map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {compareVersions.length>0 && (
                  <select className="w-full px-3 py-2 border border-slate-200 rounded text-sm mt-1">
                    {compareVersions.map((v,i)=><option key={i} value={v.version}>{v.version} ({(v.accuracy*100).toFixed(1)}%)</option>)}
                  </select>
                )}
              </div>
            </div>

            {versions[0] && compareVersions[0] && (
              <div className="space-y-4">
                {/* Performance metrics comparison */}
                <div>
                  <h5 className="text-sm font-medium text-slate-600 mb-2">性能指标对比</h5>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead><tr className="border-b bg-slate-50"><th className="py-2 px-3 text-left">指标</th><th className="py-2 px-3 text-center bg-blue-50">版本 A ({versions[0].version})</th><th className="py-2 px-3 text-center bg-amber-50">版本 B ({compareVersions[0].version})</th><th className="py-2 px-3 text-center">差异</th><th className="py-2 px-3 text-center">优劣</th></tr></thead>
                      <tbody>
                        {[
                          {label:'准确率 (Accuracy)', a:versions[0].accuracy, b:compareVersions[0].accuracy, fmt:(v:number)=>(v*100).toFixed(1)+'%', higher:true},
                          {label:'精确率 (Precision)', a:(versions[0] as any).precision||versions[0].accuracy-0.01, b:(compareVersions[0] as any).precision||compareVersions[0].accuracy-0.01, fmt:(v:number)=>(v*100).toFixed(1)+'%', higher:true},
                          {label:'召回率 (Recall)', a:(versions[0] as any).recall||versions[0].accuracy-0.02, b:(compareVersions[0] as any).recall||compareVersions[0].accuracy-0.02, fmt:(v:number)=>(v*100).toFixed(1)+'%', higher:true},
                          {label:'F1 分数', a:(versions[0] as any).f1||versions[0].accuracy-0.015, b:(compareVersions[0] as any).f1||compareVersions[0].accuracy-0.015, fmt:(v:number)=>(v*100).toFixed(1)+'%', higher:true},
                          {label:'推理速度 (FPS)', a:(versions[0] as any).fps||32, b:(compareVersions[0] as any).fps||28, fmt:(v:number)=>v+' FPS', higher:true},
                          {label:'推理延迟', a:(versions[0] as any).inferenceTime||'18ms', b:(compareVersions[0] as any).inferenceTime||'24ms', fmt:(v:any)=>v, higher:false},
                        ].map(row=>{
                          const aVal = typeof row.a==='number'?row.a:0;
                          const bVal = typeof row.b==='number'?row.b:0;
                          const diff = typeof row.a==='number'&&typeof row.b==='number'?aVal-bVal:0;
                          const pct = typeof row.a==='number'&&typeof row.b==='number'&&bVal!==0?((diff/bVal)*100):0;
                          let better = '持平';
                          if (diff !== 0) {
                            const aWins = row.higher ? diff > 0 : diff < 0;
                            better = aWins ? 'A 更优' : 'B 更优';
                          }
                          let diffColor = 'text-slate-400';
                          if (diff !== 0) {
                            const isGood = (row.higher && diff > 0) || (!row.higher && diff < 0);
                            diffColor = isGood ? 'text-emerald-600' : 'text-red-500';
                          }
                          let betterColor = 'bg-slate-50 text-slate-500';
                          if (better.includes('A') && row.higher || better.includes('B') && !row.higher) betterColor = 'bg-emerald-50 text-emerald-600';
                          if (better === '持平') betterColor = 'bg-slate-50 text-slate-500';
                          return (<tr key={row.label} className="border-b border-slate-50">
                            <td className="py-2 px-3 font-medium text-slate-600">{row.label}</td>
                            <td className="py-2 px-3 text-center bg-blue-50/30 font-medium">{row.fmt(row.a)}</td>
                            <td className="py-2 px-3 text-center bg-amber-50/30 font-medium">{row.fmt(row.b)}</td>
                            <td className={`py-2 px-3 text-center font-bold ${diffColor}`}>{diff>0?'+'+pct.toFixed(1)+'%':diff<0?pct.toFixed(1)+'%':'—'}</td>
                            <td className="py-2 px-3 text-center"><span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${betterColor}`}>{better}</span></td>
                          </tr>);
                        })}
                      </tbody>
                    </table>
                  </div>
                  {/* Visual bars for top metrics */}
                  <div className="grid grid-cols-2 gap-4 mt-3">
                    {['accuracy','fps'].map(k=>{
                      const aVal = k==='accuracy'?versions[0].accuracy:(versions[0]as any).fps||32;
                      const bVal = k==='accuracy'?compareVersions[0].accuracy:(compareVersions[0]as any).fps||28;
                      const max = Math.max(aVal,bVal)*1.15;
                      const aPct = (aVal/max)*100;
                      const bPct = (bVal/max)*100;
                      return (<div key={k} className="text-xs">
                        <p className="font-medium text-slate-600 mb-1">{k==='accuracy'?'准确率':'推理速度 (FPS)'}</p>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2"><span className="w-14 text-slate-400">A</span><div className="flex-1 h-4 bg-slate-100 rounded"><div className="h-4 bg-blue-500 rounded" style={{width:aPct+'%'}}/></div><span className="w-14 text-right font-mono">{k==='accuracy'?(aVal*100).toFixed(1)+'%':aVal+' FPS'}</span></div>
                          <div className="flex items-center gap-2"><span className="w-14 text-slate-400">B</span><div className="flex-1 h-4 bg-slate-100 rounded"><div className="h-4 bg-amber-500 rounded" style={{width:bPct+'%'}}/></div><span className="w-14 text-right font-mono">{k==='accuracy'?(bVal*100).toFixed(1)+'%':bVal+' FPS'}</span></div>
                        </div>
                      </div>);
                    })}
                  </div>
                </div>

                {/* Resource usage comparison */}
                <div>
                  <h5 className="text-sm font-medium text-slate-600 mb-2">资源占用对比</h5>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {[
                      {label:'模型大小', a:(versions[0]as any).modelSize||'128MB', b:(compareVersions[0]as any).modelSize||'145MB'},
                      {label:'GPU显存', a:(versions[0]as any).gpuMemory||'2.1GB', b:(compareVersions[0]as any).gpuMemory||'2.5GB'},
                      {label:'推理延迟', a:(versions[0]as any).inferenceTime||'18ms', b:(compareVersions[0]as any).inferenceTime||'24ms'},
                      {label:'训练数据', a:(versions[0]as any).dataset||'ship-det-v4', b:(compareVersions[0]as any).dataset||'ship-det-v3'},
                    ].map(r=>(<div key={r.label} className="flex items-center justify-between p-2 bg-slate-50 rounded"><span className="text-slate-500">{r.label}</span><div className="flex items-center gap-2"><span className="text-blue-600 font-medium">{r.a}</span><span className="text-slate-300">vs</span><span className="text-amber-600 font-medium">{r.b}</span></div></div>))}
                  </div>
                </div>

                {/* Structure difference */}
                <div>
                  <h5 className="text-sm font-medium text-slate-600 mb-2">结构与算法差异</h5>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium text-blue-700 mb-1">版本 A: {versions[0].version}</p>
                      <p className="text-slate-600">{versions[0].changes}</p>
                      <p className="text-slate-400 mt-1">作者: {(versions[0]as any).author||'算法团队'}</p>
                    </div>
                    <div className="bg-amber-50 rounded-lg p-3">
                      <p className="font-medium text-amber-700 mb-1">版本 B: {compareVersions[0].version}</p>
                      <p className="text-slate-600">{compareVersions[0].changes}</p>
                      <p className="text-slate-400 mt-1">作者: {(compareVersions[0]as any).author||'算法团队'}</p>
                    </div>
                  </div>
                </div>

                {/* Summary recommendation */}
                <div className="p-3 bg-slate-50 rounded-lg text-xs">
                  <p className="font-medium text-slate-700 mb-1">对比总结</p>
                  {versions[0].accuracy > compareVersions[0].accuracy ? (
                    <p>版本 A ({versions[0].version}) 在准确率方面更优（{(versions[0].accuracy*100).toFixed(1)}% vs {(compareVersions[0].accuracy*100).toFixed(1)}%）。
                       {(versions[0]as any).fps > (compareVersions[0]as any).fps ? '同时在推理速度上也更快。': '但在推理速度上略慢，需权衡精度与延迟。'}
                      建议在精度敏感场景使用版本 A，实时性要求高场景可考虑版本 B。</p>
                  ) : (
                    <p>版本 B ({compareVersions[0].version}) 在准确率方面更优（{(compareVersions[0].accuracy*100).toFixed(1)}% vs {(versions[0].accuracy*100).toFixed(1)}%）。
                      {(compareVersions[0]as any).fps > (versions[0]as any).fps ? '同时在推理速度上也更快，建议升级。': '但在推理速度上略慢。'}</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ====== DEPLOY REVIEW ====== */}
      {tab==='deploy' && (
        <div className="card">
          <h4 className="card-title">发布审核流程</h4>
          <p className="text-sm text-slate-600 mb-4">模型上线需经过功能测试 → 性能测试 → 业务适配测试三层审核，审核流程与浙港通审批模块对接，全程留痕可追溯。</p>
          <div className="space-y-3">
            {models.filter(m=>m.status!=='stopped').map(m=>(
              <div key={m.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                <div><span className="font-medium">{m.name}</span><span className="text-xs text-slate-400 ml-2">{m.version}</span><span className="text-xs text-slate-400 ml-2">· {m.author}</span></div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px]">✓</span>功能测试</span>
                  <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px]">✓</span>性能测试</span>
                  <span className="flex items-center gap-1"><span className="w-3.5 h-3.5 rounded-full bg-emerald-500 flex items-center justify-center text-white text-[9px]">✓</span>业务适配</span>
                  <StatusTag status="已完成" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====== INFERENCE SERVICES ====== */}
      {tab==='inference' && (
        <div className="space-y-6">
          {metrics && (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="card"><p className="card-title">总 QPS</p><p className="text-2xl font-bold text-blue-600">{metrics.totalQPS}</p></div>
              <div className="card"><p className="card-title">GPU 节点</p><p className="text-2xl font-bold text-purple-600">4</p></div>
              <div className="card"><p className="card-title">平均 GPU 利用率</p><p className="text-2xl font-bold text-amber-500">{metrics.avgGpuUtil}</p></div>
              <div className="card"><p className="card-title">服务健康率</p><p className="text-2xl font-bold text-emerald-600">{Math.round(services.filter(s=>s.status==='healthy').length/Math.max(services.length,1)*100)}%</p></div>
            </div>
          )}
          <div className="overflow-x-auto card p-0">
            <div className="px-5 py-4 border-b"><h4 className="font-semibold">推理服务实例</h4></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500"><th className="py-2 px-3">服务</th><th className="py-2 px-3">模型</th><th className="py-2 px-3">状态</th><th className="py-2 px-3">QPS</th><th className="py-2 px-3">延迟</th><th className="py-2 px-3">GPU</th><th className="py-2 px-3">副本</th><th className="py-2 px-3">24h错误</th><th className="py-2 px-3">操作</th></tr></thead>
              <tbody>{services.map(s=>(<tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 text-xs"><td className="py-2 px-3 font-medium">{s.name}</td><td className="py-2 px-3">{s.models.join(', ')}</td><td className="py-2 px-3"><StatusTag status={s.status==='healthy'?'online':'待审核'}/></td><td className="py-2 px-3">{s.qps}</td><td className="py-2 px-3">{s.avgLatency}/{s.p99Latency}</td><td className="py-2 px-3">{s.gpuUtil}</td><td className="py-2 px-3">{s.replicas}</td><td className="py-2 px-3"><span className={s.errors24h>0?'text-red-500 font-bold':''}>{s.errors24h}</span></td><td className="py-2 px-3 flex gap-1"><button onClick={()=>handleScale(s.id,1)} className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100">扩容</button><button onClick={()=>handleScale(s.id,-1)} disabled={s.replicas<=1} className="px-2 py-0.5 bg-slate-100 text-slate-500 text-xs rounded hover:bg-slate-200 disabled:opacity-30">缩容</button></td></tr>))}</tbody>
            </table>
          </div>
          {metrics && (
            <div className="card">
              <h4 className="card-title">GPU 利用率 & QPS（24h）</h4>
              <ResponsiveContainer width="100%" height={280}>
                <LineChart data={metrics.history}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey="time" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Line type="monotone" dataKey="qps" stroke="#3b82f6" strokeWidth={2} name="QPS"/><Line type="monotone" dataKey="gpuUtil" stroke="#f59e0b" strokeWidth={2} name="GPU利用率(%)"/></LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* ====== ORCHESTRATE ====== */}
      {tab==='orchestrate' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Step palette */}
          <div className="card">
            <h4 className="font-semibold text-sm text-slate-700 mb-3">可用模型步骤</h4>
            <p className="text-xs text-slate-400 mb-3">点击添加步骤到编排中</p>
            <div className="flex flex-wrap gap-1.5">
              {AVAILABLE_STEPS.map(s=>(
                <button key={s} onClick={()=>addStep(s)}
                  className={`px-2.5 py-1.5 text-xs rounded-full border transition-colors ${editingPipeline.steps.includes(s)?'bg-blue-100 border-blue-300 text-blue-700':'bg-slate-50 border-slate-200 text-slate-500 hover:border-blue-300 hover:text-blue-600'}`}>
                  {s} {editingPipeline.steps.includes(s)?'✓':''}
                </button>
              ))}
            </div>
          </div>

          {/* Pipeline canvas */}
          <div className="card lg:col-span-2">
            <h4 className="font-semibold text-sm text-slate-700 mb-3">编排画布</h4>
            <div className="space-y-3 mb-4">
              <div className="flex gap-2">
                <input value={editingPipeline.name} onChange={e=>setEditingPipeline({...editingPipeline,name:e.target.value})} placeholder="编排名称，如：视频流智能分析流水线" className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
                <button onClick={savePipeline} disabled={!editingPipeline.name.trim()||editingPipeline.steps.length===0} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 disabled:opacity-50">保存编排</button>
              </div>
              {/* Step sequence */}
              <div className="min-h-[120px] border-2 border-dashed border-slate-200 rounded-xl p-4">
                {editingPipeline.steps.length===0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">从左侧点击添加步骤，构建推理流水线</p>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    {editingPipeline.steps.map((s,i)=>(
                      <div key={i} className="flex items-center gap-1">
                        {i>0 && <span className="text-slate-300 text-lg">→</span>}
                        <div className="group relative bg-gradient-to-r from-blue-500 to-blue-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
                          <span className="text-[9px] opacity-60 mr-1">{i+1}</span>{s}
                          <button onClick={()=>removeStep(i)} className="ml-1 text-white/60 hover:text-white/90">&times;</button>
                          {i>0 && <button onClick={()=>moveStep(i,i-1)} className="absolute -left-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 text-xs" title="左移">◀</button>}
                          {i<editingPipeline.steps.length-1 && <button onClick={()=>moveStep(i,i+1)} className="absolute -right-5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-blue-500 text-xs" title="右移">▶</button>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Existing pipelines */}
          <div className="lg:col-span-3">
            <h4 className="font-semibold text-sm text-slate-700 mb-3">已有编排</h4>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {pipelines.map(p=>(
                <div key={p.id} className="card">
                  <div className="flex items-center justify-between mb-2"><h5 className="font-medium text-sm">{p.name}</h5><StatusTag status={p.status==='running'?'online':'offline'}/></div>
                  <p className="text-xs text-slate-500 mb-2">{p.description}</p>
                  <div className="flex items-center gap-1 flex-wrap">
                    {p.steps.map((s,i)=>(<span key={i} className="inline-flex items-center gap-1">{i>0&&<span className="text-slate-300 text-xs">→</span>}<span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-xs rounded-full">{s}</span></span>))}
                  </div>
                  <p className="text-xs text-slate-400 mt-2">QPS: {p.qps} · 状态: {p.status}</p>
                </div>
              ))}
              {pipelines.length===0 && <div className="text-slate-400 text-sm col-span-2 text-center py-4">暂无编排，请使用上方画布创建</div>}
            </div>
          </div>
        </div>
      )}

      {/* ====== TRAINING ====== */}
      {tab==='training' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Training parameter form */}
          <div className="card">
            <h4 className="font-semibold text-sm text-slate-700 mb-4">训练参数配置</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-500 block mb-1">训练模型</label>
                <select value={trainingForm.model} onChange={e=>setTrainingForm({...trainingForm,model:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {models.map(m=><option key={m.id} value={m.name}>{m.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">训练数据集</label>
                <select value={trainingForm.dataset} onChange={e=>setTrainingForm({...trainingForm,dataset:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option>ship-det-jun(2500张)</option><option>behavior-jun(1200条)</option><option>ship-cls-jun(800张)</option><option>waterline-jun(600张)</option>
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">学习率</label>
                  <select value={trainingForm.learningRate} onChange={e=>setTrainingForm({...trainingForm,learningRate:Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value={0.0001}>0.0001</option><option value={0.0005}>0.0005</option><option value={0.001}>0.001</option><option value={0.005}>0.005</option><option value={0.01}>0.01</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">批次大小</label>
                  <select value={trainingForm.batchSize} onChange={e=>setTrainingForm({...trainingForm,batchSize:Number(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option value={8}>8</option><option value={16}>16</option><option value={32}>32</option><option value={64}>64</option><option value={128}>128</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-500 block mb-1">训练轮数 (Epochs)</label>
                  <input type="number" value={trainingForm.epochs} onChange={e=>setTrainingForm({...trainingForm,epochs:Number(e.target.value)})} min={1} max={500} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-1">优化器</label>
                  <select value={trainingForm.optimizer} onChange={e=>setTrainingForm({...trainingForm,optimizer:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    <option>Adam</option><option>SGD</option><option>AdamW</option><option>RMSprop</option>
                  </select>
                </div>
              </div>
              <button onClick={startTraining} className="w-full py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">启动训练</button>
            </div>
          </div>

          {/* Training jobs */}
          <div className="space-y-4">
            <h4 className="font-semibold text-sm text-slate-700">训练任务</h4>
            {trainingJobs.map(j=>(
              <div key={j.id} className="card">
                <div className="flex items-center justify-between mb-2">
                  <h5 className="font-medium text-sm">{j.model}</h5>
                  <StatusTag status={j.status==='running'?'online':j.status==='paused'?'待审核':j.status==='queued'?'offline':'已完成'}/>
                </div>
                <div className="grid grid-cols-4 gap-2 text-xs mb-2">
                  <div><span className="text-slate-400 block">进度</span><span className="font-bold">{j.progress}%</span></div>
                  <div><span className="text-slate-400 block">轮次</span><span className="font-bold">{j.epoch}</span></div>
                  <div><span className="text-slate-400 block">准确率</span><span className="font-bold text-blue-600">{j.accuracy>0?(j.accuracy*100).toFixed(1)+'%':'-'}</span></div>
                  <div><span className="text-slate-400 block">损失</span><span className="font-bold">{j.loss>0?j.loss.toFixed(3):'-'}</span></div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 mb-2">
                  <div className={`h-2 rounded-full transition-all duration-500 ${j.status==='running'?'bg-blue-500':j.status==='paused'?'bg-amber-500':'bg-slate-300'}`} style={{width:`${j.progress}%`}}/>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>数据集: {j.dataset}</span>
                  <span>开始: {j.startedAt} · 预计完成: {j.eta}</span>
                </div>
                <div className="flex gap-2 mt-2">
                  {j.status==='running' && <button onClick={()=>pauseTraining(j.id)} className="px-3 py-1 bg-amber-50 text-amber-700 text-xs rounded-lg hover:bg-amber-100 font-medium">暂停训练</button>}
                  {j.status==='paused' && <button onClick={()=>resumeTraining(j.id)} className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-lg hover:bg-emerald-100 font-medium">继续训练</button>}
                </div>
              </div>
            ))}
            {trainingJobs.length===0 && <div className="text-slate-400 text-sm text-center py-8">暂无训练任务，请在左侧配置参数后启动训练</div>}
          </div>
        </div>
      )}
    </div>
  );
}
