<script setup>
import { computed } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  html: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: '결과 미리보기',
  },
});

const emit = defineEmits(['update:modelValue']);

function closeModal() {
  emit('update:modelValue', false);
}

const iframeDoc = computed(() => {
  return `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <style>
      body { margin: 0; padding: 18px; line-height: 1.6; color: #111827; font-size: 15px; }
      img { max-width: 100%; height: auto; }
      table { border-collapse: collapse; table-layout: fixed; width: 100%; margin: 12px 0; }
      th, td { border: 1px solid #b9c1d0; padding: 8px; vertical-align: top; }
      th { background: #f2f5fa; font-weight: 600; }
      p { margin: 0.15em 0; }
      .ql-align-center { text-align: center; }
      .ql-align-right { text-align: right; }
      .ql-align-justify { text-align: justify; }
      .ql-direction-rtl { direction: rtl; text-align: inherit; }
      .ql-indent-1 { padding-left: 3em; }
      .ql-indent-2 { padding-left: 6em; }
      .ql-indent-3 { padding-left: 9em; }
      .ql-indent-4 { padding-left: 12em; }
      .ql-indent-5 { padding-left: 15em; }
      .ql-indent-6 { padding-left: 18em; }
      .ql-indent-7 { padding-left: 21em; }
      .ql-indent-8 { padding-left: 24em; }
      .ql-indent-9 { padding-left: 27em; }
    </style>
  </head>
  <body>${props.html || ''}</body>
</html>`;
});
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="preview-modal" @click.self="closeModal">
      <div class="preview-card" role="dialog" aria-modal="true" :aria-label="title">
        <div class="preview-header">
          <strong>{{ title }}</strong>
          <button type="button" class="close-btn" @click="closeModal">닫기</button>
        </div>
        <iframe class="preview-frame" :srcdoc="iframeDoc" title="HTML preview" />
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.preview-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.preview-card {
  width: min(1200px, 100%);
  height: min(86vh, 920px);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 14px;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
}

.close-btn {
  height: 30px;
  padding: 0 10px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}

.preview-frame {
  border: 0;
  width: 100%;
  height: 100%;
  background: #fff;
}
</style>
