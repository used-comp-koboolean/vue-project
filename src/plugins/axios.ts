import axios from 'axios';
import type { App, Plugin } from 'vue';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(error)
);

const axiosPlugin: Plugin = {
  install(app: App) {
    app.config.globalProperties.$axios = apiClient;
    app.provide('axios', apiClient);
  },
};

export { apiClient };
export default axiosPlugin;
