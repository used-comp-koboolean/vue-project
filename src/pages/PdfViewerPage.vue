<script setup>
import { ref } from 'vue';
import PdfPreviewModal from '@/components/PdfPreviewModal.vue';
import { apiClient } from '@/plugins/axios.ts';

const pdfUrl = ref('');
const fileName = ref('');
const isPreviewOpen = ref(false);
const isUploading = ref(false);

function resolveServerFileUrl(url) {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) return url;

  const normalizedBase = base.endsWith('/') ? base.slice(0, -1) : base;
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${normalizedBase}${normalizedPath}`;
}

async function uploadPdf(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await apiClient.post('/api/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  const uploadedUrl = res.data?.urls?.[0] || '';
  return resolveServerFileUrl(uploadedUrl);
}

async function onPdfChange(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    alert('PDF 파일만 업로드할 수 있습니다.');
    event.target.value = '';
    return;
  }

  try {
    isUploading.value = true;
    const uploadedUrl = await uploadPdf(file);

    if (!uploadedUrl) {
      alert('PDF 업로드에 실패했습니다.');
      return;
    }

    pdfUrl.value = uploadedUrl;
    fileName.value = file.name;
  } catch {
    alert('PDF 업로드 중 오류가 발생했습니다.');
  } finally {
    isUploading.value = false;
    event.target.value = '';
  }
}

function openPreview() {
  if (!pdfUrl.value || isUploading.value) return;
  isPreviewOpen.value = true;
}
</script>

<template>
  <section class="page-wrap">
    <h1>PDF Viewer</h1>

    <div class="actions">
      <label class="upload-btn">
        {{ isUploading ? '업로드 중...' : 'PDF 업로드' }}
        <input type="file" accept="application/pdf,.pdf" hidden :disabled="isUploading" @change="onPdfChange" />
      </label>
      <button class="preview-btn" :disabled="!pdfUrl || isUploading" @click="openPreview">결과 보기</button>
      <span v-if="fileName" class="file-name">{{ fileName }}</span>
    </div>

    <div class="pdf-shell">
      <iframe v-if="pdfUrl" :src="pdfUrl" class="pdf-viewer" title="PDF viewer" />
      <div v-else class="pdf-empty">PDF 파일을 업로드하면 여기에서 미리보기 됩니다.</div>
    </div>

    <PdfPreviewModal v-model="isPreviewOpen" :pdf-url="pdfUrl" title="PDF 결과" />
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

.actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.upload-btn,
.preview-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 34px;
  padding: 0 12px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

.preview-btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.file-name {
  color: #334155;
  font-size: 13px;
}

.pdf-shell {
  border: 1px solid #d0d5dd;
  border-radius: 8px;
  min-height: 72vh;
  overflow: hidden;
  background: #fff;
}

.pdf-viewer {
  width: 100%;
  height: 72vh;
  border: 0;
}

.pdf-empty {
  display: grid;
  place-items: center;
  min-height: 72vh;
  color: #64748b;
}
</style>
