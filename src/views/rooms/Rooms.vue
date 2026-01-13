<template>
  <div>
    <!-- Filters and Search -->
    <div class="flex flex-col md:flex-row justify-between mb-6 gap-4">
      <a-radio-group v-model:value="filterStatus" button-style="solid">
        <a-radio-button value="all">Tất cả</a-radio-button>
        <a-radio-button value="empty">Trống</a-radio-button>
        <a-radio-button value="in-use">Đang sử dụng</a-radio-button>
        <a-radio-button value="overdue">Quá hạn</a-radio-button>
      </a-radio-group>
      <a-input-search
        v-model:value="searchText"
        placeholder="Tìm phòng..."
        style="width: 250px"
      />
    </div>

    <!-- Room Grid -->
    <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      <div
        v-for="room in filteredRooms"
        :key="room.id"
        class="room-card relative h-32 rounded-lg shadow-sm border-2 cursor-pointer transition-all hover:shadow-md flex flex-col items-center justify-center text-center p-2"
        :class="getStatusColor(room)"
        @click="handleRoomClick(room)"
      >
        <div class="text-2xl font-bold mb-1">{{ room.name }}</div>
        <div class="text-3xl font-bold mb-1">
            <span v-if="room.status === 'empty'">O</span>
            <span v-if="room.status === 'in-use'">X</span>
            <span v-if="room.status === 'overdue'">!</span>
        </div>
        <div v-if="room.customer" class="text-sm truncate w-full px-2" :title="room.customer.name">
           {{ room.customer.name }}
           <div class="text-xs opacity-75">{{ getDuration(room) }}</div>
        </div>
      </div>
    </div>

    <!-- Check In Modal -->
    <a-modal v-model:open="checkInVisible" title="Nhận Phòng" @ok="handleCheckIn">
      <a-form layout="vertical">
        <a-form-item label="Khách hàng">
          <a-input v-model:value="checkInForm.name" placeholder="Họ tên (Không bắt buộc)" />
        </a-form-item>
        <a-form-item label="Điện thoại">
          <a-input v-model:value="checkInForm.phone" placeholder="SĐT (Không bắt buộc)" />
        </a-form-item>
        <a-form-item label="CCCD">
          <a-input v-model:value="checkInForm.citizenId" placeholder="CCCD (Không bắt buộc)" />
        </a-form-item>
        <a-form-item label="Tiền cọc (.000 VND)">
           <a-input-number v-model:value="checkInForm.deposit" class="w-full" 
                :formatter="(value: any) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                :parser="(value: string) => value.replace(/\$\s?|(,*)/g, '')" />
        </a-form-item>
        <a-form-item label="Ghi chú">
          <a-textarea v-model:value="checkInForm.note" />
        </a-form-item>
      </a-form>
    </a-modal>

    <!-- Room Detail / Checkout Modal -->
    <a-modal v-model:open="detailVisible" title="Chi tiết phòng" width="800px" 
       :footer="null" 
       centered
       :maskClosable="false"
     >
       <div v-if="selectedRoom && selectedRoom.customer" class="flex flex-col gap-6">
          <!-- Info Section -->
          <div class="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
             <div><strong>Khách:</strong> {{ selectedRoom.customer.name || 'Khách vãng lai' }}</div>
             <div><strong>SĐT:</strong> {{ selectedRoom.customer.phone || '---' }}</div>
             <div><strong>Vào lúc:</strong> {{ formatDate(selectedRoom.customer.checkInTime) }}</div>
             <div><strong>Hạn lúc:</strong> {{ formatDate(hotelStore.getDueTime(selectedRoom.customer.checkInTime, hotelStore.limitTime).toISOString()) }}</div>
             <div><strong>Thời lượng:</strong> {{ getDuration(selectedRoom) }}</div>
             <div><strong>Cọc:</strong> {{ formatPrice(selectedRoom.customer.deposit) }}</div>
          </div>

          <!-- Services Section -->
          <div>
            <div class="flex justify-between items-center mb-2">
               <h3 class="font-bold">Dịch vụ sử dụng</h3>
               <a-button type="dashed" size="small" @click="serviceModalVisible = true">Thêm dịch vụ</a-button>
            </div>
            <a-table 
               :dataSource="selectedRoom.usage" 
               :columns="usageColumns" 
               pagination="false" 
               size="small"
               rowKey="serviceId"
            >
               <template #bodyCell="{ column, record }">
                  <template v-if="column.key === 'name'">
                     {{ getServiceName(record.serviceId) }}
                  </template>
                  <template v-if="column.key === 'price'">
                     {{ formatPrice(record.price) }}
                  </template>
                  <template v-if="column.key === 'total'">
                     {{ formatPrice(record.price * record.quantity) }}
                  </template>
               </template>
            </a-table>
          </div>

          <!-- Actions -->
          <div class="flex justify-end gap-2 mt-4 border-t pt-4">
             <a-button @click="detailVisible = false">Đóng</a-button>
             <a-button type="primary" danger @click="openCheckout">Trả Phòng</a-button>
          </div>
       </div>
    </a-modal>

    <!-- Add Service Modal -->
    <a-modal v-model:open="serviceModalVisible" title="Thêm dịch vụ" @ok="handleAddService">
       <a-form layout="vertical">
          <a-form-item label="Chọn dịch vụ">
             <a-select v-model:value="serviceForm.serviceId" show-search optionFilterProp="label">
                <a-select-option v-for="s in hotelStore.services" :key="s.id" :value="s.id" :label="s.name">
                   {{ s.name }} - {{ formatPrice(s.price) }}
                </a-select-option>
             </a-select>
          </a-form-item>
          <a-form-item label="Số lượng">
             <a-input-number v-model:value="serviceForm.quantity" :min="1" class="w-full" />
          </a-form-item>
       </a-form>
    </a-modal>

    <!-- Checkout / Payment Modal -->
    <a-modal v-model:open="checkoutVisible" title="Thanh toán" width="700px" @ok="confirmCheckout" okText="Xác nhận thanh toán">
       <div v-if="checkoutInvoice">
          <a-table :dataSource="checkoutInvoice" :columns="invoiceColumns" pagination="false" bordered size="small">
              <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'name'">
                      <a-input v-if="record.isCustom" v-model:value="record.name" size="small" />
                      <span v-else>{{ record.name }}</span>
                  </template>
                  <template v-if="column.key === 'quantity'">
                      <a-input-number v-model:value="record.quantity" :min="1" size="small" @change="recalcTotal(record)" />
                  </template>
                  <template v-if="column.key === 'price'">
                      <a-input-number v-model:value="record.price" size="small" @change="recalcTotal(record)" 
                         :formatter="(value: any) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                         :parser="(value: string) => value.replace(/\$\s?|(,*)/g, '')" />
                  </template>
                  <template v-if="column.key === 'total'">
                      <span class="font-bold">{{ formatPrice(record.total) }}</span>
                  </template>
                  <template v-if="column.key === 'action'">
                      <a-button v-if="record.isCustom" type="link" danger size="small" @click="removeInvoiceItem(index)">Xóa</a-button>
                  </template>
              </template>
          </a-table>

           <div class="mt-4 flex justify-between items-center">
               <a-button type="dashed" @click="addCustomItem">Thêm mục khác</a-button>
               <div class="text-right text-xl">
                   <div>Tổng cộng: <strong>{{ formatTotal(invoiceTotal) }}</strong></div>
                   <div class="text-red-500">Đã cọc: -{{ formatTotal(depositAmount) }}</div>
                   <div class="border-t pt-2 mt-2 font-bold text-blue-600">Thanh toán: {{ formatTotal(invoiceTotal - depositAmount) }}</div>
               </div>
           </div>
       </div>
    </a-modal>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onUnmounted } from 'vue';
