<template>
  <div class="space-y-6">
    <div class="surface-card p-6">
      <div class="mb-6">
        <div class="text-xs uppercase tracking-[0.3em] text-emerald-700">Cài đặt</div>
        <h3 class="font-display mt-2 text-2xl text-slate-900">Cài đặt chung</h3>
        <p class="mt-2 text-sm text-slate-500">Thiết lập giờ giới hạn và giá phòng áp dụng toàn hệ thống.</p>
      </div>
      <a-form layout="vertical">
        <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
          <a-form-item label="Giờ trả phòng giới hạn (hàng ngày)">
            <a-time-picker v-model:value="timeValue" format="HH:mm" @change="onTimeChange" class="w-full" />
            <small class="text-slate-500">Mặc định: 11:00</small>
          </a-form-item>
          <a-form-item label="Giá phòng (1 Block)">
            <a-input-number v-model:value="hotelStore.blockPrice" class="w-full"
              :formatter="(value: any) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
              :parser="(value: string) => value.replace(/\$\s?|(,*)/g, '')"
              addon-after=".000 VND"
            />
          </a-form-item>
        </div>
      </a-form>
    </div>

    <div class="surface-card p-6">
      <div class="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div class="text-xs uppercase tracking-[0.3em] text-emerald-700">Phòng</div>
          <h3 class="font-display mt-2 text-2xl text-slate-900">Quản lý phòng</h3>
          <p class="mt-2 text-sm text-slate-500">Thêm phòng mới hoặc xóa phòng không còn sử dụng.</p>
        </div>
        <div class="flex gap-2">
          <a-input v-model:value="newRoomName" placeholder="Tên phòng mới" class="w-48" />
          <a-button type="primary" @click="handleAddRoom">Thêm Phòng</a-button>
        </div>
      </div>
      <a-list :data-source="hotelStore.rooms" bordered>
        <template #renderItem="{ item }">
          <a-list-item>
            <template #actions>
              <a-space>
                <a-button v-if="editingRoomId !== item.id" type="text" @click="startEditRoom(item)">Sửa</a-button>
                <a-button v-else type="text" @click="saveEditRoom(item.id)">Lưu</a-button>
                <a-button v-if="editingRoomId === item.id" type="text" @click="cancelEditRoom">Hủy</a-button>
                <a-popconfirm v-if="editingRoomId !== item.id" title="Bạn có chắc muốn xóa?" @confirm="hotelStore.deleteRoom(item.id)">
                  <a-button danger type="text">Xóa</a-button>
                </a-popconfirm>
              </a-space>
            </template>
            <span v-if="editingRoomId !== item.id" class="font-medium">{{ item.name }}</span>
            <a-input v-else v-model:value="editRoomName" class="w-48" />
          </a-list-item>
        </template>
      </a-list>
    </div>

    <div class="surface-card p-6">
      <div class="mb-6">
        <div class="text-xs uppercase tracking-[0.3em] text-emerald-700">Bảo mật</div>
        <h3 class="font-display mt-2 text-2xl text-slate-900">Đổi mật khẩu Admin</h3>
        <p class="mt-2 text-sm text-slate-500">Tăng bảo mật bằng cách cập nhật mật khẩu định kỳ.</p>
      </div>
      <a-form layout="vertical" :model="passwordState" @finish="onChangePassword">
        <a-form-item label="Mật khẩu cũ" name="oldPassword" :rules="[{ required: true, message: 'Nhập mật khẩu cũ' }]">
          <a-input-password v-model:value="passwordState.oldPassword" />
        </a-form-item>
        <a-form-item label="Mật khẩu mới" name="newPassword" :rules="[{ required: true, message: 'Nhập mật khẩu mới' }]">
          <a-input-password v-model:value="passwordState.newPassword" />
        </a-form-item>
        <a-form-item label="Nhập lại mật khẩu mới" name="confirmPassword" :rules="[{ required: true, message: 'Nhập lại mật khẩu mới' }]">
          <a-input-password v-model:value="passwordState.confirmPassword" />
        </a-form-item>
        <a-form-item>
          <a-button type="primary" html-type="submit">Cập nhật mật khẩu</a-button>
        </a-form-item>
      </a-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { useHotelStore } from '../../stores/hotel';
import { useAuthStore } from '../../stores/auth';
import dayjs from 'dayjs';
import { message } from 'ant-design-vue';

const hotelStore = useHotelStore();
const authStore = useAuthStore();
const router = useRouter();

// Time Handling
const timeValue = ref(dayjs(hotelStore.limitTime, 'HH:mm'));

const onTimeChange = (time: dayjs.Dayjs) => {
  if (time) {
     hotelStore.limitTime = time.format('HH:mm');
     message.success('Đã lưu giờ giới hạn');
  }
};

// Room Handling
const newRoomName = ref('');
const editingRoomId = ref<string | null>(null);
const editRoomName = ref('');
const handleAddRoom = () => {
   if (!newRoomName.value.trim()) return message.error('Vui lòng nhập tên phòng');
   hotelStore.addRoom(newRoomName.value);
   newRoomName.value = '';
   message.success('Đã thêm phòng');
};

const startEditRoom = (room: { id: string; name: string }) => {
  editingRoomId.value = room.id;
  editRoomName.value = room.name;
};

const cancelEditRoom = () => {
  editingRoomId.value = null;
  editRoomName.value = '';
};

const saveEditRoom = (roomId: string) => {
  const name = editRoomName.value.trim();
  if (!name) return message.error('Vui lòng nhập tên phòng');
  hotelStore.updateRoomName(roomId, name);
  message.success('Đã cập nhật tên phòng');
  cancelEditRoom();
};

// Password Handling
const passwordState = reactive({ oldPassword: '', newPassword: '', confirmPassword: '' });
const onChangePassword = () => {
   if (passwordState.newPassword !== passwordState.confirmPassword) {
      return message.error('Mật khẩu xác nhận không khớp');
   }
   try {
      authStore.changePassword(passwordState.oldPassword, passwordState.newPassword);
      passwordState.oldPassword = '';
      passwordState.newPassword = '';
      passwordState.confirmPassword = '';
      authStore.logout(false);
      router.replace('/login');
   } catch (error: any) {
      message.error(error.message);
   }
};
</script>
