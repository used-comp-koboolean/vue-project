<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Chart from 'chart.js/auto';
import 'chartjs-adapter-dayjs-4';
import ChartDataTable from '@/components/ChartDataTable.vue';
import { randomInt, randomPoints } from '@/utils/chart';

// chartDefs: [{ label, config, min, max, randomValue, labelType }]
// - min / max: 랜덤 변경 시 숫자 데이터의 범위 (min 기본값 1)
// - randomValue: 랜덤 값 생성 함수 (min / max 대신 사용, 예: 로그 스케일)
// - labelType: 표의 항목 입력 형식 ('text' | 'date')
const props = defineProps({
  title: { type: String, required: true },
  chartDefs: { type: Array, required: true },
});

const canvasEls = [];
const charts = [];
// 랜덤 변경 후 표를 다시 그리기 위한 키
const tableVersion = ref(0);

onMounted(() => {
  props.chartDefs.forEach((def, index) => {
    charts.push(new Chart(canvasEls[index], def.config));
  });
});

onBeforeUnmount(() => {
  charts.forEach((chart) => chart.destroy());
});

function shuffleData() {
  charts.forEach((chart, index) => {
    const { min = 1, max, randomValue } = props.chartDefs[index];
    const nextValue = () => (randomValue ? randomValue() : randomInt(min, max));

    chart.data.datasets.forEach((dataset) => {
      dataset.data = dataset.data.map((value) => {
        // 플로팅 막대의 [시작, 끝] 범위
        if (Array.isArray(value)) return [nextValue(), nextValue()].sort((a, b) => a - b);
        if (typeof value === 'object') return randomPoints(1, 'r' in value)[0];
        // 혼합 차트의 보조축(전환율 %)은 작은 소수 스케일 유지
        if (dataset.yAxisID === 'y1') return +(Math.random() * 5 + 1).toFixed(1);
        return nextValue();
      });
    });
    chart.update();
  });
  tableVersion.value += 1;
}
</script>

<template>
  <section class="page-wrap">
    <h1>{{ title }}</h1>

    <div class="actions">
      <button type="button" class="action-btn" @click="shuffleData">데이터 랜덤 변경</button>
    </div>

    <div class="chart-grid">
      <div v-for="(def, index) in chartDefs" :key="def.label" class="chart-card">
        <span class="chart-type">{{ def.label }}</span>
        <div class="chart-card-body">
          <ChartDataTable
            :key="tableVersion"
            :data="def.config.data"
            :label-type="def.labelType"
            @change="charts[index].update()"
          />
          <div class="chart-body">
            <canvas :ref="(el) => (canvasEls[index] = el)" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.action-btn {
  padding: 8px 14px;
  border: 1px solid #2563eb;
  border-radius: 8px;
  background: #2563eb;
  color: #fff;
  font-weight: 500;
  cursor: pointer;
}

.action-btn:hover {
  background: #1d4ed8;
}

.chart-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(100%, 760px), 1fr));
  gap: 16px;
}

.chart-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 12px;
  border: 1px solid #d5dbe7;
  border-radius: 10px;
  background: #fff;
}

.chart-type {
  align-self: flex-start;
  padding: 2px 8px;
  border-radius: 6px;
  background: #e8eefc;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 600;
}

.chart-card-body {
  display: grid;
  grid-template-columns: minmax(220px, 2fr) 3fr;
  gap: 12px;
  align-items: start;
}

.chart-body {
  position: relative;
  min-width: 0;
  height: 300px;
}

@media (max-width: 900px) {
  .chart-card-body {
    grid-template-columns: 1fr;
  }
}
</style>
