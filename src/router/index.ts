import { createRouter, createWebHistory } from 'vue-router';
import Login from '../views/Login.vue';
import DefaultLayout from '../layouts/DefaultLayout.vue';
import Rooms from '../views/rooms/Rooms.vue';
import Services from '../views/services/Services.vue';
import Settings from '../views/settings/Settings.vue';
import { useAuthStore } from '../stores/auth';

const router = createRouter({
  history: createWebHistory(),
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
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login');
  } else if (to.meta.guest && authStore.isLoggedIn) {
    next('/');
  } else {
    next();
  }
});

export default router;
