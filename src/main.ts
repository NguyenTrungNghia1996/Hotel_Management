import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './style.css'
import App from './App.vue'
import router from './router'
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/reset.css';
import { useAuthStore } from './stores/auth';

type NtpStatus = {
  checked: boolean;
  ok: boolean;
  reason: string;
  timestamp: string | null;
  expiryTimestamp: string | null;
};

const getIpcRenderer = () => {
  const w = window as any;
  if (!w?.require) return null;
  try {
    return w.require('electron').ipcRenderer;
  } catch (_err) {
    return null;
  }
};

const fetchNtpStatus = async (): Promise<NtpStatus> => {
  const ipcRenderer = getIpcRenderer();
  if (!ipcRenderer) {
    return { checked: true, ok: false, reason: 'ipc_unavailable', timestamp: null, expiryTimestamp: null };
  }
  try {
    return await ipcRenderer.invoke('ntp:get-status');
  } catch (_err) {
    return { checked: true, ok: false, reason: 'unreachable', timestamp: null, expiryTimestamp: null };
  }
};

const bootstrap = async () => {
  const app = createApp(App);
  const pinia = createPinia();

  app.use(pinia);
  app.use(router);
  app.use(Antd);

  const authStore = useAuthStore(pinia);
  const status = await fetchNtpStatus();
  authStore.setNtpTimestamp(status.timestamp);
  authStore.setExpiryTimestamp(status.expiryTimestamp);
  if (!status.ok) {
    authStore.setLock(status.reason || 'unreachable');
    if (router.currentRoute.value.path !== '/login') {
      await router.replace('/login');
    }
  } else {
    authStore.clearLock();
  }

  app.mount('#app');
};

bootstrap();
