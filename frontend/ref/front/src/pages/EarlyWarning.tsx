import { useState, useEffect, useCallback } from 'react';
import { DataCard } from '../components/DataCard';
import { StatusBadge, StatusTag } from '../components/StatusBadge';
import { WarningPanel } from '../components/WarningPanel';
import { MapView } from '../components/MapView';
import { usePolling } from '../hooks/usePolling';
import type { ShipPosition, Warning, HydrologicalData, WeatherCurrent, FloodForecast, Berth, HydrologicalStation } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer, AreaChart, Area, ComposedChart } from 'recharts';
import { IconWater, IconWind, IconRain, IconShip, IconWarning, IconFire, IconBell, IconSignal, IconCamera, IconLock } from '../components/Icons';

export default function EarlyWarning() {
  const [ships, setShips] = useState<ShipPosition[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [hydrology, setHydrology] = useState<HydrologicalData[]>([]);
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [floodForecast, setFloodForecast] = useState<FloodForecast | null>(null);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [selectedShip, setSelectedShip] = useState<ShipPosition | null>(null);
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);

  // Push modal
  const [showPushModal, setShowPushModal] = useState(false);
  const [pushStep, setPushStep] = useState(1);
  const [pushMethod, setPushMethod] = useState('both');
  const [selectedWarnings, setSelectedWarnings] = useState<string[]>([]);

  // Bridge area
  const [bridgeView, setBridgeView] = useState(false);
  const [ptzCamera, setPtzCamera] = useState('CAM02');

  // Berth detail
  const [selectedBerth, setSelectedBerth] = useState<Berth | null>(null);
  const [berthShips, setBerthShips] = useState<ShipPosition[]>([]);

  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3500)};

  const fetchData = useCallback(async () => {
    const [shipRes, hydroRes, weatherRes, floodRes, berthRes] = await Promise.all([
      fetch('/api/south/ais/ship').then(r=>r.json()),
      fetch('/api/south/hydrology/level').then(r=>r.json()),
      fetch('/api/south/weather/current').then(r=>r.json()),
      fetch('/api/south/hydrology/flood-forecast').then(r=>r.json()),
      fetch('/api/ops/berths').then(r=>r.json()),
    ]);
    setShips(shipRes.data as ShipPosition[]);
    setHydrology((hydroRes.data as HydrologicalData[])||[]);
    setWeather(weatherRes.data as WeatherCurrent);
    setFloodForecast(floodRes.data as FloodForecast);
    if (berthRes.data) setBerths(berthRes.data);
  }, []);

  useEffect(() => {
    fetch('/api/north/report-history').then(r=>r.json()).then(d=>{if(d.data?.warnings)setWarnings(d.data.warnings)});
    fetchData();
  }, []);
  usePolling(fetchData, 15000);

  const handleReviewWarning = async (id:string, status:string) => {
    if (status==='已推送') {
      await fetch('/api/north/warning/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({warningId:id})});
    }
    setWarnings(p=>p.map(w=>w.id===id?{...w,status}:w));
    addToast(status==='已推送'?'预警已推送至辖区船舶（短信+平台）':'已驳回');
  };

  const handlePushAll = async () => {
    const pending = warnings.filter(w=>selectedWarnings.includes(w.id)||w.status==='待审核');
    for (const w of pending.slice(0,5)) {
      await fetch('/api/north/warning/report',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({warningId:w.id,method:pushMethod})});
    }
    pending.forEach(w=>setWarnings(p=>p.map(x=>x.id===w.id?{...x,status:'已推送',pushedTo:[...x.pushedTo,pushMethod==='sms'?'短信':pushMethod==='both'?'短信+平台':'平台推送']}:x)));
    addToast(`已通过${pushMethod==='both'?'短信+平台':pushMethod==='sms'?'短信':'平台'}推送 ${Math.min(pending.length,5)} 条预警`);
    setShowPushModal(false); setPushStep(1); setSelectedWarnings([]);
  };

  const handleBerthDetail = (b:Berth) => {
    setSelectedBerth(b);
    // Filter ships near this berth
    const near = ships.filter(s=>Math.abs(s.lat-b.lat)<0.01&&Math.abs(s.lng-b.lng)<0.01);
    setBerthShips(near);
  };

  const handlePTZ = async (pan:number,tilt:number) => {
    await fetch('/api/south/video/ptz',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({cameraId:ptzCamera,pan,tilt,zoom:1})});
    addToast(`云台已调整：水平${pan>0?'+'+pan:pan}°, 俯仰${tilt>0?'+'+tilt:tilt}°`);
  };

  const currentLevel = hydrology[0]?.level||0;
  const currentVelocity = hydrology[0]?.velocity||0;
  const floodFlow = floodForecast?.currentFlow||0;
  const warningLevel = currentLevel>31?'red':currentLevel>28?'orange':currentLevel>26?'yellow':'blue';

  const stations: HydrologicalStation[] = [
    { id:'H001', name:'兰溪水文站', river:'衢江', lat:29.2055, lng:119.4755, warningLevel:31.0, dangerLevel:33.5 },
    { id:'H002', name:'衢江阶梯枢纽', river:'衢江', lat:29.1910, lng:119.5010, warningLevel:28.0, dangerLevel:30.0 },
    { id:'H003', name:'龙游水文站', river:'衢江', lat:29.2180, lng:119.4640, warningLevel:30.5, dangerLevel:32.8 },
  ];

  return (
    <div className="space-y-6">
      {toasts.length>0&&<div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">汛期预警管控</h2>
          <p className="text-sm text-slate-500 mt-1">水文气象实时监测 · 锚地泊位管理 · 桥区监控 · 蓝色/黄色/橙色/红色四级预警</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={()=>{setShowPushModal(true);setPushStep(1)}} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 flex items-center gap-2">
            <IconBell className="w-4 h-4"/> 推送预警
          </button>
          <button onClick={fetchData} className="px-3 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm hover:bg-slate-200">刷新数据</button>
        </div>
      </div>

      {/* Data cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        <DataCard title="兰溪水位" value={currentLevel.toFixed(2)} unit="m" color={currentLevel>30?'text-red-500':'text-blue-600'} trend={currentLevel>28?'up':'steady'} icon={<IconWater className="w-5 h-5"/>} subtitle={`警戒:31.00m · ${warningLevel}级`}/>
        <DataCard title="当前流速" value={currentVelocity.toFixed(1)} unit="m/s" color={currentVelocity>2.5?'text-orange-500':'text-cyan-600'} icon={<IconWind className="w-5 h-5"/>}/>
        <DataCard title="泄洪流量" value={floodFlow} unit="m³/s" color={floodFlow>2500?'text-red-500':floodFlow>1500?'text-orange-500':'text-blue-600'} icon={<IconFire className="w-5 h-5"/>}/>
        <DataCard title="降雨量" value={weather?.rainfall.value.toFixed(1)||'--'} unit="mm" color={(weather?.rainfall.value||0)>50?'text-orange-500':'text-indigo-600'} icon={<IconRain className="w-5 h-5"/>} subtitle={weather?.rainfall.level}/>
        <DataCard title="辖区船舶" value={ships.length} unit="艘" icon={<IconShip className="w-5 h-5"/>} subtitle={`在航${ships.filter(s=>s.status==='航行中').length}艘`}/>
        <DataCard title={`${warningLevel==='red'?'红色':warningLevel==='orange'?'橙色':warningLevel==='yellow'?'黄色':'蓝色'}预警`} value={warnings.filter(w=>w.status==='待审核').length} unit="条" color={warningLevel==='red'?'text-red-500':warningLevel==='orange'?'text-orange-500':warningLevel==='yellow'?'text-amber-500':'text-blue-500'} icon={<IconBell className="w-5 h-5"/>}/>
      </div>

      {/* Map + Warning */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <MapView ships={ships} berths={berths} stations={stations} onShipClick={setSelectedShip} height="380px"/>
        </div>
        <div><WarningPanel warnings={warnings} onReview={handleReviewWarning}/></div>
      </div>

      {/* ===== Power vs Flow Velocity + Berth detail ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ship power vs velocity */}
        <div className="card">
          <h4 className="card-title flex items-center gap-2"><IconFire className="w-4 h-4"/> 船舶动力 vs 流速分析</h4>
          <p className="text-xs text-slate-400 mb-3">根据船舶功率(kW)和当前流速，判断上行船舶是否具备安全通过能力。动力不足自动预警推送。</p>
          <div className="overflow-x-auto max-h-[300px] overflow-y-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b bg-slate-50 text-slate-500"><th className="py-2 px-2 text-left">船名</th><th className="py-2 px-2">类型</th><th className="py-2 px-2 text-right">功率(kW)</th><th className="py-2 px-2 text-right">流速(m/s)</th><th className="py-2 px-2 text-right">功率/流速比</th><th className="py-2 px-2 text-center">通行能力</th><th className="py-2 px-2">建议</th></tr></thead>
              <tbody>
                {ships.filter(s=>s.status==='航行中').slice(0,8).map(pos=>{
                  const power = Math.max(400,(pos.shipTonnage||1000)*0.55);
                  const ratio = power/Math.max(currentVelocity,0.1);
                  const risk = ratio<300?'danger':ratio<500?'warning':'safe';
                  return (
                    <tr key={pos.shipId} className="border-b border-slate-50 hover:bg-slate-50">
                      <td className="py-2 px-2 font-medium">{pos.shipName}</td>
                      <td className="py-2 px-2 text-slate-400">{pos.shipType}</td>
                      <td className="py-2 px-2 text-right">{power.toFixed(0)}</td>
                      <td className="py-2 px-2 text-right">{currentVelocity.toFixed(1)}</td>
                      <td className="py-2 px-2 text-right font-mono">{ratio.toFixed(0)}</td>
                      <td className="py-2 px-2 text-center"><StatusBadge level={risk==='danger'?'red':risk==='warning'?'yellow':'blue'}/></td>
                      <td className="py-2 px-2 text-[10px] text-slate-500">{risk==='danger'?'动力不足，建议暂停上行，就近锚泊':risk==='warning'?'注意流速，谨慎航行':'可正常通行'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Berth detail with ship list */}
        <div className="card">
          <h4 className="card-title flex items-center gap-2"><IconShip className="w-4 h-4"/> 锚地/泊位监测（AIS+视频）</h4>
          <p className="text-xs text-slate-400 mb-3">AIS自动统计各锚地船舶数量，视频辅助核对。点击锚地查看停泊船舶名单。</p>
          <div className="space-y-2 max-h-[300px] overflow-y-auto">
            {berths.map(b=>(
              <div key={b.id}>
                <div onClick={()=>handleBerthDetail(b)} className={`p-3 rounded-lg cursor-pointer transition-colors ${selectedBerth?.id===b.id?'bg-blue-50 border border-blue-200':'bg-slate-50 hover:bg-slate-100'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm">{b.name}</span>
                    <span className="text-xs text-slate-400">{b.district}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                      <div className={`h-1.5 rounded-full ${b.occupiedSlots/b.totalSlots>0.8?'bg-red-500':b.occupiedSlots/b.totalSlots>0.6?'bg-amber-500':'bg-green-500'}`} style={{width:`${(b.occupiedSlots/b.totalSlots)*100}%`}}/>
                    </div>
                    <span className="text-sm font-bold">{b.occupiedSlots}/{b.totalSlots}</span>
                    <span className="text-[10px] text-slate-400">{Math.round(b.occupiedSlots/b.totalSlots*100)}%</span>
                  </div>
                </div>
                {/* Expanded: ship list */}
                {selectedBerth?.id===b.id && (
                  <div className="ml-4 mt-1 p-3 bg-white border border-slate-100 rounded-lg text-xs">
                    <p className="font-medium text-slate-600 mb-2">停泊船舶 ({berthShips.length>0?berthShips.length:b.occupiedSlots} 艘)</p>
                    {berthShips.length>0 ? berthShips.map(s=>(
                      <div key={s.shipId} className="flex items-center justify-between py-1 border-b border-slate-50">
                        <span className="font-medium">{s.shipName}</span>
                        <span className="text-slate-400">{s.shipType} · {s.shipLength}m</span>
                      </div>
                    )) : (
                      <div className="text-slate-400 py-2">
                        {['浙金航016','建德货工007','桐庐砂石005'].slice(0,b.occupiedSlots).map((n,i)=>(
                          <div key={i} className="flex items-center justify-between py-1">
                            <span>{n}</span>
                            <span className="text-slate-400">1380579{i+1}00{i+2}</span>
                            <button onClick={()=>addToast(`已向 ${n} 发送预警通知`)} className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px]">通知</button>
                          </div>
                        ))}
                      </div>
                    )}
                    {b.occupiedSlots/b.totalSlots>0.6 && (
                      <p className="text-[10px] text-amber-600 mt-2">
                        占用率 {Math.round(b.occupiedSlots/b.totalSlots*100)}%，建议引导新增船舶至其他有空位锚地
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bridge area monitoring */}
      {bridgeView && (
        <div className="card border-2 border-amber-200 bg-amber-50/30">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-amber-800 flex items-center gap-2"><IconCamera className="w-4 h-4"/> 桥区重点监控 — 衢江大桥</h4>
            <button onClick={()=>setBridgeView(false)} className="text-xs text-slate-400 hover:text-slate-600">收起</button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-slate-900 rounded-lg h-48 flex items-center justify-center relative">
              <div className="text-center"><span className="text-4xl">📷</span><p className="text-slate-400 text-xs mt-2">上游摄像头</p></div>
              <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">CAM02 · 衢江大桥-上游</div>
            </div>
            <div className="bg-slate-900 rounded-lg h-48 flex items-center justify-center relative">
              <div className="text-center"><span className="text-4xl">📷</span><p className="text-slate-400 text-xs mt-2">下游摄像头</p></div>
              <div className="absolute top-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded">CAM03 · 衢江大桥-下游</div>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-slate-600">桥区水域范围：上游 500m — 下游 300m</p>
              <div className="text-xs space-y-1">
                <div className="flex justify-between"><span className="text-slate-500">桥区船舶</span><span className="font-bold">{ships.filter(s=>Math.abs(s.lat-29.195)<0.005&&Math.abs(s.lng-119.493)<0.005).length||3} 艘</span></div>
                <div className="flex justify-between"><span className="text-slate-500">禁止追越</span><span className="text-red-500 font-medium">是</span></div>
                <div className="flex justify-between"><span className="text-slate-500">限速</span><span>4 节</span></div>
              </div>
              <p className="text-[10px] text-slate-400 mt-2">预警时自动调出桥区摄像头画面，支持云台调控（点击按钮调整摄像头角度）</p>
              <div className="flex gap-1 flex-wrap">
                <button onClick={()=>handlePTZ(0,10)} className="px-2 py-1 bg-white border text-[10px] rounded hover:bg-slate-50">云台上仰</button>
                <button onClick={()=>handlePTZ(0,-10)} className="px-2 py-1 bg-white border text-[10px] rounded hover:bg-slate-50">云台下俯</button>
                <button onClick={()=>handlePTZ(-15,0)} className="px-2 py-1 bg-white border text-[10px] rounded hover:bg-slate-50">左转</button>
                <button onClick={()=>handlePTZ(15,0)} className="px-2 py-1 bg-white border text-[10px] rounded hover:bg-slate-50">右转</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Push modal */}
      {showPushModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl p-6 w-[540px] max-w-[90vw]">
            <h3 className="text-lg font-bold mb-1">{pushStep===1?'选择预警信息':pushStep===2?'选择推送方式':'确认推送'}</h3>
            <p className="text-xs text-slate-400 mb-4">步骤 {pushStep}/3 · 推送后需人工审核确认</p>
            {pushStep===1 && (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {warnings.filter(w=>w.status==='待审核').map(w=>(
                  <label key={w.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                    <input type="checkbox" checked={selectedWarnings.includes(w.id)} onChange={()=>setSelectedWarnings(p=>p.includes(w.id)?p.filter(x=>x!==w.id):[...p,w.id])} className="mt-0.5"/>
                    <div><StatusBadge level={w.level}/><span className="text-sm font-medium ml-1">{w.title}</span><p className="text-xs text-slate-500 mt-1">{w.content.slice(0,80)}...</p></div>
                  </label>
                ))}
              </div>
            )}
            {pushStep===2 && (
              <div className="space-y-3">
                {[{v:'platform',l:'平台推送',d:'在港航业务系统内推送通知'},{v:'sms',l:'短信推送',d:'向船舶联系人和辖区执法人员发送短信'},{v:'both',l:'平台+短信',d:'两种方式同时推送（重要预警推荐）'}].map(o=>(
                  <label key={o.v} className={`flex items-start gap-3 p-4 rounded-lg border cursor-pointer ${pushMethod===o.v?'border-blue-400 bg-blue-50':'border-slate-200 hover:bg-slate-50'}`}>
                    <input type="radio" name="pushMethod" value={o.v} checked={pushMethod===o.v} onChange={()=>setPushMethod(o.v)} className="mt-0.5"/>
                    <div><p className="font-medium text-sm">{o.l}</p><p className="text-xs text-slate-500">{o.d}</p></div>
                  </label>
                ))}
              </div>
            )}
            {pushStep===3 && (
              <div className="bg-slate-50 rounded-lg p-4 text-sm">
                <p>将推送 <strong>{selectedWarnings.length||warnings.filter(w=>w.status==='待审核').length}</strong> 条预警</p>
                <p className="text-xs text-slate-500 mt-1">方式: {pushMethod==='sms'?'短信':pushMethod==='both'?'平台+短信':'平台推送'}</p>
                <p className="text-xs text-amber-500 mt-2">推送后系统自动生成推送记录，可追溯。</p>
              </div>
            )}
            <div className="flex justify-between mt-6">
              <button onClick={()=>setShowPushModal(false)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">取消</button>
              <div className="flex gap-2">
                {pushStep>1&&<button onClick={()=>setPushStep(pushStep-1)} className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">上一步</button>}
                {pushStep<3?<button onClick={()=>setPushStep(pushStep+1)} className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm">下一步</button>
                :<button onClick={handlePushAll} className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm">确认推送</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
