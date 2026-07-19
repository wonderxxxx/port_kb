import { useState, useEffect, useCallback } from 'react';
import { DataCard } from '../components/DataCard';
import { StatusTag } from '../components/StatusBadge';
import { IconDrone, IconCheck, IconClock, IconPin, IconCamera, IconList } from '../components/Icons';

interface DroneUnit {
  id: string; name: string; model: string;
  status: 'idle' | 'patrol' | 'charging' | 'maintenance';
  battery: number; location: string;
  currentTask: string | null; lastPatrol: string; totalHours: number;
}

interface PatrolRoute {
  id: string; name: string; description: string; duration: string;
  frequency: string; status: 'active' | 'standby'; lastRun: string;
}

interface PatrolResult {
  id: string; routeId: string; routeName: string; droneId: string;
  startTime: string; endTime: string; duration: string;
  shipsDetected: number; alertsFound: number; images: number;
  status: 'completed' | 'in-progress' | 'failed';
}

const mockFleet: DroneUnit[] = [
  { id:'DJI-001', name:'衢江巡航一号', model:'DJI Matrice 350 RTK', status:'patrol', battery:72, location:'龙游锚地上空', currentTask:'衢江主航道巡航路线A', lastPatrol:'2026-06-17 09:30', totalHours: 328 },
  { id:'DJI-002', name:'衢江巡航二号', model:'DJI Matrice 350 RTK', status:'idle', battery:98, location:'龙游机库', currentTask:null, lastPatrol:'2026-06-17 08:15', totalHours: 215 },
  { id:'DJI-003', name:'应急备机', model:'DJI Mavic 3T', status:'charging', battery:45, location:'兰溪机库', currentTask:null, lastPatrol:'2026-06-16 16:00', totalHours: 86 },
];

const mockRoutes: PatrolRoute[] = [
  { id:'R001', name:'衢江主航道巡航', description:'兰溪水文站 → 衢江大桥 → 龙游锚地，总长 18km', duration:'45分钟', frequency:'每日3次', status:'active', lastRun:'2026-06-17 09:30' },
  { id:'R002', name:'桥区安全巡检', description:'衢江大桥上下游各500m重点区域', duration:'20分钟', frequency:'每日6次', status:'active', lastRun:'2026-06-17 08:15' },
  { id:'R003', name:'锚地应急巡检', description:'龙游港区锚地 → 衢江服务区', duration:'30分钟', frequency:'按需激活', status:'standby', lastRun:'2026-06-16 14:00' },
  { id:'R004', name:'夜间红外巡检', description:'衢江全域红外热成像巡航', duration:'60分钟', frequency:'每日1次（夜间）', status:'active', lastRun:'2026-06-17 02:00' },
];

const mockResults: PatrolResult[] = [
  { id:'PR001', routeId:'R001', routeName:'衢江主航道巡航', droneId:'DJI-001', startTime:'2026-06-17 09:30', endTime:'2026-06-17 10:15', duration:'45分钟', shipsDetected:15, alertsFound:3, images:128, status:'completed' },
  { id:'PR002', routeId:'R002', routeName:'桥区安全巡检', droneId:'DJI-002', startTime:'2026-06-17 08:15', endTime:'2026-06-17 08:35', duration:'20分钟', shipsDetected:4, alertsFound:1, images:56, status:'completed' },
  { id:'PR003', routeId:'R001', routeName:'衢江主航道巡航', droneId:'DJI-001', startTime:'2026-06-17 06:00', endTime:'2026-06-17 06:45', duration:'45分钟', shipsDetected:12, alertsFound:0, images:120, status:'completed' },
  { id:'PR004', routeId:'R004', routeName:'夜间红外巡检', droneId:'DJI-003', startTime:'2026-06-17 02:00', endTime:'2026-06-17 03:00', duration:'60分钟', shipsDetected:8, alertsFound:2, images:95, status:'completed' },
  { id:'PR005', routeId:'R002', routeName:'桥区安全巡检', droneId:'DJI-001', startTime:'2026-06-17 10:20', endTime:'', duration:'进行中', shipsDetected:2, alertsFound:0, images:12, status:'in-progress' },
];

