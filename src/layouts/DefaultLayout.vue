<template>
  <a-layout style="height: 100vh; overflow: hidden">
    <a-layout-sider v-model:collapsed="collapsed" collapsible>
      <div class="logo p-4 text-white text-xl font-bold truncate">Admin Hotel</div>
      <a-menu v-model:selectedKeys="selectedKeys" theme="dark" mode="inline">
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
    <a-layout style="height: 100%; overflow: hidden; display: flex; flex-direction: column;">
      <a-layout-header style="background: #fff; padding: 0 16px; flex-shrink: 0;" class="flex justify-between items-center shadow-sm z-10">
        <div class="text-lg font-semibold">{{ headerTitle }}</div>
        <a-dropdown>
          <a class="ant-dropdown-link" @click.prevent>
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
      </a-layout-header>
      <a-layout-content style="margin: 16px; overflow-y: auto; flex-grow: 1;">
        <div :style="{ padding: '24px', background: '#fff', minHeight: '100%', borderRadius: '8px' }">
          <router-view />
        </div>
      </a-layout-content>
      <a-layout-footer style="text-align: center; flex-shrink: 0;">
        Hotel Management Dashboard ©2026 Admin Hotel
      </a-layout-footer>
    </a-layout>
  </a-layout>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
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

const headerTitle = computed(() => {
  if (route.path === '/services') return 'Quản lý dịch vụ';
  if (route.path === '/settings') return 'Cài đặt hệ thống';
  return 'Quản lý phòng';
});

// Update selectedKeys based on route on mount/change
// Simplified logic for now, can be reactive watcher
if (route.path === '/services') selectedKeys.value = ['2'];
else if (route.path === '/settings') selectedKeys.value = ['3'];
else selectedKeys.value = ['1'];

const logout = () => {
  authStore.logout();
};
</script>

<style scoped>
.logo {
  height: 32px;
  background: rgba(255, 255, 255, 0.2);
  margin: 16px;
  line-height: 32px;
  text-align: center;
  border-radius: 4px;
}
</style>
