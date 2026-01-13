<template>
  <div class="space-y-6">
    <div class="relative overflow-hidden rounded-[28px] border border-[#f0e6da] bg-gradient-to-br from-white via-[#fff7ef] to-[#f3f6f1] p-6">
      <div class="absolute -right-16 -top-12 h-44 w-44 rounded-full bg-emerald-200/40 blur-2xl"></div>
      <div class="absolute -left-10 bottom-0 h-36 w-36 rounded-full bg-amber-200/40 blur-2xl"></div>
      <div class="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <div class="text-xs uppercase tracking-[0.3em] text-emerald-700">Tổng quan phòng</div>
          <h2 class="font-display mt-2 text-3xl text-slate-900">Theo dõi tình trạng phòng</h2>
          <p class="mt-2 text-sm text-slate-500">
            Quản lý phòng đang sử dụng, phòng trống và cảnh báo quá hạn theo thời gian thực.
          </p>
        </div>
        <div class="grid grid-cols-2 gap-3 md:grid-cols-4">
          <div class="rounded-2xl bg-white/80 p-4 text-sm shadow-sm">
            <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Tổng</div>
            <div class="mt-2 text-2xl font-semibold text-slate-800">{{ roomStats.total }}</div>
          </div>
          <div class="rounded-2xl bg-white/80 p-4 text-sm shadow-sm">
            <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Trống</div>
            <div class="mt-2 text-2xl font-semibold text-emerald-700">{{ roomStats.empty }}</div>
          </div>
          <div class="rounded-2xl bg-white/80 p-4 text-sm shadow-sm">
            <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Đang dùng</div>
            <div class="mt-2 text-2xl font-semibold text-teal-700">{{ roomStats.inUse }}</div>
          </div>
          <div class="rounded-2xl bg-white/80 p-4 text-sm shadow-sm">
            <div class="text-xs uppercase tracking-[0.2em] text-slate-400">Quá hạn</div>
            <div class="mt-2 text-2xl font-semibold text-amber-700">{{ roomStats.overdue }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="surface-card p-4 md:p-5">
      <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <a-radio-group v-model:value="filterStatus" button-style="solid">
          <a-radio-button value="all">Tất cả</a-radio-button>
          <a-radio-button value="empty">Trống</a-radio-button>
          <a-radio-button value="in-use">Đang sử dụng</a-radio-button>
          <a-radio-button value="overdue">Quá hạn</a-radio-button>
        </a-radio-group>
        <a-input-search
          v-model:value="searchText"
          placeholder="Tìm phòng..."
          class="max-w-xs"
          allow-clear
          size="large"
        />
      </div>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <div
        v-for="room in filteredRooms"
        :key="room.id"
        class="room-card group relative cursor-pointer overflow-hidden rounded-2xl border p-4 transition-all"
        :class="getStatusColor(room)"
        @click="handleRoomClick(room)"
      >
        <div class="flex items-start justify-between gap-4">
          <div>
            <div class="text-xl font-semibold">{{ room.name }}</div>
            <div class="mt-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.25em]" :class="getStatusTone(room)">
              <span class="h-2 w-2 rounded-full" :class="getStatusDot(room)"></span>
              <span>{{ getStatusLabel(room) }}</span>
            </div>
          </div>
          <!-- <div class="text-3xl font-bold text-slate-500">
            <span v-if="room.status === 'empty'">O</span>
            <span v-else-if="hotelStore.isOverdue(room)">!</span>
            <span v-else>X</span>
          </div> -->
        </div>
        <div v-if="room.customer" class="mt-4 text-sm text-slate-600">
          <div class="font-medium" :title="room.customer.name">
            {{ room.customer.name || 'Khách vãng lai' }}
          </div>
          <div class="mt-1 text-xs text-slate-500">{{ getDuration(room) }}</div>
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
        <a-form-item label="Giờ quá hạn">
          <a-time-picker
            v-model:value="checkInTimeValue"
            format="HH:mm"
            class="w-full"
            :allowClear="false"
            @change="onCheckInLimitChange"
          />
          <small class="text-slate-500">Mặc định: {{ hotelStore.limitTime }}</small>
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
             <div><strong>Hạn lúc:</strong> {{ formatDate(hotelStore.getDueTime(selectedRoom.customer.checkInTime, getRoomLimitTime(selectedRoom)).toISOString()) }}</div>
             <div><strong>Thời lượng:</strong> {{ getDuration(selectedRoom) }}</div>
             <div><strong>Cọc:</strong> {{ formatPrice(selectedRoom.customer.deposit) }}</div>
          </div>
          <div class="rounded border bg-white p-4">
             <div class="mb-3 font-semibold text-slate-700">Cập nhật khách hàng</div>
             <a-form layout="vertical">
                <div class="grid grid-cols-1 gap-4 md:grid-cols-2">
                   <a-form-item label="Họ tên">
                      <a-input v-model:value="editCustomerForm.name" placeholder="Họ tên khách" />
                   </a-form-item>
                   <a-form-item label="Điện thoại">
                      <a-input v-model:value="editCustomerForm.phone" placeholder="Số điện thoại" />
                   </a-form-item>
                   <a-form-item label="CCCD">
                      <a-input v-model:value="editCustomerForm.citizenId" placeholder="Số CCCD" />
                   </a-form-item>
                   <a-form-item label="Tiền cọc (.000 VND)">
                      <a-input-number v-model:value="editCustomerForm.deposit" class="w-full"
                        :formatter="(value: any) => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
                        :parser="(value: string) => value.replace(/\$\s?|(,*)/g, '')" />
                   </a-form-item>
                   <a-form-item label="Ghi chú" class="md:col-span-2">
                      <a-textarea v-model:value="editCustomerForm.note" :auto-size="{ minRows: 2, maxRows: 4 }" />
                   </a-form-item>
                </div>
                <div class="flex justify-end">
                   <a-button type="primary" @click="saveCustomerEdits">Lưu cập nhật</a-button>
                </div>
             </a-form>
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
               <template #bodyCell="{ column, record, index }">
                  <template v-if="column.key === 'name'">
                     {{ getServiceName(record.serviceId) }}
                  </template>
                  <template v-if="column.key === 'price'">
                     {{ formatPrice(record.price) }}
                  </template>
                  <template v-if="column.key === 'total'">
                     {{ formatPrice(record.price * record.quantity) }}
                  </template>
                  <template v-if="column.key === 'action'">
                     <a-popconfirm title="Xóa dịch vụ này?" @confirm="removeUsageService(index)">
                        <a-button type="link" danger size="small">Xóa</a-button>
                     </a-popconfirm>
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
                      <a-button v-if="record.kind !== 'block'" type="link" danger size="small" @click="removeInvoiceItem(index)">Xóa</a-button>
                  </template>
              </template>
          </a-table>

           <div class="mt-4 flex flex-col gap-3">
               <div class="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                   <div class="flex flex-col gap-2 md:flex-row md:items-end">
                      <a-select v-model:value="invoiceServiceForm.serviceId" show-search optionFilterProp="label" class="w-full md:w-64" placeholder="Chọn dịch vụ">
                         <a-select-option v-for="s in hotelStore.services" :key="s.id" :value="s.id" :label="s.name">
                            {{ s.name }} - {{ formatPrice(s.price) }}
                         </a-select-option>
                      </a-select>
                      <a-input-number v-model:value="invoiceServiceForm.quantity" :min="1" class="w-full md:w-28" />
                      <a-button type="dashed" @click="addInvoiceService">Thêm dịch vụ</a-button>
                   </div>
                   <a-button type="dashed" @click="addCustomItem">Thêm mục khác</a-button>
               </div>
               <div class="flex flex-col items-end gap-2">
                   <div class="text-right text-xl">
                       <div>Tổng cộng: <strong>{{ formatTotal(invoiceTotal) }}</strong></div>
                       <div class="text-red-500">Đã cọc: -{{ formatTotal(depositAmount) }}</div>
                       <div class="border-t pt-2 mt-2 font-bold text-blue-600">Thanh toán: {{ formatTotal(invoiceTotal - depositAmount) }}</div>
                   </div>
                   <a-button type="primary" @click="printInvoice" :disabled="!checkoutInvoice.length">In hóa đơn</a-button>
               </div>
           </div>
       </div>
    </a-modal>

    <iframe id="print-frame" style="display:none;"></iframe>
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
const now = ref(dayjs());

// --- Filters & Grid ---
const filterStatus = ref('all');
const searchText = ref('');

const filteredRooms = computed(() => {
  now.value;
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

const roomStats = computed(() => {
  now.value;
  const total = hotelStore.rooms.length;
  const empty = hotelStore.rooms.filter(room => room.status === 'empty').length;
  const overdue = hotelStore.rooms.filter(room => hotelStore.isOverdue(room)).length;
  return {
    total,
    empty,
    overdue,
    inUse: total - empty
  };
});

const getStatusColor = (room: Room) => {
   if (room.status === 'empty') return 'bg-white border-emerald-100 text-slate-700 hover:border-emerald-300';
   if (hotelStore.isOverdue(room)) return 'bg-[#fff4e6] border-[#f59e0b] text-[#92400e] hover:border-[#f97316]';
   return 'bg-[#eef7f3] border-[#1f8a70] text-[#114b3f] hover:border-[#2aa37f]';
};

const getStatusLabel = (room: Room) => {
  if (room.status === 'empty') return 'Trống';
  if (hotelStore.isOverdue(room)) return 'Quá hạn';
  return 'Đang sử dụng';
};

const getStatusTone = (room: Room) => {
  if (room.status === 'empty') return 'text-emerald-700';
  if (hotelStore.isOverdue(room)) return 'text-amber-700';
  return 'text-emerald-800';
};

const getStatusDot = (room: Room) => {
  if (room.status === 'empty') return 'bg-emerald-300';
  if (hotelStore.isOverdue(room)) return 'bg-amber-500';
  return 'bg-emerald-500';
};

// --- Check In ---
const checkInVisible = ref(false);
const selectedRoomId = ref<string | null>(null);
const checkInForm = reactive({ name: '', phone: '', citizenId: '', deposit: 0, note: '', customLimitTime: hotelStore.limitTime });
const checkInTimeValue = ref(dayjs(hotelStore.limitTime, 'HH:mm'));

const handleRoomClick = (room: Room) => {
   selectedRoomId.value = room.id;
   if (room.status === 'empty') {
      // Open CheckIn
      checkInForm.name = ''; checkInForm.phone = ''; checkInForm.citizenId = ''; checkInForm.deposit = 0; checkInForm.note = '';
      checkInForm.customLimitTime = hotelStore.limitTime;
      checkInTimeValue.value = dayjs(hotelStore.limitTime, 'HH:mm');
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

const onCheckInLimitChange = (time: dayjs.Dayjs | null) => {
  checkInForm.customLimitTime = time ? time.format('HH:mm') : hotelStore.limitTime;
};

// --- Detail & Service ---
const detailVisible = ref(false);
const selectedRoom = ref<Room | null>(null);
const serviceModalVisible = ref(false);
const serviceForm = reactive({ serviceId: '', quantity: 1 });
const editCustomerForm = reactive({ name: '', phone: '', citizenId: '', deposit: 0, note: '' });

const openDetail = (room: Room) => {
   selectedRoom.value = room;
   if (room.customer) {
      editCustomerForm.name = room.customer.name || '';
      editCustomerForm.phone = room.customer.phone || '';
      editCustomerForm.citizenId = room.customer.citizenId || '';
      editCustomerForm.deposit = room.customer.deposit || 0;
      editCustomerForm.note = room.customer.note || '';
   }
   detailVisible.value = true;
};

const usageColumns = [
    { title: 'Dịch vụ', key: 'name' },
    { title: 'Đơn giá', key: 'price' },
    { title: 'SL', dataIndex: 'quantity' },
    { title: 'Thành tiền', key: 'total' },
    { title: 'Hành động', key: 'action' },
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

const saveCustomerEdits = () => {
   if (!selectedRoom.value || !selectedRoom.value.customer) return;
   const deposit = Number(editCustomerForm.deposit) || 0;
   hotelStore.updateRoomCustomer(selectedRoom.value.id, {
      name: editCustomerForm.name?.trim() || '',
      phone: editCustomerForm.phone?.trim() || '',
      citizenId: editCustomerForm.citizenId?.trim() || '',
      deposit,
      note: editCustomerForm.note?.trim() || ''
   });
   message.success('Đã cập nhật thông tin khách hàng');
};

const removeUsageService = (usageIndex: number) => {
   if (!selectedRoom.value) return;
   hotelStore.removeServiceFromRoom(selectedRoom.value.id, usageIndex);
   message.success('Đã xóa dịch vụ');
};

// --- Checkout ---
const checkoutVisible = ref(false);
const checkoutInvoice = ref<any[]>([]);
const depositAmount = ref(0);
const invoiceServiceForm = reactive({ serviceId: '', quantity: 1 });

const invoiceColumns = [
    { title: 'Hạng mục', dataIndex: 'name', key: 'name' },
    { title: 'Đơn giá (.000 VND)', dataIndex: 'price', key: 'price' },
    { title: 'SL', dataIndex: 'quantity', key: 'quantity' },
    { title: 'Thành tiền (.000 VND)', key: 'total' },
    { title: 'Hành động', key: 'action' }
];

const openCheckout = () => {
   if (!selectedRoom.value || !selectedRoom.value.customer) return;
   
   // Build Invoice
   // 1. Blocks
   const blocks = hotelStore.calculateBlocks(selectedRoom.value.customer.checkInTime, getRoomLimitTime(selectedRoom.value));
   const blockItem = {
      name: `Tiền giờ (${blocks} block)`,
      price: hotelStore.blockPrice,
      quantity: blocks, /* Logical quantity is 1 block-set, but implementation says "Touching due time is a block" so let's treat quantity as blocks and price as blockPrice */
      // Actually, if price is per block, quantity is blocks.
      total: blocks * hotelStore.blockPrice,
      kind: 'block'
   };
   
   // 2. Services
   const serviceItems = selectedRoom.value.usage.map(u => ({
       serviceId: u.serviceId,
       name: getServiceName(u.serviceId),
       price: u.price,
       quantity: u.quantity,
       total: u.price * u.quantity,
       kind: 'service'
   }));

   checkoutInvoice.value = [blockItem, ...serviceItems];
   depositAmount.value = selectedRoom.value.customer.deposit;
   invoiceServiceForm.serviceId = '';
   invoiceServiceForm.quantity = 1;
   checkoutVisible.value = true;
};

const recalcTotal = (record: any) => {
   record.total = record.price * record.quantity;
};

const invoiceTotal = computed(() => {
   return checkoutInvoice.value.reduce((sum, item) => sum + item.total, 0);
});

const removeInvoiceItem = (index: number) => {
   const item = checkoutInvoice.value[index];
   if (!item || item.kind === 'block') return;
   checkoutInvoice.value.splice(index, 1);
};

const insertInvoiceItem = (item: any) => {
   const firstCustomIndex = checkoutInvoice.value.findIndex(it => it.kind === 'custom');
   if (firstCustomIndex === -1) {
      checkoutInvoice.value.push(item);
      return;
   }
   checkoutInvoice.value.splice(firstCustomIndex, 0, item);
};

const addInvoiceService = () => {
   if (!invoiceServiceForm.serviceId) {
      message.error('Chọn dịch vụ');
      return;
   }
   const service = hotelStore.services.find(s => s.id === invoiceServiceForm.serviceId);
   if (!service) {
      message.error('Không tìm thấy dịch vụ');
      return;
   }
   const quantity = Number(invoiceServiceForm.quantity) || 0;
   if (quantity <= 0) {
      message.error('Số lượng phải lớn hơn 0');
      return;
   }
   const existing = checkoutInvoice.value.find(item => item.kind === 'service' && item.serviceId === service.id && item.price === service.price);
   if (existing) {
      existing.quantity += quantity;
      recalcTotal(existing);
   } else {
      insertInvoiceItem({
         serviceId: service.id,
         name: service.name,
         price: service.price,
         quantity,
         total: service.price * quantity,
         kind: 'service'
      });
   }
   invoiceServiceForm.serviceId = '';
   invoiceServiceForm.quantity = 1;
};

const addCustomItem = () => {
   checkoutInvoice.value.push({
      name: 'Chi phí khác',
      price: 0,
      quantity: 1,
      total: 0,
      kind: 'custom'
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

type PrintInvoiceItem = {
  name: string;
  quantity: number;
  price: number;
  total: number;
};

type PrintPayload = {
  code: string;
  roomName: string;
  customerName: string;
  customerPhone: string;
  checkInTime: string;
  checkOutTime: string;
  items: PrintInvoiceItem[];
  total: number;
  deposit: number;
  payable: number;
  note?: string;
};

const buildInvoiceCode = () => dayjs().format('YYMMDD-HHmm');

const buildPrintPayload = (): PrintPayload | null => {
   if (!selectedRoom.value || !selectedRoom.value.customer) return null;
   const customer = selectedRoom.value.customer;
   const items = checkoutInvoice.value.map(item => ({
      name: item.name || 'Chi phí khác',
      quantity: Number(item.quantity) || 0,
      price: Number(item.price) || 0,
      total: Number(item.total) || 0
   }));

   return {
      code: buildInvoiceCode(),
      roomName: selectedRoom.value.name,
      customerName: customer.name || 'Khách vãng lai',
      customerPhone: customer.phone || '---',
      checkInTime: formatDate(customer.checkInTime),
      checkOutTime: formatDate(dayjs().toISOString()),
      items,
      total: invoiceTotal.value,
      deposit: depositAmount.value || 0,
      payable: invoiceTotal.value - (depositAmount.value || 0),
      note: customer.note
   };
};

const printInvoice = () => {
   const payload = buildPrintPayload();
   if (!payload) return;
   const iframe = document.getElementById('print-frame') as HTMLIFrameElement | null;
   if (!iframe || !iframe.contentWindow) {
      message.error('Không thể mở khung in');
      return;
   }

   const html = generatePrintableHtml(payload);
   const doc = iframe.contentWindow.document;

   doc.open();
   doc.write(`
  <html>
    <head>
      <title>Hóa đơn</title>
      <style>
        @page { size: 80mm auto; margin: 0 }
        body {
          font-family: monospace;
          font-size: 13px;
          width: 76mm;
          padding: 6mm 4mm;
          margin: 0;
        }
        hr {
          border: none;
          border-top: 1px dashed #111827;
          margin: 10px 0;
        }
        .row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
        }
        .label {
          text-align: left;
          white-space: nowrap;
        }
        .value {
          text-align: right;
          word-break: break-word;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: fixed;
        }
        th, td {
          word-break: break-word;
          padding: 4px 0;
          font-size: 13px;
        }
        th:nth-child(1), td:nth-child(1) { width: 46%; text-align: left; }
        th:nth-child(2), td:nth-child(2) { width: 14%; text-align: center; }
        th:nth-child(3), td:nth-child(3) { width: 20%; text-align: right; }
        th:nth-child(4), td:nth-child(4) { width: 20%; text-align: right; }
      </style>
    </head>
    <body onload="window.print()">
      ${html}
    </body>
  </html>
`);
   doc.close();
};

const generatePrintableHtml = (payload: PrintPayload) => {
   const itemRows = payload.items.map(item => `
      <tr>
        <td>${item.name}</td>
        <td>${item.quantity}</td>
        <td>${formatCompact(item.price)}</td>
        <td>${formatCompact(item.total)}</td>
      </tr>
   `).join('');

   return `
    <div style="font-family: monospace; font-size: 14px; width: 100%;">
      <div style="text-align:center; font-weight:bold; font-size:16px;">HÓA ĐƠN THANH TOÁN</div>
      <div style="text-align:center;">Mã HĐ: <b>${payload.code}</b></div>
      <div style="text-align:center; margin-bottom:6px;">Phòng: <b>${payload.roomName}</b></div>
      <div class="row"><span class="label">Khách</span><span class="value">${payload.customerName}</span></div>
      <div class="row"><span class="label">SĐT</span><span class="value">${payload.customerPhone}</span></div>
      <div class="row"><span class="label">Nhận</span><span class="value">${payload.checkInTime}</span></div>
      <div class="row"><span class="label">Trả</span><span class="value">${payload.checkOutTime}</span></div>
      <hr />
      <table>
        <thead>
          <tr>
            <th>Hạng mục</th>
            <th>SL</th>
            <th>Đơn giá</th>
            <th>Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemRows}
        </tbody>
      </table>
      <div style="text-align:right; margin-top:8px;">Tổng cộng: <b>${formatTotal(payload.total)} đ</b></div>
      <div style="text-align:right; color:#dc2626;">Đã cọc: -${formatTotal(payload.deposit)} đ</div>
      <div style="text-align:right; font-weight:bold; font-size:15px;">Thanh toán: ${formatTotal(payload.payable)} đ</div>
      ${payload.note ? `<div style="margin-top:8px;">Ghi chú: ${payload.note}</div>` : ''}
      <div style="text-align:center; margin-top:12px; font-weight:bold;">Cảm ơn quý khách!</div>
    </div>
   `;
};


// --- Utilities ---
const formatDate = (iso: string) => dayjs(iso).format('HH:mm DD/MM/YYYY');
const formatPrice = (value: number) => new Intl.NumberFormat('vi-VN').format(value);
const formatTotal = (value: number) => new Intl.NumberFormat('vi-VN').format(value) + '.000';
const formatCompact = (value: number) => new Intl.NumberFormat('vi-VN').format(value);

const getRoomLimitTime = (room: Room | null) => room?.customer?.customLimitTime || hotelStore.limitTime;

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
.room-card {
   box-shadow: 0 14px 26px rgba(24, 26, 28, 0.08);
}

.room-card:hover {
   transform: translateY(-4px);
   box-shadow: 0 18px 34px rgba(24, 26, 28, 0.12);
}
</style>
