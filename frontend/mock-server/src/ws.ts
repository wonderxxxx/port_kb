import { Server as HttpServer } from 'http';
import { Server, WebSocket } from 'ws';

export class WebSocketServer {
  private wss: Server;
  private interval: NodeJS.Timeout | null = null;

  constructor(server: HttpServer) {
    this.wss = new Server({ server, path: '/ws' });
    this.wss.on('connection', this.handleConnection.bind(this));
    this.startBroadcast();
  }

  private handleConnection(ws: WebSocket) {
    console.log('📡 WebSocket client connected');
    ws.on('close', () => console.log('📡 WebSocket client disconnected'));
  }

  private startBroadcast() {
    this.interval = setInterval(() => {
      const warnings = require('./mock-data/warnings.json');
      const hydrology = require('./mock-data/hydrology.json');
      const ships = require('./mock-data/ships.json');

      const payload = JSON.stringify({
        type: 'status-update',
        timestamp: new Date().toISOString(),
        data: {
          warnings: warnings.warnings.filter((w: { status: string }) => w.status === '待审核').length,
          waterLevel: hydrology.currentData[0].level + (Math.random() - 0.5) * 0.3,
          shipCount: ships.positions.length,
          activeWarnings: warnings.warnings.slice(0, 2),
        },
      });

      this.wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      });
    }, 10000); // Push every 10 seconds
  }

  public stop() {
    if (this.interval) clearInterval(this.interval);
  }
}
