import { useEffect, useMemo, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { ShipPosition, Berth, HydrologicalStation } from '../types';
import { StatusTag } from './StatusBadge';

// Ship icon factory — using colored circle + direction indicator
function shipIcon(heading: number, status: string) {
  const color = status === '航行中' ? '#22c55e' : status === '锚泊' ? '#64748b' : status === '作业中' ? '#f59e0b' : '#3b82f6';
  const size = status === '航行中' ? 28 : 22;
  return L.divIcon({
    className: 'ship-marker',
    html: `<div style="
      width:${size}px;height:${size}px;
      border-radius:50%;
      background:${color};
      border:2px solid white;
      box-shadow:0 2px 6px rgba(0,0,0,0.3);
      display:flex;align-items:center;justify-content:center;
      color:white;font-size:${size > 24 ? '14px' : '11px'};font-weight:bold;
      transform:rotate(${heading}deg);
    ">▲</div>`,
    iconSize: [size + 4, size + 4],
    iconAnchor: [size / 2 + 2, size / 2 + 2],
  });
}

// Berth icon
function berthIcon(riskLevel: string) {
  const colors: Record<string, string> = { low: '#22c55e', medium: '#f59e0b', high: '#ef4444' };
  return L.divIcon({
    className: 'berth-marker',
    html: `<div style="width:20px;height:20px;border-radius:4px;background:${colors[riskLevel] || '#64748b'};border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });
}

function stationIcon() {
  return L.divIcon({
    className: 'station-marker',
    html: `<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:2px solid white;box-shadow:0 1px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  });
}

// Auto-fit map bounds
function MapBounds({ positions }: { positions: ShipPosition[] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions.map(p => [p.lat, p.lng]));
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [30, 30], maxZoom: 14 });
    }
  }, [map, positions]);
  return null;
}

interface MapViewProps {
  ships: ShipPosition[];
  berths?: Berth[];
  stations?: HydrologicalStation[];
  onShipClick?: (ship: ShipPosition) => void;
  selectedShipId?: string;
  height?: string;
}

