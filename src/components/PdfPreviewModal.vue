<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  pdfUrl: {
    type: String,
    default: '',
  },
  title: {
    type: String,
    default: 'PDF 결과 미리보기',
  },
});

const emit = defineEmits(['update:modelValue']);

function closeModal() {
  emit('update:modelValue', false);
}
</script>

<template>
  <Teleport to="body">
    <div v-if="modelValue" class="pdf-modal" @click.self="closeModal">
      <div class="pdf-card" role="dialog" aria-modal="true" :aria-label="title">
        <div class="pdf-header">
          <strong>{{ title }}</strong>
          <button type="button" class="close-btn" @click="closeModal">닫기</button>
        </div>

        <iframe v-if="pdfUrl" class="pdf-frame" :src="pdfUrl" title="PDF preview" />
        <div v-else class="pdf-empty">표시할 PDF가 없습니다.</div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.pdf-modal {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(15, 23, 42, 0.45);
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 16px;
}

.pdf-card {
  width: min(1200px, 100%);
  height: min(86vh, 920px);
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(2, 6, 23, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.pdf-header {
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

.pdf-frame {
  border: 0;
  width: 100%;
  height: 100%;
  background: #fff;
}

.pdf-empty {
  display: grid;
  place-items: center;
  height: 100%;
  color: #64748b;
}
</style>
