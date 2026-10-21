<script setup>
import ChartGallery from '@/components/ChartGallery.vue';
import { baseOptions, randomPoints } from '@/utils/chart';

const chartDefs = [
  {
    label: 'Radar',
    max: 100,
    config: {
      type: 'radar',
      data: {
        labels: ['속도', '안정성', '보안', '확장성', '편의성', '비용'],
        datasets: [
          {
            label: '제품 A',
            data: [80, 70, 90, 60, 75, 50],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.2)',
          },
          {
            label: '제품 B',
            data: [60, 85, 70, 80, 65, 80],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
          },
        ],
      },
      options: baseOptions('제품 비교', { scales: { r: { min: 0, max: 100 } } }),
    },
  },
  {
    label: 'Scatter',
    config: {
      type: 'scatter',
      data: {
        datasets: [
          { label: '그룹 A', data: randomPoints(20), backgroundColor: '#2563eb' },
          { label: '그룹 B', data: randomPoints(20), backgroundColor: '#ef4444' },
        ],
      },
      options: baseOptions('그룹별 분포'),
    },
  },
  {
    label: 'Bubble',
    config: {
      type: 'bubble',
      data: {
        datasets: [
          {
            label: '프로젝트',
            data: randomPoints(12, true),
            backgroundColor: 'rgba(139, 92, 246, 0.5)',
            borderColor: '#8b5cf6',
          },
        ],
      },
      options: baseOptions('난이도 / 가치 / 규모(반지름)'),
    },
  },
];
</script>

<template>
  <ChartGallery title="분포 · 비교 차트" :chart-defs="chartDefs" />
</template>
