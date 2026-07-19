import { useState, useEffect, useCallback } from 'react';
import { StatusTag } from '../components/StatusBadge';
import { IconShip } from '../components/Icons';
import { usePolling } from '../hooks/usePolling';

interface Berth { id:string;name:string;category:string;district:string;lat:number;lng:number;totalSlots:number;occupiedSlots:number;riskLevel:string;suitableTonnageMin:number;suitableTonnageMax:number }
interface BerthShip { shipName:string;mmsi:string;type:string;tonnage:number;captainName:string;captainPhone:string;berthedAt:string }

const mockShips: Record<string,BerthShip[]> = {
  B001:[{ shipName:'浙金航016',mmsi:'413798502',type:'货船',tonnage:1800,captainName:'钱伟',captainPhone:'13805790002',berthedAt:'06-17 08:30'},{ shipName:'建德货工007',mmsi:'413798015',type:'工程船',tonnage:1000,captainName:'周师傅',captainPhone:'13805710015',berthedAt:'06-16 16:00'}],
  B002:[{ shipName:'桐庐砂石005',mmsi:'413794209',type:'砂石船',tonnage:2500,captainName:'吴矿长',captainPhone:'13905710009',berthedAt:'06-17 06:00'}],
  B003:[{ shipName:'金航客渡008',mmsi:'413796112',type:'渡船',tonnage:300,captainName:'周小军',captainPhone:'13506890012',berthedAt:'06-17 07:00'}],
};

export default function BerthsMonitor() {
  const [berths, setBerths] = useState<Berth[]>([]);
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  const fetchData = useCallback(async()=>{
    const res = await fetch('/api/ops/berths');
    const d = await res.json();
    if(d.data) setBerths(d.data);
  },[]);

  useEffect(()=>{fetchData();},[]);
  usePolling(fetchData, 15000);

  const totalSlots = berths.reduce((s,b)=>s+b.totalSlots,0);
  const totalOccupied = berths.reduce((s,b)=>s+b.occupiedSlots,0);
  const rate = totalSlots>0?Math.round(totalOccupied/totalSlots*100):0;

  return (
    <div className="space-y-6">
      {toasts.length>0&&<div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}
      <div><h2 className="text-xl font-bold text-slate-800">锚地泊位监控</h2><p className="text-sm text-slate-500 mt-1">AIS自动统计锚地船舶数量 · 视频辅助核对 · 停泊船舶名单及联系方式</p></div>

      <div className="grid grid-cols-4 gap-3">
        <div className="card text-center py-2"><p className="text-xs text-slate-400">泊位总数</p><p className="text-xl font-bold">{totalSlots}</p></div>
        <div className="card text-center py-2"><p className="text-xs text-slate-400">已占用</p><p className="text-xl font-bold text-amber-500">{totalOccupied}</p></div>
        <div className="card text-center py-2"><p className="text-xs text-slate-400">空闲</p><p className="text-xl font-bold text-emerald-500">{totalSlots-totalOccupied}</p></div>
        <div className={`card text-center py-2 ${rate>80?'border-red-200 bg-red-50':rate>60?'border-amber-200 bg-amber-50':''}`}><p className="text-xs text-slate-400">占用率</p><p className={`text-xl font-bold ${rate>80?'text-red-500':rate>60?'text-amber-500':'text-emerald-500'}`}>{rate}%</p></div>
      </div>

      <div className="space-y-3">
        {berths.map(b=>{
          const ships = mockShips[b.id]||[];
          return (<div key={b.id} className={`card border-l-4 ${b.riskLevel==='high'?'border-l-red-500':b.riskLevel==='medium'?'border-l-amber-400':'border-l-green-500'}`}>
            <div className="flex items-center justify-between">
              <div><h4 className="font-semibold text-sm">{b.name}</h4><p className="text-xs text-slate-400">{b.category}·{b.district}·{b.suitableTonnageMin}-{b.suitableTonnageMax}吨</p></div>
              <div className="flex items-center gap-3">
                <div className="w-28 h-2 bg-slate-200 rounded-full"><div className={`h-2 rounded-full ${b.occupiedSlots/b.totalSlots>0.8?'bg-red-500':b.occupiedSlots/b.totalSlots>0.6?'bg-amber-500':'bg-green-500'}`} style={{width:`${(b.occupiedSlots/b.totalSlots)*100}%`}}/></div>
                <span className="text-sm font-bold">{b.occupiedSlots}/{b.totalSlots}</span>
                <button onClick={()=>setExpandedId(expandedId===b.id?null:b.id)} className="text-xs text-blue-500 hover:underline">{expandedId===b.id?'收起':'查看船舶'}</button>
              </div>
            </div>
            {expandedId===b.id && (
              <div className="mt-3 pt-3 border-t">
                {ships.length>0?(
                  <table className="w-full text-xs"><thead><tr className="border-b text-slate-500"><th className="py-1.5 px-2 text-left">船名</th><th className="py-1.5 px-2">MMSI</th><th className="py-1.5 px-2">类型</th><th className="py-1.5 px-2 text-right">吨位</th><th className="py-1.5 px-2">船长</th><th className="py-1.5 px-2">手机号</th><th className="py-1.5 px-2">停泊时间</th></tr></thead>
                    <tbody>{ships.map((s,i)=>(<tr key={i} className="border-b border-slate-50"><td className="py-1 px-2 font-medium">{s.shipName}</td><td className="py-1 px-2 text-slate-500">{s.mmsi}</td><td className="py-1 px-2">{s.type}</td><td className="py-1 px-2 text-right">{s.tonnage}</td><td className="py-1 px-2">{s.captainName}</td><td className="py-1 px-2 text-slate-500">{s.captainPhone}</td><td className="py-1 px-2 text-slate-500">{s.berthedAt}</td></tr>))}</tbody></table>
                ):<p className="text-xs text-slate-400 py-2">暂无停泊船舶</p>}
                {b.occupiedSlots/b.totalSlots>0.7&&<p className="text-xs text-amber-600 mt-2">占用率偏高，建议引导船舶至有空位锚地</p>}
              </div>
            )}
          </div>);
        })}
      </div>
    </div>
  );
}