export default function DronePatrol() {
  const [activeTab, setActiveTab] = useState<'fleet' | 'routes' | 'results'>('fleet');
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);
  const [dispatching, setDispatching] = useState<string | null>(null);

  const addToast = (m: string, t = 'success') => {
    const id = Date.now(); setToasts(p => [...p, {id, message:m, type:t}]);
    setTimeout(() => setToasts(p => p.filter(x => x.id !== id)), 3500);
  };

  const handleDispatch = async (routeId: string, routeName: string) => {
    setDispatching(routeId);
    try {
      // Call drone platform API to dispatch a patrol task
      await fetch('/api/ops/drone/command', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ command:'patrol', routeId }) });
      addToast(`已向无人机平台下发巡检任务: ${routeName}`);
    } catch { addToast('任务下发失败，请检查无人机平台连接', 'error'); }
    finally { setDispatching(null); }
  };

  const statusColor = (s: string) => s === 'patrol' ? 'text-green-600' : s === 'idle' ? 'text-blue-600' : s === 'charging' ? 'text-amber-500' : 'text-slate-400';
  const statusLabel = (s: string) => s === 'patrol' ? '巡逻中' : s === 'idle' ? '待命' : s === 'charging' ? '充电中' : '维护';
  const batteryColor = (v: number) => v > 50 ? 'text-green-600' : v > 20 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="space-y-6">
      {toasts.length > 0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t => (<div key={t.id} className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white ${t.type === 'error' ? 'bg-red-500' : t.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div>
        <h2 className="text-xl font-bold text-slate-800">无人机巡航</h2>
        <p className="text-sm text-slate-500 mt-1">对接省级无人机指挥平台 · 航线管理 · 任务调度 · 结果查看</p>
      </div>

      {/* Tab bar */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-1 w-fit">
        {[
          { key:'fleet' as const, label:'机队状态' },
          { key:'routes' as const, label:'航线 & 任务' },
          { key:'results' as const, label:'巡检结果' },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* === FLEET TAB === */}
      {activeTab === 'fleet' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {mockFleet.map(d => (
              <div key={d.id} className={`card border-l-4 ${d.status === 'patrol' ? 'border-l-green-500' : d.status === 'idle' ? 'border-l-blue-500' : d.status === 'charging' ? 'border-l-amber-400' : 'border-l-slate-300'}`}>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-slate-800">{d.name}</h4>
                    <p className="text-xs text-slate-400">{d.model}</p>
                  </div>
                  <StatusTag status={statusLabel(d.status)} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div><span className="text-slate-400 block">电量</span>
                    <span className={`font-bold ${batteryColor(d.battery)}`}>{d.battery}%</span></div>
                  <div><span className="text-slate-400 block">累计飞行</span><span className="font-medium">{d.totalHours}h</span></div>
                  <div className="col-span-2"><span className="text-slate-400 block">位置</span><span className="font-medium">{d.location}</span></div>
                  {d.currentTask && (
                    <div className="col-span-2"><span className="text-slate-400 block">当前任务</span><span className="font-medium text-blue-600">{d.currentTask}</span></div>
                  )}
                  <div className="col-span-2"><span className="text-slate-400 block">上次巡逻</span><span>{d.lastPatrol}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === ROUTES TAB === */}
      {activeTab === 'routes' && (
        <div className="space-y-4">
          {mockRoutes.map(r => (
            <div key={r.id} className="card flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <h4 className="font-semibold text-slate-800">{r.name}</h4>
                  <StatusTag status={r.status === 'active' ? '生效中' : '待命'} />
                </div>
                <p className="text-sm text-slate-500 mb-2">{r.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><IconClock className="w-3.5 h-3.5" /> {r.duration}</span>
                  <span className="flex items-center gap-1"><IconList className="w-3.5 h-3.5" /> {r.frequency}</span>
                  <span>上次执行: {r.lastRun}</span>
                </div>
              </div>
              <button
                onClick={() => handleDispatch(r.id, r.name)}
                disabled={dispatching === r.id}
                className={`ml-4 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex-shrink-0 ${
                  r.status === 'active'
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                } disabled:opacity-50`}>
                {dispatching === r.id ? '下发中...' : '下发巡检任务'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* === RESULTS TAB === */}
      {activeTab === 'results' && (
        <div className="card p-0 overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h4 className="font-semibold text-slate-700">巡检结果记录</h4>
            <span className="text-xs text-slate-400">{mockResults.length} 条记录</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs text-slate-500">
                  <th className="py-3 px-4">巡检路线</th>
                  <th className="py-3 px-4">执行无人机</th>
                  <th className="py-3 px-4">时间</th>
                  <th className="py-3 px-4">耗时</th>
                  <th className="py-3 px-4 text-center">船舶数</th>
                  <th className="py-3 px-4 text-center">预警</th>
                  <th className="py-3 px-4 text-center">图片</th>
                  <th className="py-3 px-4">状态</th>
                  <th className="py-3 px-4">操作</th>
                </tr>
              </thead>
              <tbody>
                {mockResults.map(r => (
                  <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-700">{r.routeName}</td>
                    <td className="py-3 px-4 text-slate-500">{r.droneId}</td>
                    <td className="py-3 px-4 text-xs text-slate-500">
                      <div>{r.startTime.slice(5)}</div>
                      {r.endTime && <div className="text-slate-400">至 {r.endTime.slice(5)}</div>}
                    </td>
                    <td className="py-3 px-4 text-slate-500">{r.duration}</td>
                    <td className="py-3 px-4 text-center">{r.shipsDetected}</td>
                    <td className="py-3 px-4 text-center">
                      {r.alertsFound > 0 ? <span className="text-red-500 font-medium">{r.alertsFound}</span> : <span className="text-slate-400">0</span>}
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">{r.images}</td>
                    <td className="py-3 px-4">
                      <StatusTag status={r.status === 'completed' ? '已完成' : r.status === 'in-progress' ? '生效中' : '已驳回'} />
                    </td>
                    <td className="py-3 px-4">
                      <button onClick={() => addToast('正在从无人机平台获取巡检详情...')}
                        className="px-3 py-1 bg-blue-50 text-blue-600 text-xs rounded hover:bg-blue-100">查看详情</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
