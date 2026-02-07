
// Domain Models

export enum RoomStatus {
  CLEAN = 'Clean',
  DIRTY = 'Dirty',
  INSPECTED = 'Inspected',
  OUT_OF_ORDER = 'Out of Order',
}

export enum ReservationStatus {
  CONFIRMED = 'Confirmed',
  CHECKED_IN = 'Checked In',
  CHECKED_OUT = 'Checked Out',
  CANCELLED = 'Cancelled',
}

export interface Property {
  id: string;
  name: string;
  currency: string;
}

export interface RoomType {
  id: string;
  propertyId: string;
  name: string;
  code: string;
  basePrice: number;
  capacity: number;
  description: string;
}

export interface Room {
  id: string;
  roomTypeId: string;
  name: string; // e.g., "101"
  status: RoomStatus;
  floor: number;
}

export interface Guest {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  idNumber?: string;
  notes?: string;
  vipStatus?: boolean;
}

export interface FolioItem {
  id: string;
  description: string;
  amount: number;
  quantity: number;
  category: 'Room' | 'F&B' | 'Service' | 'Tax' | 'Payment';
  date: string; // ISO Date
}

export interface Folio {
  id: string;
  reservationId: string;
  items: FolioItem[];
  balance: number;
  currency: string;
}

export interface Reservation {
  id: string;
  propertyId: string;
  roomId: string; // The physical room assigned
  roomTypeId: string; // The type booked
  guestId: string;
  checkIn: string; // ISO Date YYYY-MM-DD
  checkOut: string; // ISO Date YYYY-MM-DD
  status: ReservationStatus;
  guestCount: number;
  source: 'OTA' | 'Direct' | 'Walk-In';
  totalPrice: number;
  checkedInAt?: string; // ISO Datetime
  checkedOutAt?: string; // ISO Datetime
  folioId: string;
  balance?: number;
}

// New Interface for Rate Management
export interface DailyRate {
  id: string;
  roomTypeId: string;
  date: string; // YYYY-MM-DD
  price: number;
  isClosed: boolean; // Stop Sell
  minStay: number;
}

// Helper types for the UI
export interface GridCellData {
  date: string;
  roomId: string;
  isWeekend: boolean;
  rate: number;
  availability: number;
}
