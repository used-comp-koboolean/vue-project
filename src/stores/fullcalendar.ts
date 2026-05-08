import { computed, ref } from 'vue';
import { defineStore } from 'pinia';
import { apiClient } from '@/plugins/axios.ts';

const CAL_TYPE_COLOR = {
  TYPE1: {
    backgroundColor: '#1e88e59f',
    borderColor: '#1e88e59f',
    textColor: '#ffffff',
  },
  TYPE2: {
    backgroundColor: '#43a0479f',
    borderColor: '#43a0479f',
    textColor: '#ffffff',
  },
  DEFAULT: {
    backgroundColor: '#1e88e59f',
    borderColor: '#1e88e59f',
    textColor: '#ffffff',
  },
};

const withDefaultColor = (event) => {
  const calType = event?.calType || event?.type;
  const palette = CAL_TYPE_COLOR[calType] || CAL_TYPE_COLOR.DEFAULT;

  return {
    ...event,
    backgroundColor: palette.backgroundColor,
    borderColor: palette.borderColor,
    textColor: palette.textColor,
  };
};

const compactDate = (value) =>
  String(value || '')
    .replaceAll('-', '')
    .slice(0, 8);

const monthRange = (month) => {
  const year = Number(String(month).slice(0, 4));
  const mon = Number(String(month).slice(4, 6));
  if (!year || !mon) return undefined;

  const first = `${year}${String(mon).padStart(2, '0')}01`;
  const lastDate = new Date(year, mon, 0).getDate();
  const last = `${year}${String(mon).padStart(2, '0')}${String(lastDate).padStart(2, '0')}`;
  return { first, last };
};

const isInMonth = (event, month) => {
  const range = monthRange(month);
  if (!range) return false;

  const start = compactDate(event?.start);
  const end = compactDate(event?.end || event?.start);
  if (!start || !end) return false;

  return start <= range.last && end >= range.first;
};

export const useFullCalendarStore = defineStore('fullCalendar', () => {
  const currentMonth = ref('');
  const eventsByYear = ref({});

  const currentEvents = computed(() => {
    const year = String(currentMonth.value || '').slice(0, 4);
    const yearEvents = eventsByYear.value[year] || [];
    return yearEvents.filter((event) => isInMonth(event, currentMonth.value));
  });

  const setCurrentMonth = (month) => {
    currentMonth.value = month;
  };

  const loadEventsByMonth = async (month) => {
    if (!month) return;

    currentMonth.value = month;
    const year = String(month).slice(0, 4);

    if (eventsByYear.value[year]) {
      return;
    }

    try {
      const response = await apiClient.get(`/api/full/${year}`);
      eventsByYear.value[year] = Array.isArray(response.data)
        ? response.data.map(withDefaultColor)
        : [];
    } catch {
      eventsByYear.value[year] = [];
    }
  };

  const clearCache = () => {
    eventsByYear.value = {};
  };

  return {
    currentMonth,
    currentEvents,
    eventsByYear,
    setCurrentMonth,
    loadEventsByMonth,
    clearCache,
  };
});
