
import { ID, Query, Models } from 'appwrite';
import { account, databases, DB_ID, COLLECTIONS } from './appwrite';
import { Folio, Guest, Reservation, Room, RoomStatus, RoomType, DailyRate, Property, ReservationStatus } from '../types';
import { MOCK_FOLIOS, MOCK_GUESTS, MOCK_PROPERTY, MOCK_RESERVATIONS, MOCK_ROOMS, MOCK_ROOM_TYPES } from './mockData';

// Helper to map Appwrite document to our TS types (converting $id to id)
const mapDoc = <T>(doc: Models.Document): T => {
    const { $id, $createdAt, $updatedAt, $permissions, $databaseId, $collectionId, ...rest } = doc;
    return {
        id: $id,
        ...rest
    } as unknown as T;
};

export const api = {
  // --- Authentication ---
  auth: {
      login: async (email: string, password: string) => {
          return await account.createEmailPasswordSession(email, password);
      },
      logout: async () => {
          return await account.deleteSession('current');
      },
      getAccount: async () => {
          try {
              return await account.get();
          } catch (e) {
              return null;
          }
      }
  },

  // --- Seeding (For Demo Purposes) ---
  // If DB is empty, this uploads MOCK_DATA
  seedDatabase: async () => {
      try {
          const rooms = await databases.listDocuments(DB_ID, COLLECTIONS.ROOMS);
          if (rooms.total > 0) return; // Already seeded

          console.log('Seeding Database...');
          
          // Seed Property
          await databases.createDocument(DB_ID, COLLECTIONS.PROPERTIES, MOCK_PROPERTY.id, { ...MOCK_PROPERTY, id: undefined });

          // Seed Room Types
          for (const rt of MOCK_ROOM_TYPES) {
              await databases.createDocument(DB_ID, COLLECTIONS.ROOM_TYPES, rt.id, { ...rt, id: undefined });
          }

          // Seed Rooms
          for (const r of MOCK_ROOMS) {
              await databases.createDocument(DB_ID, COLLECTIONS.ROOMS, r.id, { ...r, id: undefined });
          }

          // Seed Guests
          for (const g of MOCK_GUESTS) {
              await databases.createDocument(DB_ID, COLLECTIONS.GUESTS, g.id, { ...g, id: undefined });
          }

           // Seed Reservations
           for (const res of MOCK_RESERVATIONS) {
              const { balance, ...resData } = res; // separate balance logic if needed, or keep simpler
              await databases.createDocument(DB_ID, COLLECTIONS.RESERVATIONS, res.id, { ...resData, id: undefined });
          }

          // Seed Folios
          for (const f of MOCK_FOLIOS) {
            // Appwrite doesn't support array of objects easily in one doc without stringifying
            // For simplicity in this demo, we store items as a stringified JSON
            await databases.createDocument(DB_ID, COLLECTIONS.FOLIOS, f.id, { 
                reservationId: f.reservationId,
                balance: f.balance,
                currency: f.currency,
                items: JSON.stringify(f.items) 
            });
        }

          console.log('Seeding Complete');
      } catch (error) {
          console.error('Seeding failed:', error);
      }
  },

  // --- Property ---
  getProperty: async () => {
      try {
        const result = await databases.listDocuments(DB_ID, COLLECTIONS.PROPERTIES);
        if (result.documents.length > 0) {
            return mapDoc<Property>(result.documents[0]);
        }
        return MOCK_PROPERTY;
      } catch {
          return MOCK_PROPERTY;
      }
  },
  
  updateProperty: async (data: Partial<Property>) => {
      const result = await databases.listDocuments(DB_ID, COLLECTIONS.PROPERTIES);
      if (result.documents.length > 0) {
          const doc = await databases.updateDocument(DB_ID, COLLECTIONS.PROPERTIES, result.documents[0].$id, data);
          return mapDoc<Property>(doc);
      }
      return MOCK_PROPERTY;
  },

  // --- Rooms ---
  getRooms: async () => {
    // Trigger seed check on first load of rooms
    await api.seedDatabase();

    const result = await databases.listDocuments(DB_ID, COLLECTIONS.ROOMS, [
        Query.limit(100)
    ]);
    return result.documents.map(d => mapDoc<Room>(d));
  },

  createRoom: async (roomData: Omit<Room, 'id' | 'status'>) => {
    const doc = await databases.createDocument(DB_ID, COLLECTIONS.ROOMS, ID.unique(), {
        ...roomData,
        status: RoomStatus.CLEAN
    });
    return mapDoc<Room>(doc);
  },

  updateRoomStatus: async (roomId: string, status: RoomStatus) => {
    await databases.updateDocument(DB_ID, COLLECTIONS.ROOMS, roomId, { status });
    return { success: true };
  },

  // --- Room Types ---
  getRoomTypes: async () => {
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.ROOM_TYPES);
    return result.documents.map(d => mapDoc<RoomType>(d));
  },

  updateRoomType: async (id: string, updates: Partial<RoomType>) => {
    await databases.updateDocument(DB_ID, COLLECTIONS.ROOM_TYPES, id, updates);
    return { success: true };
  },

  // --- Guests ---
  getGuests: async () => {
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.GUESTS);
    return result.documents.map(d => mapDoc<Guest>(d));
  },

  getGuestById: async (id: string) => {
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.GUESTS, id);
    return mapDoc<Guest>(doc);
  },

  // --- Rates ---
  getDailyRates: async (startDate: string, endDate: string) => {
      const result = await databases.listDocuments(DB_ID, COLLECTIONS.DAILY_RATES, [
          Query.greaterThanEqual('date', startDate),
          Query.lessThanEqual('date', endDate)
      ]);
      
      const rates = result.documents.map(d => mapDoc<DailyRate>(d));
      
      // Fill gaps with generated rates (in memory only for display, or create logic to save them)
      // For this implementation, we will fetch room types and fill gaps in UI or here
      const roomTypes = await api.getRoomTypes();
      const filledRates: DailyRate[] = [];
      
      const s = new Date(startDate);
      const e = new Date(endDate);
      
      for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        
        roomTypes.forEach(rt => {
            let rate = rates.find(r => r.roomTypeId === rt.id && r.date === dateStr);
            
            if (!rate) {
                const isWeekend = d.getDay() === 5 || d.getDay() === 6;
                rate = {
                    id: `temp_${rt.id}_${dateStr}`, // Temp ID
                    roomTypeId: rt.id,
                    date: dateStr,
                    price: Math.round(isWeekend ? rt.basePrice * 1.2 : rt.basePrice),
                    isClosed: false,
                    minStay: 1
                };
            }
            filledRates.push(rate);
        });
    }
    return filledRates;
  },

  updateDailyRate: async (rate: Partial<DailyRate> & { roomTypeId: string, date: string }) => {
      // Check if exists
      const result = await databases.listDocuments(DB_ID, COLLECTIONS.DAILY_RATES, [
          Query.equal('roomTypeId', rate.roomTypeId),
          Query.equal('date', rate.date)
      ]);

      if (result.documents.length > 0) {
          await databases.updateDocument(DB_ID, COLLECTIONS.DAILY_RATES, result.documents[0].$id, {
              price: rate.price,
              isClosed: rate.isClosed
          });
      } else {
          await databases.createDocument(DB_ID, COLLECTIONS.DAILY_RATES, ID.unique(), {
              roomTypeId: rate.roomTypeId,
              date: rate.date,
              price: rate.price,
              isClosed: rate.isClosed,
              minStay: rate.minStay || 1
          });
      }
      return { success: true };
  },

  calculatePrice: async (roomTypeId: string, checkIn: string, checkOut: string) => {
      // Get explicitly set rates
      const rates = await api.getDailyRates(checkIn, checkOut);
      let total = 0;
      const current = new Date(checkIn);
      const end = new Date(checkOut);
      
      while (current < end) {
          const dateStr = current.toISOString().split('T')[0];
          const rate = rates.find(r => r.roomTypeId === roomTypeId && r.date === dateStr);
          if (rate) total += rate.price;
          current.setDate(current.getDate() + 1);
      }
      return Math.round(total);
  },

  // --- Reservations ---
  getReservations: async (from: string, to: string) => {
    // Overlap Logic: (StartA <= EndB) and (EndA >= StartB)
    const result = await databases.listDocuments(DB_ID, COLLECTIONS.RESERVATIONS, [
        Query.lessThan('checkIn', to),
        Query.greaterThan('checkOut', from),
    ]);

    const reservations = result.documents.map(d => mapDoc<Reservation>(d));

    // Enrich with balance from Folios
    const foliosRes = await databases.listDocuments(DB_ID, COLLECTIONS.FOLIOS, [
        Query.equal('reservationId', reservations.map(r => r.id))
    ]);
    
    return reservations.map(res => {
        const folio = foliosRes.documents.find(f => f.reservationId === res.id);
        return { ...res, balance: folio ? folio.balance : 0 };
    });
  },

  getAvailableRooms: async (checkIn: string, checkOut: string) => {
      // 1. Get all occupied rooms for dates
      const result = await databases.listDocuments(DB_ID, COLLECTIONS.RESERVATIONS, [
        Query.lessThan('checkIn', checkOut),
        Query.greaterThan('checkOut', checkIn),
        Query.notEqual('status', [ReservationStatus.CANCELLED, ReservationStatus.CHECKED_OUT])
      ]);
      
      const occupiedRoomIds = result.documents.map(d => d.roomId);

      // 2. Get all rooms
      const allRooms = await api.getRooms();

      // 3. Filter
      return allRooms.filter(r => !occupiedRoomIds.includes(r.id) && r.status !== RoomStatus.OUT_OF_ORDER);
  },

  createReservation: async (data: Partial<Reservation>, guestData: Partial<Guest>) => {
      let guestId = guestData.id;

      // 1. Handle Guest
      if (!guestId) {
          // Check if guest exists by email
          if (guestData.email) {
            const existingGuests = await databases.listDocuments(DB_ID, COLLECTIONS.GUESTS, [
                Query.equal('email', guestData.email)
            ]);
            if (existingGuests.total > 0) {
                guestId = existingGuests.documents[0].$id;
            }
          }

          if (!guestId) {
            const newGuest = await databases.createDocument(DB_ID, COLLECTIONS.GUESTS, ID.unique(), {
                firstName: guestData.firstName,
                lastName: guestData.lastName,
                email: guestData.email,
                phone: guestData.phone
            });
            guestId = newGuest.$id;
          }
      }

      // 2. Create Reservation
      const resId = ID.unique();
      const folioId = ID.unique();

      const newReservation = await databases.createDocument(DB_ID, COLLECTIONS.RESERVATIONS, resId, {
        propertyId: 'prop_1',
        roomId: data.roomId,
        roomTypeId: data.roomTypeId,
        guestId: guestId,
        checkIn: data.checkIn,
        checkOut: data.checkOut,
        status: ReservationStatus.CONFIRMED,
        guestCount: data.guestCount || 1,
        source: 'Direct',
        totalPrice: data.totalPrice || 0,
        folioId: folioId
      });

      // 3. Create Folio
      await databases.createDocument(DB_ID, COLLECTIONS.FOLIOS, folioId, {
          reservationId: resId,
          items: JSON.stringify([]),
          balance: 0,
          currency: 'USD'
      });

      return mapDoc<Reservation>(newReservation);
  },

  moveReservation: async (reservationId: string, newRoomId: string, newCheckIn: string, newCheckOut: string) => {
    // Check conflict
    const conflicts = await databases.listDocuments(DB_ID, COLLECTIONS.RESERVATIONS, [
        Query.equal('roomId', newRoomId),
        Query.lessThan('checkIn', newCheckOut),
        Query.greaterThan('checkOut', newCheckIn),
        Query.notEqual('$id', reservationId),
        Query.notEqual('status', ReservationStatus.CANCELLED)
    ]);

    if (conflicts.total > 0) {
        throw new Error("Room is already booked for these dates.");
    }

    await databases.updateDocument(DB_ID, COLLECTIONS.RESERVATIONS, reservationId, {
        roomId: newRoomId,
        checkIn: newCheckIn,
        checkOut: newCheckOut
    });

    return { success: true };
  },

  checkIn: async (reservationId: string) => {
    const res = await databases.updateDocument(DB_ID, COLLECTIONS.RESERVATIONS, reservationId, {
        status: ReservationStatus.CHECKED_IN,
        checkedInAt: new Date().toISOString()
    });
    // Set Room Dirty
    await api.updateRoomStatus(res.roomId, RoomStatus.DIRTY);
    return { success: true };
  },

  checkOut: async (reservationId: string) => {
      // Check Balance
      const folio = await api.getFolio(reservationId);
      if (folio && folio.balance > 0) {
        throw new Error(`Cannot checkout. Outstanding balance: ${folio.balance} ${folio.currency}`);
      }

      const res = await databases.updateDocument(DB_ID, COLLECTIONS.RESERVATIONS, reservationId, {
        status: ReservationStatus.CHECKED_OUT,
        checkedOutAt: new Date().toISOString()
      });
      
      await api.updateRoomStatus(res.roomId, RoomStatus.DIRTY);
      return { success: true };
  },

  // --- Folios ---
  getFolio: async (reservationId: string) => {
      const result = await databases.listDocuments(DB_ID, COLLECTIONS.FOLIOS, [
          Query.equal('reservationId', reservationId)
      ]);
      if (result.documents.length === 0) return undefined;
      
      const doc = result.documents[0];
      const items = typeof doc.items === 'string' ? JSON.parse(doc.items) : doc.items;
      
      return {
          ...mapDoc<Folio>(doc),
          items: items || []
      };
  },

  addCharge: async (folioId: string, amount: number, description: string) => {
      const doc = await databases.getDocument(DB_ID, COLLECTIONS.FOLIOS, folioId);
      const items = typeof doc.items === 'string' ? JSON.parse(doc.items) : (doc.items || []);
      
      const newItem = {
          id: `fi_${Date.now()}`,
          date: new Date().toISOString().split('T')[0],
          description,
          amount,
          quantity: 1,
          category: 'Service'
      };

      const newItems = [...items, newItem];
      const newBalance = doc.balance + amount;

      await databases.updateDocument(DB_ID, COLLECTIONS.FOLIOS, folioId, {
          items: JSON.stringify(newItems),
          balance: newBalance
      });
      return { success: true };
  },

  processPayment: async (folioId: string, amount: number) => {
    const doc = await databases.getDocument(DB_ID, COLLECTIONS.FOLIOS, folioId);
    const items = typeof doc.items === 'string' ? JSON.parse(doc.items) : (doc.items || []);

    const newItem = {
        id: `pay_${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        description: 'Payment - Credit Card',
        amount: -amount,
        quantity: 1,
        category: 'Payment'
    };

    const newItems = [...items, newItem];
    const newBalance = doc.balance - amount;

    await databases.updateDocument(DB_ID, COLLECTIONS.FOLIOS, folioId, {
        items: JSON.stringify(newItems),
        balance: newBalance
    });
    return { success: true };
  }
};
