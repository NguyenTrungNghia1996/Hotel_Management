import { createRouter, createWebHistory, createWebHashHistory } from 'vue-router';
import Login from '../views/Login.vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import Rooms from '../views/rooms/Rooms.vue';
import Services from '../views/services/Services.vue';
import Settings from '../views/settings/Settings.vue';
import { useAuthStore } from '../stores/auth';

const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';

const router = createRouter({
  history: isFileProtocol ? createWebHashHistory() : createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { guest: true }
    },
    {
      path: '/',
      component: DefaultLayout,
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'Rooms',
          component: Rooms
        },
        {
          path: 'services',
          name: 'Services',
          component: Services
        },
        {
          path: 'settings',
          name: 'Settings',
          component: Settings
        }
      ]
    }
  ]
});

router.beforeEach((to, _from, next) => {
  const authStore = useAuthStore();
  if (authStore.isLocked) {
    if (to.path !== '/login') {
      next('/login');
    } else {
      next();
    }
    return;
  }
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login');
  } else if (to.meta.guest && authStore.isLoggedIn) {
    next('/');
  } else {
    next();
  }
});

export default router;
