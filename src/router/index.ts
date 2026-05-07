import { createRouter, createWebHistory } from 'vue-router';
import QuillEditorPage from '@/pages/QuillEditorPage.vue';
import TiptapEditorPage from '@/pages/TiptapEditorPage.vue';
import PdfViewerPage from '@/pages/PdfViewerPage.vue';
import FullCalender from '@/pages/FullCalender.vue';

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/quill',
    },
    {
      path: '/quill',
      name: 'quill-editor',
      component: QuillEditorPage,
    },
    {
      path: '/tiptap',
      name: 'tiptap-editor',
      component: TiptapEditorPage,
    },
    {
      path: '/pdf-viewer',
      name: 'pdf-viewer',
      component: PdfViewerPage,
    },
    {
      path: '/full-calender',
      name: 'full-calender',
      component: FullCalender,
    },
  ],
});

export default router;
