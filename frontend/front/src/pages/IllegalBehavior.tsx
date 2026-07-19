import { useState, useEffect, useCallback } from 'react';
import { DataCard } from '../components/DataCard';
import { AIResultCard } from '../components/AIResultCard';
import { StatusBadge } from '../components/StatusBadge';
import { IconSearch, IconClock, IconCheck, IconX, IconTarget, IconEye, IconCamera } from '../components/Icons';
import type { AIDetection, DetectionStats } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6'];
const DETECTION_TYPES = ['救生衣违规','超载嫌疑','桥区追越','AIS信号异常','未授权进入'];

export default function IllegalBehavior() {
  const [detections, setDetections] = useState<AIDetection[]>([]);
  const [stats, setStats] = useState<DetectionStats | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [reviewDialog, setReviewDialog] = useState<AIDetection | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [cameraView, setCameraView] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [evidenceViewer, setEvidenceViewer] = useState<AIDetection|null>(null);

  const addToast = (m: string, t = 'success') => {
    const id = Date.now(); setToasts(p => [...p, {id, message:m, type:t}]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3500);
  };

  const fetchDetections = useCallback(async () => {
    try {
      const res = await fetch('/api/ops/detections');
      const d = await res.json();
      setDetections(d.data as AIDetection[]);
      if (d.stats) setStats(d.stats);
    } catch { addToast('数据加载失败', 'error'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDetections(); }, []);

  const handleReview = async (id: string, status: string) => {
    try {
      await fetch(`/api/ops/detection/${id}/review`, {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ status, note: reviewNote }),
      });
      setDetections(prev => prev.map(d => d.id === id ? {...d, status, reviewNote: reviewNote || (status === '已驳回' ? '人工审核驳回' : '人工审核确认')} : d));
      addToast(status === '已确认' ? '已确认违法线索' : '已驳回');
      setReviewDialog(null); setReviewNote('');
      fetchDetections();
    } catch { addToast('操作失败', 'error'); }
  };

  const handleBulkReview = async (status: string) => {
    if (selectedIds.size === 0) { addToast('请先选择检测记录', 'warning'); return; }
    for (const id of selectedIds) {
      await fetch(`/api/ops/detection/${id}/review`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ status, note: '批量审核' }) });
    }
    setDetections(prev => prev.map(d => selectedIds.has(d.id) ? {...d, status, reviewNote: '批量审核'} : d));
    addToast(`已批量${status === '已确认' ? '确认' : '驳回'} ${selectedIds.size} 条`);
    setSelectedIds(new Set());
    fetchDetections();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const filtered = selectedType === 'all' ? detections : detections.filter(d => d.type === selectedType);

  if (loading) return <div className="space-y-6 animate-pulse"><div className="h-8 bg-slate-200 rounded w-48"/><div className="grid grid-cols-5 gap-4">{Array(5).fill(0).map((_,i)=><div key={i} className="card h-20 bg-slate-100"/>)}</div></div>;

  return (
    <div className="space-y-6">
      {toasts.length > 0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t => (<div key={t.id} className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white ${t.type === 'error' ? 'bg-red-500' : t.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div className="flex items-center justify-between">
        <div><h2 className="text-xl font-bold text-slate-800">违法行为识别</h2><p className="text-sm text-slate-500 mt-1">AI 智能检测 — 线索发现 — 人工复核</p></div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <>
              <button onClick={() => handleBulkReview('已确认')} className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600">批量确认 ({selectedIds.size})</button>
              <button onClick={() => handleBulkReview('已驳回')} className="px-3 py-1.5 bg-slate-200 text-slate-600 text-xs rounded-lg hover:bg-slate-300">批量驳回</button>
            </>
          )}
          <button onClick={fetchDetections} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">刷新</button>
          <div className="text-xs text-slate-400 bg-slate-100 rounded-lg px-3 py-2">AI线索，非自动处罚</div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <DataCard title="检测总数" value={stats?.total || 0} unit="条" color="text-slate-700" icon={<IconSearch className="w-5 h-5" />} />
        <DataCard title="待审核" value={stats?.pending || 0} unit="条" color="text-amber-500" icon={<IconClock className="w-5 h-5" />} />
        <DataCard title="已确认" value={stats?.confirmed || 0} unit="条" color="text-emerald-600" icon={<IconCheck className="w-5 h-5" />} />
        <DataCard title="已驳回" value={stats?.rejected || 0} unit="条" color="text-slate-400" icon={<IconX className="w-5 h-5" />} />
        <DataCard title="准确率" value={stats ? `${((stats.confirmed / Math.max(stats.confirmed + stats.rejected, 1))*100).toFixed(0)}%` : '--'} color="text-blue-600" icon={<IconTarget className="w-5 h-5" />} />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {['all', ...DETECTION_TYPES].map(t => (
          <button key={t} onClick={() => setSelectedType(t)} className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${selectedType === t ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{t === 'all' ? '全部' : t}</button>
        ))}
        <button onClick={() => setCameraView(cameraView ? null : 'CAM01')} className={`ml-auto px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1 ${cameraView ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-600'}`}>
          <IconCamera className="w-3.5 h-3.5" /> {cameraView ? '关闭预览' : '摄像头预览'}
        </button>
      </div>

      {/* Camera snapshot panel */}
      {cameraView && (
        <div className="card bg-slate-900 p-0 overflow-hidden">
          <div className="relative h-48 flex items-center justify-center bg-gradient-to-br from-slate-800 to-slate-900">
            <div className="text-center">
              <IconEye className="w-10 h-10 text-slate-500 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">摄像头 {cameraView} 实时画面（模拟）</p>
              <p className="text-slate-500 text-xs mt-1">AI检测标注: 船舶边界框 · 水线检测 · 人员识别</p>
              <div className="flex items-center justify-center gap-2 mt-3">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"/><span className="text-red-400 text-xs">AI 分析中</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(det => (
          <div key={det.id} className="relative">
            <input type="checkbox" checked={selectedIds.has(det.id)} onChange={() => toggleSelect(det.id)}
              className="absolute top-3 left-3 z-10 w-4 h-4 rounded border-slate-300" />
            <AIResultCard detection={det} onReview={(id) => {
              const d = detections.find(x => x.id === id);
              if (d) { setReviewDialog(d); setReviewNote(''); }
            }} onViewEvidence={(det) => setEvidenceViewer(det)} />
          </div>
        ))}
        {filtered.length === 0 && <div className="lg:col-span-3 text-center py-12 text-slate-400">暂无该类别的检测结果</div>}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="card-title">违法类型分布</h4>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart><Pie data={stats?.byType||[]} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={100} label={({type,count})=>`${type}:${count}`}>{(stats?.byType||[]).map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Pie><Tooltip/></PieChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h4 className="card-title">每日检测趋势</h4>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={stats?.trend||[]}><CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0"/><XAxis dataKey="date" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/><Tooltip/><Bar dataKey="count" fill="#3b82f6" radius={[4,4,0,0]} name="检测数量"/></BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Review Dialog */}
      {reviewDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[520px] max-w-[90vw]">
            <h3 className="text-lg font-bold text-slate-800 mb-4">审核检测记录</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-slate-500">类型</span><span className="font-medium">{reviewDialog.type}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">摄像头</span><span>{reviewDialog.camera || '系统数据'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">置信度</span><span className={reviewDialog.confidence >= 0.85 ? 'text-red-600' : 'text-orange-500'}>{(reviewDialog.confidence*100).toFixed(0)}%</span></div>
              <div className="flex justify-between"><span className="text-slate-500">时间</span><span>{new Date(reviewDialog.time).toLocaleString('zh-CN')}</span></div>
              <div><span className="text-slate-500">描述</span><p className="mt-1 text-slate-700">{reviewDialog.description}</p></div>
              <div>
                <label className="text-slate-500 block mb-1">审核意见</label>
                <textarea value={reviewNote} onChange={e => setReviewNote(e.target.value)} rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm resize-none focus:outline-none focus:border-blue-400"
                  placeholder="输入审核意见（选填）..." />
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button onClick={() => handleReview(reviewDialog.id, '已确认')} className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600">确认违法</button>
              <button onClick={() => handleReview(reviewDialog.id, '已驳回')} className="flex-1 px-4 py-2 bg-slate-200 text-slate-600 rounded-lg text-sm hover:bg-slate-300">驳回线索</button>
              <button onClick={() => setReviewDialog(null)} className="px-4 py-2 text-slate-500 text-sm">取消</button>
            </div>
          </div>
        </div>
      )}
      {/* Evidence Viewer Modal */}
      {evidenceViewer && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-5 w-[600px] max-w-[90vw]">
            <h4 className="font-bold mb-2">证据查看 — {evidenceViewer.type}</h4>
            <p className="text-xs text-slate-500 mb-3">摄像头: {evidenceViewer.camera||'系统数据'} · 时间: {new Date(evidenceViewer.time).toLocaleString('zh-CN')}</p>
            <div className="bg-slate-100 rounded-lg h-64 flex items-center justify-center mb-3">
              <div className="text-center"><p className="text-4xl mb-2">{evidenceViewer.type==='救生衣违规'?'🦺':evidenceViewer.type==='超载嫌疑'?'⚖️':evidenceViewer.type==='桥区追越'?'🚗':evidenceViewer.type==='AIS信号异常'?'📡':'🚫'}</p><p className="text-xs text-slate-400">检测截图 / 视频帧（生产环境对接视频平台）</p></div>
            </div>
            <div className="text-xs text-slate-600 space-y-1 mb-3">
              <p><span className="font-medium">AI检测描述:</span> {evidenceViewer.description}</p>
              <p><span className="font-medium">置信度:</span> {(evidenceViewer.confidence*100).toFixed(0)}%</p>
              <p><span className="font-medium">涉事船舶ID:</span> {evidenceViewer.shipId}</p>
              {evidenceViewer.reviewNote && <p><span className="font-medium">审核意见:</span> {evidenceViewer.reviewNote}</p>}
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setEvidenceViewer(null)} className="px-3 py-1.5 bg-slate-100 text-sm rounded">关闭</button>
              {evidenceViewer.status==='待审核' && (
                <>
                  <button onClick={()=>{handleReview(evidenceViewer.id,'已确认');setEvidenceViewer(null);}} className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded">确认违法</button>
                  <button onClick={()=>{handleReview(evidenceViewer.id,'已驳回');setEvidenceViewer(null);}} className="px-3 py-1.5 bg-red-50 text-red-600 text-sm rounded">驳回</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
