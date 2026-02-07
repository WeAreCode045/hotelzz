import { Guest, Property, Reservation, ReservationStatus, Room, RoomStatus, RoomType, Folio } from '../types';

export const MOCK_PROPERTY: Property = {
  id: 'prop_1',
  name: 'Grand Horizon Hotel',
  currency: 'USD',
};

export const MOCK_ROOM_TYPES: RoomType[] = [
  { id: 'rt_1', propertyId: 'prop_1', name: 'Standard King', code: 'STDK', basePrice: 150, capacity: 2, description: 'Cozy room with a king bed.' },
  { id: 'rt_2', propertyId: 'prop_1', name: 'Ocean Suite', code: 'OCNS', basePrice: 280, capacity: 4, description: 'Luxury suite with ocean view.' },
  { id: 'rt_3', propertyId: 'prop_1', name: 'Family Room', code: 'FAM', basePrice: 200, capacity: 4, description: 'Spacious room for families.' },
];

export const MOCK_ROOMS: Room[] = [
  { id: 'r_101', roomTypeId: 'rt_1', name: '101', status: RoomStatus.CLEAN, floor: 1 },
  { id: 'r_102', roomTypeId: 'rt_1', name: '102', status: RoomStatus.DIRTY, floor: 1 },
  { id: 'r_103', roomTypeId: 'rt_1', name: '103', status: RoomStatus.CLEAN, floor: 1 },
  { id: 'r_104', roomTypeId: 'rt_1', name: '104', status: RoomStatus.INSPECTED, floor: 1 },
  { id: 'r_201', roomTypeId: 'rt_2', name: '201', status: RoomStatus.CLEAN, floor: 2 },
  { id: 'r_202', roomTypeId: 'rt_2', name: '202', status: RoomStatus.OUT_OF_ORDER, floor: 2 },
  { id: 'r_301', roomTypeId: 'rt_3', name: '301', status: RoomStatus.DIRTY, floor: 3 },
  { id: 'r_302', roomTypeId: 'rt_3', name: '302', status: RoomStatus.CLEAN, floor: 3 },
];

export const MOCK_GUESTS: Guest[] = [
  { id: 'g_1', firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '+1234567890', vipStatus: true },
  { id: 'g_2', firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '+1987654321' },
  { id: 'g_3', firstName: 'Alice', lastName: 'Johnson', email: 'alice@example.com', phone: '+1122334455' },
];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 3);

export const MOCK_RESERVATIONS: Reservation[] = [
  {
    id: 'res_1',
    propertyId: 'prop_1',
    roomId: 'r_101',
    roomTypeId: 'rt_1',
    guestId: 'g_1',
    checkIn: today.toISOString().split('T')[0],
    checkOut: nextWeek.toISOString().split('T')[0],
    status: ReservationStatus.CHECKED_IN,
    guestCount: 2,
    source: 'Direct',
    totalPrice: 450,
    folioId: 'fol_1'
  },
  {
    id: 'res_2',
    propertyId: 'prop_1',
    roomId: 'r_201',
    roomTypeId: 'rt_2',
    guestId: 'g_2',
    checkIn: tomorrow.toISOString().split('T')[0],
    checkOut: nextWeek.toISOString().split('T')[0],
    status: ReservationStatus.CONFIRMED,
    guestCount: 2,
    source: 'OTA',
    totalPrice: 560,
    folioId: 'fol_2'
  }
];

export const MOCK_FOLIOS: Folio[] = [
  {
    id: 'fol_1',
    reservationId: 'res_1',
    balance: 50,
    currency: 'USD',
    items: [
      { id: 'fi_1', date: today.toISOString().split('T')[0], description: 'Room Charge (Night 1)', amount: 150, quantity: 1, category: 'Room' },
      { id: 'fi_2', date: today.toISOString().split('T')[0], description: 'Breakfast', amount: 25, quantity: 2, category: 'F&B' },
      { id: 'fi_3', date: today.toISOString().split('T')[0], description: 'Deposit Payment', amount: -150, quantity: 1, category: 'Payment' },
    ]
  },
  {
    id: 'fol_2',
    reservationId: 'res_2',
    balance: 560,
    currency: 'USD',
    items: [
       { id: 'fi_4', date: tomorrow.toISOString().split('T')[0], description: 'Room Charge (Pending)', amount: 280, quantity: 1, category: 'Room' },
    ]
  }
];
