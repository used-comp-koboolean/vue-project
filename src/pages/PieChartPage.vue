<script setup>
import { Chart } from 'chart.js';
import ChartGallery from '@/components/ChartGallery.vue';
import { baseOptions, palette } from '@/utils/chart';

// 게이지 가운데에 첫 번째 값의 비율(첫 번째 값 / 전체 합)을 표시하는 플러그인
const gaugeCenterText = {
  id: 'gaugeCenterText',
  afterDatasetsDraw(chart) {
    const arc = chart.getDatasetMeta(0).data[0];
    if (!arc) return;

    const values = chart.data.datasets[0].data;
    const total = values.reduce((sum, value) => sum + value, 0);
    const percent = total ? Math.round((values[0] / total) * 100) : 0;
    const { ctx } = chart;

    ctx.save();
    ctx.font = `700 ${Math.round(arc.innerRadius * 0.45)}px ${Chart.defaults.font.family}`;
    ctx.fillStyle = '#1f2937';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${percent}%`, arc.x, arc.y);
    ctx.restore();
  },
};

const chartDefs = [
  {
    label: 'Pie',
    max: 50,
    config: {
      type: 'pie',
      data: {
        labels: ['식비', '주거', '교통', '여가', '기타'],
        datasets: [{ data: [35, 30, 12, 15, 8], backgroundColor: palette }],
      },
      options: baseOptions('지출 비율 (%)', { plugins: { legend: { position: 'right' } } }),
    },
  },
  {
    label: 'Doughnut',
    max: 60,
    config: {
      type: 'doughnut',
      data: {
        labels: ['Chrome', 'Safari', 'Edge', 'Firefox', '기타'],
        datasets: [{ data: [58, 22, 10, 6, 4], backgroundColor: palette }],
      },
      options: baseOptions('브라우저 점유율 (%)', { plugins: { legend: { position: 'right' } } }),
    },
  },
  {
    label: 'Polar Area',
    max: 20,
    config: {
      type: 'polarArea',
      data: {
        labels: ['서울', '부산', '대구', '인천', '광주'],
        datasets: [
          {
            data: [18, 12, 7, 10, 5],
            backgroundColor: palette.map((color) => `${color}b3`),
          },
        ],
      },
      options: baseOptions('지역별 매장 수', { plugins: { legend: { position: 'right' } } }),
    },
  },
  {
    label: 'Gauge (Half Doughnut)',
    max: 100,
    config: {
      type: 'doughnut',
      data: {
        labels: ['달성', '미달성'],
        datasets: [{ data: [72, 28], backgroundColor: ['#2563eb', '#e5e7eb'] }],
      },
      options: baseOptions('목표 달성률 (%)', {
        // 반원만 그리도록 각도를 조정
        rotation: -90,
        circumference: 180,
        cutout: '70%',
      }),
      plugins: [gaugeCenterText],
    },
  },
  {
    label: 'Multi-ring Doughnut',
    max: 40,
    config: {
      type: 'doughnut',
      data: {
        labels: ['1분기', '2분기', '3분기', '4분기'],
        // 첫 번째 데이터셋이 바깥 링
        datasets: [
          { label: '2026', data: [22, 28, 26, 24], backgroundColor: palette.slice(0, 4) },
          {
            label: '2025',
            data: [20, 25, 30, 25],
            backgroundColor: palette.slice(0, 4).map((color) => `${color}80`),
          },
        ],
      },
      options: baseOptions('분기별 매출 비중 (바깥: 2026 / 안: 2025)', {
        plugins: { legend: { position: 'right' } },
      }),
    },
  },
];
</script>

<template>
  <ChartGallery title="원형 차트" :chart-defs="chartDefs" />
</template>
