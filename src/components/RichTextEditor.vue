<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { QuillEditor as BaseQuillEditor } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import { apiClient } from '@/plugins/axios.ts';

const props = defineProps({
  content: {
    type: [String, Object],
    default: '',
  },
  editorStyle: {
    type: [String, Object, Array],
    default: () => ({ height: '500px' }),
  },
});

const emit = defineEmits(['update:content']);
const editRef = ref(null);

/* =========================
   공통 이미지 삽입 처리
========================= */
async function insertUploadedImages(files) {
  if (!files.length) return;

  const quill = editRef.value.getQuill();
  let range = quill.getSelection(true);

  for (const file of files) {
    const url = await uploadImage(file);

    quill.insertEmbed(range.index, 'image', url);
    range.index += 1;
  }
}

/* =========================
   툴바 이미지 버튼 처리
========================= */
function imageHandler() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'image/*';
  input.multiple = true;
  input.click();

  input.onchange = async () => {
    const files = Array.from(input.files || []);
    await insertUploadedImages(files);
  };
}

/* =========================
   붙여넣기 이미지 처리
========================= */
async function handlePaste(e) {
  const items = e.clipboardData.items;
  const files = [];

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      const file = items[i].getAsFile();

      if (file) {
        files.push(file);
      }
    }
  }

  if (files.length === 0) return;

  e.preventDefault();
  await insertUploadedImages(files);
}

/* =========================
   이미지 업로드
========================= */
async function uploadImage(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data?.urls?.[0] || '';
}

/* =========================
   Quill 옵션
========================= */
const editorOptions = {
  theme: 'snow',
  modules: {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        [{ header: [1, 2, 3, false] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['link'],
        ['image'],
        ['clean'],
      ],
      handlers: {
        image: imageHandler,
      },
    },
    clipboard: {
      matchers: [
        [
          'img',
          (node, delta) => {
            const src = node.getAttribute('src') || '';

            if (src.startsWith('data:image/')) {
              return { ops: [] };
            }

            return delta;
          },
        ],
      ],
    },
  },
};

/* =========================
   에디터 준비/정리
========================= */
function onEditorReady() {
  const quill = editRef.value.getQuill();
  quill.root.addEventListener('paste', handlePaste);
}

onBeforeUnmount(() => {
  const quill = editRef.value?.getQuill?.();
  quill?.root?.removeEventListener('paste', handlePaste);
});

/* =========================
   부모에서 사용할 메서드 노출
========================= */
function getHTML() {
  return editRef.value?.getHTML?.() || '';
}

function getQuill() {
  return editRef.value?.getQuill?.() || null;
}

defineExpose({
  getHTML,
  getQuill,
});
</script>

<template>
  <BaseQuillEditor
    ref="editRef"
    class="quill"
    :style="props.editorStyle"
    :content="content"
    contentType="delta"
    :options="editorOptions"
    @update:content="emit('update:content', $event)"
    @ready="onEditorReady"
  />
</template>

<style scoped>
.quill {
  width: 100%;
}
</style>
