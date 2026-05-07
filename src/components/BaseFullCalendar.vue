<script setup>
import { computed } from 'vue'
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'

const props = defineProps({
  dateEvents: {
    type: Array,
    default: () => []
  },
  onDateClick: {
    type: Function,
    default: undefined
  }
})

const compactDate = (value) => {
  if (!value) return value
  return String(value).replaceAll('-', '').slice(0, 8)
}

const dashedDate = (value) => {
  const raw = compactDate(value)
  if (!raw || raw.length !== 8) return value
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`
}

const toExclusiveEnd = (end) => {
  if (!end) return end
  const date = new Date(dashedDate(end))
  if (Number.isNaN(date.getTime())) return end
  date.setDate(date.getDate() + 1)
  return date.toISOString().slice(0, 10)
}

const normalizeEvent = (event) => {
  const normalized = {
    ...event,
    start: dashedDate(event?.start),
    end: dashedDate(event?.end)
  }

  if (!normalized?.allDay || !normalized?.end) return normalized

  return {
    ...normalized,
    end: toExclusiveEnd(normalized.end)
  }
}

const normalizedEvents = computed(() => props.dateEvents.map(normalizeEvent))

const handleDateClick = (arg) => {
  if (typeof props.onDateClick === 'function') {
    props.onDateClick(compactDate(arg.dateStr), arg)
  }
}

const calendarOptions = computed(() => ({
  plugins: [ dayGridPlugin, interactionPlugin ],
  initialView: 'dayGridMonth',
  locale: 'ko',
  dayCellContent: (arg) => String(arg.dayNumberText).replace(/[^0-9]/g, ''),
  headerToolbar: {
    left: '',
    center: 'title',
    right: 'prev today next'
  },
  buttonText: {
    prev: '<',
    today: '오늘',
    next: '>'
  },
  dateClick: handleDateClick,
  events: normalizedEvents.value
}))
</script>

<template>
  <FullCalendar :options="calendarOptions" />
</template>

<style>
.fc-daygrid-event {
  pointer-events: none;
}

.fc .fc-prev-button,
.fc .fc-next-button,
.fc .fc-today-button {
  appearance: none !important;
  -webkit-appearance: none !important;
  background-color: transparent !important;
  background: transparent !important;
  background-image: none !important;
  border: 0 !important;
  border-color: transparent !important;
  box-shadow: none !important;
  color: #000 !important;
  opacity: 1 !important;
  outline: none !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  padding: 0 6px;
}

.fc .fc-toolbar .fc-button-group {
  gap: 8px;
}

.fc .fc-header-toolbar {
  row-gap: 10px;
}

.fc .fc-toolbar.fc-header-toolbar {
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px;
}

.fc .fc-toolbar.fc-header-toolbar .fc-toolbar-chunk {
  display: flex;
  justify-content: center;
  width: 100%;
}

.fc .fc-toolbar.fc-header-toolbar .fc-toolbar-chunk:nth-child(1) {
  display: none;
}

.fc .fc-toolbar.fc-header-toolbar .fc-toolbar-chunk:nth-child(2) {
  order: 1;
}

.fc .fc-toolbar.fc-header-toolbar .fc-toolbar-chunk:nth-child(3) {
  order: 2;
}

.fc .fc-daygrid-day.fc-day-today {
  background-color: transparent !important;
}

.fc .fc-daygrid-day-number {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  font-weight: 500;
}

.fc .fc-daygrid-day.fc-day-today .fc-daygrid-day-number {
  background-color: transparent;
  color: #ffffff;
  background-color: tomato;
  border-radius: 50%;
  font-weight: 600;
}

@media (max-width: 640px) {
  .fc .fc-toolbar-title {
    font-size: 20px;
  }

  .fc .fc-prev-button,
  .fc .fc-next-button,
  .fc .fc-today-button {
    font-size: 14px !important;
    padding: 0 4px;
  }
}
</style>
