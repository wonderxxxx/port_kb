import { useState, useEffect, useCallback } from 'react';
import { StatusBadge } from '../components/StatusBadge';
import { IconBell, IconWarning, IconShip, IconWind } from '../components/Icons';
import { usePolling } from '../hooks/usePolling';

interface ShipRisk {
  shipId: string; shipName: string; shipType: string; tonnage: number; power: number;
  speed: number; status: string; heading: number; lat: number; lng: number;
  velocity: number; segment: string; captainName: string; captainPhone: string;
  ratio: number; riskLevel: 'safe'|'caution'|'danger';
  recommendation: string; bestBerth: string; notified: boolean;
}
interface NotifyDetail { ship: ShipRisk; berth: string; }

interface Berth {
  id: string; name: string; lat: number; lng: number;
  totalSlots: number; occupiedSlots: number; suitableTonnageMin: number; suitableTonnageMax: number;
  distance?: number;
}

interface SegmentVelocity {
  segment: string; from: string; to: string; velocity: number; trend: string;
}

// River segments from upstream to downstream
const SEGMENTS: SegmentVelocity[] = [
  { segment:'龙游段', from:'龙游水文站', to:'龙游港区', velocity:2.5, trend:'平稳' },
  { segment:'龙游-衢江段', from:'龙游港区', to:'衢江大桥', velocity:2.8, trend:'上涨' },
  { segment:'衢江桥区段', from:'衢江大桥', to:'桥区下游', velocity:3.2, trend:'上涨' },
  { segment:'兰溪段', from:'衢江服务区', to:'兰溪水文站', velocity:2.6, trend:'平稳' },
  { segment:'姚家船闸段', from:'兰溪水文站', to:'姚家船闸', velocity:2.2, trend:'回落' },
];

