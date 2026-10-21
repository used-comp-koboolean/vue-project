import { createRouter, createWebHistory } from 'vue-router';
import QuillEditorPage from '@/pages/QuillEditorPage.vue';
import TiptapEditorPage from '@/pages/TiptapEditorPage.vue';
import PdfViewerPage from '@/pages/PdfViewerPage.vue';
import FullCalender from '@/pages/FullCalender.vue';
import BarChartPage from '@/pages/BarChartPage.vue';
import LineChartPage from '@/pages/LineChartPage.vue';
import PieChartPage from '@/pages/PieChartPage.vue';
import DistributionChartPage from '@/pages/DistributionChartPage.vue';

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
    {
      path: '/chart',
      redirect: '/chart/bar',
    },
    {
      path: '/chart/bar',
      name: 'chart-bar',
      component: BarChartPage,
    },
    {
      path: '/chart/line',
      name: 'chart-line',
      component: LineChartPage,
    },
    {
      path: '/chart/pie',
      name: 'chart-pie',
      component: PieChartPage,
    },
    {
      path: '/chart/distribution',
      name: 'chart-distribution',
      component: DistributionChartPage,
    },
  ],
});

export default router;
