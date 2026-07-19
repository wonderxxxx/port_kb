import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { StatusTag } from '../components/StatusBadge';
import { IconShip } from '../components/Icons';

interface Berth {
  id: string; name: string; category: string; district: string;
  lat: number; lng: number; totalSlots: number; occupiedSlots: number;
  riskLevel: string; suitableTonnageMin: number; suitableTonnageMax: number;
}

const CATEGORIES = ['锚地', '服务区', '码头', '等待区', '应急点'];
const DISTRICTS = ['龙游', '衢江', '兰溪', '金华'];

const initialBerths: Berth[] = [
  { id:'B001', name:'龙游港区锚地', category:'锚地', district:'龙游', lat:29.217, lng:119.465, totalSlots:15, occupiedSlots:10, riskLevel:'medium', suitableTonnageMin:1000, suitableTonnageMax:5000 },
  { id:'B002', name:'衢江服务区', category:'服务区', district:'衢江', lat:29.1945, lng:119.496, totalSlots:20, occupiedSlots:14, riskLevel:'medium', suitableTonnageMin:500, suitableTonnageMax:3000 },
  { id:'B003', name:'兰溪执法码头', category:'码头', district:'兰溪', lat:29.205, lng:119.476, totalSlots:8, occupiedSlots:5, riskLevel:'low', suitableTonnageMin:500, suitableTonnageMax:2000 },
  { id:'B004', name:'姚家船闸等待区', category:'等待区', district:'兰溪', lat:29.1995, lng:119.486, totalSlots:10, occupiedSlots:3, riskLevel:'low', suitableTonnageMin:1000, suitableTonnageMax:4000 },
  { id:'B005', name:'龙游应急停泊点', category:'应急点', district:'龙游', lat:29.2145, lng:119.4685, totalSlots:5, occupiedSlots:2, riskLevel:'high', suitableTonnageMin:500, suitableTonnageMax:3000 },
  { id:'B006', name:'桥区下游锚地', category:'锚地', district:'衢江', lat:29.1915, lng:119.500, totalSlots:12, occupiedSlots:8, riskLevel:'medium', suitableTonnageMin:1000, suitableTonnageMax:5000 },
];

const emptyBerth = (): Partial<Berth> => ({
  name:'', category:'锚地', district:'龙游', lat:29.208, lng:119.480, totalSlots:10,
  occupiedSlots:0, riskLevel:'low', suitableTonnageMin:500, suitableTonnageMax:3000,
});

function berthMarkerIcon(riskLevel: string) {
  const colors: Record<string,string> = { low:'#22c55e', medium:'#f59e0b', high:'#ef4444' };
  return L.divIcon({
    className: '',
    html: `<div style="width:22px;height:22px;border-radius:4px;background:${colors[riskLevel]||'#64748b'};border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;color:white;font-size:11px;font-weight:bold;">⚓</div>`,
    iconSize: [26,26], iconAnchor: [13,13],
  });
}

function MapClickHandler({ enabled, onClick }: { enabled:boolean; onClick:(e:{latlng:{lat:number;lng:number}})=>void }) {
  useMapEvents({ click: enabled ? onClick : undefined });
  return null;
}

function MapBounds({ berths }: { berths: Berth[] }) {
  const map = useMap();
  useEffect(() => {
    if (berths.length>0) {
      const bounds = L.latLngBounds(berths.map(b=>[b.lat,b.lng]));
      if (bounds.isValid()) map.fitBounds(bounds, { padding:[50,50], maxZoom:15 });
    }
  }, [map, berths]);
  return null;
}

