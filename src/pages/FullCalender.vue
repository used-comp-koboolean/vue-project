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
  <section class="calendar-page">
    <BaseFullCalendar
      :date-events="currentEvents"
      :on-date-click="handleDateClick"
      :on-month-change="handleMonthChange"
    />
  </section>
</template>

<style scoped>
.calendar-page {
  height: 60%;
  width: 90%;
  margin: 0 auto;
  min-width: 0;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background-color: #ffffff;
  padding: 12px;
  box-sizing: border-box;
}
</style>
