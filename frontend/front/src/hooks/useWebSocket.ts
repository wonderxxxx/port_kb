import { useEffect, useRef, useState } from 'react';

interface WSMessage {
  type: string;
  timestamp: string;
  data: {
    warnings: number;
    waterLevel: number;
    shipCount: number;
    activeWarnings: { id: string; type: string; level: string; title: string; time: string }[];
  };
}

export function useWebSocket() {
  const [data, setData] = useState<WSMessage['data'] | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => setConnected(true);
    ws.onclose = () => setConnected(false);
    ws.onmessage = (event) => {
      try {
        const msg: WSMessage = JSON.parse(event.data);
        if (msg.type === 'status-update') {
          setData(msg.data);
        }
      } catch {}
    };

    return () => ws.close();
  }, []);

  return { data, connected };
}
