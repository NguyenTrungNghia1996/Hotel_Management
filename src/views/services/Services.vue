<template>
  <div class="max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold">Quản lý dịch vụ</h2>
      <a-button type="primary" @click="openModal()">Thêm Dịch Vụ</a-button>
    </div>

    <a-table :dataSource="hotelStore.services" :columns="columns" rowKey="id" bordered>
       <template #bodyCell="{ column, record }">
          <template v-if="column.key === 'price'">
             {{ formatPrice(record.price) }}
          </template>
          <template v-if="column.key === 'action'">
             <a-button type="link" @click="openModal(record)">Sửa</a-button>
             <a-popconfirm title="Xóa dịch vụ này?" @confirm="hotelStore.deleteService(record.id)">
               <a-button type="link" danger>Xóa</a-button>
             </a-popconfirm>
          </template>
       </template>
    </a-table>

    <a-modal v-model:open="modalVisible" :title="editingId ? 'Sửa dịch vụ' : 'Thêm dịch vụ'" @ok="handleOk">
       <a-form layout="vertical">
          <a-form-item label="Tên dịch vụ">
             <a-input v-model:value="formState.name" />
          </a-form-item>
          <a-form-item label="Giá (.000 VND)">
             <a-input-number v-model:value="formState.price" class="w-full" 
                :formatter="(value: any) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                :parser="(value: string) => value.replace(/\$\s?|(,*)/g, '')"
             />
          </a-form-item>
       </a-form>
    </a-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useHotelStore } from '../../stores/hotel';
import type { Service } from '../../stores/hotel';
import { message } from 'ant-design-vue';

const hotelStore = useHotelStore();

const columns = [
  { title: 'Tên dịch vụ', dataIndex: 'name', key: 'name' },
  { title: 'Giá (.000 VND)', dataIndex: 'price', key: 'price' },
  { title: 'Hành động', key: 'action', width: 200 },
];

const modalVisible = ref(false);
const editingId = ref<string | null>(null);
const formState = reactive({ name: '', price: 0 });

const openModal = (service?: Service) => {
   if (service) {
      editingId.value = service.id;
      formState.name = service.name;
      formState.price = service.price;
   } else {
      editingId.value = null;
      formState.name = '';
      formState.price = 0;
   }
   modalVisible.value = true;
};

const handleOk = () => {
   if (!formState.name) return message.error('Nhập tên dịch vụ');
   if (editingId.value) {
      hotelStore.updateService(editingId.value, formState.name, formState.price);
      message.success('Đã cập nhật dịch vụ');
   } else {
      hotelStore.addService(formState.name, formState.price);
      message.success('Đã thêm dịch vụ');
   }
   modalVisible.value = false;
};

const formatPrice = (value: number) => {
   return new Intl.NumberFormat('vi-VN').format(value);
};
</script>
