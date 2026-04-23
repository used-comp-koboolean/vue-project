<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { QuillEditor as BaseQuillEditor, Quill } from '@vueup/vue-quill';
import '@vueup/vue-quill/dist/vue-quill.snow.css';
import 'quill-resize-module/dist/resize.css';
import { apiClient } from '@/plugins/axios.ts';

const FONT_WHITELIST = ['nanum-gothic', 'nanum-myeongjo'];
const SIZE_WHITELIST = Array.from({ length: 21 }, (_, index) => `${index + 10}px`);
const QuillFontClass = Quill.import('attributors/class/font');
QuillFontClass.whitelist = FONT_WHITELIST;
Quill.register(QuillFontClass, true);

const QuillSizeStyle = Quill.import('attributors/style/size');
QuillSizeStyle.whitelist = SIZE_WHITELIST;
Quill.register(QuillSizeStyle, true);

const QuillLink = Quill.import('formats/link');

class ExternalLink extends QuillLink {
  static create(value) {
    const node = super.create(value);
    node.setAttribute('target', '_blank');
    node.setAttribute('rel', 'noopener noreferrer');
    return node;
  }
}

Quill.register(ExternalLink, true);

const URL_PATTERN = /((?:https?:\/\/|www\.)[^\s<>()]+(?:\([^\s<>()]*\)[^\s<>()]*)*)/gi;

const isEditorVisible = ref(false);

async function initResizeModule() {
  if (typeof window === 'undefined') return;

  window.Quill = Quill;

  if (!window.__quillResizeLoaded) {
    await import('quill-resize-module');
    window.__quillResizeLoaded = true;
  }
}

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
let pasteHandler = null;

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

function escapeHtml(value) {
  return (value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function textContainsUrl(value) {
  return /(?:https?:\/\/|www\.)[^\s<>()]+/i.test(value || '');
}

function splitTrailingPunctuation(value) {
  let core = value || '';
  let tail = '';

  while (/[),.;!?]$/.test(core)) {
    tail = core.slice(-1) + tail;
    core = core.slice(0, -1);
  }

  return { core, tail };
}

function normalizeUrl(url) {
  if (!url) return '';
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

function linkifyInlineText(text) {
  return escapeHtml(text).replace(URL_PATTERN, raw => {
    const { core, tail } = splitTrailingPunctuation(raw);
    if (!core) return raw;

    const href = normalizeUrl(core);
    return `<a href="${href}" target="_blank" rel="noopener noreferrer">${escapeHtml(core)}</a>${escapeHtml(tail)}`;
  });
}

function linkifyPlainTextToHtml(text) {
  return linkifyInlineText(text || '').replace(/\r?\n/g, '<br>');
}

function linkifyHtmlContent(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  if (!doc?.body) return html;

  const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
  const textNodes = [];
  while (walker.nextNode()) {
    textNodes.push(walker.currentNode);
  }

  textNodes.forEach(node => {
    const value = node.nodeValue || '';
    if (!textContainsUrl(value)) return;

    const parent = node.parentElement;
    if (!parent || parent.closest('a,script,style')) return;

    const container = doc.createElement('span');
    container.innerHTML = linkifyInlineText(value);

    const fragment = doc.createDocumentFragment();
    while (container.firstChild) {
      fragment.appendChild(container.firstChild);
    }

    node.parentNode?.replaceChild(fragment, node);
  });

  doc.body.querySelectorAll('a[href]').forEach(anchor => {
    anchor.setAttribute('target', '_blank');
    anchor.setAttribute('rel', 'noopener noreferrer');
  });

  return doc.body.innerHTML;
}

/* =========================
   붙여넣기 처리
========================= */
async function handlePaste(e) {
  const clipboardData = e.clipboardData;
  if (!clipboardData) return;

  const items = clipboardData.items;
  const files = [];

  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith('image/')) {
      const file = items[i].getAsFile();

      if (file) {
        files.push(file);
      }
    }
  }

  const quill = editRef.value?.getQuill?.();
  if (!quill) return;

  if (files.length > 0) {
    e.preventDefault();
    await insertUploadedImages(files);
    return;
  }

  const html = clipboardData.getData('text/html') || '';
  const text = clipboardData.getData('text/plain') || '';
  const range = quill.getSelection(true);

  if (html && textContainsUrl(html)) {
    const linkedHtml = linkifyHtmlContent(html);
    e.preventDefault();
    quill.deleteText(range.index, range.length, 'user');
    quill.clipboard.dangerouslyPasteHTML(range.index, linkedHtml, 'user');
    quill.setSelection(range.index + (text || '').length, 0, 'silent');
    return;
  }

  if (!html && textContainsUrl(text)) {
    const linkedTextHtml = linkifyPlainTextToHtml(text);
    e.preventDefault();
    quill.deleteText(range.index, range.length, 'user');
    quill.clipboard.dangerouslyPasteHTML(range.index, linkedTextHtml, 'user');
    quill.setSelection(range.index + text.length, 0, 'silent');
  }
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
        [{ font: FONT_WHITELIST }],
        [{ size: SIZE_WHITELIST }],
        ['bold', 'italic', 'underline'],
        [{ header: [1, 2, 3, false] }],
        [{ align: [] }],
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
    resize: {
      modules: ['Resize', 'DisplaySize', 'Toolbar'],
    },
  },
};

/* =========================
   에디터 준비/정리
========================= */
function onEditorReady() {
  const quill = editRef.value.getQuill();
  pasteHandler = e => {
    handlePaste(e);
  };

  quill.root.addEventListener('paste', pasteHandler);
}

onBeforeUnmount(() => {
  const quill = editRef.value?.getQuill?.();
  if (pasteHandler) {
    quill?.root?.removeEventListener('paste', pasteHandler);
  }
});

onMounted(async () => {
  try {
    await initResizeModule();
  } finally {
    isEditorVisible.value = true;
  }
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
    v-if="isEditorVisible"
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

<style>
.quill {
  width: 100%;
}

.quill .ql-editor img {
  max-width: 100%;
  height: auto;
}

.ql-editor .ql-font-nanum-gothic {
  font-family: 'Nanum Gothic', sans-serif;
}

.ql-editor .ql-font-nanum-myeongjo {
  font-family: 'Nanum Myeongjo', serif;
}

.ql-snow .ql-picker.ql-font .ql-picker-label::before,
.ql-snow .ql-picker.ql-font .ql-picker-item::before {
  content: '기본 글꼴';
}

.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='nanum-gothic']::before,
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='nanum-gothic']::before {
  content: '나눔고딕';
  font-family: 'Nanum Gothic', sans-serif;
}

.ql-snow .ql-picker.ql-font .ql-picker-item[data-value='nanum-myeongjo']::before,
.ql-snow .ql-picker.ql-font .ql-picker-label[data-value='nanum-myeongjo']::before {
  content: '나눔명조';
  font-family: 'Nanum Myeongjo', serif;
}

.ql-snow .ql-picker.ql-size .ql-picker-label::before,
.ql-snow .ql-picker.ql-size .ql-picker-item::before {
  content: '기본 크기';
}

.ql-snow .ql-picker.ql-size .ql-picker-item[data-value]::before,
.ql-snow .ql-picker.ql-size .ql-picker-label[data-value]::before {
  content: attr(data-value);
}
</style>
