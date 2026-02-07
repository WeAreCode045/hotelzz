import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Calendar, User, CreditCard, Loader2, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';
import { Room } from '../../types';
import { formatCurrency } from '../../utils/helpers';
import { useToast } from '../../context/ToastContext';

interface Props {
  onClose: () => void;
  initialDate?: string;
  initialRoomId?: string;
}

export const NewReservationModal: React.FC<Props> = ({ onClose, initialDate, initialRoomId }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    checkIn: initialDate || new Date().toISOString().split('T')[0],
    checkOut: initialDate ? new Date(new Date(initialDate).getTime() + 86400000).toISOString().split('T')[0] : new Date(Date.now() + 86400000).toISOString().split('T')[0],
    roomId: initialRoomId || '',
    guests: 2,
    price: 0
  });

  const { data: roomTypes = [] } = useQuery({ queryKey: ['roomTypes'], queryFn: api.getRoomTypes });
  
  // Fetch available rooms specifically for the dates
  const { data: availableRooms = [], isLoading: loadingAvailability } = useQuery({ 
      queryKey: ['availableRooms', formData.checkIn, formData.checkOut], 
      queryFn: () => api.getAvailableRooms(formData.checkIn, formData.checkOut)
  });

  // Calculate Price Effect
  useEffect(() => {
     if (formData.roomId && formData.checkIn && formData.checkOut) {
         const room = availableRooms.find(r => r.id === formData.roomId) || 
                      (initialRoomId === formData.roomId ? { roomTypeId: roomTypes.find(rt => rt.id === 'rt_1')?.id } : null); // Fallback for initial load
         
         const typeId = room ? (room as any).roomTypeId : null; // Hacky typing for brevity, ideally strict
         
         if (typeId) {
             api.calculatePrice(typeId, formData.checkIn, formData.checkOut).then(price => {
                 setFormData(prev => ({ ...prev, price }));
             });
         }
     }
  }, [formData.roomId, formData.checkIn, formData.checkOut, availableRooms, roomTypes, initialRoomId]);

  const createMutation = useMutation({
    mutationFn: async () => {
        const room = availableRooms.find(r => r.id === formData.roomId);
        // If room is not in availableRooms (e.g. initialRoomId passed but actually booked), validate
        if (!room && formData.roomId !== initialRoomId) {
             throw new Error("Selected room is no longer available.");
        }
        // Fallback for types if room object isn't fully loaded
        const typeId = room ? room.roomTypeId : roomTypes[0].id; 
        
        return api.createReservation({
            checkIn: formData.checkIn,
            checkOut: formData.checkOut,
            roomId: formData.roomId,
            roomTypeId: typeId,
            guestCount: formData.guests,
            totalPrice: formData.price
        }, {
            firstName: formData.firstName,
            lastName: formData.lastName,
            email: formData.email,
            phone: formData.phone
        });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      toast({ type: 'success', title: 'Reservation Created', description: `Booking confirmed for ${formData.lastName}.` });
      onClose();
    },
    onError: (err: any) => {
        toast({ type: 'error', title: 'Creation Failed', description: err.message });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
            <h3 className="font-bold text-lg text-slate-800">New Reservation</h3>
            <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
            
            {/* Stay Details */}
            <div className="">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                    <Calendar size={14}/> Stay Dates
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <span className="text-xs text-slate-400">Check-in</span>
                        <input 
                            type="date" required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.checkIn}
                            onChange={e => setFormData({...formData, checkIn: e.target.value})}
                        />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400">Check-out</span>
                        <input 
                            type="date" required
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            value={formData.checkOut}
                            min={formData.checkIn}
                            onChange={e => setFormData({...formData, checkOut: e.target.value})}
                        />
                    </div>
                </div>
            </div>

            {/* Room Selection */}
            <div className="pt-2">
                 <label className="block text-xs font-semibold text-slate-500 uppercase mb-2">Room Selection</label>
                 {loadingAvailability ? (
                     <div className="flex items-center gap-2 text-sm text-slate-500 py-2"><Loader2 className="animate-spin" size={16}/> Checking availability...</div>
                 ) : availableRooms.length === 0 ? (
                     <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                         <AlertCircle size={16} /> No rooms available for these dates.
                     </div>
                 ) : (
                     <select 
                        required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.roomId}
                        onChange={e => setFormData({...formData, roomId: e.target.value})}
                     >
                         <option value="" disabled>Select an available room</option>
                         {availableRooms.map(room => (
                             <option key={room.id} value={room.id}>
                                 {room.name} - {roomTypes.find(t => t.id === room.roomTypeId)?.name}
                             </option>
                         ))}
                     </select>
                 )}
            </div>

            {/* Guest Info */}
            <div className="pt-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase mb-2 flex items-center gap-1">
                    <User size={14}/> Guest Details
                </label>
                <div className="grid grid-cols-2 gap-4">
                    <input 
                        type="text" placeholder="First Name" required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.firstName}
                        onChange={e => setFormData({...formData, firstName: e.target.value})}
                    />
                    <input 
                        type="text" placeholder="Last Name" required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.lastName}
                        onChange={e => setFormData({...formData, lastName: e.target.value})}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4 mt-3">
                    <input 
                        type="email" placeholder="Email Address" required
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                    />
                     <input 
                        type="tel" placeholder="Phone Number"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                        value={formData.phone}
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                    />
                </div>
            </div>

            {/* Pricing Summary */}
            <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="bg-indigo-50 p-4 rounded-lg flex justify-between items-center">
                    <div className="flex items-center gap-2 text-indigo-700">
                        <CreditCard size={18}/>
                        <div>
                            <span className="font-semibold text-sm block">Total Estimate</span>
                            <span className="text-xs text-indigo-500">Includes dynamic weekend pricing</span>
                        </div>
                    </div>
                    <div className="text-xl font-bold text-slate-900">
                        {formatCurrency(formData.price)}
                    </div>
                </div>
            </div>

            <button 
                type="submit" 
                disabled={createMutation.isPending || availableRooms.length === 0}
                className="w-full bg-indigo-600 text-white py-3 rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200 disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
            >
                {createMutation.isPending ? 'Creating Reservation...' : 'Confirm Booking'}
            </button>
        </form>
      </div>
    </div>
  );
};
