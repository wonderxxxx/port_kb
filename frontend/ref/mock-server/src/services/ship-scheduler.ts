const MAX_DAILY_SHIPS = 40;

export interface DistrictSchedule {
  district: string;
  requestedCount: number;
  approvedCount: number;
  shipIds: string[];
  status: 'pending' | 'approved' | 'rejected';
}

export interface DailyDispatch {
  id: string;
  date: string;
  totalRequested: number;
  totalApproved: number;
  districts: DistrictSchedule[];
  lanxiAdditional: { shipId: string; shipName: string; reason: string }[];
  status: 'draft' | 'submitted' | 'approved';
}

const dispatchHistory: DailyDispatch[] = [
  {
    id: 'DD-20260617',
    date: '2026-06-17',
    totalRequested: 32,
    totalApproved: 32,
    districts: [
      { district: '龙游', requestedCount: 10, approvedCount: 10, shipIds: ['S001','S007','S013'], status: 'approved' },
      { district: '衢江', requestedCount: 15, approvedCount: 15, shipIds: ['S003','S005','S010','S014'], status: 'approved' },
      { district: '兰溪（罗阳）', requestedCount: 7, approvedCount: 7, shipIds: ['S002','S012'], status: 'approved' },
    ],
    lanxiAdditional: [
      { shipId: 'S006', shipName: '金航工003', reason: '航道疏浚工程' },
      { shipId: 'S011', shipName: '富春江货012', reason: '紧急物资运输' },
    ],
    status: 'approved',
  },
];

export function getTodayDispatch(): DailyDispatch | undefined {
  return dispatchHistory.find(d => d.date === '2026-06-17');
}

export function submitSchedule(districts: { district: string; count: number }[]): {
  success: boolean;
  message: string;
  dispatch?: DailyDispatch;
} {
  const total = districts.reduce((sum, d) => sum + d.count, 0);
  if (total > MAX_DAILY_SHIPS) {
    return {
      success: false,
      message: `三区合计申请 ${total} 艘，超过上限 40 艘，请各区分减后再提交。`,
    };
  }

  const dispatch: DailyDispatch = {
    id: `DD-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}`,
    date: new Date().toISOString().slice(0, 10),
    totalRequested: total,
    totalApproved: total,
    districts: districts.map(d => ({
      district: d.district,
      requestedCount: d.count,
      approvedCount: d.count,
      shipIds: [],
      status: 'approved' as const,
    })),
    lanxiAdditional: [],
    status: 'approved',
  };

  dispatchHistory.push(dispatch);
  return { success: true, message: '调度计划已生成', dispatch };
}

export function getQueuePosition(shipId: string): number {
  return Math.floor(Math.random() * 40) + 1;
}
