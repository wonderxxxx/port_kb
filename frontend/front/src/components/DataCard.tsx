import { ReactNode } from 'react';

interface DataCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'steady';
  color?: string;
  subtitle?: string;
  className?: string;
}

const trendIcons = {
  up: '↑', down: '↓', steady: '→',
};
const trendColors = {
  up: 'text-red-500', down: 'text-green-500', steady: 'text-slate-400',
};

export function DataCard({ title, value, unit, icon, trend, color, subtitle, className = '' }: DataCardProps) {
  return (
    <div className={`card hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="card-title">{title}</p>
          <div className="flex items-baseline gap-1 mt-1">
            <span className={`text-2xl font-bold ${color || 'text-slate-800'}`}>{value}</span>
            {unit && <span className="text-sm text-slate-400">{unit}</span>}
            {trend && <span className={`ml-1 text-sm ${trendColors[trend]}`}>{trendIcons[trend]}</span>}
          </div>
          {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
        </div>
        {icon && <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500">{icon}</div>}
      </div>
    </div>
  );
}
