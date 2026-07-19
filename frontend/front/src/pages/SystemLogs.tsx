import { useState, useEffect } from 'react';
import { StatusTag } from '../components/StatusBadge';
import { IconSearch, IconWarning, IconCheck, IconChart } from '../components/Icons';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';

interface LogEntry { id:string;time:string;category:string;level:string;operator:string|null;module:string;action:string;detail:string;ip:string;result:string;duration:string }
interface LogStats { todayTotal:number;errors24h:number;warnings24h:number;byCategory:{category:string;count:number}[];byHour:{hour:string;count:number}[];topErrors:{action:string;count:number}[] }

const COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6'];

export default function SystemLogs() {
  const [tab, setTab] = useState<'query'|'stats'>('query');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [stats, setStats] = useState<LogStats|null>(null);
  const [category, setCategory] = useState('all');
  const [level, setLevel] = useState('all');
  const [keyword, setKeyword] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({category,level,keyword,page:String(page),pageSize:'20'});
      const res = await fetch(`/api/ops/logs?${params}`);
      const d = await res.json();
      setLogs(d.data); setTotal(d.total);
    } catch { addToast('日志查询失败','error'); }
    finally { setLoading(false); }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/ops/logs/stats');
      const d = await res.json();
      if (d.data) setStats(d.data);
    } catch {}
  };

  useEffect(() => { fetchLogs(); fetchStats(); }, []);
  useEffect(() => { fetchLogs(); }, [category,level,page]);

  const handleSearch = () => { setPage(1); fetchLogs(); };
  const handleExport = () => { addToast('日志导出中，请稍候...'); setTimeout(()=>addToast('日志已导出为 CSV 文件'),1500); };
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key==='Enter') handleSearch(); };

  const levelTag = (l:string) => l==='ERROR'?'red':l==='WARN'?'yellow':'blue' as 'red'|'yellow'|'blue';

  return (
    <div className="space-y-6">
      {toasts.length>0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">系统日志</h2><p className="text-sm text-slate-500 mt-1">操作记录 · 运行日志 · 模型日志 · 安全审计 · 日志保留180天</p></div>
        <button onClick={handleExport} className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600">导出日志</button>
      </div>

      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[{key:'query',label:'日志查询'},{key:'stats',label:'统计分析'}].map(t=>(
          <button key={t.key} onClick={()=>{setTab(t.key as typeof tab);if(t.key==='stats')fetchStats()}} className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab===t.key?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>{t.label}</button>))}
      </div>

      {/* QUERY */}
      {tab==='query' && (
        <div className="space-y-4">
          {/* Filter bar */}
          <div className="card">
            <div className="flex items-center gap-3 flex-wrap">
              <select value={category} onChange={e=>setCategory(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-sm">
                <option value="all">全部分类</option>
                <option value="用户操作">用户操作</option><option value="系统运行">系统运行</option><option value="模型推理">模型推理</option><option value="数据交互">数据交互</option><option value="预警推送">预警推送</option>
              </select>
              <select value={level} onChange={e=>setLevel(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded text-sm">
                <option value="all">全部级别</option><option value="ERROR">ERROR</option><option value="WARN">WARN</option><option value="INFO">INFO</option>
              </select>
              <input value={keyword} onChange={e=>setKeyword(e.target.value)} onKeyDown={handleKeyDown} placeholder="搜索操作/模块/详情..." className="px-3 py-1.5 border border-slate-200 rounded text-sm flex-1 max-w-[300px]"/>
              <button onClick={handleSearch} className="px-4 py-1.5 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 flex items-center gap-1"><IconSearch className="w-3.5 h-3.5"/> 查询</button>
            </div>
          </div>

          {/* Log table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b bg-slate-50 text-left text-xs text-slate-500"><th className="py-2 px-3">时间</th><th className="py-2 px-3">分类</th><th className="py-2 px-3">级别</th><th className="py-2 px-3">操作人</th><th className="py-2 px-3">模块</th><th className="py-2 px-3">操作</th><th className="py-2 px-3">结果</th><th className="py-2 px-3">耗时</th></tr></thead>
                <tbody>{logs.map(l=>(<tr key={l.id} className={`border-b border-slate-50 hover:bg-slate-50 text-xs ${l.level==='ERROR'?'bg-red-50/30':''}`}><td className="py-2 px-3 text-slate-500 font-mono">{l.time.slice(11)}</td><td className="py-2 px-3"><StatusTag status={l.category==='用户操作'?'online':l.category==='预警推送'?'生效中':l.category==='模型推理'?'待审核':'offline'}/></td><td className="py-2 px-3"><span className={`inline-flex px-1.5 py-0.5 rounded text-xs font-bold ${l.level==='ERROR'?'bg-red-100 text-red-600':l.level==='WARN'?'bg-amber-100 text-amber-600':'bg-blue-50 text-blue-600'}`}>{l.level}</span></td><td className="py-2 px-3">{l.operator||'系统'}</td><td className="py-2 px-3 text-slate-500">{l.module}</td><td className="py-2 px-3">{l.action}</td><td className="py-2 px-3">{l.result==='成功'?<IconCheck className="w-3.5 h-3.5 text-emerald-500"/>:<IconWarning className="w-3.5 h-3.5 text-red-500"/>}</td><td className="py-2 px-3 text-slate-400 font-mono">{l.duration}</td></tr>))}</tbody>
              </table>
            </div>
            {logs.length===0 && <div className="text-center py-12 text-slate-400 text-sm">{loading?'加载中...':'暂无日志记录'}</div>}
            {/* Pagination */}
            <div className="flex items-center justify-between px-5 py-3 border-t">
              <span className="text-xs text-slate-400">共 {total} 条，第 {page}/{Math.ceil(total/20)} 页</span>
              <div className="flex gap-1">
                <button onClick={()=>setPage(p=>Math.max(1,p-1))} disabled={page===1} className="px-3 py-1 bg-slate-100 text-xs rounded hover:bg-slate-200 disabled:opacity-30">上一页</button>
                <button onClick={()=>setPage(p=>Math.min(Math.ceil(total/20),p+1))} disabled={page>=Math.ceil(total/20)} className="px-3 py-1 bg-slate-100 text-xs rounded hover:bg-slate-200 disabled:opacity-30">下一页</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATS */}
      {tab==='stats' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card"><p className="card-title">今日日志总数</p><p className="text-2xl font-bold text-blue-600">{stats.todayTotal.toLocaleString()}</p></div>
            <div className="card"><p className="card-title">24h 错误</p><p className="text-2xl font-bold text-red-500">{stats.errors24h}</p></div>
            <div className="card"><p className="card-title">24h 警告</p><p className="text-2xl font-bold text-amber-500">{stats.warnings24h}</p></div>
            <div className="card"><p className="card-title">错误率</p><p className="text-2xl font-bold text-slate-600">{(stats.errors24h/stats.todayTotal*100).toFixed(2)}%</p></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="card-title">日志分类分布</h4>
              <ResponsiveContainer width="100%" height={280}>
                <PieChart><Pie data={stats.byCategory} dataKey="count" nameKey="category" cx="50%" cy="50%" outerRadius={100} label={({category,count})=>`${category}:${count}`}>{(stats.byCategory||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart>
              </ResponsiveContainer>
            </div>
            <div className="card">
              <h4 className="card-title">每小时日志量</h4>
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={stats.byHour}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey="hour" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="日志数"/></BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="card">
            <h4 className="card-title">高频错误 Top 3</h4>
            <div className="space-y-2">
              {stats.topErrors.map((e,i)=>(<div key={i} className="flex items-center justify-between p-3 bg-red-50 rounded-lg"><span className="text-sm text-red-700">{e.action}</span><span className="text-sm font-bold text-red-500">{e.count} 次</span></div>))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
