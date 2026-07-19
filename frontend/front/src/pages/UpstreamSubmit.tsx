import { useState, useEffect } from 'react';
import { StatusTag } from '../components/StatusBadge';
import { IconShip, IconDocument } from '../components/Icons';

const DISTRICT = '龙游港区'; // 从登录账号获取，此处模拟

interface ShipEntry {
  id?: string; name: string; mmsi: string; type: string; tonnage: number;
  cargoType: string; hazardous: boolean; hazardClass: string;
  captainName: string; captainPhone: string; crewCount: number;
  origin: string; destination: string; eta: string;
}

interface SubmissionRecord {
  id: string; date: string; shipCount: number; totalTonnage: number;
  hazardousCount: number; status: string; submittedAt: string;
  ships: ShipEntry[];
}

const mockHistory: SubmissionRecord[] = [
  { id:'S01', date:'2026-06-16', shipCount:2, totalTonnage:6500, hazardousCount:0, status:'已汇总', submittedAt:'06-16 11:30', ships:[
    { name:'浙海集003',mmsi:'413799513',type:'集装箱船',tonnage:5000,cargoType:'集装箱',hazardous:false,hazardClass:'',captainName:'张建国',captainPhone:'13805710001',crewCount:12,origin:'杭州建德',destination:'龙游港区',eta:'2026-06-17 08:00'},
    { name:'浙西客001',mmsi:'413799807',type:'客船',tonnage:1500,cargoType:'空载',hazardous:false,hazardClass:'',captainName:'李明华',captainPhone:'13805700007',crewCount:8,origin:'杭州建德',destination:'龙游港区',eta:'2026-06-17 09:00'},
  ]},
  { id:'S02', date:'2026-06-15', shipCount:1, totalTonnage:3000, hazardousCount:0, status:'已完成', submittedAt:'06-15 10:50', ships:[
    { name:'浙海通008',mmsi:'413798201',type:'集装箱船',tonnage:3000,cargoType:'设备',hazardous:false,hazardClass:'',captainName:'陈大船',captainPhone:'13805710001',crewCount:10,origin:'杭州建德',destination:'龙游港区',eta:'2026-06-16 08:00'},
  ]},
];

const emptyShip = (): ShipEntry => ({
  name:'',mmsi:'',type:'货船',tonnage:0,cargoType:'砂石',hazardous:false,hazardClass:'',
  captainName:'',captainPhone:'',crewCount:0,origin:'杭州建德',destination:DISTRICT,eta:'',
});

const SHIP_TYPES = ['货船','集装箱船','散货船','油船','化学品船','工程船','客船','拖船','砂石船','其他'];
const CARGO_TYPES = ['煤炭','砂石','钢材','集装箱','油品','化学品','粮食','化肥','建材','设备','日用百货','空载','其他'];