export function MapView({ ships, berths = [], stations = [], onShipClick, selectedShipId, height = '500px' }: MapViewProps) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selectedShip, setSelectedShip] = useState<ShipPosition | null>(null);

  const filteredShips = useMemo(() =>
    filterStatus === 'all' ? ships : ships.filter(s => s.status === filterStatus),
    [ships, filterStatus]
  );

  const center: [number, number] = [29.208, 119.480];

  const handleShipClick = (ship: ShipPosition) => {
    setSelectedShip(ship);
    onShipClick?.(ship);
  };

  // Ship detail panel for selected ship
  const selectedShipData = selectedShip
    ? ships.find(s => s.shipId === selectedShip.shipId) || selectedShip
    : null;

  return (
    <div className="card p-0 overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-slate-100 bg-white">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-slate-700">辖区航道图</span>
          <span className="text-xs text-slate-400">船舶 {ships.length} 艘</span>
          <span className="text-xs text-slate-400">|</span>
          <div className="flex items-center gap-1">
            {['all', '航行中', '锚泊', '作业中'].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${filterStatus === s ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                {s === 'all' ? '全部' : s}
              </button>
            ))}
          </div>
        </div>
        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> 航行</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-slate-400" /> 锚泊</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> 作业</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded bg-blue-500" /> 水文站</span>
        </div>
      </div>

      <div className="flex" style={{ height }}>
        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer
            center={center}
            zoom={13}
            style={{ height: '100%', width: '100%' }}
            scrollWheelZoom={true}
            zoomControl={true}
          >
            <LayersControl position="topright">
              {/* Standard layer — ESRI World Street Map (WGS-84, accessible in China) */}
              <LayersControl.BaseLayer checked name="标准地图">
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, DeLorme, NAVTEQ'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                />
              </LayersControl.BaseLayer>

              {/* Satellite layer — ESRI World Imagery (WGS-84, accessible in China) */}
              <LayersControl.BaseLayer name="卫星影像">
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a> &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                />
              </LayersControl.BaseLayer>

              {/* Alternative — Terrain with labels (Topo) */}
              <LayersControl.BaseLayer name="地形图">
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={18}
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            {/* River polyline — Qu River (衢江) Lanxi-Longyou section */}
            <Polyline
              positions={[
                [29.220, 119.462],
                [29.218, 119.464],
                [29.217, 119.465],
                [29.215, 119.467],
                [29.213, 119.469],
                [29.210, 119.471],
                [29.208, 119.473],
                [29.206, 119.475],
                [29.205, 119.476],
                [29.203, 119.479],
                [29.201, 119.482],
                [29.200, 119.484],
                [29.199, 119.486],
                [29.197, 119.489],
                [29.195, 119.493],
                [29.193, 119.497],
                [29.191, 119.501],
                [29.188, 119.504],
              ]}
              color="#3b82f6" weight={4} opacity={0.5}
            />

            {/* Berth markers */}
            {berths.map(b => (
              <Marker key={b.id} position={[b.lat, b.lng]} icon={berthIcon(b.riskLevel)}>
                <Popup>
                  <div className="text-sm min-w-[180px]">
                    <p className="font-semibold text-slate-800">{b.name}</p>
                    <p className="text-xs text-slate-500">{b.category} · {b.district}</p>
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span>泊位: {b.occupiedSlots}/{b.totalSlots}</span>
                      <span className="text-slate-400">{Math.round(b.occupiedSlots / b.totalSlots * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                      <div className={`h-1.5 rounded-full transition-all ${
                        b.occupiedSlots / b.totalSlots > 0.8 ? 'bg-red-500' :
                        b.occupiedSlots / b.totalSlots > 0.6 ? 'bg-amber-500' : 'bg-green-500'
                      }`} style={{ width: `${(b.occupiedSlots / b.totalSlots) * 100}%` }} />
                    </div>
                    <p className="text-xs text-slate-400 mt-2">
                      风险等级: <StatusTag status={b.riskLevel === 'low' ? '生效中' : b.riskLevel === 'medium' ? '已确认' : '已驳回'} />
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Station markers */}
            {stations.map(s => (
              <Marker key={s.id} position={[s.lat, s.lng]} icon={stationIcon()}>
                <Popup>
                  <div className="text-sm">
                    <p className="font-semibold">{s.name}</p>
                    <p className="text-xs text-slate-500">河流: {s.river}</p>
                    <p className="text-xs text-slate-500 mt-1">警戒水位: {s.warningLevel}m</p>
                    <p className="text-xs text-red-500">危险水位: {s.dangerLevel}m</p>
                  </div>
                </Popup>
              </Marker>
            ))}

            {/* Bridge area — Qu River Bridge */}
            <Circle center={[29.195, 119.493]} radius={500}
              pathOptions={{ color: '#f59e0b', fillColor: '#fbbf24', fillOpacity: 0.08, weight: 2 }}>
              <Popup>衢江大桥桥区水域（上下游500m禁追越区）</Popup>
            </Circle>
            {/* Hydrological monitoring area */}
            <Circle center={[29.2055, 119.4755]} radius={300}
              pathOptions={{ color: '#ef4444', fillColor: '#fca5a5', fillOpacity: 0.06, weight: 1.5 }}>
              <Popup>兰溪水文站监测区域</Popup>
            </Circle>

            {/* Ship markers */}
            {filteredShips.map(pos => (
              <Marker
                key={pos.shipId}
                position={[pos.lat, pos.lng]}
                icon={shipIcon(pos.heading, pos.status)}
                eventHandlers={{ click: () => handleShipClick(pos) }}
              >
                <Popup>
                  <div className="text-sm min-w-[170px]">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold">{pos.shipName}</p>
                      <StatusTag status={pos.status} />
                    </div>
                    <p className="text-xs text-slate-500">类型: {pos.shipType} | {pos.shipLength}m | {pos.shipTonnage}t</p>
                    <p className="text-xs text-slate-500">航速: {pos.speed.toFixed(1)}kn | 航向: {pos.heading.toFixed(0)}°</p>
                    {pos.destination && <p className="text-xs text-slate-500">目的地: {pos.destination}</p>}
                    {pos.eta && <p className="text-xs text-slate-500">ETA: {new Date(pos.eta).toLocaleString('zh-CN')}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}

            <MapBounds positions={filteredShips} />
          </MapContainer>
        </div>

        {/* Ship detail sidebar */}
        {selectedShipData && (
          <div className="w-64 border-l border-slate-200 bg-white overflow-y-auto flex-shrink-0">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-slate-700">船舶详情</h4>
              <button onClick={() => setSelectedShip(null)} className="text-slate-400 hover:text-slate-600 text-xs">&times;</button>
            </div>
            <div className="p-4 space-y-3 text-sm">
              <div>
                <p className="text-xs text-slate-400">船名</p>
                <p className="font-medium text-slate-800">{selectedShipData.shipName}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">MMSI / 类型</p>
                <p className="text-slate-700">{selectedShipData.shipType} | {selectedShipData.shipLength}m</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">位置</p>
                <p className="text-slate-700 font-mono text-xs">{selectedShipData.lat.toFixed(4)}, {selectedShipData.lng.toFixed(4)}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">航速 / 航向</p>
                <p className="text-slate-700">{selectedShipData.speed.toFixed(1)} kn | {selectedShipData.heading.toFixed(0)}°</p>
              </div>
              <div>
                <p className="text-xs text-slate-400">状态</p>
                <StatusTag status={selectedShipData.status} />
              </div>
              {selectedShipData.destination && (
                <div>
                  <p className="text-xs text-slate-400">目的地</p>
                  <p className="text-slate-700">{selectedShipData.destination}</p>
                </div>
              )}
              {selectedShipData.eta && (
                <div>
                  <p className="text-xs text-slate-400">预计到达</p>
                  <p className="text-slate-700">{new Date(selectedShipData.eta).toLocaleString('zh-CN')}</p>
                </div>
              )}
              <div className="pt-3 border-t border-slate-100">
                <button className="w-full px-3 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 transition-colors">发送消息</button>
                <button className="w-full px-3 py-2 bg-slate-100 text-slate-600 text-xs rounded-lg hover:bg-slate-200 transition-colors mt-1">查看轨迹</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