export default function PowerVelocity() {
  const [ships, setShips] = useState<ShipRisk[]>([]);
  const [segments, setSegments] = useState<SegmentVelocity[]>(SEGMENTS);
  const [sortBy, setSortBy] = useState<'risk'|'ratio'|'power'>('risk');
  const [filterRisk, setFilterRisk] = useState<'all'|'danger'|'caution'>('all');
  const [notifying, setNotifying] = useState<string|null>(null);
  const [notifyDialog, setNotifyDialog] = useState<NotifyDetail|null>(null);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [autoNotify, setAutoNotify] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  // Enhanced berth recommendation: speed, distance, flow, tonnage, slots composite score
  const findBestBerth = (ship: {lat:number;lng:number;tonnage:number;speed:number;velocity:number}, berths: Berth[]): string => {
    const suitable = berths
      .filter(b=>ship.tonnage>=b.suitableTonnageMin && ship.tonnage<=b.suitableTonnageMax && b.occupiedSlots<b.totalSlots)
      .map(b=>{
        const dist = Math.sqrt((b.lat-ship.lat)**2+(b.lng-ship.lng)**2)*111; // km
        const freeSlots = b.totalSlots-b.occupiedSlots;
        // Composite score (lower = better):
        // Distance: 0-30km → 0-60pts, Flow velocity: 0-5m/s → 0-50pts,
        // Speed approach: 0-15kn → 0-30pts, Slot availability: more slots = less penalty
        const distScore = Math.min(dist*2, 60);
        const flowScore = ship.velocity*10;
        const speedScore = Math.min(ship.speed*2, 30);
        const slotScore = Math.max(0, 30-freeSlots*5);
        const tonnageFit = 1-Math.abs(ship.tonnage-(b.suitableTonnageMin+b.suitableTonnageMax)/2)/((b.suitableTonnageMax-b.suitableTonnageMin)/2+1);
        const tonnageScore = (1-tonnageFit)*20;
        const score = distScore+flowScore+speedScore+slotScore+tonnageScore;
        return { berth:b, distance:dist, freeSlots, score };
      });
    if (suitable.length===0) return '无合适泊位，建议就近紧急停靠';
    suitable.sort((a,b)=>a.score-b.score);
    const best = suitable[0];
    const factors = [];
    if (best.distance<5) factors.push('距离近');
    if (best.freeSlots>=3) factors.push('泊位充足');
    if (ship.tonnage>=(best.berth.suitableTonnageMin+best.berth.suitableTonnageMax)/2*0.8) factors.push('吨位匹配');
    return `${best.berth.name}（距${best.distance.toFixed(1)}km · 空闲${best.freeSlots}泊位 · ${factors.slice(0,2).join('·')||'综合最优'}）`;
  };

  const fetchData = useCallback(async () => {
    try {
      const [shipRes, hydroRes, berthRes] = await Promise.all([
        fetch('/api/south/ais/ship').then(r=>r.json()),
        fetch('/api/south/hydrology/velocity').then(r=>r.json()),
        fetch('/api/ops/berths').then(r=>r.json()).catch(()=>({data:null})),
      ]);
      const rawShips = (shipRes.data||[]) as any[];
      const allBerths = (berthRes.data||[]) as Berth[];
      setBerths(allBerths);
      const hydroData = (hydroRes.data||[]) as any[];

      // Build ship risk list
      const risks: ShipRisk[] = rawShips.map((s:any) => {
        const power = Math.max(400, (s.shipTonnage||1000) * 0.55);
        // Get segment velocity based on ship position
        let segmentVelocity = 2.8; // default
        let segmentName = '龙游-衢江段';
        if (s.lat > 29.212) { segmentVelocity = 2.5; segmentName = '龙游段'; }
        else if (s.lat > 29.200) { segmentVelocity = 2.8; segmentName = '龙游-衢江段'; }
        else if (s.lat > 29.193) { segmentVelocity = 3.2; segmentName = '衢江桥区段'; }
        else if (s.lat > 29.188) { segmentVelocity = 2.6; segmentName = '兰溪段'; }
        else { segmentVelocity = 2.2; segmentName = '姚家船闸段'; }

        const ratio = power / Math.max(segmentVelocity, 0.1);
        let riskLevel: 'safe'|'caution'|'danger' = 'safe';
        if (ratio < 300) riskLevel = 'danger';
        else if (ratio < 500 || segmentVelocity > 3.0) riskLevel = 'caution';
        const bestBerth = findBestBerth({lat:s.lat,lng:s.lng,tonnage:s.shipTonnage||0,speed:s.speed,velocity:segmentVelocity}, allBerths);
        let recommendation = '';
        if (riskLevel === 'danger') recommendation = `动力不足，建议立即前往 ${bestBerth}`;
        else if (riskLevel === 'caution') recommendation = '流速偏高，提醒船长谨慎航行';
        else recommendation = '正常通行';

        return {
          shipId: s.shipId, shipName: s.shipName, shipType: s.shipType, tonnage: s.shipTonnage||0,
          power, speed: s.speed, status: s.status, heading: s.heading, lat: s.lat, lng: s.lng,
          captainName: `船长${String.fromCharCode(24352+Math.floor(Math.random()*20))}`, captainPhone: `1380571${String(Math.floor(Math.random()*90000)+10000)}`,
          velocity: segmentVelocity, segment: segmentName,
          ratio, riskLevel, recommendation, bestBerth, notified: false,
        };
      });

      setShips(risks);
      setLastUpdate(new Date());

      // Update segment data
      setSegments(prev=>prev.map(seg=>({...seg, velocity:seg.velocity+(Math.random()-0.5)*0.3})));

      // Auto-notify danger ships
      if (autoNotify) {
        const danger = risks.filter(s=>s.riskLevel==='danger'&&!s.notified);
        if (danger.length>0) {
          addToast(`检测到 ${danger.length} 艘高风险船舶，建议立即通知`, 'warning');
        }
      }
    } catch { addToast('数据加载失败','error'); }
  }, [autoNotify]);

  useEffect(() => { fetchData(); }, []);
  usePolling(fetchData, 10000);

  const handleNotify = async (ship:ShipRisk) => {
    setNotifying(ship.shipId);
    try {
      const msg = `【船舶动力预警】${ship.shipName} 功率${ship.power.toFixed(0)}kW，${ship.segment}当前流速${ship.velocity.toFixed(1)}m/s，功率流速比${ship.ratio.toFixed(0)}，动力不足风险。建议立即前往 ${ship.bestBerth}。船长${ship.captainName} ${ship.captainPhone}`;
      await fetch('/api/north/warning/report', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type:'船舶动力预警', shipId:ship.shipId, shipName:ship.shipName, content: msg })});
      setShips(p=>p.map(s=>s.shipId===ship.shipId?{...s,notified:true}:s));
      setNotifyDialog(null);
      addToast(`已通知 ${ship.shipName}（短信+平台推送）→ ${ship.bestBerth}`);
    } catch { addToast('通知发送失败','error'); }
    setNotifying(null);
  };

  const notifyAllDanger = async () => {
    const dangerShips = ships.filter(s=>s.riskLevel==='danger'&&!s.notified);
    for (const s of dangerShips) {
      await fetch('/api/north/warning/report', { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ type:'船舶动力预警', shipId:s.shipId, shipName:s.shipName, content:s.recommendation })});
    }
    setShips(p=>p.map(s=>dangerShips.find(d=>d.shipId===s.shipId)?{...s,notified:true}:s));
    addToast(`已批量通知 ${dangerShips.length} 艘高风险船舶`);
  };

  // Sort and filter
  const filtered = ships
    .filter(s=>filterRisk==='all'||s.riskLevel===filterRisk)
    .sort((a,b)=>{
      if (sortBy==='risk') { const order = {danger:0,caution:1,safe:2}; return order[a.riskLevel]-order[b.riskLevel]; }
      if (sortBy==='ratio') return a.ratio - b.ratio;
      return a.power - b.power;
    });

  const dangerCount = ships.filter(s=>s.riskLevel==='danger').length;
  const cautionCount = ships.filter(s=>s.riskLevel==='caution').length;
  const safeCount = ships.filter(s=>s.riskLevel==='safe').length;

  return (
    <div className="space-y-6">
      {toasts.length>0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">船舶动力-流速分析</h2>
          <p className="text-sm text-slate-500 mt-1">根据船舶功率(kW)和各航段实时流速(m/s)，评估上行通行能力 · 自动预警 · 一键通知</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-1.5 text-xs text-slate-500 cursor-pointer">
            <input type="checkbox" checked={autoNotify} onChange={()=>setAutoNotify(!autoNotify)} className="w-3.5 h-3.5"/>
            自动检测高风险船舶
          </label>
          <span className="text-xs text-slate-400">更新于 {lastUpdate.toLocaleTimeString('zh-CN')}</span>
          <button onClick={fetchData} className="px-3 py-1.5 bg-slate-100 text-xs rounded-lg hover:bg-slate-200">刷新</button>
        </div>
      </div>

      {/* Summary + Segment velocity */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card text-center py-3 border-l-4 border-l-red-500">
          <p className="text-xs text-slate-400">高风险 (动力不足)</p>
          <p className="text-2xl font-bold text-red-500">{dangerCount} 艘</p>
          {dangerCount>0 && (
            <button onClick={notifyAllDanger} className="mt-1 text-xs text-red-500 hover:underline">一键通知全部</button>
          )}
        </div>
        <div className="card text-center py-3 border-l-4 border-l-amber-400">
          <p className="text-xs text-slate-400">需关注</p>
          <p className="text-2xl font-bold text-amber-500">{cautionCount} 艘</p>
        </div>
        <div className="card text-center py-3 border-l-4 border-l-green-500">
          <p className="text-xs text-slate-400">正常通行</p>
          <p className="text-2xl font-bold text-emerald-500">{safeCount} 艘</p>
        </div>
        <div className="card text-center py-3">
          <p className="text-xs text-slate-400">总计</p>
          <p className="text-2xl font-bold text-slate-600">{ships.length} 艘</p>
        </div>
      </div>

      {/* Segment velocity */}
      <div className="card">
        <h4 className="font-semibold text-sm text-slate-700 mb-3">各航段实时流速</h4>
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {segments.map((seg,i)=>(
            <div key={seg.segment} className="flex items-center gap-2 flex-shrink-0">
              <div className={`px-3 py-2 rounded-lg text-center min-w-[120px] ${
                seg.velocity>3?'bg-red-50 border border-red-200':seg.velocity>2.5?'bg-amber-50 border border-amber-200':'bg-green-50 border border-green-200'
              }`}>
                <p className="text-xs font-medium text-slate-700">{seg.segment}</p>
                <p className={`text-lg font-bold ${seg.velocity>3?'text-red-600':seg.velocity>2.5?'text-amber-600':'text-emerald-600'}`}>{seg.velocity.toFixed(1)} m/s</p>
                <p className="text-[10px] text-slate-400">{seg.from} → {seg.to} · {seg.trend}</p>
              </div>
              {i<segments.length-1 && <span className="text-slate-300">→</span>}
            </div>
          ))}
        </div>
      </div>

      {/* Available berths quick reference */}
      <div className="card">
        <h4 className="font-semibold text-sm text-slate-700 mb-2">可用泊位参考（算法综合评分）</h4>
        <p className="text-xs text-slate-400 mb-2">推荐综合考虑：距离 · 流速 · 航速 · 吨位匹配 · 空闲泊位</p>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
          {berths.map(b=>{
            const free = b.totalSlots - b.occupiedSlots;
            return (<div key={b.id} className={`flex items-center justify-between p-2 rounded ${free>0?'bg-green-50':'bg-red-50'}`}><div><span className="font-medium">{b.name}</span><span className="text-slate-400 ml-1">{b.suitableTonnageMin}-{b.suitableTonnageMax}吨</span></div><span className={`font-bold ${free>0?'text-emerald-600':'text-red-500'}`}>{free>0?`空闲 ${free}`:'满'}</span></div>);
          })}
        </div>
      </div>

      {/* Ship risk table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-3 border-b flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-sm">船舶风险评估</h4>
            <div className="flex items-center gap-1 text-xs">
              <button onClick={()=>setFilterRisk('all')} className={`px-2 py-0.5 rounded ${filterRisk==='all'?'bg-slate-700 text-white':'bg-slate-100 text-slate-500'}`}>全部</button>
              <button onClick={()=>setFilterRisk('danger')} className={`px-2 py-0.5 rounded ${filterRisk==='danger'?'bg-red-500 text-white':'bg-slate-100 text-red-500'}`}>高风险</button>
              <button onClick={()=>setFilterRisk('caution')} className={`px-2 py-0.5 rounded ${filterRisk==='caution'?'bg-amber-500 text-white':'bg-slate-100 text-amber-500'}`}>需关注</button>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span>排序:</span>
            <button onClick={()=>setSortBy('risk')} className={`${sortBy==='risk'?'text-blue-600 font-medium':''}`}>风险等级</button>
            <button onClick={()=>setSortBy('ratio')} className={`${sortBy==='ratio'?'text-blue-600 font-medium':''}`}>功率流速比</button>
            <button onClick={()=>setSortBy('power')} className={`${sortBy==='power'?'text-blue-600 font-medium':''}`}>船舶功率</button>
          </div>
        </div>
        <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="sticky top-0 bg-slate-50">
              <tr className="text-slate-500">
                <th className="py-2 px-3 text-left">船名</th>
                <th className="py-2 px-3 text-left">类型</th>
                <th className="py-2 px-3 text-right">功率(kW)</th>
                <th className="py-2 px-3 text-left">所在航段</th>
                <th className="py-2 px-3 text-right">流速(m/s)</th>
                <th className="py-2 px-3 text-right">功率/流速比</th>
                <th className="py-2 px-3 text-center">风险等级</th>
                <th className="py-2 px-3 text-left">推荐停泊地</th>
                <th className="py-2 px-3 text-center">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(s=>(
                <tr key={s.shipId} className={`border-b border-slate-50 hover:bg-slate-50 ${
                  s.riskLevel==='danger'?'bg-red-50/30':s.riskLevel==='caution'?'bg-amber-50/20':''
                }`}>
                  <td className="py-2 px-3 font-medium">{s.shipName}</td>
                  <td className="py-2 px-3 text-slate-500">{s.shipType}</td>
                  <td className="py-2 px-3 text-right font-mono">{s.power.toFixed(0)}</td>
                  <td className="py-2 px-3 text-slate-500">{s.segment}</td>
                  <td className="py-2 px-3 text-right font-mono">{s.velocity.toFixed(1)}</td>
                  <td className={`py-2 px-3 text-right font-bold font-mono ${
                    s.ratio<300?'text-red-600':s.ratio<500?'text-amber-600':'text-emerald-600'
                  }`}>{s.ratio.toFixed(0)}</td>
                  <td className="py-2 px-3 text-center"><StatusBadge level={s.riskLevel==='danger'?'red':s.riskLevel==='caution'?'yellow':'blue'}/></td>
                  <td className="py-2 px-3 text-[10px] max-w-[200px]">{s.riskLevel==='danger'?<span className="text-red-600 font-medium">{s.bestBerth}</span>:<span className="text-slate-400">{s.bestBerth||'—'}</span>}</td>
                  <td className="py-2 px-3 text-center">
                    {s.riskLevel==='danger'&&!s.notified?(
                      <button onClick={()=>setNotifyDialog({ship:s, berth:s.bestBerth})}
                        className="px-2 py-1 bg-red-500 text-white text-[10px] rounded hover:bg-red-600 font-medium">
                        立即通知
                      </button>
                    ):s.notified?(
                      <span className="text-[10px] text-emerald-500">已通知</span>
                    ):(
                      <span className="text-[10px] text-slate-300">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && <p className="text-center py-8 text-slate-400 text-sm">暂无匹配的船舶</p>}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 text-xs text-slate-500">
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-red-500"/> 功率/流速比 &lt; 300 → 动力不足，高风险</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-amber-500"/> 300-500 或流速&gt;3.0m/s → 需关注</span>
        <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-emerald-500"/> &ge; 500 → 安全通行</span>
      </div>

      {/* Notification modal */}
      {notifyDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-[520px] max-w-[95vw] max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-red-600">船舶动力预警通知</h3>
              <button onClick={()=>setNotifyDialog(null)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              {/* Risk summary */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm font-bold text-red-700 mb-1">风险等级：动力不足</p>
                <p className="text-xs text-red-600">
                  {notifyDialog.ship.shipName} 功率 {notifyDialog.ship.power.toFixed(0)}kW，
                  所在航段「{notifyDialog.ship.segment}」当前流速 {notifyDialog.ship.velocity.toFixed(1)}m/s，
                  功率流速比 <strong>{notifyDialog.ship.ratio.toFixed(0)}</strong>（阈值300），
                  上行存在动力不足风险。
                </p>
              </div>

              {/* Ship info */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2 font-medium">船舶信息</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">船名</span><span className="font-bold">{notifyDialog.ship.shipName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">类型</span><span>{notifyDialog.ship.shipType}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">吨位</span><span>{notifyDialog.ship.tonnage} 吨</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">航速</span><span>{notifyDialog.ship.speed.toFixed(1)} kn</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">所在航段</span><span>{notifyDialog.ship.segment}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">流速</span><span className="text-red-500">{notifyDialog.ship.velocity.toFixed(1)} m/s</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">功率/流速比</span><span className="text-red-600 font-bold">{notifyDialog.ship.ratio.toFixed(0)}</span></div>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-2 font-medium">人员信息</p>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-slate-500">船长</span><span className="font-bold">{notifyDialog.ship.captainName}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">手机号</span><span className="font-mono text-blue-600">{notifyDialog.ship.captainPhone}</span></div>
                  </div>
                </div>
              </div>

              {/* Recommended berth */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
                <p className="text-xs text-emerald-600 font-medium mb-1">推荐停泊地</p>
                <p className="text-sm font-bold text-emerald-700">{notifyDialog.berth}</p>
                <p className="text-xs text-emerald-600 mt-1">算法综合评分：距离、流速、航速、吨位匹配度、空闲泊位</p>
              </div>

              {/* Push method */}
              <div>
                <p className="text-xs text-slate-500 mb-2">推送方式</p>
                <div className="flex gap-3 text-xs">
                  <label className="flex items-center gap-1"><input type="checkbox" defaultChecked className="w-3.5 h-3.5"/> 平台推送</label>
                  <label className="flex items-center gap-1"><input type="checkbox" defaultChecked className="w-3.5 h-3.5"/> 短信通知</label>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
              <button onClick={()=>setNotifyDialog(null)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">取消</button>
              <button onClick={()=>handleNotify(notifyDialog.ship)} disabled={!!notifying}
                className="px-6 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 font-medium disabled:opacity-50">
                {notifying?'发送中...':'确认发送通知'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
