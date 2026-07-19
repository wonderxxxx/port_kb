const BASE = '/api';

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ---- Hydrology ----
export const getWaterLevels = () => fetchJSON<{ code: number; data: unknown[] }>('/south/hydrology/level');
export const getFloodForecast = () => fetchJSON<{ code: number; data: unknown }>('/south/hydrology/flood-forecast');
export const getFloodRelease = () => fetchJSON<{ code: number; data: unknown }>('/south/hydrology/flood-release');
export const getReservoir = () => fetchJSON<{ code: number; data: unknown }>('/south/hydrology/reservoir');

// ---- Weather ----
export const getWeatherCurrent = () => fetchJSON<{ code: number; data: unknown }>('/south/weather/current');
export const getWeatherForecast = () => fetchJSON<{ code: number; data: unknown }>('/south/weather/forecast');

// ---- Maritime / AIS ----
export const getShipPositions = () => fetchJSON<{ code: number; data: unknown[] }>('/south/ais/ship');
export const getShipInfo = () => fetchJSON<{ code: number; data: unknown[] }>('/south/ais/info');

// ---- Video ----
export const getCameras = () => fetchJSON<{ code: number; data: unknown }>('/south/video/stream');
export const controlPTZ = (params: { cameraId: string; pan?: number; tilt?: number; zoom?: number }) =>
  fetchJSON('/south/video/ptz', { method: 'POST', body: JSON.stringify(params) });

// ---- Lock ----
export const getLockStatus = () => fetchJSON<{ code: number; data: unknown }>('/south/lock/status');
export const getLockPlan = () => fetchJSON<{ code: number; data: unknown }>('/south/lock/plan');

// ---- Traffic ----
export const getTrafficFlow = () => fetchJSON<{ code: number; data: unknown }>('/south/traffic/flow');
export const getTrafficControl = () => fetchJSON<{ code: number; data: unknown }>('/south/traffic/control');

// ---- Berths ----
export const getBerths = async () => {
  // Load berths from a dedicated endpoint (not a real southbound API; served via server)
  const res = await fetch('/api/south/hydrology/stations');
  return res.json();
};

// ---- AI Detections ----
export const loadAIDetections = async () => {
  const res = await fetch('/api/north/report-history');
  const d = await res.json();
  return { detections: d.data.warnings, stats: { total: 0, pending: 0, confirmed: 0, rejected: 0, byType: [], trend: [] } };
};

// ---- Northbound reports ----
export const submitReport = (type: string, data: unknown) =>
  fetchJSON(`/north/${type}/report`, { method: 'POST', body: JSON.stringify(data) });
