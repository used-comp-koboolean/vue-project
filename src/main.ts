import { createApp } from 'vue';
import App from './App.vue';
import router from '@/router';
import { vuetify, pinia } from './plugins';
import '@/scss/style.scss';
import { PerfectScrollbar } from 'vue3-perfect-scrollbar';
import VueApexCharts from 'vue3-apexcharts';
import VueTablerIcons from 'vue-tabler-icons';

const app = createApp(App);
app.use(router);
app.component('PerfectScrollbar', PerfectScrollbar);
app.use(VueTablerIcons);
app.use(VueApexCharts as any);
app.use(pinia);
app.use(vuetify);
app.mount('#app');
