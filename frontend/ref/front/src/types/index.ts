// ---- Ships & Positions ----
export interface ShipInfo {
  id: string; mmsi: string; name: string; type: string;
  power: number; tonnage: number; length: number; draft: number;
  owner: string; phone: string; dangerous: boolean;
}

export interface ShipPosition {
  shipId: string; shipName: string; shipType: string; shipLength: number; shipTonnage: number;
  lat: number; lng: number; heading: number; speed: number;
  status: string; destination: string | null; eta: string | null; updateTime: string;
}

// ---- Hydrology ----
export interface HydrologicalStation {
  id: string; name: string; river: string; lat: number; lng: number;
  warningLevel: number; dangerLevel: number;
}

export interface HydrologicalData {
  stationId: string; level: number; velocity: number; flow: number;
  time: string; trend: string;
}

export interface FloodForecast {
  station: string; currentFlow: number; forecastFlow: number;
  forecastTime: string; warningLevel: string;
}

// ---- Weather ----
export interface WeatherCurrent {
  rainfall: { region: string; value: number; unit: string; period: string; level: string; levelColor: string };
  forecast: { region: string; value: number; unit: string; period: string; level: string; levelColor: string };
  wind: { speed: number; gust: number; direction: string; level: string };
  warning: { type: string; level: string; publishTime: string; content: string };
  temperature: number; humidity: number; pressure: number;
}

export interface WeatherHourly {
  time: string; rainfall: number; wind: number; temperature: number;
}

// ---- Berths ----
export interface Berth {
  id: string; name: string; category: string; district: string;
  lat: number; lng: number; totalSlots: number; occupiedSlots: number;
  riskLevel: string; suitableTonnage: number[];
}

// ---- Warnings ----
export interface Warning {
  id: string; type: string; level: 'blue' | 'yellow' | 'orange' | 'red';
  title: string; content: string; source: string; time: string;
  status: string; pushedTo: string[];
}

// ---- AI Detections ----
export interface AIDetection {
  id: string; type: string; camera: string | null; time: string;
  confidence: number; description: string; thumbnail: string | null;
  status: string; shipId: string; reviewNote?: string;
}

export interface DetectionStats {
  total: number; pending: number; confirmed: number; rejected: number;
  byType: { type: string; count: number }[];
  trend: { date: string; count: number }[];
}

// ---- Ship Scheduling ----
export interface DistrictSchedule {
  district: string; requestedCount: number; approvedCount: number;
  shipIds: string[]; status: 'pending' | 'approved' | 'rejected';
}

export interface DailyDispatch {
  id: string; date: string; totalRequested: number; totalApproved: number;
  districts: DistrictSchedule[];
  lanxiAdditional: { shipId: string; shipName: string; reason: string }[];
  status: string;
}

// ---- Lock & Traffic ----
export interface LockStatus {
  id: string; name: string; status: string; direction: string | null;
  currentShip: string | null; queueLength: number; nextLockTime: string | null;
}

export interface TrafficFlow {
  currentFlow: { total: number; upbound: number; downbound: number };
  hourly: { hour: string; count: number }[];
  dailyTrend: { date: string; count: number }[];
}

// ---- Drone ----
export interface DroneInfo {
  id: string; name: string; model: string; status: 'idle' | 'patrol' | 'charging' | 'maintenance';
  battery: number; altitude: number; speed: number; lat: number; lng: number;
  currentRoute: string | null; nextMission: string | null;
}

// ---- Law Assistant ----
export interface LegalStep {
  order: number; title: string; description: string; evidenceRequired: boolean;
  promptQuestion: string;
}
