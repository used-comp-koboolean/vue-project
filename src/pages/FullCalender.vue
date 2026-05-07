<script setup>
import { onMounted, ref } from 'vue'
import BaseFullCalendar from '../components/BaseFullCalendar.vue'
import { fetchDummyDbEvents } from '../stores/fullcalendar-dummy-events'

const dateEvents = ref([]);

const handleDateClick = (compactDate) => {
  console.log(compactDate);
}

const loadEvents = async () => {
  try {
    dateEvents.value = await fetchDummyDbEvents();
  } catch {
    dateEvents.value = [];
  }
}

onMounted(loadEvents);
</script>

<template>
  <BaseFullCalendar :date-events="dateEvents" :on-date-click="handleDateClick" />
</template>
