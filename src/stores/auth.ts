import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { message } from 'ant-design-vue';

export const useAuthStore = defineStore('auth', () => {
  const isLoggedIn = ref(false);
  const adminPassword = ref(localStorage.getItem('adminPassword') || 'admin');
  const lockReason = ref(localStorage.getItem('authLockReason') || '');
  const ntpTimestamp = ref(localStorage.getItem('ntpTimestamp') || '');
  const expiryTimestamp = ref(localStorage.getItem('expiryTimestamp') || '');

  const isLocked = computed(() => lockReason.value !== '');
  const lockMessage = computed(() => {
    if (lockReason.value === 'unreachable') {
      return 'Không thể kết nối NTP Server. Vui lòng kiểm tra mạng.';
    }
    if (lockReason.value === 'expired') {
      return 'Ứng dụng đã vượt quá thời hạn sử dụng.';
    }
    if (lockReason.value === 'ipc_unavailable') {
      return 'Không thể xác thực thời gian hệ thống.';
    }
    return 'Không thể đăng nhập vào hệ thống.';
  });

  function login(password: string) {
    if (isLocked.value) {
      return false;
    }
    if (password === adminPassword.value) {
      isLoggedIn.value = true;
      return true;
    }
    return false;
  }

  function logout(reload = true) {
    isLoggedIn.value = false;
    if (reload) {
      window.location.reload();
    }
  }

  function setLock(reason: string) {
    lockReason.value = reason;
    localStorage.setItem('authLockReason', reason);
    isLoggedIn.value = false;
  }

  function clearLock() {
    lockReason.value = '';
    localStorage.removeItem('authLockReason');
  }

  function setNtpTimestamp(value: string | null) {
    if (value) {
      ntpTimestamp.value = value;
      localStorage.setItem('ntpTimestamp', value);
    } else {
      ntpTimestamp.value = '';
      localStorage.removeItem('ntpTimestamp');
    }
  }

  function setExpiryTimestamp(value: string | null) {
    if (value) {
      expiryTimestamp.value = value;
      localStorage.setItem('expiryTimestamp', value);
    } else {
      expiryTimestamp.value = '';
      localStorage.removeItem('expiryTimestamp');
    }
  }

  function changePassword(oldPassword: string, newPassword: string) {
    if (oldPassword !== adminPassword.value) {
      throw new Error('Mật khẩu cũ không đúng');
    }
    adminPassword.value = newPassword;
    localStorage.setItem('adminPassword', newPassword);
    message.success('Đổi mật khẩu thành công');
  }

  return {
    isLoggedIn,
    isLocked,
    lockMessage,
    ntpTimestamp,
    expiryTimestamp,
    login,
    logout,
    setLock,
    clearLock,
    setNtpTimestamp,
    setExpiryTimestamp,
    changePassword
  };
});
