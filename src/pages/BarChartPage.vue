<script setup>
import ChartGallery from '@/components/ChartGallery.vue';
import { baseOptions, months, palette } from '@/utils/chart';

const chartDefs = [
  {
    label: 'Bar',
    max: 30,
    config: {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: '2025', data: [12, 19, 8, 15, 22, 18], backgroundColor: '#93c5fd' },
          { label: '2026', data: [16, 23, 11, 20, 27, 25], backgroundColor: '#2563eb' },
        ],
      },
      options: baseOptions('월별 매출 (백만원)', { scales: { y: { beginAtZero: true } } }),
    },
  },
  {
    label: 'Horizontal Bar',
    max: 100,
    config: {
      type: 'bar',
      data: {
        labels: ['기획', '디자인', '개발', 'QA', '배포'],
        datasets: [{ label: '진행률', data: [100, 85, 60, 30, 10], backgroundColor: palette }],
      },
      options: baseOptions('업무별 진행률 (%)', {
        indexAxis: 'y',
        scales: { x: { beginAtZero: true, max: 100 } },
        plugins: { legend: { display: false } },
      }),
    },
  },
  {
    label: 'Stacked Bar',
    max: 20,
    config: {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          { label: '온라인', data: [10, 12, 9, 14, 16, 15], backgroundColor: '#2563eb' },
          { label: '오프라인', data: [6, 5, 7, 6, 8, 9], backgroundColor: '#f59e0b' },
          { label: '제휴', data: [2, 3, 2, 4, 3, 5], backgroundColor: '#16a34a' },
        ],
      },
      options: baseOptions('채널별 매출 누적', {
        scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } },
      }),
    },
  },
  {
    label: 'Horizontal Stacked Bar',
    max: 15,
    config: {
      type: 'bar',
      data: {
        labels: ['프론트엔드', '백엔드', '디자인', 'QA'],
        datasets: [
          { label: '완료', data: [12, 9, 6, 4], backgroundColor: '#16a34a' },
          { label: '진행 중', data: [5, 7, 3, 6], backgroundColor: '#f59e0b' },
          { label: '대기', data: [3, 4, 2, 5], backgroundColor: '#9ca3af' },
        ],
      },
      options: baseOptions('팀별 업무 현황', {
        indexAxis: 'y',
        scales: { x: { stacked: true, beginAtZero: true }, y: { stacked: true } },
      }),
    },
  },
  {
    label: 'Floating Bar',
    min: -10,
    max: 35,
    config: {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: '기온 범위',
            // [시작, 끝] 으로 막대의 아래/위 위치를 지정
            data: [
              [-8, 2],
              [-5, 6],
              [1, 13],
              [7, 20],
              [12, 25],
              [18, 28],
            ],
            backgroundColor: '#fca5a5',
            borderColor: '#ef4444',
            borderWidth: 1,
          },
        ],
      },
      options: baseOptions('월별 최저 / 최고 기온 (°C)', { plugins: { legend: { display: false } } }),
    },
  },
];
</script>

<template>
  <ChartGallery title="막대 차트" :chart-defs="chartDefs" />
</template>
