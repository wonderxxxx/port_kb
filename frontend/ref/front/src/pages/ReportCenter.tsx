import { useState, useEffect } from 'react';
import { StatusTag } from '../components/StatusBadge';
import { IconDocument, IconClock } from '../components/Icons';

// ---- Template types ----
interface ReportTemplate {
  id: string; name: string; category: string; format: string; period: string;
  content: string; variables: string[]; createdAt: string;
}
interface ScheduledReport {
  id: string; templateId: string; templateName: string; schedule: string;
  nextRun: string; lastRun: string; format: string; status: string; recipientCount: number;
}
interface GeneratedReport {
  id: string; templateName: string; generatedAt: string; format: string; period: string;
  status: string; fileSize: string;
}

// ---- Available variables for templates ----
const AVAILABLE_VARS = [
  { key:'{{日期}}', label:'当前日期', desc:'2026-06-17' },
  { key:'{{时间}}', label:'当前时间', desc:'14:30:00' },
  { key:'{{水位}}', label:'兰溪水位', desc:'28.65m' },
  { key:'{{流速}}', label:'当前流速', desc:'2.8m/s' },
  { key:'{{泄洪流量}}', label:'泄洪流量', desc:'2200m³/s' },
  { key:'{{降雨量}}', label:'24h降雨量', desc:'52.8mm' },
  { key:'{{船舶总数}}', label:'辖区船舶数', desc:'15艘' },
  { key:'{{在航船舶}}', label:'在航船舶数', desc:'7艘' },
  { key:'{{预警数量}}', label:'待处理预警', desc:'3条' },
  { key:'{{船闸排队}}', label:'船闸排队数', desc:'13艘' },
  { key:'{{锚地占用}}', label:'锚地占用率', desc:'67%' },
  { key:'{{检测线索}}', label:'AI检测线索', desc:'5条' },
  { key:'{{调度总数}}', label:'今日调度', desc:'32艘' },
  { key:'{{风速}}', label:'当前风速', desc:'8.5m/s' },
  { key:'{{报告周期}}', label:'报告周期', desc:'日报/周报/月报' },
];

const FORMATS = ['Word', 'Excel', 'PDF'] as const;

