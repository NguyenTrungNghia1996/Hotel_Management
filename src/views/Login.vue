<template>
  <div class="flex items-center justify-center min-h-screen bg-gray-100">
    <div class="p-8 bg-white rounded shadow-md w-96">
      <h2 class="mb-6 text-2xl font-bold text-center text-gray-800">Đăng Nhập Quản Trị</h2>
      <a-form :model="formState" @finish="onFinish" layout="vertical">
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
          <a-button type="primary" html-type="submit" block :loading="loading" size="large">Đăng Nhập</a-button>
        </a-form-item>
      </a-form>
      <div class="text-center mt-4 text-gray-500 text-sm">
        Mặc định: admin / admin
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

const onFinish = (values: any) => {
  loading.value = true;
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
