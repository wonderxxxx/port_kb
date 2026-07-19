import { SVGProps } from 'react';

// Heroicons-style inline SVG icons
function Icon({ children, className = 'w-5 h-5', ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.8} stroke="currentColor" {...props}>
      {children}
    </svg>
  );
}

// Dashboard / Grid
export function IconDashboard({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zm0 9.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zm0 9.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></Icon>;
}

// Warning / Alert
export function IconWarning({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" /></Icon>;
}

// Ship / Anchor
export function IconShip({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v17.25m0 0c-1.875 0-3.75-.563-5.25-2.063m5.25 2.063c1.875 0 3.75-.563 5.25-2.063M12 3c1.875 0 3.75.563 5.25 2.063M12 3C10.125 3 8.25 3.563 6.75 5.063M12 3v4.5m0 0l-3-1.5m3 1.5l3-1.5M12 7.5V3m-3.75 7.5h7.5m-7.5 0L6 18m9.75-7.5L18 18" /></Icon>;
}

// Eye / View
export function IconEye({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></Icon>;
}

// Drone / Paper airplane
export function IconDrone({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></Icon>;
}

// Document / File
export function IconDocument({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></Icon>;
}

// Anchor for logo
export function IconAnchor({ className }: { className?: string }) {
  return <Icon className={className}><circle cx="12" cy="5" r="3" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v14m0 0l-4-4m4 4l4-4" /><path strokeLinecap="round" d="M3 14c1.5 2.5 5 4 9 4s7.5-1.5 9-4" /></Icon>;
}

// Water drop / Hydrology
export function IconWater({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" /></Icon>;
}

// Wind
export function IconWind({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" /></Icon>;
}

// Signal / Antenna
export function IconSignal({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.288 15.038a5.25 5.25 0 017.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 011.06 0z" /></Icon>;
}

// Clock / Time
export function IconClock({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
}

// Bell / Notification
export function IconBell({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></Icon>;
}

// Chart / Analytics
export function IconChart({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zm6.75-4.5c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" /></Icon>;
}

// List / checklist
export function IconList({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></Icon>;
}

// Lock
export function IconLock({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></Icon>;
}

// Map pin
export function IconPin({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></Icon>;
}

// Search
export function IconSearch({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></Icon>;
}

// Battery
export function IconBattery({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M21 10.5h.375c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125H21M3.75 18h15A2.25 2.25 0 0021 15.75v-6a2.25 2.25 0 00-2.25-2.25h-15A2.25 2.25 0 001.5 9.75v6A2.25 2.25 0 003.75 18z" /></Icon>;
}

// Rain / Cloud
export function IconRain({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15a4.5 4.5 0 004.5 4.5H18a3.75 3.75 0 001.332-7.257 3 3 0 00-3.758-3.848 5.25 5.25 0 00-10.233 2.33A4.502 4.502 0 002.25 15z" /></Icon>;
}

// Check circle
export function IconCheck({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
}

// X circle
export function IconX({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></Icon>;
}

// Target / crosshair
export function IconTarget({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6m0 0l3.75 3.75M12 12l-3.75 3.75M12 18a6 6 0 100-12 6 6 0 000 12z" /><circle cx="12" cy="12" r="3" /></Icon>;
}

// Thermometer
export function IconThermometer({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M12 15.5V3m0 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5zM4.5 19.5h15" /></Icon>;
}

// Play
export function IconPlay({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" /></Icon>;
}

// Pause
export function IconPause({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" /></Icon>;
}

// Arrow right / return
export function IconArrowRight({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></Icon>;
}

// Camera
export function IconCamera({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zm-2.25 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" /></Icon>;
}

// Fire / flame
export function IconFire({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.048 8.287 8.287 0 009 9.6a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.467 5.99 5.99 0 00-1.925 3.546 5.974 5.974 0 01-2.133-1A3.75 3.75 0 0012 18z" /></Icon>;
}

// Ruler
export function IconRuler({ className }: { className?: string }) {
  return <Icon className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5 7.5 12 3 7.5zm0 0L7.5 12m0 0l4.5 4.5 4.5-4.5m-4.5 4.5V21" /></Icon>;
}
