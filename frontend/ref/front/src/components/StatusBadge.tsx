const levelConfig: Record<string, string> = {
  blue: 'bg-blue-100 text-blue-700 border-blue-300',
  yellow: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  orange: 'bg-orange-100 text-orange-700 border-orange-300',
  red: 'bg-red-100 text-red-700 border-red-300',
};

const levelLabels: Record<string, string> = {
  blue: '蓝色', yellow: '黄色', orange: '橙色', red: '红色',
};

export function StatusBadge({ level, className = '' }: { level: string; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${levelConfig[level] || levelConfig.blue} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${level === 'red' ? 'animate-pulse-warning bg-red-500' : 'bg-current'}`} />
      {levelLabels[level] || level}
    </span>
  );
}

export function StatusTag({ status, className = '' }: { status: string; className?: string }) {
  const colors: Record<string, string> = {
    '航行中': 'bg-green-100 text-green-700',
    '锚泊': 'bg-slate-100 text-slate-600',
    '作业中': 'bg-sky-100 text-sky-700',
    '待审核': 'bg-amber-100 text-amber-700',
    '已推送': 'bg-blue-100 text-blue-700',
    '已确认': 'bg-emerald-100 text-emerald-700',
    '已驳回': 'bg-red-100 text-red-600',
    '已完成': 'bg-emerald-100 text-emerald-700',
    '已处置': 'bg-emerald-100 text-emerald-700',
    '生效中': 'bg-indigo-100 text-indigo-700',
    '维护中': 'bg-orange-100 text-orange-700',
    'online': 'bg-green-100 text-green-700',
    'offline': 'bg-red-100 text-red-600',
  };
  return (
    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600'} ${className}`}>
      {status}
    </span>
  );
}