export default function UpstreamSubmit() {
  const [history, setHistory] = useState<SubmissionRecord[]>(mockHistory);
  const [showDialog, setShowDialog] = useState(false);
  const [ships, setShips] = useState<ShipEntry[]>([emptyShip()]);
  const [expandedId, setExpandedId] = useState<string|null>(null);
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  const today = new Date().toISOString().slice(0,10);
  const todaySubmitted = history.some(h=>h.date===today);

  const addShip = () => setShips(p=>[...p,emptyShip()]);
  const removeShip = (i:number) => setShips(p=>p.filter((_,idx)=>idx!==i));
  const updateShip = (i:number, f:keyof ShipEntry, v:unknown) => setShips(p=>p.map((s,idx)=>idx===i?{...s,[f]:v}:s));

  const handleSubmit = () => {
    const valid = ships.filter(s=>s.name.trim()&&s.mmsi.trim()&&s.captainPhone.trim());
    if (valid.length===0) { addToast('请至少填写一艘船舶','warning'); return; }
    const record: SubmissionRecord = {
      id: `S${Date.now()}`, date: today,
      shipCount: valid.length,
      totalTonnage: valid.reduce((s,sh)=>s+(sh.tonnage||0),0),
      hazardousCount: valid.filter(s=>s.hazardous).length,
      status:'已提交', submittedAt: new Date().toLocaleString('zh-CN',{month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}),
      ships: valid,
    };
    setHistory(p=>[record,...p]);
    setShowDialog(false); setShips([emptyShip()]);
    addToast(`已提交 ${valid.length} 艘船舶`);
  };

  // Excel template download
  const downloadTemplate = () => {
    const headers = '船舶名称,MMSI,船舶类型,总吨位,货物类型,是否危险品,危险品类别,船长姓名,船长手机号,船员人数,始发港,目的港,预计到达时间';
    const example = '浙海通008,413798201,货船,3000,砂石,否,,张建国,13805710001,10,杭州建德,龙游港区,2026-06-18 08:00';
    const csv = '﻿'+headers+'\n'+example;
    const blob = new Blob([csv],{type:'text/csv'});
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = '申报模板.csv'; a.click();
    addToast('模板已下载');
  };

  // Excel import
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string)||'';
      const lines = text.split('\n').filter(l=>l.trim());
      if (lines.length<2) { addToast('文件为空','warning'); return; }
      const imported: ShipEntry[] = [];
      for (let i=1;i<lines.length;i++) {
        const cols = lines[i].split(',');
        if (cols.length<13) continue;
        imported.push({
          name:cols[0].trim(), mmsi:cols[1].trim(), type:cols[2].trim()||'货船',
          tonnage:Number(cols[3])||0, cargoType:cols[4].trim()||'砂石',
          hazardous:cols[5].trim()==='是', hazardClass:cols[6].trim()||'',
          captainName:cols[7].trim(), captainPhone:cols[8].trim(),
          crewCount:Number(cols[9])||0, origin:cols[10].trim()||'杭州建德',
          destination:cols[11].trim()||DISTRICT, eta:cols[12].trim(),
        });
      }
      setShips(imported);
      addToast(`已导入 ${imported.length} 艘船舶`);
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {toasts.length>0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">上游申报</h2>
          <p className="text-sm text-slate-500 mt-1">
            当前港区：<span className="font-medium text-blue-600">{DISTRICT}</span>
            <span className="mx-2">|</span>
            每日 12:00 前申报次日计划
            {todaySubmitted && <span className="ml-2 text-emerald-500 font-medium">今日已申报</span>}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={downloadTemplate} className="px-3 py-2 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 flex items-center gap-1">
            <IconDocument className="w-3.5 h-3.5"/> 下载模板
          </button>
          <label className="px-3 py-2 text-xs bg-slate-100 text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer flex items-center gap-1">
            <IconDocument className="w-3.5 h-3.5"/> 导入 Excel
            <input type="file" accept=".csv,.xlsx" onChange={handleImport} className="hidden"/>
          </label>
          {!todaySubmitted && (
            <button onClick={()=>{setShips([emptyShip()]);setShowDialog(true);}}
              className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-1">
              + 新增申报
            </button>
          )}
        </div>
      </div>

      {/* History table */}
      <div className="card p-0 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-50 text-xs text-slate-500">
              <th className="py-3 px-4 text-left">申报日期</th>
              <th className="py-3 px-4 text-center">船舶数</th>
              <th className="py-3 px-4 text-right">总吨位</th>
              <th className="py-3 px-4 text-center">危险品</th>
              <th className="py-3 px-4 text-left">提交时间</th>
              <th className="py-3 px-4 text-center">状态</th>
              <th className="py-3 px-4 text-center">详情</th>
            </tr>
          </thead>
          <tbody>
            {history.map(h=>(
              <>
                <tr key={h.id} className="border-b border-slate-50 hover:bg-slate-50 text-xs">
                  <td className="py-3 px-4 font-medium">{h.date}</td>
                  <td className="py-3 px-4 text-center">{h.shipCount} 艘</td>
                  <td className="py-3 px-4 text-right">{h.totalTonnage.toLocaleString()} 吨</td>
                  <td className="py-3 px-4 text-center">{h.hazardousCount>0?<span className="text-red-500 font-medium">{h.hazardousCount} 艘</span>:<span className="text-slate-300">—</span>}</td>
                  <td className="py-3 px-4 text-slate-400">{h.submittedAt}</td>
                  <td className="py-3 px-4 text-center"><StatusTag status={h.status==='已汇总'?'已完成':h.status==='已完成'?'在线':'待审核'}/></td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={()=>setExpandedId(expandedId===h.id?null:h.id)}
                      className="text-blue-500 hover:underline text-xs">
                      {expandedId===h.id?'收起':'查看'}
                    </button>
                  </td>
                </tr>
                {expandedId===h.id && (
                  <tr key={`${h.id}-detail`}>
                    <td colSpan={7} className="p-4 bg-slate-50">
                      <table className="w-full text-xs border">
                        <thead><tr className="bg-white text-slate-500"><th className="p-1.5 border text-left">船名</th><th className="p-1.5 border text-left">MMSI</th><th className="p-1.5 border text-left">类型</th><th className="p-1.5 border text-right">吨位</th><th className="p-1.5 border text-left">货物</th><th className="p-1.5 border text-left">危险品</th><th className="p-1.5 border text-left">船长</th><th className="p-1.5 border text-left">手机</th><th className="p-1.5 border text-right">船员</th></tr></thead>
                        <tbody>{h.ships.map((s,i)=>(
                          <tr key={i} className="bg-white"><td className="p-1.5 border font-medium">{s.name}</td><td className="p-1.5 border text-slate-500">{s.mmsi}</td><td className="p-1.5 border">{s.type}</td><td className="p-1.5 border text-right">{s.tonnage}</td><td className="p-1.5 border">{s.cargoType}</td><td className="p-1.5 border">{s.hazardous?<span className="text-red-500">{s.hazardClass}</span>:'—'}</td><td className="p-1.5 border">{s.captainName}</td><td className="p-1.5 border text-slate-500">{s.captainPhone}</td><td className="p-1.5 border text-right">{s.crewCount}</td></tr>
                        ))}</tbody>
                      </table>
                    </td>
                  </tr>
                )}
              </>
            ))}
            {history.length===0 && (
              <tr><td colSpan={7} className="text-center py-12 text-slate-400 text-sm">暂无申报记录</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-[720px] max-w-[95vw] max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h3 className="text-lg font-bold">新增申报</h3>
                <p className="text-xs text-slate-400">{DISTRICT} · {today} · {ships.length} 艘</p>
              </div>
              <button onClick={()=>setShowDialog(false)} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-4">
              {ships.map((ship,idx)=>(
                <div key={idx} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-500">船舶 #{idx+1}</span>
                    {ships.length>1 && <button onClick={()=>removeShip(idx)} className="text-xs text-red-400">删除</button>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div><label className="text-[10px] text-slate-400">船舶名称 *</label><input value={ship.name} onChange={e=>updateShip(idx,'name',e.target.value)} className="w-full px-2 py-1 border rounded text-xs" placeholder="浙海通008"/></div>
                    <div><label className="text-[10px] text-slate-400">MMSI *</label><input value={ship.mmsi} onChange={e=>updateShip(idx,'mmsi',e.target.value)} className="w-full px-2 py-1 border rounded text-xs" placeholder="413798201"/></div>
                    <div><label className="text-[10px] text-slate-400">船舶类型</label><select value={ship.type} onChange={e=>updateShip(idx,'type',e.target.value)} className="w-full px-2 py-1 border rounded text-xs">{SHIP_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                    <div><label className="text-[10px] text-slate-400">总吨位</label><input type="number" value={ship.tonnage||''} onChange={e=>updateShip(idx,'tonnage',Number(e.target.value))} className="w-full px-2 py-1 border rounded text-xs" placeholder="3000"/></div>
                    <div><label className="text-[10px] text-slate-400">货物类型</label><select value={ship.cargoType} onChange={e=>updateShip(idx,'cargoType',e.target.value)} className="w-full px-2 py-1 border rounded text-xs">{CARGO_TYPES.map(t=><option key={t}>{t}</option>)}</select></div>
                    <div><label className="text-[10px] text-slate-400">是否危险品</label><select value={ship.hazardous?'是':'否'} onChange={e=>updateShip(idx,'hazardous',e.target.value==='是')} className="w-full px-2 py-1 border rounded text-xs"><option>否</option><option>是</option></select></div>
                    {ship.hazardous && <div><label className="text-[10px] text-slate-400">危险品类别</label><select value={ship.hazardClass} onChange={e=>updateShip(idx,'hazardClass',e.target.value)} className="w-full px-2 py-1 border rounded text-xs bg-red-50"><option value="">选择</option><option>3类-易燃液体</option><option>6类-毒性物质</option><option>8类-腐蚀品</option></select></div>}
                    <div><label className="text-[10px] text-slate-400">船长姓名</label><input value={ship.captainName} onChange={e=>updateShip(idx,'captainName',e.target.value)} className="w-full px-2 py-1 border rounded text-xs" placeholder="张建国"/></div>
                    <div><label className="text-[10px] text-slate-400">船长手机 *</label><input value={ship.captainPhone} onChange={e=>updateShip(idx,'captainPhone',e.target.value)} className="w-full px-2 py-1 border rounded text-xs" placeholder="13805710001"/></div>
                    <div><label className="text-[10px] text-slate-400">船员人数</label><input type="number" value={ship.crewCount||''} onChange={e=>updateShip(idx,'crewCount',Number(e.target.value))} className="w-full px-2 py-1 border rounded text-xs" placeholder="10"/></div>
                    <div><label className="text-[10px] text-slate-400">始发港</label><input value={ship.origin} onChange={e=>updateShip(idx,'origin',e.target.value)} className="w-full px-2 py-1 border rounded text-xs" placeholder="杭州建德"/></div>
                    <div><label className="text-[10px] text-slate-400">目的港</label><input value={ship.destination} onChange={e=>updateShip(idx,'destination',e.target.value)} className="w-full px-2 py-1 border rounded text-xs" placeholder={DISTRICT}/></div>
                    <div><label className="text-[10px] text-slate-400">ETA</label><input type="datetime-local" value={ship.eta} onChange={e=>updateShip(idx,'eta',e.target.value)} className="w-full px-2 py-1 border rounded text-xs"/></div>
                  </div>
                </div>
              ))}

              <button onClick={addShip} className="w-full py-2 border-2 border-dashed border-slate-300 rounded-lg text-sm text-slate-400 hover:border-blue-300 hover:text-blue-500">
                + 添加船舶
              </button>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">{ships.filter(s=>s.name.trim()).length} 艘有效</span>
              <div className="flex gap-2">
                <button onClick={()=>setShowDialog(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">取消</button>
                <button onClick={handleSubmit} className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 font-medium">确认申报</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
