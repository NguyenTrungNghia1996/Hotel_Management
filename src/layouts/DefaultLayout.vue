<template>
  <a-layout class="app-shell min-h-screen">
    <a-layout-sider v-model:collapsed="collapsed" collapsible class="app-sider">
      <div class="flex items-center gap-3 px-2">
        <div class="brand-mark">AH</div>
        <div v-if="!collapsed" class="min-w-0">
          <div class="font-display text-lg text-white truncate">Admin</div>
          <div class="text-xs text-white/70">Quản trị vận hành</div>
        </div>
      </div>

      <div v-if="!collapsed" class="px-2">
        <div class="sider-card">
          <div class="text-[11px] uppercase tracking-[0.28em] text-white/60">Hôm nay</div>
          <div class="text-lg font-semibold text-white">{{ todayLabel }}</div>
          <div class="mt-2 text-sm text-white/70">
            Trống: {{ roomStats.empty }}/{{ roomStats.total }} phòng
          </div>
          <div class="text-sm text-white/70">Quá hạn: {{ roomStats.overdue }}</div>
        </div>
      </div>

      <a-menu v-model:selectedKeys="selectedKeys" mode="inline" class="sider-menu">
        <a-menu-item key="1" @click="router.push('/')">
          <template #icon><home-outlined /></template>
          <span>Quản lý phòng</span>
        </a-menu-item>
        <a-menu-item key="2" @click="router.push('/services')">
          <template #icon><shopping-outlined /></template>
          <span>Quản lý dịch vụ</span>
        </a-menu-item>
        <a-menu-item key="3" @click="router.push('/settings')">
          <template #icon><setting-outlined /></template>
          <span>Cài đặt hệ thống</span>
        </a-menu-item>
      </a-menu>
    </a-layout-sider>

    <a-layout class="h-full min-h-0 flex flex-col">
      <a-layout-header class="app-header flex items-center justify-between">
        <div>
          <div class="text-[11px] uppercase tracking-[0.28em] text-emerald-700"></div>
          <div class="font-display text-2xl text-slate-900"></div>
        </div>
        <div class="flex items-center gap-3">
          <div class="hidden md:flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
            <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
            Đang hoạt động
          </div>
          <a-dropdown>
            <a class="flex items-center gap-2 rounded-full bg-white px-3 py-1.5 text-sm text-slate-700 shadow-sm" @click.prevent>
              Admin <down-outlined />
            </a>
            <template #overlay>
              <a-menu>
                <a-menu-item @click="logout">
                  <logout-outlined /> Đăng xuất
                </a-menu-item>
              </a-menu>
            </template>
          </a-dropdown>
        </div>
      </a-layout-header>

      <a-layout-content class="flex-1 overflow-y-auto px-6 pb-6">
        <div class="surface-glass p-6 min-h-[calc(100vh-170px)]">
          <router-view />
        </div>
      </a-layout-content>

      <a-layout-footer class="text-center text-sm text-slate-500">
        Hotel Management Dashboard ©2026 Admin Hotel
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useHotelStore } from '../stores/hotel';
import dayjs from 'dayjs';
import {
  HomeOutlined,
  ShoppingOutlined,
  SettingOutlined,
  LogoutOutlined,
  DownOutlined
} from '@ant-design/icons-vue';

const collapsed = ref(false);
const selectedKeys = ref<string[]>(['1']);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const hotelStore = useHotelStore();

// const headerTitle = computed(() => {
//   if (route.path === '/services') return 'Quản lý dịch vụ';
//   if (route.path === '/settings') return 'Cài đặt hệ thống';
//   return 'Quản lý phòng';
// });

const todayLabel = computed(() => dayjs().format('dddd, DD/MM'));

const roomStats = computed(() => {
  const total = hotelStore.rooms.length;
  const empty = hotelStore.rooms.filter(room => room.status === 'empty').length;
  const overdue = hotelStore.rooms.filter(room => hotelStore.isOverdue(room)).length;
  return { total, empty, overdue };
});

watch(
  () => route.path,
  (path) => {
    if (path === '/services') selectedKeys.value = ['2'];
    else if (path === '/settings') selectedKeys.value = ['3'];
    else selectedKeys.value = ['1'];
  },
  { immediate: true }
);

const logout = () => {
  authStore.logout();
};
</script>

<style scoped>
.app-sider {
  background: linear-gradient(180deg, #0f2b2b 0%, #1a3b35 100%);
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.app-sider :deep(.ant-layout-sider-children) {
  display: flex;
  flex-direction: column;
  gap: 20px;
  padding: 20px 16px;
}

.brand-mark {
  height: 40px;
  width: 40px;
  border-radius: 14px;
  display: grid;
  place-items: center;
  font-weight: 700;
  color: #12352f;
  background: linear-gradient(145deg, #fbe7c6, #f5b87f);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
}

.sider-card {
  border-radius: 16px;
  padding: 16px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.18);
}

.app-sider :deep(.ant-menu) {
  background: transparent;
  color: rgba(255, 255, 255, 0.78);
  font-weight: 500;
}

.app-sider :deep(.ant-menu-item) {
  border-radius: 14px;
  margin: 4px 0;
  height: 44px;
  line-height: 44px;
}

.app-sider :deep(.ant-menu-item-selected) {
  background: rgba(255, 255, 255, 0.18);
  color: #ffffff;
}

.app-sider :deep(.ant-layout-sider-trigger) {
  background: rgba(10, 20, 18, 0.5);
  color: #fff;
}

.app-header {
  background: transparent;
  padding: 16px 24px 12px;
  flex-shrink: 0;
}
</style>
