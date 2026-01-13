<template>
  <div class="relative min-h-screen overflow-x-hidden bg-[var(--bg)]">
    <div class="absolute -left-32 -top-40 h-72 w-72 rounded-full bg-emerald-200/60 blur-3xl"></div>
    <div class="absolute -right-24 top-20 h-80 w-80 rounded-full bg-amber-200/70 blur-3xl"></div>
    <div class="absolute bottom-0 left-10 h-56 w-56 rounded-full bg-rose-200/60 blur-3xl"></div>

    <div class="relative z-10 flex min-h-screen items-center justify-center px-6 py-12">
      <div class="grid w-full max-w-5xl gap-8 rounded-[32px] bg-white/70 p-6 shadow-[0_30px_80px_rgba(24,26,28,0.18)] backdrop-blur md:grid-cols-[1.1fr,0.9fr] md:p-8">
        <div class="flex flex-col justify-between rounded-3xl bg-gradient-to-br from-[#1f8a70] via-[#1b6d5b] to-[#0f3d35] p-8 text-white">
          <div>
            <div class="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/80">
              Admin Hotel
            </div>
            <h1 class="font-display mt-6 text-4xl leading-tight">
              Điều phối vận hành khách sạn
            </h1>
            <p class="mt-4 text-sm text-white/80">
              Kiểm soát phòng, dịch vụ và thanh toán trong một bảng điều khiển duy nhất.
            </p>
          </div>
          <div class="space-y-3 text-sm text-white/80">
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-amber-300"></span>
              Cập nhật tình trạng phòng theo thời gian thực
            </div>
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-amber-300"></span>
              Theo dõi doanh thu dịch vụ theo ca
            </div>
            <div class="flex items-center gap-2">
              <span class="h-2 w-2 rounded-full bg-amber-300"></span>
              Rút gọn thao tác thanh toán cho lễ tân
            </div>
          </div>
        </div>

        <div class="flex flex-col justify-center px-2">
          <div class="mb-6">
            <div class="text-xs uppercase tracking-[0.3em] text-emerald-700">Đăng nhập</div>
            <h2 class="font-display mt-2 text-3xl text-slate-900">Quản trị hệ thống</h2>
            <p class="mt-2 text-sm text-slate-500">
              Vui lòng sử dụng tài khoản quản trị để tiếp tục.
            </p>
          </div>

          <a-form :model="formState" @finish="onFinish" layout="vertical" class="space-y-2">
            <a-form-item
              label="Tên đăng nhập"
              name="username"
              :rules="[{ required: true, message: 'Vui lòng nhập tên đăng nhập!' }]"
            >
              <a-input v-model:value="formState.username" placeholder="Nhập tên đăng nhập (admin)" size="large" />
            </a-form-item>

            <a-form-item
              label="Mật khẩu"
              name="password"
              :rules="[{ required: true, message: 'Vui lòng nhập mật khẩu!' }]"
            >
              <a-input-password v-model:value="formState.password" placeholder="Nhập mật khẩu" size="large" />
            </a-form-item>

            <a-form-item>
              <a-button type="primary" html-type="submit" block :loading="loading" size="large">
                Bắt đầu làm việc
              </a-button>
            </a-form-item>
          </a-form>

          <div class="mt-4 inline-flex items-center gap-2 rounded-full bg-amber-100 px-4 py-2 text-xs text-amber-800">
            Mặc định: admin / admin
          </div>
          <div class="mt-3 rounded-2xl bg-slate-100 px-4 py-3 text-xs text-slate-700">
            Giờ NTP (Hà Nội): {{ authStore.ntpTimestamp ? formatNtp(authStore.ntpTimestamp) : 'Không thể lấy thời gian' }}
          </div>
          <div v-if="authStore.isLocked" class="mt-3 rounded-2xl bg-rose-50 px-4 py-3 text-xs text-rose-700">
            {{ authStore.lockMessage }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';
import { message } from 'ant-design-vue';

const authStore = useAuthStore();
const router = useRouter();
const loading = ref(false);

const formState = reactive({
  username: '',
  password: '',
});

const formatNtp = (value: string) => value.replace('T', ' ').replace('+07:00', '');

const onFinish = (values: any) => {
  loading.value = true;
  if (authStore.isLocked) {
    message.error(authStore.lockMessage);
    loading.value = false;
    return;
  }
  if (values.username !== 'admin') {
    message.error('Tên đăng nhập không đúng');
    loading.value = false;
    return;
  }

  if (authStore.login(values.password)) {
    message.success('Đăng nhập thành công');
    router.push('/');
  } else {
    message.error('Mật khẩu không đúng');
  }
  loading.value = false;
};
</script>
