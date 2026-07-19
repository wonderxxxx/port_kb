import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapView } from '../components/MapView';
import { DataCard } from '../components/DataCard';
import { WarningPanel } from '../components/WarningPanel';
import { StatusBadge } from '../components/StatusBadge';
import { usePolling } from '../hooks/usePolling';
import type { ShipPosition, Warning, HydrologicalData, WeatherCurrent, Berth, TrafficFlow, HydrologicalStation } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { IconWater, IconWind, IconRain, IconShip, IconBell, IconWarning, IconEye, IconDocument, IconChart, IconAnchor } from '../components/Icons';

interface DashboardSummary {
  waterLevel: number; velocity: number; flow: number; rainfall: number; windSpeed: number;
  shipCount: number; activeShips: number; atAnchor: number;
  warningCount: number; detectionCount: number;
  weatherWarning: { type: string; level: string; publishTime: string; content: string } | null;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [ships, setShips] = useState<ShipPosition[]>([]);
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [hydrology, setHydrology] = useState<HydrologicalData[]>([]);
  const [weather, setWeather] = useState<WeatherCurrent | null>(null);
  const [trafficFlow, setTrafficFlow] = useState<TrafficFlow | null>(null);
  const [berths, setBerths] = useState<Berth[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [toasts, setToasts] = useState<{ id: number; message: string; type: string }[]>([]);
  const [shipSortKey, setShipSortKey] = useState<string>('name');
  const [shipSortDir, setShipSortDir] = useState<boolean>(true);

  const addToast = (message: string, type = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  const fetchAll = useCallback(async () => {
    try {
      setError(null);
      const [shipRes, hydroRes, weatherRes, trafficRes, sumRes] = await Promise.all([
        fetch('/api/south/ais/ship').then(r => r.json()),
        fetch('/api/south/hydrology/level').then(r => r.json()),
        fetch('/api/south/weather/current').then(r => r.json()),
        fetch('/api/south/traffic/flow').then(r => r.json()),
        fetch('/api/ops/dashboard/summary').then(r => r.json()),
      ]);
      setShips(shipRes.data as ShipPosition[]);
      setHydrology((hydroRes.data as HydrologicalData[]) || []);
      setWeather(weatherRes.data as WeatherCurrent);
      setTrafficFlow(trafficRes.data as TrafficFlow);
      if (sumRes.data) setSummary(sumRes.data);
      setLastUpdated(new Date());
    } catch (e) {
      setError('数据加载失败，请检查后端服务是否启动');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
    // Load additional static data
    fetch('/api/north/report-history').then(r => r.json()).then(d => {
      if (d.data?.warnings) setWarnings(d.data.warnings);
    });
    fetch('/api/ops/berths').then(r => r.json()).then(d => {
      if (d.data) setBerths(d.data);
    });
  }, []);

  usePolling(fetchAll, 15000);

  const currentLevel = summary?.waterLevel || hydrology[0]?.level || 0;
  const currentVelocity = summary?.velocity || hydrology[0]?.velocity || 0;
  const activeShips = summary?.activeShips ?? ships.filter(s => s.status === '航行中').length;
  const atAnchor = summary?.atAnchor ?? ships.filter(s => s.status === '锚泊').length;
  const warningCount = summary?.warningCount ?? warnings.filter(w => w.status === '待审核').length;

  const stations: HydrologicalStation[] = [
    { id: 'H001', name: '兰溪水文站', river: '衢江', lat: 29.2055, lng: 119.4755, warningLevel: 31.0, dangerLevel: 33.5 },
    { id: 'H002', name: '衢江阶梯枢纽', river: '衢江', lat: 29.1910, lng: 119.5010, warningLevel: 28.0, dangerLevel: 30.0 },
    { id: 'H003', name: '龙游水文站', river: '衢江', lat: 29.2180, lng: 119.4640, warningLevel: 30.5, dangerLevel: 32.8 },
  ];

  // Sort ships
  const sortedShips = [...ships].sort((a, b) => {
    const getVal = (s: ShipPosition, key: string) => {
      if (key === 'name') return s.shipName;
      if (key === 'speed') return s.speed;
      if (key === 'status') return s.status;
      return '';
    };
    const va = getVal(a, shipSortKey), vb = getVal(b, shipSortKey);
    return (va < vb ? -1 : va > vb ? 1 : 0) * (shipSortDir ? 1 : -1);
  });

  const handleSort = (key: string) => {
    if (shipSortKey === key) setShipSortDir(!shipSortDir);
    else { setShipSortKey(key); setShipSortDir(true); }
  };

  const hourlyData = trafficFlow?.hourly || [
    { hour: '06:00', count: 8 }, { hour: '07:00', count: 15 }, { hour: '08:00', count: 22 }, { hour: '09:00', count: 18 }, { hour: '10:00', count: 12 },
  ];

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {Array.from({length: 6}).map((_,i) => <div key={i} className="card h-24 bg-slate-100" />)}
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 card h-[480px] bg-slate-100" />
          <div className="card h-[480px] bg-slate-100" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toast container */}
      {toasts.length > 0 && (
        <div className="fixed top-4 right-4 z-50 space-y-2">
          {toasts.map(t => (
            <div key={t.id} className={`px-4 py-2 rounded-lg shadow-lg text-sm text-white ${t.type === 'error' ? 'bg-red-500' : t.type === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'}`}>
              {t.message}
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
          <IconWarning className="w-4 h-4" /> {error}
          <button onClick={fetchAll} className="ml-auto px-3 py-1 bg-red-100 rounded text-xs hover:bg-red-200">重试</button>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">系统总览</h2>
          <p className="text-sm text-slate-500 mt-1">衢江流域（兰溪—龙游段）实时态势感知</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">更新于 {lastUpdated.toLocaleTimeString('zh-CN')}</span>
          <button onClick={fetchAll} className="px-3 py-1.5 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors">刷新</button>
          {weather?.warning && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border ${
              weather.warning.level === '红色' ? 'bg-red-50 border-red-200' : weather.warning.level === '橙色' ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'
            }`}>
              <StatusBadge level={weather.warning.level === '红色' ? 'red' : weather.warning.level === '橙色' ? 'orange' : 'yellow'} />
              <span className="text-xs font-medium">{weather.warning.type}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        <DataCard title="兰溪水位" value={currentLevel.toFixed(2)} unit="m" color={currentLevel > 30 ? 'text-red-500' : 'text-blue-600'} trend={currentLevel > 28 ? 'up' : 'steady'}
          icon={<IconWater className="w-5 h-5" />} subtitle="警戒: 31.00m" />
        <DataCard title="当前流速" value={currentVelocity.toFixed(1)} unit="m/s" color={currentVelocity > 2.5 ? 'text-orange-500' : 'text-cyan-600'} trend={currentVelocity > 2.5 ? 'up' : 'steady'}
          icon={<IconWind className="w-5 h-5" />} />
        <DataCard title="降雨量(24h)" value={weather?.rainfall.value.toFixed(1) || summary?.rainfall.toFixed(1) || '--'} unit="mm" color={(weather?.rainfall.value || summary?.rainfall || 0) > 30 ? 'text-orange-500' : 'text-indigo-600'}
          icon={<IconRain className="w-5 h-5" />} subtitle={weather?.rainfall.level} />
        <DataCard title="风速" value={(weather?.wind.speed || summary?.windSpeed || '--').toString()} unit="m/s" color="text-teal-600"
          icon={<IconWind className="w-5 h-5" />} subtitle={weather?.wind.level} />
        <DataCard title="在航船舶" value={activeShips} unit="艘" color="text-green-600"
          icon={<IconShip className="w-5 h-5" />} />
        <DataCard title="待处理预警" value={warningCount} unit="条" color={warningCount > 0 ? 'text-red-500' : 'text-slate-600'}
          icon={<IconBell className="w-5 h-5" />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <MapView ships={ships} berths={berths} stations={stations} height="480px" />
        </div>
        <div>
          <WarningPanel warnings={warnings.slice(0, 8)} onReview={(id, status) => {
            fetch(`/api/ops/detection/${id}/review`, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({status}) })
              .then(() => { addToast(status === '已推送' ? '预警已推送' : '已驳回'); fetchAll(); })
              .catch(() => addToast('操作失败', 'error'));
          }} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h4 className="card-title">今日航道通行量</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="通行艘次" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h4 className="card-title">兰溪水文站水位趋势</h4>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={[
              { time: '06:00', level: 28.2 }, { time: '07:00', level: 28.35 }, { time: '08:00', level: 28.5 },
              { time: '09:00', level: 28.6 }, { time: '10:00', level: 28.65 },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="time" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={['dataMin - 0.5', 'dataMax + 0.5']} />
              <Tooltip />
              <Area type="monotone" dataKey="level" stroke="#3b82f6" fill="#3b82f620" name="水位(m)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <h4 className="card-title">船舶类型分布</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={[
              { type: '货船', count: ships.filter(s => s.shipType?.includes('货')).length },
              { type: '集装箱', count: ships.filter(s => s.shipType?.includes('集装箱')).length },
              { type: '工程船', count: ships.filter(s => s.shipType?.includes('工程')).length },
              { type: '油/危化', count: ships.filter(s => s.shipType?.includes('油') || s.shipType?.includes('危化')).length },
              { type: '客/渡', count: ships.filter(s => s.shipType?.includes('客') || s.shipType?.includes('渡')).length },
            ]} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} width={60} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} name="数量" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h4 className="card-title">船舶状态一览</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                  <th className="py-2 px-2 cursor-pointer hover:text-slate-700" onClick={() => handleSort('name')}>船名 {shipSortKey === 'name' ? (shipSortDir ? '↑' : '↓') : ''}</th>
                  <th className="py-2 px-2">类型</th>
                  <th className="py-2 px-2 cursor-pointer hover:text-slate-700 text-right" onClick={() => handleSort('speed')}>航速 {shipSortKey === 'speed' ? (shipSortDir ? '↑' : '↓') : ''}</th>
                  <th className="py-2 px-2 cursor-pointer hover:text-slate-700" onClick={() => handleSort('status')}>状态 {shipSortKey === 'status' ? (shipSortDir ? '↑' : '↓') : ''}</th>
                  <th className="py-2 px-2 text-right">更新时间</th>
                </tr>
              </thead>
              <tbody>
                {sortedShips.slice(0, 10).map(pos => (
                  <tr key={pos.shipId} className="border-b border-slate-50 hover:bg-slate-50 text-xs">
                    <td className="py-2 px-2 font-medium text-slate-700">{pos.shipName}</td>
                    <td className="py-2 px-2 text-slate-400">{pos.shipType}</td>
                    <td className="py-2 px-2 text-right">{pos.speed.toFixed(1)} kn</td>
                    <td className="py-2 px-2"><span className={`inline-flex px-1.5 py-0.5 rounded text-xs ${pos.status === '航行中' ? 'bg-green-100 text-green-700' : pos.status === '锚泊' ? 'bg-slate-100 text-slate-600' : 'bg-sky-100 text-sky-700'}`}>{pos.status}</span></td>
                    <td className="py-2 px-2 text-right text-slate-400">{new Date(pos.updateTime).toLocaleTimeString('zh-CN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <h4 className="card-title">快速操作</h4>
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => navigate('/early-warning')} className="flex flex-col items-center justify-center p-4 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors text-center">
              <IconWarning className="w-7 h-7 text-blue-600 mb-2" />
              <span className="text-sm font-medium text-blue-700">查看预警管控</span>
              <span className="text-xs text-blue-500 mt-1">{warningCount} 条待处理</span>
            </button>
            <button onClick={() => navigate('/ship-scheduling')} className="flex flex-col items-center justify-center p-4 rounded-lg bg-green-50 hover:bg-green-100 transition-colors text-center">
              <IconDocument className="w-7 h-7 text-green-600 mb-2" />
              <span className="text-sm font-medium text-green-700">船舶调度管理</span>
              <span className="text-xs text-green-500 mt-1">今日 32/40 艘</span>
            </button>
            <button onClick={() => navigate('/illegal-behavior')} className="flex flex-col items-center justify-center p-4 rounded-lg bg-orange-50 hover:bg-orange-100 transition-colors text-center">
              <IconEye className="w-7 h-7 text-orange-600 mb-2" />
              <span className="text-sm font-medium text-orange-700">违法行为识别</span>
              <span className="text-xs text-orange-500 mt-1">{summary?.detectionCount || 3} 条待审核</span>
            </button>
            <button onClick={() => navigate('/early-warning/power-velocity')} className="flex flex-col items-center justify-center p-4 rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors text-center">
              <IconWarning className="w-7 h-7 text-purple-600 mb-2" />
              <span className="text-sm font-medium text-purple-700">动力流速分析</span>
              <span className="text-xs text-purple-500 mt-1">船舶风险评估</span>
            </button>
          </div>

          <div className="mt-4 p-4 bg-slate-50 rounded-lg">
            <h5 className="text-sm font-semibold text-slate-700 mb-2">系统状态</h5>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between"><span className="text-slate-500">数据接口</span><span className="text-green-600">正常</span></div>
              <div className="flex justify-between"><span className="text-slate-500">AIS 数据源</span><span className="text-green-600">在线 ({ships.length}艘)</span></div>
              <div className="flex justify-between"><span className="text-slate-500">视频平台</span><span className="text-green-600">在线 (5/6)</span></div>
              <div className="flex justify-between"><span className="text-slate-500">预警引擎</span><span className="text-amber-500">{warningCount > 0 ? '有预警' : '正常'}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">WebSocket</span><span className="text-green-600">已连接</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
