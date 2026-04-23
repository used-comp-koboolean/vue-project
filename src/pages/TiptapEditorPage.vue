<script setup>
import { ref } from 'vue';
import RichTextEditorTiptap from '@/components/RichTextEditorTiptap.vue';
import HtmlPreviewModal from '@/components/HtmlPreviewModal.vue';

const editorRef = ref(null);
const content = ref('');
const html = ref('');
const isPreviewOpen = ref(false);

function clickHandler() {
  html.value = editorRef.value?.getHTML?.() || '';
  isPreviewOpen.value = true;
}
</script>

<template>
  <section class="page-wrap">
    <h1>TipTap Editor</h1>
    <RichTextEditorTiptap ref="editorRef" v-model:content="content" :editor-style="{ height: '72vh' }" />
    <button class="preview-btn" @click="clickHandler">결과 보기</button>
    <HtmlPreviewModal v-model="isPreviewOpen" :html="html" title="TipTap 결과" />
  </section>
</template>

<style scoped>
.page-wrap {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h1 {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
}

.preview-btn {
  width: fit-content;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
}
</style>