export default function ReportCenter() {
  const [tab, setTab] = useState<'templates'|'scheduled'>('templates');

  // Template state
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [editingTpl, setEditingTpl] = useState<ReportTemplate|null>(null);
  const [previewTpl, setPreviewTpl] = useState<ReportTemplate|null>(null);

  // Schedule state
  const [schedules, setSchedules] = useState<ScheduledReport[]>([]);
  const [history, setHistory] = useState<GeneratedReport[]>([]);
  const [newSchedule, setNewSchedule] = useState({templateId:'',schedule:'daily',format:'Word',recipients:''});

  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  // ---- Data fetching ----
  useEffect(()=>{
    fetch('/api/ops/reports/templates').then(r=>r.json()).then(d=>{
      if(d.data) {
        const withVars = d.data.map((t:ReportTemplate)=>({...t, variables: extractVars(t.content||''), content: t.content||getDefaultContent(t.name)}));
        setTemplates(withVars);
      }
    });
    // Mock schedules
    setSchedules([
      { id:'SCH001', templateId:'TPL001', templateName:'水上交通安全运行日报', schedule:'每日 08:00', nextRun:'2026-06-18 08:00', lastRun:'2026-06-17 08:00', format:'Word', status:'active', recipientCount:5 },
      { id:'SCH002', templateId:'TPL004', templateName:'执法工单统计报告', schedule:'每周一 09:00', nextRun:'2026-06-22 09:00', lastRun:'2026-06-15 09:00', format:'Excel', status:'active', recipientCount:3 },
      { id:'SCH003', templateId:'TPL003', templateName:'水路经济运行分析报告', schedule:'每月1日 08:00', nextRun:'2026-07-01 08:00', lastRun:'2026-06-01 08:00', format:'Excel', status:'active', recipientCount:8 },
    ]);
    setHistory([
      { id:'RPT001', templateName:'水上交通安全运行日报', generatedAt:'2026-06-17 08:00', format:'Word', period:'日报', status:'已完成', fileSize:'1.2MB' },
      { id:'RPT002', templateName:'三防预警分析报告', generatedAt:'2026-06-17 10:30', format:'Word', period:'按需', status:'已完成', fileSize:'2.8MB' },
      { id:'RPT003', templateName:'执法工单统计报告', generatedAt:'2026-06-15 09:00', format:'Excel', period:'周报', status:'已完成', fileSize:'856KB' },
    ]);
  }, []);

  // ---- Helpers ----
  const extractVars = (content:string): string[] => {
    const matches = content.match(/\{\{[^}]+\}\}/g);
    return matches ? [...new Set(matches)] : [];
  };
  const getDefaultContent = (name:string) => {
    if (name.includes('日报')) return '# 水上交通安全运行日报\n\n**日期**: {{日期}} {{时间}}\n\n## 一、水文气象概况\n- 兰溪水位: {{水位}}\n- 当前流速: {{流速}}\n- 24h降雨量: {{降雨量}}\n- 当前风速: {{风速}}\n\n## 二、船舶动态\n- 辖区船舶总数: {{船舶总数}}\n- 在航船舶: {{在航船舶}}\n- 锚地占用率: {{锚地占用}}\n\n## 三、预警情况\n- 待处理预警: {{预警数量}}\n\n## 四、调度情况\n- 今日调度: {{调度总数}}\n';
    if (name.includes('预警')) return '# 三防预警分析报告\n\n**日期**: {{日期}}\n\n## 一、预警概述\n- 当前水位: {{水位}}\n- 泄洪流量: {{泄洪流量}}\n- 降雨情况: {{降雨量}}\n\n## 二、预警等级\n- 当前预警: {{预警数量}} 条待处理\n\n## 三、建议措施\n...\n';
    return `# ${name}\n\n**生成时间**: {{日期}} {{时间}}\n\n## 关键指标\n- 水位: {{水位}}\n- 船舶: {{船舶总数}}\n- 预警: {{预警数量}}\n`;
  };

  const insertVar = (varkey: string) => {
    if (!editingTpl) return;
    setEditingTpl({...editingTpl, content: editingTpl.content + varkey});
  };

  const previewContent = (content:string) => {
    return content
      .replace(/\{\{日期\}\}/g, '2026-06-17')
      .replace(/\{\{时间\}\}/g, '14:30:00')
      .replace(/\{\{水位\}\}/g, '28.65m')
      .replace(/\{\{流速\}\}/g, '2.8m/s')
      .replace(/\{\{泄洪流量\}\}/g, '2200m³/s')
      .replace(/\{\{降雨量\}\}/g, '52.8mm')
      .replace(/\{\{船舶总数\}\}/g, '15艘')
      .replace(/\{\{在航船舶\}\}/g, '7艘')
      .replace(/\{\{预警数量\}\}/g, '3条')
      .replace(/\{\{船闸排队\}\}/g, '13艘')
      .replace(/\{\{锚地占用\}\}/g, '67%')
      .replace(/\{\{检测线索\}\}/g, '5条')
      .replace(/\{\{调度总数\}\}/g, '32艘')
      .replace(/\{\{风速\}\}/g, '8.5m/s')
      .replace(/\{\{报告周期\}\}/g, '日报');
  };

  // ---- Actions ----
  const saveTemplate = async () => {
    if (!editingTpl||!editingTpl.name.trim()) { addToast('请输入模板名称','warning'); return; }
    editingTpl.variables = extractVars(editingTpl.content);
    const method = editingTpl.id ? 'PUT' : 'POST';
    const url = editingTpl.id ? `/api/ops/reports/templates/${editingTpl.id}` : '/api/ops/reports/templates';
    await fetch(url, {method, headers:{'Content-Type':'application/json'}, body:JSON.stringify(editingTpl)});
    addToast(editingTpl.id?'模板已更新':'模板已创建');
    setEditingTpl(null);
    const r = await fetch('/api/ops/reports/templates'); const d = await r.json();
    if(d.data) setTemplates(d.data.map((t:ReportTemplate)=>({...t, variables:extractVars(t.content||getDefaultContent(t.name)), content:t.content||getDefaultContent(t.name)})));
  };

  const deleteTemplate = async (id:string) => {
    if(!confirm('确认删除此模板？')) return;
    await fetch(`/api/ops/reports/templates/${id}`, {method:'DELETE'});
    addToast('模板已删除');
    setTemplates(p=>p.filter(t=>t.id!==id));
  };

  const handleExport = (template: ReportTemplate, format: string) => {
    const content = previewContent(template.content);
    let blob: Blob;
    if (format === 'Excel') {
      const csv = content.replace(/#+/g,'').replace(/\*\*/g,'').replace(/- /g,'').split('\n').map(l=>l.trim()).filter(Boolean).join(',');
      blob = new Blob(['﻿'+csv], {type:'text/csv'});
    } else if (format === 'PDF') {
      blob = new Blob([content], {type:'application/pdf'});
    } else {
      blob = new Blob([content], {type:'application/msword'});
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const ext = format==='Word'?'doc':format==='Excel'?'csv':'pdf';
    a.download = `${template.name}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    addToast(`已导出为 ${format} 格式`);
  };

  const addSchedule = () => {
    if (!newSchedule.templateId) { addToast('请选择模板','warning'); return; }
    const tpl = templates.find(t=>t.id===newSchedule.templateId);
    const scheduleLabel = newSchedule.schedule==='daily'?'每日 08:00':newSchedule.schedule==='weekly'?'每周一 09:00':newSchedule.schedule==='monthly'?'每月1日 08:00':'按需';
    const sched: ScheduledReport = {
      id: `SCH${Date.now()}`, templateId: newSchedule.templateId, templateName: tpl?.name||'',
      schedule: scheduleLabel, nextRun: '2026-06-18 08:00', lastRun: '-',
      format: newSchedule.format, status: 'active', recipientCount: newSchedule.recipients?newSchedule.recipients.split(',').length:0,
    };
    setSchedules(p=>[...p, sched]);
    addToast('定时报告已创建');
    setNewSchedule({templateId:'',schedule:'daily',format:'Word',recipients:''});
  };

  const toggleSchedule = (id:string) => {
    setSchedules(p=>p.map(s=>s.id===id?{...s,status:s.status==='active'?'paused':'active'}:s));
    addToast('定时状态已切换');
  };

  return (
    <div className="space-y-6">
      {toasts.length>0&&<div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div>
        <h2 className="text-xl font-bold text-slate-800">报告中心</h2>
        <p className="text-sm text-slate-500 mt-1">报告模板管理 · 变量替换 · 多格式导出 · 定时自动生成</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        <button onClick={()=>setTab('templates')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab==='templates'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
          模板管理
        </button>
        <button onClick={()=>setTab('scheduled')} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab==='scheduled'?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
          定时报告
        </button>
      </div>

      {/* ====== TAB 1: TEMPLATE MANAGEMENT ====== */}
      {tab==='templates' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Template list */}
          <div className="lg:col-span-1 space-y-2">
            <button onClick={()=>setEditingTpl({id:'',name:'',category:'安全运行',format:'Word',period:'daily',content:getDefaultContent('新报告模板'),variables:[],createdAt:new Date().toISOString().slice(0,10)})}
              className="w-full py-2.5 bg-blue-500 text-white text-sm font-medium rounded-lg hover:bg-blue-600">
              + 新建模板
            </button>
            {templates.map(t=>(
              <div key={t.id} onClick={()=>editingTpl?.id!==t.id&&setEditingTpl(t)}
                className={`p-3 rounded-lg border cursor-pointer transition-colors ${editingTpl?.id===t.id?'border-blue-400 bg-blue-50':'border-slate-200 hover:bg-slate-50'}`}>
                <div className="flex items-center justify-between">
                  <div><p className="text-sm font-medium">{t.name}</p><p className="text-xs text-slate-400">{t.category} · {t.format} · {t.period}</p></div>
                  <button onClick={(e)=>{e.stopPropagation();deleteTemplate(t.id);}} className="text-xs text-red-400 hover:text-red-600">删除</button>
                </div>
                {t.variables?.length>0 && <div className="flex flex-wrap gap-1 mt-1.5">{t.variables.map((v,i)=><span key={i} className="px-1.5 py-0.5 bg-purple-50 text-purple-600 text-[10px] rounded">{v}</span>)}</div>}
              </div>
            ))}
          </div>

          {/* Template editor */}
          <div className="lg:col-span-2">
            {editingTpl ? (
              <div className="space-y-4">
                {/* Meta fields */}
                <div className="card">
                  <h4 className="font-semibold text-sm text-slate-700 mb-3">{editingTpl.id?'编辑模板':'新建模板'}</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className="text-xs text-slate-500 block mb-1">模板名称</label><input value={editingTpl.name} onChange={e=>setEditingTpl({...editingTpl,name:e.target.value})} placeholder="如：水上交通安全运行日报" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/></div>
                    <div><label className="text-xs text-slate-500 block mb-1">分类</label><select value={editingTpl.category} onChange={e=>setEditingTpl({...editingTpl,category:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"><option>安全运行</option><option>预警分析</option><option>经济分析</option><option>执法统计</option><option>航道养护</option><option>应急管理</option></select></div>
                    <div><label className="text-xs text-slate-500 block mb-1">默认格式</label><select value={editingTpl.format} onChange={e=>setEditingTpl({...editingTpl,format:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">{FORMATS.map(f=><option key={f} value={f}>{f}</option>)}</select></div>
                    <div><label className="text-xs text-slate-500 block mb-1">默认周期</label><select value={editingTpl.period} onChange={e=>setEditingTpl({...editingTpl,period:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"><option value="daily">每日</option><option value="weekly">每周</option><option value="monthly">每月</option><option value="quarterly">每季</option><option value="custom">按需</option></select></div>
                  </div>
                </div>

                {/* Variable palette */}
                <div className="card">
                  <h4 className="font-semibold text-sm text-slate-700 mb-2">可用变量（点击插入到内容中）</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_VARS.map(v=>(
                      <button key={v.key} onClick={()=>insertVar(v.key)} title={v.desc}
                        className="px-2 py-1 text-[11px] bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 border border-purple-200 transition-colors">
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content editor */}
                <div className="card">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm text-slate-700">模板内容（Markdown 格式）</h4>
                    <div className="flex items-center gap-2">
                      <button onClick={()=>setPreviewTpl(editingTpl)} className="px-3 py-1 text-xs bg-slate-100 text-slate-600 rounded hover:bg-slate-200">预览</button>
                      <button onClick={saveTemplate} className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">保存模板</button>
                    </div>
                  </div>
                  <textarea value={editingTpl.content} onChange={e=>setEditingTpl({...editingTpl,content:e.target.value})}
                    rows={14} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm font-mono resize-y focus:outline-none focus:border-blue-400"
                    placeholder="输入 Markdown 内容，使用 {{变量名}} 插入动态数据..."/>
                </div>

                {/* Export buttons */}
                <div className="card">
                  <h4 className="font-semibold text-sm text-slate-700 mb-2">导出报告</h4>
                  <div className="flex items-center gap-2">
                    {FORMATS.map(f=>(
                      <button key={f} onClick={()=>handleExport(editingTpl,f)}
                        className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm hover:bg-slate-50 transition-colors flex items-center gap-1.5">
                        <IconDocument className="w-4 h-4" /> 导出 {f}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="card text-center py-12 text-slate-400 text-sm">← 从左侧选择模板进行编辑，或点击「新建模板」创建</div>
            )}
          </div>

          {/* Preview modal */}
          {previewTpl && (
            <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
              <div className="bg-white rounded-xl shadow-2xl p-6 w-[700px] max-w-[90vw] max-h-[80vh] overflow-y-auto">
                <h4 className="font-bold mb-4">预览 — {previewTpl.name}</h4>
                <div className="bg-white border rounded-lg p-6 font-mono text-sm whitespace-pre-wrap leading-relaxed">
                  {previewContent(previewTpl.content)}
                </div>
                <p className="text-xs text-slate-400 mt-3">变量已被实际数据替换（预览效果），导出时使用最新数据。</p>
                <div className="flex gap-2 justify-end mt-3">
                  <button onClick={()=>setPreviewTpl(null)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">关闭</button>
                  {FORMATS.map(f=>(<button key={f} onClick={()=>handleExport(previewTpl,f)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">导出 {f}</button>))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ====== TAB 2: SCHEDULED REPORTS ====== */}
      {tab==='scheduled' && (
        <div className="space-y-6">
          {/* Add schedule */}
          <div className="card">
            <h4 className="font-semibold text-sm text-slate-700 mb-3">新建定时报告</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
              <div>
                <label className="text-xs text-slate-500 block mb-1">报告模板</label>
                <select value={newSchedule.templateId} onChange={e=>setNewSchedule({...newSchedule,templateId:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="">选择模板</option>
                  {templates.map(t=><option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">生成周期</label>
                <select value={newSchedule.schedule} onChange={e=>setNewSchedule({...newSchedule,schedule:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  <option value="daily">每日 08:00</option>
                  <option value="weekly">每周一 09:00</option>
                  <option value="monthly">每月1日 08:00</option>
                  <option value="quarterly">每季首日 08:00</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">输出格式</label>
                <select value={newSchedule.format} onChange={e=>setNewSchedule({...newSchedule,format:e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                  {FORMATS.map(f=><option key={f} value={f}>{f}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-500 block mb-1">接收人（逗号分隔）</label>
                <input value={newSchedule.recipients} onChange={e=>setNewSchedule({...newSchedule,recipients:e.target.value})} placeholder="张三,李四" className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
              </div>
              <button onClick={addSchedule} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 font-medium">添加定时</button>
            </div>
          </div>

          {/* Active schedules */}
          <div className="card">
            <h4 className="font-semibold text-sm text-slate-700 mb-3">定时任务列表</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500"><th className="py-2 px-3">模板</th><th className="py-2 px-3">周期</th><th className="py-2 px-3">下次执行</th><th className="py-2 px-3">上次执行</th><th className="py-2 px-3">格式</th><th className="py-2 px-3">接收人</th><th className="py-2 px-3">状态</th><th className="py-2 px-3">操作</th></tr></thead>
                <tbody>{schedules.map(s=>(
                  <tr key={s.id} className="border-b border-slate-50 hover:bg-slate-50 text-xs">
                    <td className="py-2 px-3 font-medium">{s.templateName}</td>
                    <td className="py-2 px-3">{s.schedule}</td>
                    <td className="py-2 px-3 text-slate-500">{s.nextRun}</td>
                    <td className="py-2 px-3 text-slate-400">{s.lastRun}</td>
                    <td className="py-2 px-3">{s.format}</td>
                    <td className="py-2 px-3">{s.recipientCount}人</td>
                    <td className="py-2 px-3"><StatusTag status={s.status==='active'?'online':'offline'}/></td>
                    <td className="py-2 px-3">
                      <button onClick={()=>toggleSchedule(s.id)} className="px-2 py-0.5 text-xs rounded hover:bg-slate-100">
                        {s.status==='active'?'暂停':'启用'}
                      </button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            {schedules.length===0 && <p className="text-center py-8 text-slate-400 text-sm">暂无定时任务，请使用上方表单创建</p>}
          </div>

          {/* Generated history */}
          <div className="card">
            <h4 className="font-semibold text-sm text-slate-700 mb-3">已生成报告</h4>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500"><th className="py-2 px-3">报告名称</th><th className="py-2 px-3">生成时间</th><th className="py-2 px-3">格式</th><th className="py-2 px-3">周期</th><th className="py-2 px-3">大小</th><th className="py-2 px-3">状态</th><th className="py-2 px-3">操作</th></tr></thead>
                <tbody>{history.map(h=>(
                  <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50 text-xs">
                    <td className="py-2 px-3 font-medium">{h.templateName}</td>
                    <td className="py-2 px-3 text-slate-500">{h.generatedAt}</td>
                    <td className="py-2 px-3">{h.format}</td>
                    <td className="py-2 px-3">{h.period}</td>
                    <td className="py-2 px-3 text-slate-400">{h.fileSize}</td>
                    <td className="py-2 px-3"><StatusTag status="已完成"/></td>
                    <td className="py-2 px-3">
                      <button onClick={()=>addToast(`正在下载 ${h.templateName}.${h.format.toLowerCase()}`)} className="px-2 py-0.5 text-xs text-blue-600 hover:bg-blue-50 rounded">下载</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
