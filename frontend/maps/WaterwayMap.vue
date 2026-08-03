<template>
  <div class="map-card card-shadow">
    <div class="map-title-bar">
      <h2 class="map-title">金华市水路网地图</h2>
      <div class="map-controls">
        <el-button @click="zoomIn">＋</el-button>
        <el-button @click="zoomOut">－</el-button>
        <el-button @click="resetZoom">重置</el-button>
      </div>
    </div>
    <div class="map-viewport" :style="{ transform: `scale(${scale})` }">
      <div class="map-bg">
        <div v-for="w in waterways" :key="w.id" class="waterway" :style="w.style" />
        <div
          v-for="m in markers"
          :key="m.id"
          class="marker"
          :class="'marker-' + m.type"
          :style="{ top: m.top, left: m.left }"
          :title="m.label"
        >
          <div class="marker-icon">{{ m.icon }}</div>
          <div class="marker-label">{{ m.label }}</div>
        </div>
      </div>
    </div>
    <div class="legend">
      <span><i class="dot port" />港口</span>
      <span><i class="dot service" />水上服务区</span>
      <span><i class="dot lock" />闸道</span>
      <span><i class="dot channel" />航道</span>
    </div>
  </div>
</template>

<script setup lang="ts" name="WaterwayMap">
import { ref } from 'vue'

const scale = ref(1)

const waterways = [
  { id: 1, style: { top: '40%', left: '10%', width: '70%', transform: 'rotate(-8deg)' } },
  { id: 2, style: { top: '55%', left: '20%', width: '55%', transform: 'rotate(12deg)' } },
  { id: 3, style: { top: '30%', left: '35%', width: '40%', transform: 'rotate(25deg)' } }
]

const markers = [
  { id: 1, type: 'port', icon: '港', label: '金华港', top: '30%', left: '25%' },
  { id: 2, type: 'port', icon: '港', label: '兰溪港', top: '55%', left: '45%' },
  { id: 3, type: 'port', icon: '港', label: '义乌港', top: '38%', left: '65%' },
  { id: 4, type: 'port', icon: '港', label: '武义港', top: '70%', left: '30%' },
  { id: 5, type: 'port', icon: '港', label: '东阳港', top: '48%', left: '78%' },
  { id: 6, type: 'service', icon: '服', label: '金华水上服务区', top: '25%', left: '40%' },
  { id: 7, type: 'service', icon: '服', label: '兰溪水上服务区', top: '60%', left: '55%' },
  { id: 8, type: 'service', icon: '服', label: '婺城水上服务区', top: '42%', left: '32%' },
  { id: 9, type: 'lock', icon: '闸', label: '金华船闸', top: '48%', left: '38%' },
  { id: 10, type: 'lock', icon: '闸', label: '兰溪船闸', top: '62%', left: '48%' },
  { id: 11, type: 'lock', icon: '闸', label: '武义船闸', top: '68%', left: '28%' },
  { id: 12, type: 'channel', icon: '航', label: '金华江航道', top: '36%', left: '50%' },
  { id: 13, type: 'channel', icon: '航', label: '衢江航道', top: '58%', left: '22%' },
  { id: 14, type: 'channel', icon: '航', label: '义乌江航道', top: '44%', left: '72%' }
]

function zoomIn(): void {
  scale.value = Math.min(1.4, +(scale.value + 0.1).toFixed(2))
}

function zoomOut(): void {
  scale.value = Math.max(0.7, +(scale.value - 0.1).toFixed(2))
}

function resetZoom(): void {
  scale.value = 1
}
</script>

<style lang="scss" scoped>
.map-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
}

.card-shadow {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.map-title-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.map-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.map-controls {
  display: flex;
  gap: 6px;
}

.map-viewport {
  height: 420px;
  overflow: hidden;
  border-radius: 8px;
  border: 1px solid #e5e6eb;
  transform-origin: center center;
  transition: transform 0.15s ease;
}

.map-bg {
  position: relative;
  width: 100%;
  height: 100%;
  background: linear-gradient(160deg, #e8f3ff 0%, #d4e8f7 40%, #c5e0d8 100%);
}

.waterway {
  position: absolute;
  height: 14px;
  background: linear-gradient(90deg, rgba(22, 93, 255, 0.25), rgba(14, 120, 200, 0.45));
  border-radius: 8px;
  opacity: 0.85;
}

.marker {
  position: absolute;
  transform: translate(-50%, -50%);
  text-align: center;
  z-index: 2;
}

.marker-icon {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
}

.marker-label {
  margin-top: 4px;
  font-size: 11px;
  color: #1d2129;
  white-space: nowrap;
  text-shadow: 0 0 4px #fff;
}

.marker-port .marker-icon {
  background: #165dff;
}

.marker-service .marker-icon {
  background: #00b42a;
}

.marker-lock .marker-icon {
  background: #ff7d00;
}

.marker-channel .marker-icon {
  background: #0fc6c2;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-top: 12px;
  font-size: 12px;
  color: #4e5969;

  span {
    display: inline-flex;
    align-items: center;
    gap: 6px;
  }

  .dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    display: inline-block;

    &.port {
      background: #165dff;
    }

    &.service {
      background: #00b42a;
    }

    &.lock {
      background: #ff7d00;
    }

    &.channel {
      background: #0fc6c2;
    }
  }
}
</style>
