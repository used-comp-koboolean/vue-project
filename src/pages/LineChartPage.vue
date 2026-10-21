<script setup>
import dayjs from 'dayjs';
import ChartGallery from '@/components/ChartGallery.vue';
import { baseOptions, months } from '@/utils/chart';

const chartDefs = [
  {
    label: 'Line',
    max: 800,
    config: {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: '방문자 수',
            data: [320, 410, 380, 520, 610, 580],
            borderColor: '#16a34a',
            backgroundColor: 'rgba(22, 163, 74, 0.15)',
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: baseOptions('월별 방문자 추이'),
    },
  },
  {
    label: 'Stacked Line',
    max: 300,
    config: {
      type: 'line',
      data: {
        labels: months,
        datasets: [
          {
            label: '모바일',
            data: [200, 240, 230, 280, 300, 320],
            borderColor: '#2563eb',
            backgroundColor: 'rgba(37, 99, 235, 0.3)',
            fill: true,
          },
          {
            label: 'PC',
            data: [120, 110, 130, 140, 150, 145],
            borderColor: '#f59e0b',
            backgroundColor: 'rgba(245, 158, 11, 0.3)',
            fill: true,
          },
        ],
      },
      options: baseOptions('기기별 접속 누적', {
        scales: { y: { stacked: true, beginAtZero: true } },
      }),
    },
  },
  {
    label: 'Mixed (Bar + Line)',
    max: 100,
    config: {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          // order 값이 작을수록 위에 그려짐 → 전환율 라인을 막대 앞에 표시
          {
            type: 'bar',
            label: '주문 수',
            data: [45, 52, 38, 61, 70, 66],
            backgroundColor: '#93c5fd',
            order: 2,
          },
          {
            type: 'line',
            label: '전환율 (%)',
            order: 1,
            data: [3.2, 3.8, 2.9, 4.1, 4.6, 4.3],
            borderColor: '#ef4444',
            backgroundColor: '#ef4444',
            tension: 0.3,
            yAxisID: 'y1',
          },
        ],
      },
      options: baseOptions('주문 수 / 전환율', {
        scales: {
          y: { beginAtZero: true, position: 'left' },
          y1: { beginAtZero: true, position: 'right', grid: { drawOnChartArea: false } },
        },
      }),
    },
  },
  {
    label: 'Stepped Line',
    max: 10,
    config: {
      type: 'line',
      data: {
        labels: ['00시', '04시', '08시', '12시', '16시', '20시'],
        datasets: [
          {
            label: '인스턴스 수',
            data: [2, 2, 6, 8, 8, 4],
            borderColor: '#8b5cf6',
            backgroundColor: 'rgba(139, 92, 246, 0.15)',
            fill: true,
            stepped: true,
          },
        ],
      },
      options: baseOptions('시간대별 서버 인스턴스 수', { scales: { y: { beginAtZero: true } } }),
    },
  },
  {
    label: 'Log Scale',
    // 로그 스케일이 잘 보이도록 10 ~ 10,000,000 범위에서 자릿수 단위로 랜덤
    randomValue: () => Math.round(10 ** (1 + Math.random() * 6)),
    config: {
      type: 'bar',
      data: {
        labels: ['인증', '검색', '결제', '알림', '로그 수집'],
        datasets: [
          {
            label: '일일 요청 수',
            data: [1200, 85000, 3400, 420000, 9800000],
            backgroundColor: '#2563eb',
          },
        ],
      },
      options: baseOptions('서비스별 일일 요청 수 (로그 스케일)', {
        scales: { y: { type: 'logarithmic' } },
        plugins: { legend: { display: false } },
      }),
    },
  },
  {
    label: 'Time Axis',
    max: 120,
    labelType: 'date',
    config: {
      type: 'line',
      data: {
        labels: Array.from({ length: 14 }, (_, i) => dayjs('2026-10-01').add(i, 'day').format('YYYY-MM-DD')),
        datasets: [
          {
            label: '주문 수',
            data: [42, 55, 48, 61, 75, 90, 83, 52, 58, 66, 71, 88, 102, 95],
            borderColor: '#0ea5e9',
            backgroundColor: '#0ea5e9',
            tension: 0.3,
          },
        ],
      },
      options: baseOptions('일별 주문 수 (시간축)', {
        scales: {
          x: {
            type: 'time',
            time: { unit: 'day', tooltipFormat: 'YYYY-MM-DD', displayFormats: { day: 'MM/DD' } },
          },
          y: { beginAtZero: true },
        },
      }),
    },
  },
];
</script>

<template>
  <ChartGallery title="라인 차트" :chart-defs="chartDefs" />
</template>
