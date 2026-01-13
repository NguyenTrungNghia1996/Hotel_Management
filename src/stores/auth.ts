import { defineStore } from 'pinia';
import { ref } from 'vue';
import { message } from 'ant-design-vue';

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(localStorage.getItem('isLoggedIn') === 'true');
  const adminPassword = ref(localStorage.getItem('adminPassword') || 'admin');

  function login(password: string) {
    if (password === adminPassword.value) {
      isLoggedIn.value = true;
      localStorage.setItem('isLoggedIn', 'true');
      return true;
    }
    return false;
  }

  function logout() {
    isLoggedIn.value = false;
    localStorage.removeItem('isLoggedIn');
    window.location.reload();
  }

  function changePassword(oldPassword: string, newPassword: string) {
    if (oldPassword !== adminPassword.value) {
      throw new Error('Mật khẩu cũ không đúng');
    }
    adminPassword.value = newPassword;
    localStorage.setItem('adminPassword', newPassword);
    message.success('Đổi mật khẩu thành công');
  }

  return { isLoggedIn, login, logout, changePassword };
});
