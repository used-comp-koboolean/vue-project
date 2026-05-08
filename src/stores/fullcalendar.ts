import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { apiClient } from '@/plugins/axios.ts'

const withDefaultColor = (event) => ({
  ...event,
  backgroundColor: event?.backgroundColor || '#1e88e59f',
  borderColor: event?.borderColor || '#1e88e59f',
  textColor: event?.textColor || '#ffffff'
})

export const useFullCalendarStore = defineStore('fullCalendar', () => {
  const currentMonth = ref('')
  const eventsByMonth = ref({})

  const currentEvents = computed(() => eventsByMonth.value[currentMonth.value] || [])

  const setCurrentMonth = (month) => {
    currentMonth.value = month
  }

  const loadEventsByMonth = async (month) => {
    if (!month) return

    currentMonth.value = month

    if (eventsByMonth.value[month]) {
      return
    }

    try {
      const response = await apiClient.get(`/api/full/${month}`)
      eventsByMonth.value[month] = Array.isArray(response.data)
        ? response.data.map(withDefaultColor)
        : []
    } catch {
      eventsByMonth.value[month] = []
    }
  }

  const clearCache = () => {
    eventsByMonth.value = {}
  }

  return {
    currentMonth,
    currentEvents,
    eventsByMonth,
    setCurrentMonth,
    loadEventsByMonth,
    clearCache
  }
})
