import { Router } from 'express';

export const videoRouter = Router();

// GET /api/south/video/stream — get camera RTSP stream URL
videoRouter.get('/stream', (_req, res) => {
  res.json({
    code: 200,
    data: {
      cameras: [
        { id: 'CAM01', name: '龙游港区-1号摄像头', streamUrl: 'rtsp://video-platform/stream/cam01', lat: 29.2170, lng: 119.4680, status: 'online' },
        { id: 'CAM02', name: '衢江大桥-上游摄像头', streamUrl: 'rtsp://video-platform/stream/cam02', lat: 29.1950, lng: 119.4900, status: 'online' },
        { id: 'CAM03', name: '衢江大桥-下游摄像头', streamUrl: 'rtsp://video-platform/stream/cam03', lat: 29.1930, lng: 119.4910, status: 'online' },
        { id: 'CAM04', name: '兰溪执法码头-全景', streamUrl: 'rtsp://video-platform/stream/cam04', lat: 29.2050, lng: 119.4750, status: 'online' },
        { id: 'CAM05', name: '姚家船闸-闸口监控', streamUrl: 'rtsp://video-platform/stream/cam05', lat: 29.2000, lng: 119.4860, status: 'online' },
        { id: 'CAM06', name: '龙游应急停泊点', streamUrl: 'rtsp://video-platform/stream/cam06', lat: 29.2140, lng: 119.4760, status: 'offline' },
      ],
    },
  });
});

// GET /api/south/video/playback — get historical video playback URL
videoRouter.get('/playback', (req, res) => {
  const { camera, start, end } = req.query;
  res.json({
    code: 200,
    data: {
      camera,
      startTime: start || new Date(Date.now() - 3600000).toISOString(),
      endTime: end || new Date().toISOString(),
      playbackUrl: `https://video-platform/playback?camera=${camera}&start=${start}&end=${end}`,
    },
  });
});

// POST /api/south/video/ptz — camera PTZ control
videoRouter.post('/ptz', (req, res) => {
  const { cameraId, pan, tilt, zoom } = req.body;
  res.json({
    code: 200,
    message: `云台控制指令已下发：摄像头 ${cameraId}，水平 ${pan || 0}°，俯仰 ${tilt || 0}°，变焦 ${zoom || 1}x`,
    data: { cameraId, pan, tilt, zoom, executed: true },
  });
});