export default function BerthManage() {
  const [berths, setBerths] = useState<Berth[]>(initialBerths);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Partial<Berth>|null>(null);
  const [mapPickMode, setMapPickMode] = useState(false);
  const [search, setSearch] = useState('');
  const [toasts, setToasts] = useState<{id:number;message:string;type:string}[]>([]);
  const addToast = (m:string,t='success')=>{const id=Date.now();setToasts(p=>[...p,{id,message:m,type:t}]);setTimeout(()=>setToasts(p=>p.filter(x=>x.id!==id)),3000)};

  const filtered = berths.filter(b=>!search||b.name.includes(search)||b.district.includes(search)||b.category.includes(search));

  const totalSlots = berths.reduce((s,b)=>s+b.totalSlots,0);
  const totalOccupied = berths.reduce((s,b)=>s+b.occupiedSlots,0);

  const handleSave = () => {
    if (!editing?.name?.trim()) { addToast('请输入泊位名称','warning'); return; }
    if (editing.id) {
      setBerths(p=>p.map(b=>b.id===editing.id?{...b,...editing} as Berth:b));
      addToast('泊位已更新');
    } else {
      const b: Berth = {
        ...editing as Berth,
        id: `B${Date.now()}`, occupiedSlots:0,
        riskLevel: (editing.occupiedSlots||0)/(editing.totalSlots||1)>0.8?'high':(editing.occupiedSlots||0)/(editing.totalSlots||1)>0.6?'medium':'low',
      };
      setBerths(p=>[...p,b]);
      addToast('泊位已添加');
    }
    setShowForm(false); setEditing(null);
  };

  const handleDelete = (id:string) => {
    if (!confirm('确认删除此泊位？')) return;
    setBerths(p=>p.filter(b=>b.id!==id));
    addToast('已删除');
  };

  const handleMapClick = (e: { latlng: { lat: number; lng: number } }) => {
    if (!mapPickMode||!editing) return;
    setEditing({...editing, lat: Number(e.latlng.lat.toFixed(4)), lng: Number(e.latlng.lng.toFixed(4))});
    setMapPickMode(false);
    setShowForm(true);
    addToast('坐标已选取');
  };

  return (
    <div className="space-y-4 h-[calc(100vh-80px)] flex flex-col">
      {toasts.length>0 && <div className="fixed top-4 right-4 z-50 space-y-2">{toasts.map(t=>(<div key={t.id} className={`px-3 py-1.5 rounded-lg shadow text-xs text-white ${t.type==='error'?'bg-red-500':t.type==='warning'?'bg-amber-500':'bg-emerald-500'}`}>{t.message}</div>))}</div>}

      <div className="flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-xl font-bold text-slate-800">泊位管理</h2>
          <p className="text-sm text-slate-500 mt-1">锚地/服务区/码头 · 地图标点 · CRUD</p>
        </div>
        <div className="flex items-center gap-2">
          <input value={search} onChange={e=>setSearch(e.target.value)}
            placeholder="搜索名称/区域/类别..." className="px-3 py-2 border border-slate-200 rounded-lg text-sm w-48"/>
          <button onClick={()=>{setEditing(emptyBerth());setShowForm(true)}}
            className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 font-medium flex-shrink-0">
            + 新增泊位
          </button>
        </div>
      </div>

      {/* Map + List — fills remaining height */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 min-h-0">
        {/* Map */}
        <div className="lg:col-span-2 card p-0 overflow-hidden flex flex-col">
          <div className="px-4 py-2 border-b flex items-center justify-between flex-shrink-0">
            <span className="font-semibold text-sm">泊位分布图</span>
            <span className="text-xs text-slate-400">{berths.length} 个泊位 · 共 {totalSlots} 个 · 已用 {totalOccupied}</span>
            {mapPickMode && <span className="text-xs text-blue-500 animate-pulse ml-2">点击地图选取坐标...</span>}
          </div>
          <div className="flex-1 min-h-0">
            <MapContainer center={[29.208,119.480]} zoom={13} style={{height:'100%',width:'100%'}} scrollWheelZoom={true}>
              <MapClickHandler enabled={mapPickMode} onClick={handleMapClick} />
              <LayersControl position="topright">
                <LayersControl.BaseLayer checked name="标准地图">
                  <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"/>
                </LayersControl.BaseLayer>
                <LayersControl.BaseLayer name="卫星影像">
                  <TileLayer attribution='&copy; Esri' url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"/>
                </LayersControl.BaseLayer>
              </LayersControl>
              {berths.map(b=>(
                <Marker key={b.id} position={[b.lat,b.lng]} icon={berthMarkerIcon(b.riskLevel)}>
                  <Popup>
                    <div className="text-sm min-w-[180px]">
                      <p className="font-bold">{b.name}</p>
                      <p className="text-xs text-slate-500">{b.category} · {b.district}</p>
                      <div className="mt-2 text-xs space-y-0.5">
                        <div className="flex justify-between"><span>坐标</span><span className="font-mono">{b.lat}, {b.lng}</span></div>
                        <div className="flex justify-between"><span>泊位</span><span>{b.occupiedSlots}/{b.totalSlots}</span></div>
                        <div className="flex justify-between"><span>适合吨位</span><span>{b.suitableTonnageMin}-{b.suitableTonnageMax} 吨</span></div>
                        <div className="flex justify-between"><span>风险</span><StatusTag status={b.riskLevel==='low'?'在线':b.riskLevel==='medium'?'待审核':'已驳回'}/></div>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
              {mapPickMode && <MapBounds berths={berths}/>}
            </MapContainer>
          </div>
        </div>

        {/* List */}
        <div className="space-y-2 overflow-y-auto h-full">
          {filtered.map(b=>(
            <div key={b.id} className={`card border-l-4 ${
              b.riskLevel==='high'?'border-l-red-500':b.riskLevel==='medium'?'border-l-amber-400':'border-l-green-500'
            }`}>
              <div className="flex items-start justify-between mb-1">
                <div>
                  <h4 className="font-semibold text-sm">{b.name}</h4>
                  <p className="text-xs text-slate-400">{b.category} · {b.district}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <div className="flex-1 h-1.5 bg-slate-200 rounded-full">
                  <div className={`h-1.5 rounded-full ${b.occupiedSlots/b.totalSlots>0.8?'bg-red-500':b.occupiedSlots/b.totalSlots>0.6?'bg-amber-500':'bg-green-500'}`}
                    style={{width:`${(b.occupiedSlots/b.totalSlots)*100}%`}}/>
                </div>
                <span className="text-xs font-bold">{b.occupiedSlots}/{b.totalSlots}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-slate-400 mb-2">
                <span>{b.suitableTonnageMin}-{b.suitableTonnageMax}吨</span>
                <span className="font-mono">{b.lat},{b.lng}</span>
              </div>
              <div className="flex gap-1">
                <button onClick={()=>{setEditing({...b});setShowForm(true)}}
                  className="flex-1 px-2 py-1 text-xs text-blue-600 bg-blue-50 rounded hover:bg-blue-100">编辑</button>
                <button onClick={()=>handleDelete(b.id)}
                  className="px-2 py-1 text-xs text-red-500 bg-red-50 rounded hover:bg-red-100">删除</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit dialog */}
      {showForm && editing && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl shadow-2xl w-[580px] max-w-[95vw] max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
              <h3 className="text-lg font-bold">{editing.id?'编辑泊位':'新增泊位'}</h3>
              <button onClick={()=>{setShowForm(false);setEditing(null);setMapPickMode(false)}} className="text-slate-400 hover:text-slate-600 text-xl">&times;</button>
            </div>

            <div className="p-6 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-slate-500 block mb-0.5">名称 *</label>
                  <input value={editing.name||''} onChange={e=>setEditing({...editing,name:e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm" placeholder="如：龙游港区锚地"/>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-0.5">类别</label>
                  <select value={editing.category||'锚地'} onChange={e=>setEditing({...editing,category:e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {CATEGORIES.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-0.5">所属区</label>
                  <select value={editing.district||'龙游'} onChange={e=>setEditing({...editing,district:e.target.value})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm">
                    {DISTRICTS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-0.5">总泊位数</label>
                  <input type="number" value={editing.totalSlots||''} onChange={e=>setEditing({...editing,totalSlots:Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-0.5">适合吨位-最小</label>
                  <input type="number" value={editing.suitableTonnageMin||''} onChange={e=>setEditing({...editing,suitableTonnageMin:Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
                </div>
                <div>
                  <label className="text-xs text-slate-500 block mb-0.5">适合吨位-最大</label>
                  <input type="number" value={editing.suitableTonnageMax||''} onChange={e=>setEditing({...editing,suitableTonnageMax:Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"/>
                </div>
              </div>

              {/* Coordinate picker */}
              <div className="bg-slate-50 rounded-lg p-3">
                <label className="text-xs text-slate-500 block mb-2">坐标（可在地图上点击选取）</label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <span className="text-[10px] text-slate-400">纬度</span>
                    <input type="number" step="0.0001" value={editing.lat||''} onChange={e=>setEditing({...editing,lat:Number(e.target.value)})}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm font-mono"/>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400">经度</span>
                    <input type="number" step="0.0001" value={editing.lng||''} onChange={e=>setEditing({...editing,lng:Number(e.target.value)})}
                      className="w-full px-2 py-1.5 border border-slate-200 rounded text-sm font-mono"/>
                  </div>
                </div>
                <button onClick={()=>{setMapPickMode(!mapPickMode);setShowForm(false)}}
                  className={`w-full py-2 text-sm rounded-lg border transition-colors ${mapPickMode?'bg-blue-50 border-blue-300 text-blue-600':'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  {mapPickMode?'正在地图上选点（点击地图拾取坐标）':'在地图上点击选取坐标'}
                </button>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t px-6 py-4 flex justify-between">
              <button onClick={()=>handleDelete(editing.id||'')}
                className={`px-4 py-2 text-sm rounded-lg ${editing.id?'text-red-500 hover:bg-red-50':'invisible'}`}>
                删除泊位
              </button>
              <div className="flex gap-2">
                <button onClick={()=>{setShowForm(false);setEditing(null);setMapPickMode(false)}}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-sm">取消</button>
                <button onClick={handleSave}
                  className="px-6 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 font-medium">保存</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
