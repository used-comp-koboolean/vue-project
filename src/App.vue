<script setup>
import { ref } from 'vue';
import RichTextEditor from '@/components/RichTextEditor.vue';

const editorRef = ref(null);
const content = ref('');
const html = ref('');

/* =========================
   에디터 HTML 확인
========================= */
function clickHandler() {
  html.value = editorRef.value?.getHTML?.() || '';
}
</script>

<template>
  <RichTextEditor ref="editorRef" v-model:content="content" />

  <button @click="clickHandler">HTML 확인</button>

  <div v-html="html"></div>
</template>
