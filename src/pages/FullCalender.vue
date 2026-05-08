<script setup>
import { storeToRefs } from 'pinia';
import BaseFullCalendar from '@/components/BaseFullCalendar.vue';
import { useFullCalendarStore } from '@/stores/fullcalendar';

const fullCalendarStore = useFullCalendarStore();
const { currentEvents } = storeToRefs(fullCalendarStore);

const handleDateClick = (compactDate) => {
  console.log(compactDate);
};

const handleMonthChange = (month) => {
  fullCalendarStore.loadEventsByMonth(month);
};
</script>

<template>
  <BaseFullCalendar
    :date-events="currentEvents"
    :on-date-click="handleDateClick"
    :on-month-change="handleMonthChange"
  />
</template>
