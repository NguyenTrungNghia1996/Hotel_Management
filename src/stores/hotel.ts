import { defineStore } from 'pinia';
import { ref, watch } from 'vue';
import dayjs from 'dayjs';

export interface Service {
  id: string;
  name: string;
  price: number;
}

export interface Room {
  id: string;
  name: string;
  status: 'empty' | 'in-use';
  customer?: {
    name: string;
    phone?: string;
    citizenId?: string;
    checkInTime: string; // ISO string
    expireAt?: string; // ISO string
    deposit: number;
    note?: string;
  };
  // Services used by the room
  usage: { serviceId: string; quantity: number; price: number }[]; // price at time of add
  // Ad-hoc items added during checkout
  customItems?: { name: string; quantity: number; price: number }[];
}

type StoredRoom = Omit<Room, 'status'> & { status?: string };

const normalizeRooms = (rawRooms: StoredRoom[]): Room[] =>
  rawRooms.map((room) => ({
    ...room,
    status: room.status === 'empty' ? 'empty' : 'in-use',
    usage: Array.isArray(room.usage) ? room.usage : [],
    customItems: Array.isArray(room.customItems) ? room.customItems : []
  }));

export const useHotelStore = defineStore('hotel', () => {
  // Settings
  const limitTime = ref<string>(localStorage.getItem('limitTime') || '11:00');
  const blockPrice = ref<number>(Number(localStorage.getItem('blockPrice')) || 200);

  // Services
  const services = ref<Service[]>(JSON.parse(localStorage.getItem('services') || '[]'));

  // Rooms
  const rooms = ref<Room[]>(normalizeRooms(JSON.parse(localStorage.getItem('rooms') || '[]')));

  // Watchers for persistence
  watch(limitTime, (val) => localStorage.setItem('limitTime', val));
  watch(blockPrice, (val) => localStorage.setItem('blockPrice', val.toString()));
  watch(services, (val) => localStorage.setItem('services', JSON.stringify(val)), { deep: true });
  watch(rooms, (val) => localStorage.setItem('rooms', JSON.stringify(val)), { deep: true });

  // Service Actions
  function addService(name: string, price: number) {
    services.value.push({ id: Date.now().toString(), name, price });
  }
  function updateService(id: string, name: string, price: number) {
    const idx = services.value.findIndex(s => s.id === id);
    if (idx !== -1) services.value[idx] = { id, name, price };
  }
  function deleteService(id: string) {
    services.value = services.value.filter(s => s.id !== id);
  }

  // Logic Helpers
  function getDueTime(checkInTime: string, limitTimeStr: string): dayjs.Dayjs {
    const checkIn = dayjs(checkInTime);
    if (!checkIn.isValid()) return dayjs();
    const parts = (limitTimeStr || '11:00').split(':');
    const hour = Number.parseInt(parts[0] || '11', 10);
    const minute = Number.parseInt(parts[1] || '00', 10);
    const limitOnCheckInDay = checkIn
      .hour(hour)
      .minute(minute)
      .second(0)
      .millisecond(0);

    if (checkIn.isBefore(limitOnCheckInDay)) {
      return limitOnCheckInDay;
    }
    return limitOnCheckInDay.add(1, 'day');
  }

  function calculateBlocks(checkInTime: string, now: dayjs.Dayjs = dayjs()): number {
    const checkIn = dayjs(checkInTime);
    if (!checkIn.isValid()) return 1;
    const due = getDueTime(checkInTime, limitTime.value);
    if (!now.isAfter(due)) return 1;
    const extraDays = Math.ceil(now.diff(due, 'day', true));
    return Math.max(1, 1 + extraDays);
  }

  function getRoomExpireAt(room: Room): dayjs.Dayjs | null {
    if (room.status === 'empty' || !room.customer) return null;
    const stored = room.customer.expireAt ? dayjs(room.customer.expireAt) : null;
    if (stored && stored.isValid()) return stored;
    return getDueTime(room.customer.checkInTime, limitTime.value);
  }

  function isOverdue(room: Room): boolean {
    const expireAt = getRoomExpireAt(room);
    if (!expireAt) return false;
    return dayjs().isAfter(expireAt);
  }

  // Room Actions
  function addRoom(name: string) {
    rooms.value.push({
      id: Date.now().toString(),
      name,
      status: 'empty',
      usage: [],
      customItems: []
    });
  }

  function deleteRoom(id: string) {
    rooms.value = rooms.value.filter(r => r.id !== id);
  }

  function updateRoomName(id: string, name: string) {
    const room = rooms.value.find(r => r.id === id);
    if (room) {
      room.name = name;
    }
  }

  function updateRoomCustomer(
    roomId: string,
    data: { name?: string; phone?: string; citizenId?: string; deposit?: number; note?: string; expireAt?: string }
  ) {
    const room = rooms.value.find(r => r.id === roomId);
    if (!room || !room.customer) return;
    if (typeof data.deposit === 'number') room.customer.deposit = data.deposit;
    if ('note' in data) room.customer.note = data.note || '';
    if ('name' in data) room.customer.name = data.name || '';
    if ('phone' in data) room.customer.phone = data.phone || '';
    if ('citizenId' in data) room.customer.citizenId = data.citizenId || '';
    if ('expireAt' in data) room.customer.expireAt = data.expireAt || '';
  }

  function checkIn(roomId: string, customerData: any) {
    const room = rooms.value.find(r => r.id === roomId);
    if (room) {
      const checkInTime = customerData.checkInTime || dayjs().toISOString();
      const expireAt = customerData.expireAt || getDueTime(checkInTime, limitTime.value).toISOString();
      room.status = 'in-use';
      room.customer = {
        name: customerData.name || '',
        phone: customerData.phone,
        citizenId: customerData.citizenId,
        checkInTime,
        expireAt,
        deposit: Number(customerData.deposit) || 0,
        note: customerData.note || ''
      };
      room.usage = [];
      room.customItems = [];
    }
  }

  function checkOut(roomId: string) {
    const room = rooms.value.find(r => r.id === roomId);
    if (room) {
      room.status = 'empty';
      room.customer = undefined;
      room.usage = [];
      room.customItems = [];
    }
  }

  function addServiceToRoom(roomId: string, service: Service, quantity: number) {
    const room = rooms.value.find(r => r.id === roomId);
    if (room) {
      const existing = room.usage.find(u => u.serviceId === service.id && u.price === service.price);
      if (existing) {
        existing.quantity += quantity;
      } else {
        room.usage.push({
          serviceId: service.id,
          quantity,
          price: service.price
        });
      }
    }
  }

  function removeServiceFromRoom(roomId: string, usageIndex: number) {
    const room = rooms.value.find(r => r.id === roomId);
    if (!room) return;
    if (usageIndex < 0 || usageIndex >= room.usage.length) return;
    room.usage.splice(usageIndex, 1);
  }

  return {
    limitTime, blockPrice, services, rooms,
    addService, updateService, deleteService,
    addRoom, deleteRoom, updateRoomName,
    checkIn, checkOut, addServiceToRoom, removeServiceFromRoom,
    updateRoomCustomer,
    getDueTime, calculateBlocks, getRoomExpireAt, isOverdue
  };
});
