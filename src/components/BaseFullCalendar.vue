<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import FullCalendar from '@fullcalendar/vue3';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';

const props = defineProps({
  dateEvents: {
    type: Array,
    default: () => [],
  },
  onDateClick: {
    type: Function,
    default: undefined,
  },
  onMonthChange: {
    type: Function,
    default: undefined,
  },
  headerBackgroundColor: {
    type: String,
    default: '#f4f5f6',
  },
  headerTextColor: {
    type: String,
    default: '#131416',
  },
  headerBorderColor: {
    type: String,
    default: '#e5e7eb',
  },
});

const calendarRef = ref(undefined);
const pendingEventLayouts = new Set();
let layoutFrame = 0;

const calendarCssVars = computed(() => ({
  '--calendar-header-background-color': props.headerBackgroundColor,
  '--calendar-header-text-color': props.headerTextColor,
  '--calendar-header-border-color': props.headerBorderColor,
}));

const compactDate = (value) => {
  if (!value) return value;
  return String(value).replaceAll('-', '').slice(0, 8);
};

const dashedDate = (value) => {
  const raw = compactDate(value);
  if (!raw || raw.length !== 8) return value;
  return `${raw.slice(0, 4)}-${raw.slice(4, 6)}-${raw.slice(6, 8)}`;
};

const toExclusiveEnd = (end) => {
  if (!end) return end;
  const date = new Date(dashedDate(end));
  if (Number.isNaN(date.getTime())) return end;
  date.setDate(date.getDate() + 1);
  return date.toISOString().slice(0, 10);
};

const normalizeEvent = (event) => {
  const normalized = {
    ...event,
    start: dashedDate(event?.start),
    end: dashedDate(event?.end),
  };

  if (!normalized?.allDay || !normalized?.end) return normalized;

  return {
    ...normalized,
    end: toExclusiveEnd(normalized.end),
  };
};

const normalizedEvents = computed(() => props.dateEvents.map(normalizeEvent));

const handleDateClick = (arg) => {
  if (typeof props.onDateClick === 'function') {
    props.onDateClick(compactDate(arg.dateStr), arg);
  }
};

const compactMonth = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return undefined;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}${month}`;
};

const handleDatesSet = (arg) => {
  if (typeof props.onMonthChange !== 'function') return;
  props.onMonthChange(compactMonth(arg?.view?.currentStart), arg);
};

const buildEventKey = (event) => {
  const id = event.id || event._def?.publicId || event._def?.defId || '';
  const start = event.startStr || event.start?.toISOString?.() || '';
  const end = event.endStr || event.end?.toISOString?.() || '';
  return `${id}__${event.title || ''}__${start}__${end}`;
};

const sortEventSegments = (elements) =>
  [...elements].sort((left, right) => {
    const leftRect = left.getBoundingClientRect();
    const rightRect = right.getBoundingClientRect();

    if (Math.abs(leftRect.top - rightRect.top) > 1) {
      return leftRect.top - rightRect.top;
    }

    return leftRect.left - rightRect.left;
  });

const measureTextWidth = (text, font) => {
  if (!text) return 0;

  const canvas = measureTextWidth.canvas || document.createElement('canvas');
  const context = canvas.getContext('2d');
  measureTextWidth.canvas = canvas;
  if (!context) return 0;
  context.font = font;
  return context.measureText(text).width;
};

const layoutEventTitleSegments = (eventKey) => {
  const root = calendarRef.value?.$el;
  if (!root) return;

  const segments = sortEventSegments(root.querySelectorAll(`[data-event-key="${CSS.escape(eventKey)}"]`));
  if (!segments.length) return;

  const titleText = segments[0].dataset.eventTitle || '';
  let bestSegment = null;
  let bestWidth = 0;

  segments.forEach((segment) => {
    const title = segment.querySelector('.fc-event-title');
    if (!title) return;

    delete segment.dataset.titleFits;
    title.textContent = titleText || '\u00a0';
    title.classList.add('fc-event-title-placeholder');

    if (!titleText) return;

    const style = window.getComputedStyle(title);
    const font = `${style.fontStyle} ${style.fontVariant} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const availableWidth = Math.max(title.clientWidth, title.parentElement?.clientWidth || 0);
    const textWidth = measureTextWidth(titleText, font);

    if (availableWidth > bestWidth) {
      bestWidth = availableWidth;
      bestSegment = segment;
    }

    if (!segment.dataset.titleFits && textWidth <= availableWidth) {
      segment.dataset.titleFits = 'true';
    }
  });

  const targetSegment = segments.find((segment) => segment.dataset.titleFits === 'true') || bestSegment;
  if (!targetSegment) return;

  const visibleTitle = targetSegment.querySelector('.fc-event-title');
  if (!visibleTitle) return;

  visibleTitle.textContent = titleText || '\u00a0';
  visibleTitle.classList.remove('fc-event-title-placeholder');
};

