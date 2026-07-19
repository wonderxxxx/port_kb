import { useState, useEffect } from 'react';
import { StatusTag } from '../components/StatusBadge';
import { IconShip, IconCheck, IconBell, IconDocument, IconChart } from '../components/Icons';

const DISTRICTS = ['龙游港区', '衢州港区', '罗阳（兰溪）'];
const DEFAULT_THRESHOLD = 40;

interface ThresholdRecord { value: number; source: string; reason: string; time: string; }

interface ShipEntry {
  id: string; name: string; mmsi: string; type: string; tonnage: number; dwt: number;
  cargoType: string; hazardous: boolean; hazardClass: string;
  captainName: string; captainPhone: string; crewCount: number;
  length: number; draft: number;
  origin: string; destination: string; eta: string;
}

interface SubRecord { id:string; district:string; date:string; ships:ShipEntry[]; status:string; submittedAt:string; reviewStatus:'pending'|'approved'|'rejected'; }

const mockSubs: SubRecord[] = [
  { id:'SUB001', district:'龙游港区', date:'2026-06-17', status:'已提交', reviewStatus:'pending', submittedAt:'2026-06-17 11:30', ships:[
    { id:'S1',name:'浙海集003',mmsi:'413799513',type:'集装箱船',tonnage:5000,dwt:8000,cargoType:'集装箱',hazardous:false,hazardClass:'',captainName:'张建国',captainPhone:'13805710001',crewCount:12,length:100,draft:4.0,origin:'杭州建德',destination:'龙游港区',eta:'2026-06-18 08:00'},
    { id:'S2',name:'浙西客001',mmsi:'413799807',type:'客船',tonnage:1500,dwt:2000,cargoType:'空载',hazardous:false,hazardClass:'',captainName:'李明华',captainPhone:'13805700007',crewCount:8,length:55,draft:2.0,origin:'杭州建德',destination:'龙游港区',eta:'2026-06-18 09:00'},
    { id:'S3',name:'金航客渡008',mmsi:'413796112',type:'渡船',tonnage:300,dwt:500,cargoType:'空载',hazardous:false,hazardClass:'',captainName:'周小军',captainPhone:'13506890012',crewCount:4,length:22,draft:1.0,origin:'杭州建德',destination:'龙游港区',eta:'2026-06-18 10:00'},
  ]},
  { id:'SUB002', district:'衢州港区', date:'2026-06-17', status:'已提交', reviewStatus:'pending', submittedAt:'2026-06-17 11:45', ships:[
    { id:'S4',name:'衢江货0188',mmsi:'413799103',type:'散货船',tonnage:4500,dwt:7000,cargoType:'砂石',hazardous:false,hazardClass:'',captainName:'王德发',captainPhone:'13905700003',crewCount:10,length:95,draft:3.8,origin:'杭州建德',destination:'衢州港区',eta:'2026-06-18 06:00'},
    { id:'S5',name:'浙海油002',mmsi:'413798905',type:'油船',tonnage:2000,dwt:3500,cargoType:'油品',hazardous:true,hazardClass:'3类-易燃液体',captainName:'赵大勇',captainPhone:'13705710005',crewCount:6,length:70,draft:3.5,origin:'杭州建德',destination:'衢州港区',eta:'2026-06-18 07:30'},
    { id:'S6',name:'浙航危化001',mmsi:'413798310',type:'化学品船',tonnage:2200,dwt:3800,cargoType:'化学品',hazardous:true,hazardClass:'6类-毒性物质',captainName:'孙志强',captainPhone:'13605710010',crewCount:5,length:72,draft:3.4,origin:'杭州建德',destination:'衢州港区',eta:'2026-06-18 08:00'},
    { id:'S7',name:'衢江散006',mmsi:'413795214',type:'散货船',tonnage:1500,dwt:2200,cargoType:'煤炭',hazardous:false,hazardClass:'',captainName:'吴大海',captainPhone:'13605700014',crewCount:9,length:55,draft:2.6,origin:'杭州建德',destination:'衢州港区',eta:'2026-06-18 09:30'},
  ]},
  { id:'SUB003', district:'罗阳（兰溪）', date:'2026-06-17', status:'已提交', reviewStatus:'pending', submittedAt:'2026-06-17 11:50', ships:[
    { id:'S8',name:'浙金航016',mmsi:'413798502',type:'货船',tonnage:1800,dwt:2800,cargoType:'钢材',hazardous:false,hazardClass:'',captainName:'钱伟',captainPhone:'13805790002',crewCount:8,length:62,draft:2.8,origin:'杭州建德',destination:'罗阳港区',eta:'2026-06-18 08:30'},
    { id:'S9',name:'兰溪渔运002',mmsi:'413795408',type:'渔船',tonnage:200,dwt:300,cargoType:'空载',hazardous:false,hazardClass:'',captainName:'郑老六',captainPhone:'13305790008',crewCount:3,length:18,draft:0.8,origin:'杭州建德',destination:'罗阳港区',eta:'2026-06-18 10:30'},
  ]},
];