import { useHotelStore } from '../../stores/hotel';
import type { Room } from '../../stores/hotel';
import { message } from 'ant-design-vue';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
dayjs.extend(duration);

const hotelStore = useHotelStore();

// --- Filters & Grid ---
const filterStatus = ref('all');
const searchText = ref('');

const filteredRooms = computed(() => {
  return hotelStore.rooms.filter(room => {
    // 1. Check status
    // Note: 'overdue' relies on runtime calculation but status property might need sync.
    // In strict reactive flow, we can calc overdue here.
    let matchesStatus = true;
    const isOver = hotelStore.isOverdue(room);
    
    if (filterStatus.value === 'empty') matchesStatus = room.status === 'empty';
    if (filterStatus.value === 'in-use') matchesStatus = room.status === 'in-use' || (room.status === 'overdue' && !isOver); // Basic 'in-use' includes non-overdue
    if (filterStatus.value === 'overdue') matchesStatus = isOver;
    if (filterStatus.value === 'all') matchesStatus = true;

    // 2. Search
    const matchesSearch = room.name.toLowerCase().includes(searchText.value.toLowerCase());
    return matchesStatus && matchesSearch;
  });
});

const getStatusColor = (room: Room) => {
   if (room.status === 'empty') return 'bg-white border-gray-300 text-gray-400 hover:border-blue-300';
   if (hotelStore.isOverdue(room)) return 'bg-orange-100 border-orange-500 text-orange-600';
   return 'bg-blue-100 border-blue-500 text-blue-600'; // In Use
};

// --- Check In ---
const checkInVisible = ref(false);
const selectedRoomId = ref<string | null>(null);
const checkInForm = reactive({ name: '', phone: '', citizenId: '', deposit: 0, note: '' });