const queueEventLayout = (eventKey) => {
  pendingEventLayouts.add(eventKey);

  if (layoutFrame) return;

  layoutFrame = window.requestAnimationFrame(() => {
    pendingEventLayouts.forEach(layoutEventTitleSegments);
    pendingEventLayouts.clear();
    layoutFrame = 0;
  });
};

const relayoutAllEventTitles = () => {
  const root = calendarRef.value?.$el;
  if (!root) return;

  const eventKeys = new Set(
    [...root.querySelectorAll('[data-event-key]')]
      .map((element) => element.dataset.eventKey)
      .filter(Boolean),
  );

  eventKeys.forEach(queueEventLayout);
};

const renderEventContent = (arg) => {
  const title = document.createElement('div');
  title.className = 'fc-event-title';
  title.textContent = arg.event.title || '';

  return { domNodes: [title] };
};

const handleEventDidMount = (arg) => {
  const eventKey = buildEventKey(arg.event);
  arg.el.dataset.eventKey = eventKey;
  arg.el.dataset.eventTitle = arg.event.title || '';
  queueEventLayout(eventKey);
};

onMounted(() => {
  window.addEventListener('resize', relayoutAllEventTitles);
});

onBeforeUnmount(() => {
  window.removeEventListener('resize', relayoutAllEventTitles);

  if (layoutFrame) {
    window.cancelAnimationFrame(layoutFrame);
  }
});

const emitCurrentMonth = () => {
  if (typeof props.onMonthChange !== 'function') return;
  const api = calendarRef.value?.getApi?.();
  if (!api) return;
  props.onMonthChange(compactMonth(api.getDate()), api);
};

const clickPrev = () => {
  const api = calendarRef.value?.getApi?.();
  if (!api) return;
  api.prev();
};

const clickNext = () => {
  const api = calendarRef.value?.getApi?.();
  if (!api) return;
  api.next();
};

const clickToday = () => {
  const api = calendarRef.value?.getApi?.();
  if (!api) return;
  const before = compactMonth(api.getDate());
  api.today();
  const after = compactMonth(api.getDate());
  if (before === after) {
    emitCurrentMonth();
  }
};

const calendarOptions = computed(() => ({
  plugins: [dayGridPlugin, interactionPlugin],
  initialView: 'dayGridMonth',
  locale: 'ko',
  dayCellContent: (arg) => String(arg.dayNumberText).replace(/[^0-9]/g, ''),
  headerToolbar: {
    left: '',
    center: 'title',
    right: 'prevCustom todayCustom nextCustom',
  },
  buttonText: {
    prevCustom: '<',
    todayCustom: '오늘',
    nextCustom: '>',
  },
  customButtons: {
    prevCustom: {
      text: '<',
      click: clickPrev,
    },
    todayCustom: {
      text: '오늘',
      click: clickToday,
    },
    nextCustom: {
      text: '>',
      click: clickNext,
    },
  },
  height: '100%',
  dateClick: handleDateClick,
  datesSet: handleDatesSet,
  eventContent: renderEventContent,
  eventDidMount: handleEventDidMount,
  events: normalizedEvents.value,
}));
</script>

<template>
  <div class="base-full-calendar" :style="calendarCssVars">
    <FullCalendar ref="calendarRef" :options="calendarOptions" />
  </div>
</template>

<style>
.base-full-calendar {
  height: 100%;
  width: 100%;
}

.fc-daygrid-event {
  pointer-events: none;
}

.fc .fc-event-title {
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  line-height: 1.3;
}

.fc .fc-daygrid-block-event .fc-event-main {
  padding: 2px 4px;
}

.fc .fc-event-title-placeholder {
  visibility: hidden;
}

.fc .fc-prevCustom-button,
.fc .fc-nextCustom-button,
.fc .fc-todayCustom-button {
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
  flex-wrap: wrap;
  justify-content: center;
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
  width: auto;
  max-width: 100%;
  flex-wrap: wrap;
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

.fc .fc-col-header-cell {
  background-color: var(--calendar-header-background-color) !important;
  border-color: var(--calendar-header-border-color) !important;
}

.fc .fc-col-header-cell-cushion {
  color: var(--calendar-header-text-color) !important;
  font-weight: 600;
}

.fc .fc-col-header {
  border-color: var(--calendar-header-border-color) !important;
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

.fc .fc-day-sat,
.fc .fc-day-sun {
  background-color: #f5f5f5;
}

@media (max-width: 640px) {
  .fc .fc-toolbar-title {
    font-size: 20px;
  }

  .fc .fc-prevCustom-button,
  .fc .fc-nextCustom-button,
  .fc .fc-todayCustom-button {
    font-size: 14px !important;
    padding: 0 4px;
  }
}
</style>