const lanxiExtra: ShipEntry[] = [
  { id:'EX1',name:'金航工003',mmsi:'413797206',type:'工程船',tonnage:1200,dwt:1800,cargoType:'设备',hazardous:false,hazardClass:'',captainName:'马建国',captainPhone:'13605790006',crewCount:12,length:45,draft:2.5,origin:'兰溪',destination:'航道施工区',eta:'2026-06-18 07:00'},
];

export default function ConsolidateManage() {
  const today = new Date().toISOString().slice(0,10);
  const [subs, setSubs] = useState<SubRecord[]>(mockSubs);
  const [consolidated, setConsolidated] = useState(false);
  const [showNotify, setShowNotify] = useState(true);
  const [reportedToHangzhou, setReportedToHangzhou] = useState(false);
  const [reportMethod, setReportMethod] = useState<'online'|'offline'>('online');
  const [showReportModal, setShowReportModal] = useState(false);
  const [expandedDistrict, setExpandedDistrict] = useState<string|null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  const allSubmitted = subs.every(s=>s.status==='已提交'||s.status==='已汇总');
  const allReviewed = subs.every(s=>s.reviewStatus==='approved'||s.status==='已汇总');
  const allShips = subs.flatMap(s=>s.ships);
  const totalShips = allShips.length + lanxiExtra.length;
  const totalTonnage = allShips.reduce((s,sh)=>s+sh.tonnage,0) + lanxiExtra.reduce((s,sh)=>s+sh.tonnage,0);
  const totalCrew = allShips.reduce((s,sh)=>s+sh.crewCount,0) + lanxiExtra.reduce((s,sh)=>s+sh.crewCount,0);
  const hazardousShips = [...allShips.filter(s=>s.hazardous), ...lanxiExtra.filter(s=>s.hazardous)];
  const currentLevel = 28.65; // 模拟从水文API获取
  const weather = { rainfall: { value: 52.8 } }; // 模拟从气象API获取
  const month = new Date().getMonth()+1;
  const [threshold, setThreshold] = useState(DEFAULT_THRESHOLD);
  const [thresholdMode, setThresholdMode] = useState<'manual'|'auto'>('auto');
  const [thresholdHistory, setThresholdHistory] = useState<ThresholdRecord[]>([
    { value:40, source:'初始值', reason:'系统默认阈值', time:'2026-06-01 08:00' },
    { value:38, source:'算法推荐', reason:'兰溪水位28.65m（警戒31m），建议下调', time:'2026-06-17 09:00' },
  ]);

  // Algorithm: dynamic threshold based on water level + weather + season
  const suggestThreshold = () => {
    let suggested = DEFAULT_THRESHOLD;
    // Water level factor
    if (currentLevel > 30) suggested -= 8;
    else if (currentLevel > 28) suggested -= 4;
    else if (currentLevel > 26) suggested -= 2;
    // Weather factor (rainfall)
    if ((weather?.rainfall?.value||0) > 50) suggested -= 5;
    else if ((weather?.rainfall?.value||0) > 30) suggested -= 3;
    // Flood season (Jun-Sep)
    const month = new Date().getMonth()+1;
    if (month>=6 && month<=9) suggested -= 2;
    // Clamp
    return Math.max(15, Math.min(50, suggested));
  };

  const applySuggestedThreshold = () => {
    const v = suggestThreshold();
    setThreshold(v);
    setThresholdHistory(p=>[{value:v, source:'算法推荐', reason:`水位${currentLevel.toFixed(1)}m·降雨${(weather?.rainfall?.value||0).toFixed(0)}mm·${month>=6&&month<=9?'汛期':''}`, time:new Date().toLocaleString('zh-CN')},...p]);
    addToast(`算法推荐阈值: ${v} 艘`);
  };

  const overThreshold = totalShips > threshold;

  const handleConsolidate = () => {
    setConsolidated(true);
    setSubs(p=>p.map(s=>({...s,status:'已汇总'})));
    addToast(`汇总完成：${totalShips} 艘船舶，${totalTonnage} 总吨，${totalCrew} 名船员`);
  };

  const reportToHangzhou = () => {
    setReportedToHangzhou(true);
    addToast(reportMethod==='online'?'已线上报送杭州执法队':'已导出清单，请线下报送杭州');
    setShowReportModal(false);
  };

  const exportList = () => {
    const header = '序号,所属港区,船名,MMSI,船舶类型,吨位,载重吨,货物类型,是否危险品,危险品类别,船长姓名,船长手机,船员人数,船长(米),吃水(米),始发港,目的港,ETA';
    const rows: string[] = [];
    let order = 1;
    subs.forEach(sub => {
      sub.ships.forEach(s => {
        rows.push([order++,sub.district,s.name,s.mmsi,s.type,s.tonnage,s.dwt,s.cargoType,s.hazardous?'是':'否',s.hazardClass,s.captainName,s.captainPhone,s.crewCount,s.length,s.draft,s.origin,s.destination,s.eta].join(','));
      });
    });
    lanxiExtra.forEach(s => {
      rows.push([order++,'兰溪附加',s.name,s.mmsi,s.type,s.tonnage,s.dwt,s.cargoType,'否','',s.captainName,s.captainPhone,s.crewCount,s.length,s.draft,s.origin,s.destination,s.eta].join(','));
    });
    rows.push('');
    rows.push(`合计,${totalShips}艘,${totalTonnage}总吨,${totalCrew}船员${hazardousShips.length>0?','+hazardousShips.length+'艘危险品':''}`);
    const csv = '﻿'+header+'\n'+rows.join('\n');
    const blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `放行清单-DD-${today.replace(/-/g,'')}.csv`; a.click();
    URL.revokeObjectURL(url);
    addToast('放行清单已导出为CSV');
  };

  return (
    <div className="space-y-6">
      {toasts.length>0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">调度审核</h2>
          <p className="text-sm text-slate-500 mt-1">金华（姚家船闸）· 审核上游三区申报 · 阈值管控 · 生成放行清单 · 报送杭州</p>
        </div>
        <div className="flex items-center gap-2">
          {allSubmitted && !consolidated && (
            <span className={`px-3 py-1.5 text-xs rounded-full font-medium ${allReviewed?'bg-blue-100 text-blue-700':'bg-amber-100 text-amber-700 animate-pulse'}`}>{allReviewed?'审核通过 · 待汇总':'三区已提交 · 待审核'}</span>
          )}
          {consolidated && !reportedToHangzhou && (
            <span className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">已汇总 · 待报送</span>
          )}
          {reportedToHangzhou && (
            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-700 text-xs rounded-full font-medium">已报送杭州</span>
          )}
        </div>
      </div>

      {/* Notification */}
      {showNotify && allSubmitted && !consolidated && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3">
          <IconBell className="w-5 h-5 text-amber-500 mt-0.5"/>
          <div className="flex-1">
            <h4 className="font-semibold text-amber-800 text-sm">上游三区已全部提交</h4>
            <p className="text-xs text-amber-700 mt-1">
              龙游 {subs.find(s=>s.district==='龙游港区')?.ships.length} 艘 · 衢州 {subs.find(s=>s.district==='衢州港区')?.ships.length} 艘 · 罗阳 {subs.find(s=>s.district==='罗阳（兰溪）')?.ships.length} 艘。
              共计 {totalShips} 艘，{totalTonnage} 总吨，{totalCrew} 名船员。
              {hazardousShips.length>0 && <span className="text-red-600 font-medium">含危险品 {hazardousShips.length} 艘。</span>}
            </p>
            <button onClick={()=>setShowNotify(false)} className="text-xs text-amber-500 mt-1">关闭</button>
          </div>
        </div>
      )}

      {/* Threshold management */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h4 className="font-semibold text-sm text-slate-700">调度阈值</h4>
            <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5">
              <button onClick={()=>setThresholdMode('auto')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${thresholdMode==='auto'?'bg-white shadow-sm text-blue-600':'text-slate-500'}`}>算法推荐</button>
              <button onClick={()=>setThresholdMode('manual')} className={`px-3 py-1.5 rounded-md text-xs font-medium ${thresholdMode==='manual'?'bg-white shadow-sm text-amber-600':'text-slate-500'}`}>手动设置</button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {thresholdMode==='auto' ? (
              <>
                <span className="text-xs text-slate-400">算法建议</span>
                <span className="text-lg font-bold text-blue-600">{suggestThreshold()} 艘</span>
                <button onClick={applySuggestedThreshold} className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600">应用推荐值</button>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={()=>setThreshold(p=>Math.max(15,p-2))} className="w-7 h-7 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">−</button>
                <input type="number" value={threshold} onChange={e=>{
                  const v=Number(e.target.value);
                  if(v>=15&&v<=50){setThreshold(v);setThresholdHistory(p=>[{value:v,source:'手动设置',reason:'管理员手动调整',time:new Date().toLocaleString('zh-CN')},...p]);}
                }} className="w-16 text-center text-lg font-bold border border-slate-200 rounded py-1"/>
                <button onClick={()=>setThreshold(p=>{const v=Math.min(50,p+2);setThresholdHistory(h=>[{value:v,source:'手动设置',reason:'管理员手动调整',time:new Date().toLocaleString('zh-CN')},...h]);return v;})} className="w-7 h-7 rounded bg-slate-100 text-slate-600 hover:bg-slate-200">+</button>
                <span className="text-xs text-slate-400">艘</span>
              </div>
            )}
          </div>
        </div>
        {/* Algorithm factors */}
        {thresholdMode==='auto' && (
          <div className="mt-3 grid grid-cols-4 gap-2 text-sm text-slate-400">
            <span>水位 {currentLevel.toFixed(1)}m → {currentLevel>30?'-8':currentLevel>28?'-4':currentLevel>26?'-2':'0'}</span>
            <span>降雨 {(weather?.rainfall?.value||0).toFixed(0)}mm → {(weather?.rainfall?.value||0)>50?'-5':(weather?.rainfall?.value||0)>30?'-3':'0'}</span>
            <span>汛期(6-9月) → {month>=6&&month<=9?'-2':'0'}</span>
            <span>基准值 → {DEFAULT_THRESHOLD}</span>
          </div>
        )}
        {/* Threshold history */}
        <details className="mt-2">
          <summary className="text-xs text-slate-400 cursor-pointer">阈值变更记录（{thresholdHistory.length} 条）</summary>
          <div className="mt-1 space-y-0.5 text-xs text-slate-500">
            {thresholdHistory.map((h,i)=><div key={i} className="flex justify-between"><span>{h.value} 艘 · {h.source} · {h.reason}</span><span className="text-slate-400">{h.time}</span></div>)}
          </div>
        </details>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="card text-center py-3"><p className="text-xs text-slate-400">船舶总数</p><p className="text-2xl font-bold text-blue-600">{totalShips}</p><p className="text-sm text-slate-400">/ {threshold} 艘阈值</p></div>
        <div className="card text-center py-3"><p className="text-xs text-slate-400">总吨位</p><p className="text-2xl font-bold text-slate-700">{totalTonnage.toLocaleString()}</p><p className="text-sm text-slate-400">吨</p></div>
        <div className="card text-center py-3"><p className="text-xs text-slate-400">船员总数</p><p className="text-2xl font-bold text-slate-700">{totalCrew}</p><p className="text-sm text-slate-400">人</p></div>
        <div className={`card text-center py-3 ${hazardousShips.length>0?'border-red-200 bg-red-50':''}`}>
          <p className="text-xs text-slate-400">危险品船舶</p>
          <p className={`text-2xl font-bold ${hazardousShips.length>0?'text-red-500':'text-slate-400'}`}>{hazardousShips.length}</p>
        </div>
        <div className={`card text-center py-3 ${overThreshold?'border-red-200 bg-red-50':''}`}>
          <p className="text-xs text-slate-400">是否超阈值</p>
          <p className={`text-lg font-bold ${overThreshold?'text-red-500':'text-emerald-500'}`}>{overThreshold?'超 '+(totalShips-threshold)+' 艘':'正常'}</p>
        </div>
      </div>

      {/* District details */}
      {DISTRICTS.map(d=>{
        const sub = subs.find(s=>s.district===d);
        return (
          <div key={d} className={`card ${sub?.status==='已汇总'?'border-emerald-200':sub?'border-blue-200':'border-slate-200'}`}>
            <div onClick={()=>setExpandedDistrict(expandedDistrict===d?null:d)}
              className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <h4 className="font-semibold text-sm">{d}</h4>
                {sub ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{sub.ships.length} 艘</span>
                    <span>{sub.ships.reduce((s,sh)=>s+sh.tonnage,0)} 吨</span>
                    <span>{sub.ships.reduce((s,sh)=>s+sh.crewCount,0)} 人</span>
                    {sub.ships.some(s=>s.hazardous) && <span className="text-red-500">含危险品</span>}
                  </div>
                ) : <span className="text-xs text-slate-400">未提交</span>}
              </div>
              <div className="flex items-center gap-3">
                {sub && sub.status==='已汇总' && <StatusTag status="已完成"/>}
                {sub && sub.status!=='已汇总' && sub.reviewStatus==='pending' && (
                  <div className="flex items-center gap-2 z-10">
                    <button onClick={(e)=>{e.stopPropagation();setSubs(p=>p.map(s=>s.id===sub.id?{...s,reviewStatus:'approved'}:s));addToast(`${d} 审核通过`)}}
                      className="px-3 py-1.5 bg-emerald-500 text-white text-xs rounded-lg hover:bg-emerald-600 font-medium">审核通过</button>
                    <button onClick={(e)=>{e.stopPropagation();setSubs(p=>p.map(s=>s.id===sub.id?{...s,reviewStatus:'rejected'}:s));addToast(`${d} 已驳回`,'warning')}}
                      className="px-3 py-1.5 bg-red-50 text-red-600 text-xs rounded-lg hover:bg-red-100 font-medium border border-red-200">驳回</button>
                  </div>
                )}
                {sub && sub.status!=='已汇总' && sub.reviewStatus!=='pending' && (
                  <StatusTag status={sub.reviewStatus==='approved'?'已完成':'已驳回'}/>
                )}
                {sub && <span className="text-xs text-slate-400">{sub.submittedAt}</span>}
              </div>
            </div>

            {expandedDistrict===d && sub && (
              <div className="mt-3 overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b bg-slate-50 text-slate-500"><th className="py-1.5 px-2 text-left">船名</th><th className="py-1.5 px-2 text-left">MMSI</th><th className="py-1.5 px-2 text-left">类型</th><th className="py-1.5 px-2 text-right">吨位</th><th className="py-1.5 px-2 text-left">货物</th><th className="py-1.5 px-2 text-left">危险品</th><th className="py-1.5 px-2 text-left">船长</th><th className="py-1.5 px-2 text-left">手机号</th><th className="py-1.5 px-2 text-right">船员</th><th className="py-1.5 px-2 text-right">吃水</th><th className="py-1.5 px-2 text-left">ETA</th></tr></thead>
                  <tbody>
                    {sub.ships.map(s=>(
                      <tr key={s.id} className={`border-b border-slate-50 ${s.hazardous?'bg-red-50/30':''}`}>
                        <td className="py-1.5 px-2 font-medium">{s.name}</td>
                        <td className="py-1.5 px-2 text-slate-500 font-mono text-sm">{s.mmsi}</td>
                        <td className="py-1.5 px-2">{s.type}</td>
                        <td className="py-1.5 px-2 text-right">{s.tonnage}</td>
                        <td className="py-1.5 px-2">{s.cargoType}</td>
                        <td className="py-1.5 px-2">{s.hazardous?<span className="text-red-500 font-medium">{s.hazardClass}</span>:<span className="text-slate-300">—</span>}</td>
                        <td className="py-1.5 px-2">{s.captainName}</td>
                        <td className="py-1.5 px-2 text-slate-500">{s.captainPhone}</td>
                        <td className="py-1.5 px-2 text-right">{s.crewCount}</td>
                        <td className="py-1.5 px-2 text-right">{s.draft}m</td>
                        <td className="py-1.5 px-2 text-sm text-slate-400">{s.eta?.slice(11)||s.eta}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      })}

      {/* Lanxi extra */}
      {lanxiExtra.length>0 && (
        <div className="card border-purple-200 bg-purple-50/20">
          <h4 className="font-semibold text-sm text-purple-700 mb-2">兰溪附加调度（{lanxiExtra.length} 艘）</h4>
          <p className="text-xs text-slate-500 mb-2">工程船、方向电作业区等不包含在三区申报中的额外需求</p>
          <table className="w-full text-xs">
            <thead><tr className="border-b text-slate-500"><th className="py-1.5 px-2 text-left">船名</th><th className="py-1.5 px-2 text-left">MMSI</th><th className="py-1.5 px-2 text-left">类型</th><th className="py-1.5 px-2 text-right">吨位</th><th className="py-1.5 px-2 text-left">货物</th><th className="py-1.5 px-2 text-left">船长</th><th className="py-1.5 px-2 text-left">手机号</th><th className="py-1.5 px-2 text-right">船员</th></tr></thead>
            <tbody>{lanxiExtra.map(s=>(
              <tr key={s.id} className="border-b border-slate-50">
                <td className="py-1.5 px-2 font-medium">{s.name}</td><td className="py-1.5 px-2 text-slate-500 font-mono text-sm">{s.mmsi}</td><td className="py-1.5 px-2">{s.type}</td><td className="py-1.5 px-2 text-right">{s.tonnage}</td>
                <td className="py-1.5 px-2">{s.cargoType}</td><td className="py-1.5 px-2">{s.captainName}</td><td className="py-1.5 px-2 text-slate-500">{s.captainPhone}</td><td className="py-1.5 px-2 text-right">{s.crewCount}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {/* Actions */}
      <div className="card">
        <h4 className="font-semibold text-slate-700 mb-3">操作</h4>
        {!consolidated ? (
          <button onClick={handleConsolidate} disabled={!allReviewed||overThreshold}
            className="w-full py-3 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed">
            {!allSubmitted?'等待上游三区全部提交...':!allReviewed?'请先审核所有申报（通过/驳回）':overThreshold?`超出阈值 ${totalShips-threshold} 艘，无法汇总`:'审核通过，汇总并生成放行清单'}
          </button>
        ) : (
          <div className="flex gap-3">
            <button onClick={()=>setShowPreview(true)} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200">
              预览放行清单
            </button>
            <button onClick={exportList} className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-medium rounded-lg hover:bg-slate-200">
              导出 CSV
            </button>
            {!reportedToHangzhou && (
              <button onClick={()=>setShowReportModal(true)} className="flex-1 py-2.5 bg-blue-500 text-white font-medium rounded-lg hover:bg-blue-600">
                报送杭州执法队
              </button>
            )}
          </div>
        )}
        {consolidated && (
          <div className="mt-3 text-xs text-slate-500">
            汇总结果：{totalShips} 艘船舶 · {totalTonnage} 总吨 · {totalCrew} 名船员
            {hazardousShips.length>0 && <span className="text-red-500 ml-2">⚠ 含危险品 {hazardousShips.length} 艘</span>}
          </div>
        )}
      </div>

      {/* Preview modal — CSV table format */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[1200px] max-w-[98vw] max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4 flex-shrink-0">
              <div>
                <h4 className="font-bold">放行清单预览（CSV）</h4>
                <p className="text-sm text-slate-500">DD-{today.replace(/-/g,'')} · {totalShips} 艘 · {totalTonnage.toLocaleString()} 吨 · {totalCrew} 人 · 金华→杭州</p>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>setShowPreview(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">关闭</button>
                <button onClick={()=>{exportList();setShowPreview(false);}} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">导出 CSV</button>
              </div>
            </div>
            <div className="overflow-auto flex-1">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 bg-slate-100">
                  <tr>
                    <th className="border px-2 py-1.5 text-left">序号</th><th className="border px-2 py-1.5 text-left">港区</th><th className="border px-2 py-1.5 text-left">船名</th><th className="border px-2 py-1.5 text-left">MMSI</th><th className="border px-2 py-1.5 text-left">类型</th><th className="border px-2 py-1.5 text-right">吨位</th><th className="border px-2 py-1.5 text-left">货物</th><th className="border px-2 py-1.5 text-center">危险品</th><th className="border px-2 py-1.5 text-left">船长</th><th className="border px-2 py-1.5 text-left">手机号</th><th className="border px-2 py-1.5 text-right">船员</th>
                  </tr>
                </thead>
                <tbody>
                  {(()=>{let o=1;return subs.flatMap(sub=>sub.ships.map(s=>[o++,sub.district,s]));})().map(([o,d,s]:any,i)=>(
                    <tr key={i} className={`hover:bg-slate-50 ${s.hazardous?'bg-red-50/30':''}`}>
                      <td className="border px-2 py-1.5 text-slate-400">{o}</td>
                      <td className="border px-2 py-1">{d}</td>
                      <td className="border px-2 py-1.5 font-medium">{s.name}</td>
                      <td className="border px-2 py-1.5 font-mono text-slate-500">{s.mmsi}</td>
                      <td className="border px-2 py-1">{s.type}</td>
                      <td className="border px-2 py-1.5 text-right">{s.tonnage}</td>
                      <td className="border px-2 py-1">{s.cargoType}</td>
                      <td className="border px-2 py-1.5 text-center">{s.hazardous?<span className="text-red-500 font-medium">{s.hazardClass}</span>:'—'}</td>
                      <td className="border px-2 py-1">{s.captainName}</td>
                      <td className="border px-2 py-1.5 font-mono text-slate-500">{s.captainPhone}</td>
                      <td className="border px-2 py-1.5 text-right">{s.crewCount}</td>
                    </tr>
                  ))}
                  {/* Lanxi extra */}
                  {lanxiExtra.map((s,i)=>(
                    <tr key={'ex-'+i} className="hover:bg-slate-50 bg-purple-50/20">
                      <td className="border px-2 py-1.5 text-slate-400">{subs.flatMap(x=>x.ships).length+i+1}</td>
                      <td className="border px-2 py-1.5 text-purple-600">兰溪附加</td>
                      <td className="border px-2 py-1.5 font-medium">{s.name}</td>
                      <td className="border px-2 py-1.5 font-mono text-slate-500">{s.mmsi}</td>
                      <td className="border px-2 py-1">{s.type}</td>
                      <td className="border px-2 py-1.5 text-right">{s.tonnage}</td>
                      <td className="border px-2 py-1">{s.cargoType}</td>
                      <td className="border px-2 py-1.5 text-center">—</td>
                      <td className="border px-2 py-1">{s.captainName}</td>
                      <td className="border px-2 py-1.5 font-mono text-slate-500">{s.captainPhone}</td>
                      <td className="border px-2 py-1.5 text-right">{s.crewCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[420px]">
            <h4 className="font-bold mb-3">报送杭州执法队</h4>
            <p className="text-sm text-slate-600 mb-4">将放行清单（{totalShips} 艘）报送下游杭州执法队</p>
            <div className="space-y-3 mb-4">
              <label className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${reportMethod==='online'?'border-blue-400 bg-blue-50':'border-slate-200'}`}>
                <input type="radio" checked={reportMethod==='online'} onChange={()=>setReportMethod('online')} className="mt-0.5"/>
                <div><p className="font-medium text-sm">线上报送</p><p className="text-xs text-slate-500">通过浙港通平台直接推送</p></div>
              </label>
              <label className={`flex gap-3 p-3 rounded-lg border cursor-pointer ${reportMethod==='offline'?'border-blue-400 bg-blue-50':'border-slate-200'}`}>
                <input type="radio" checked={reportMethod==='offline'} onChange={()=>setReportMethod('offline')} className="mt-0.5"/>
                <div><p className="font-medium text-sm">线下报送</p><p className="text-xs text-slate-500">导出后通过微信/邮件发送</p></div>
              </label>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={()=>setShowReportModal(false)} className="px-4 py-2 bg-slate-100 rounded-lg text-sm">取消</button>
              <button onClick={reportToHangzhou} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">确认报送</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
