import { useState, useEffect, useCallback } from 'react';
import { IconCamera, IconShip } from '../components/Icons';
import { usePolling } from '../hooks/usePolling';

export default function BridgeMonitor() {
  const [cameras] = useState([
    { id:'CAM02', name:'衢江大桥-上游摄像头', lat:29.1955, lng:119.4925, status:'online' },
    { id:'CAM03', name:'衢江大桥-下游摄像头', lat:29.1940, lng:119.4935, status:'online' },
  ]);
  const [ptzCamera, setPtzCamera] = useState('CAM02');
  const [bridgeShips, setBridgeShips] = useState<{name:string;mmsi:string;direction:string;speed:number;distance:string}[]>([]);
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  const fetchData = useCallback(async()=>{
    // Mock bridge area ships
    setBridgeShips([
      { name:'衢江货0188', mmsi:'413799103', direction:'上行', speed:3.5, distance:'上游 320m' },
      { name:'浙海油002', mmsi:'413798905', direction:'下行', speed:5.2, distance:'上游 180m' },
      { name:'浙海集003', mmsi:'413799513', direction:'上行', speed:4.1, distance:'下游 450m' },
    ]);
  },[]);

  useEffect(()=>{fetchData();},[]);
  usePolling(fetchData, 10000);

  const handlePTZ = async (pan:number,tilt:number) => {
    await fetch('/api/south/video/ptz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cameraId:ptzCamera,pan,tilt,zoom:1})});
    addToast(`云台 ${ptzCamera}：水平${pan>0?'+'+pan:pan}° 俯仰${tilt>0?'+'+tilt:tilt}°`);
  };

  return (
    <div className="space-y-6">
      {toasts.length>0&&<div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}
      <div><h2 className="text-xl font-bold text-slate-800">桥区监控</h2><p className="text-sm text-slate-500 mt-1">衢江大桥桥区水域（上游500m-下游300m）· 船舶监测 · 摄像头云台控制</p></div>

      {/* Bridge area info */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="card text-center py-2"><p className="text-xs text-slate-400">桥区船舶</p><p className="text-xl font-bold text-amber-600">{bridgeShips.length} 艘</p></div>
        <div className="card text-center py-2"><p className="text-xs text-slate-400">禁止追越</p><p className="text-xl font-bold text-red-500">是</p></div>
        <div className="card text-center py-2"><p className="text-xs text-slate-400">限速</p><p className="text-xl font-bold text-blue-600">4 节</p></div>
        <div className="card text-center py-2"><p className="text-xs text-slate-400">预警状态</p><p className="text-xl font-bold text-amber-500">关注中</p></div>
      </div>

      {/* Camera views */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {cameras.map(c=>(
          <div key={c.id} className="card">
            <h4 className="font-semibold text-sm mb-2">{c.name}</h4>
            <div className="bg-slate-900 rounded-lg h-56 flex items-center justify-center relative">
              <div className="text-center"><IconCamera className="w-12 h-12 text-slate-600 mx-auto mb-2"/><p className="text-slate-500 text-xs">实时画面（模拟）</p></div>
              <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">{c.id} · {c.status==='online'?'在线':'离线'}</div>
              <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-1 rounded">{new Date().toLocaleTimeString('zh-CN')}</div>
            </div>
          </div>
        ))}
      </div>

      {/* PTZ control */}
      <div className="card">
        <h4 className="font-semibold text-sm mb-3">云台控制</h4>
        <div className="flex items-center gap-3 mb-3">
          <select value={ptzCamera} onChange={e=>setPtzCamera(e.target.value)} className="px-3 py-1.5 border rounded text-sm">{cameras.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
        </div>
        <div className="grid grid-cols-3 gap-2 w-48 mx-auto">
          <div/><button onClick={()=>handlePTZ(0,10)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">↑ 上仰</button><div/>
          <button onClick={()=>handlePTZ(-15,0)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">← 左转</button>
          <div className="text-center text-xs text-slate-400 py-2">云台</div>
          <button onClick={()=>handlePTZ(15,0)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">右转 →</button>
          <div/><button onClick={()=>handlePTZ(0,-10)} className="px-3 py-2 bg-slate-100 rounded-lg text-sm hover:bg-slate-200">↓ 下俯</button><div/>
        </div>
      </div>

      {/* Bridge area ships */}
      <div className="card">
        <h4 className="font-semibold text-sm mb-3">桥区水域船舶</h4>
        <table className="w-full text-xs">
          <thead><tr className="border-b bg-slate-50 text-slate-500"><th className="py-2 px-3 text-left">船名</th><th className="py-2 px-3">MMSI</th><th className="py-2 px-3">方向</th><th className="py-2 px-3 text-right">航速(kn)</th><th className="py-2 px-3">距离桥体</th><th className="py-2 px-3">状态</th></tr></thead>
          <tbody>{bridgeShips.map((s,i)=>(<tr key={i} className="border-b border-slate-50"><td className="py-2 px-3 font-medium">{s.name}</td><td className="py-2 px-3 text-slate-500">{s.mmsi}</td><td className="py-2 px-3">{s.direction}</td><td className={`py-2 px-3 text-right ${s.speed>4?'text-red-500 font-bold':''}`}>{s.speed}</td><td className="py-2 px-3">{s.distance}</td><td className="py-2 px-3">{s.speed>4?<span className="text-red-500">超速</span>:<span className="text-emerald-500">正常</span>}</td></tr>))}</tbody>
        </table>
      </div>
    </div>
  );
}
