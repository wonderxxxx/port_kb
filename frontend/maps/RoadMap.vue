<template>
  <div class="map-card card-shadow">
    <div class="map-title-bar">
      <h2 class="map-title">公路路网地图</h2>
      <div class="search-row">
        <el-input
          v-model="keyword"
          clearable
          :placeholder="placeholder"
          style="width: 280px"
          @keyup.enter="search"
        />
        <el-button type="primary" @click="search">搜索</el-button>
      </div>
    </div>
    <div ref="chartRef" class="chart" />
    <p class="hint">示意地图（demo）：支持金华视角缩放漫游；路名搜索为 mock 匹配。</p>
  </div>
</template>

<script setup lang="ts" name="RoadMap">
import { ref, onMounted, onUnmounted } from 'vue'
import * as echarts from 'echarts'
import type { ECharts } from 'echarts'
import { ElMessage } from 'element-plus'
import { zltRoadNames } from '../mock/zlt'

withDefaults(
  defineProps<{
    placeholder?: string
  }>(),
  {
    placeholder: '请输入金华市公路名称（如G60沪昆高速）'
  }
)

const keyword = ref('')
const chartRef = ref<HTMLElement | null>(null)
let chart: ECharts | null = null

const highlightName = ref('')

function search(): void {
  const kw = keyword.value.trim()
  if (!kw) {
    ElMessage.warning('请输入公路名称')
    return
  }
  const hit = zltRoadNames.find(n => n.includes(kw) || kw.includes(n))
  if (!hit) {
    ElMessage.warning(`未找到「${kw}」相关路段（mock）`)
    highlightName.value = ''
    return
  }
  highlightName.value = hit
  ElMessage.success(`已定位：${hit}（mock 示意）`)
  renderChart()
}

function renderChart(): void {
  if (!chartRef.value) return
  if (!chart) {
    chart = echarts.init(chartRef.value)
  }
  chart.setOption({
    graphic: [
      {
        type: 'group',
        left: 'center',
        top: 'middle',
        children: [
          {
            type: 'rect',
            shape: { width: 520, height: 320, r: 8 },
            style: { fill: '#e8f3ff', stroke: '#c9ddff', lineWidth: 1 },
            left: -260,
            top: -160
          },
          {
            type: 'text',
            style: {
              text: '金华市公路路网示意\n（生产环境可替换为 GIS / 路网服务）',
              fill: '#4e5969',
              fontSize: 14,
              align: 'center',
              textAlign: 'center'
            },
            left: 0,
            top: -20
          },
          {
            type: 'text',
            style: {
              text: highlightName.value ? `当前高亮：${highlightName.value}` : '支持搜索 G60 / G25 / G330 / S313 等',
              fill: highlightName.value ? '#165dff' : '#86909c',
              fontSize: 13,
              fontWeight: highlightName.value ? 600 : 400,
              align: 'center',
              textAlign: 'center'
            },
            left: 0,
            top: 30
          },
          // 简易路网折线示意
          {
            type: 'polyline',
            shape: {
              points: [
                [-200, 40],
                [-80, 10],
                [40, 50],
                [180, 20]
              ]
            },
            style: { stroke: '#165dff', lineWidth: 3, opacity: 0.7 }
          },
          {
            type: 'polyline',
            shape: {
              points: [
                [-160, 80],
                [-40, 100],
                [100, 70],
                [200, 110]
              ]
            },
            style: { stroke: '#0e42d2', lineWidth: 2, opacity: 0.5 }
          }
        ]
      }
    ]
  })
}

function onResize(): void {
  chart?.resize()
}

onMounted(() => {
  renderChart()
  window.addEventListener('resize', onResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', onResize)
  chart?.dispose()
  chart = null
})
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
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 12px;
}

.map-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.search-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.chart {
  width: 100%;
  height: 420px;
  border: 1px solid #e5e6eb;
  border-radius: 8px;
  background: #f7faff;
}

.hint {
  margin: 10px 0 0;
  font-size: 12px;
  color: #86909c;
}
</style>