const handleRoomClick = (room: Room) => {
   selectedRoomId.value = room.id;
   if (room.status === 'empty') {
      // Open CheckIn
      checkInForm.name = ''; checkInForm.phone = ''; checkInForm.citizenId = ''; checkInForm.deposit = 0; checkInForm.note = '';
      checkInVisible.value = true;
   } else {
      // Open Detail
      openDetail(room);
   }
};

const handleCheckIn = () => {
   if (selectedRoomId.value) {
      hotelStore.checkIn(selectedRoomId.value, { ...checkInForm });
      message.success('Nhận phòng thành công');
      checkInVisible.value = false;
   }
};

// --- Detail & Service ---
const detailVisible = ref(false);
const selectedRoom = ref<Room | null>(null);
const serviceModalVisible = ref(false);
const serviceForm = reactive({ serviceId: '', quantity: 1 });

const openDetail = (room: Room) => {
   selectedRoom.value = room;
   detailVisible.value = true;
};

const usageColumns = [
    { title: 'Dịch vụ', key: 'name' },
    { title: 'Đơn giá', key: 'price' },
    { title: 'SL', dataIndex: 'quantity' },
    { title: 'Thành tiền', key: 'total' },
];

const getServiceName = (id: string) => hotelStore.services.find(s => s.id === id)?.name || 'Unknown';

const handleAddService = () => {
   if (!serviceForm.serviceId || !selectedRoom.value) return;
   const service = hotelStore.services.find(s => s.id === serviceForm.serviceId);
   if (service) {
      hotelStore.addServiceToRoom(selectedRoom.value.id, service, serviceForm.quantity);
      message.success('Đã thêm dịch vụ');
      serviceForm.serviceId = '';
      serviceForm.quantity = 1;
      serviceModalVisible.value = false;
   }
};

// --- Checkout ---
const checkoutVisible = ref(false);
const checkoutInvoice = ref<any[]>([]);
const depositAmount = ref(0);

const invoiceColumns = [
    { title: 'Hạng mục', dataIndex: 'name', key: 'name' },
    { title: 'Đơn giá (.000 VND)', dataIndex: 'price', key: 'price' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Thành tiền (.000 VND)', key: 'total' },
    { title: '', key: 'action' }
];

const openCheckout = () => {
   if (!selectedRoom.value || !selectedRoom.value.customer) return;
   
   // Build Invoice
   // 1. Blocks
   const blocks = hotelStore.calculateBlocks(selectedRoom.value.customer.checkInTime, hotelStore.limitTime);
   const blockItem = {
      name: `Tiền giờ (${blocks} block)`,
      price: hotelStore.blockPrice,
      quantity: blocks, /* Logical quantity is 1 block-set, but implementation says "Touching due time is a block" so let's treat quantity as blocks and price as blockPrice */
      // Actually, if price is per block, quantity is blocks.
      total: blocks * hotelStore.blockPrice,
      isCustom: false
   };
   
   // 2. Services
   const serviceItems = selectedRoom.value.usage.map(u => ({
       name: getServiceName(u.serviceId),
       price: u.price,
       quantity: u.quantity,
       total: u.price * u.quantity,
       isCustom: false
   }));

   checkoutInvoice.value = [blockItem, ...serviceItems];
   depositAmount.value = selectedRoom.value.customer.deposit;
   checkoutVisible.value = true;
};

const recalcTotal = (record: any) => {
   record.total = record.price * record.quantity;
};

const invoiceTotal = computed(() => {
   return checkoutInvoice.value.reduce((sum, item) => sum + item.total, 0);
});

const removeInvoiceItem = (index: number) => {
   checkoutInvoice.value.splice(index, 1);
};

const addCustomItem = () => {
   checkoutInvoice.value.push({
      name: 'Chi phí khác',
      price: 0,
      quantity: 1,
      total: 0,
      isCustom: true
   });
};

const confirmCheckout = () => {
   if (selectedRoom.value) {
       hotelStore.checkOut(selectedRoom.value.id);
       message.success('Thanh toán thành công. Phòng đã trống.');
       checkoutVisible.value = false;
       detailVisible.value = false;
   }
};


// --- Utilities ---
const formatDate = (iso: string) => dayjs(iso).format('HH:mm DD/MM/YYYY');
const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const formatTotal = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + '.000';

const now = ref(dayjs());
const timer = setInterval(() => { now.value = dayjs(); }, 60000);
onUnmounted(() => clearInterval(timer));

const getDuration = (room: Room) => {
   if (!room.customer) return '';
   const diff = now.value.diff(dayjs(room.customer!.checkInTime));
   const dur = dayjs.duration(diff);
   const days = Math.floor(dur.asDays());
   const hours = dur.hours();
   const mins = dur.minutes();
   if (days > 0) return `${days}d ${hours}h`;
   return `${hours}h ${mins}m`;
};
</script>

<style scoped>
.room-card:hover {
   transform: translateY(-2px);
}
</style>
