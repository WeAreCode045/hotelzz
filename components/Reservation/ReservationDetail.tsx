import React, { useState } from 'react';
import { useQueryClient, useMutation, useQuery } from '@tanstack/react-query';
import { Reservation, Guest, Folio, ReservationStatus } from '../../types';
import { api } from '../../services/api';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { X, CheckCircle, LogOut, CreditCard, Plus, DollarSign } from 'lucide-react';
import { useToast } from '../../context/ToastContext';

interface Props {
  reservation: Reservation;
  onClose: () => void;
}

export const ReservationDetail: React.FC<Props> = ({ reservation, onClose }) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'details' | 'folio'>('details');
  const [showPaymentInput, setShowPaymentInput] = useState(false);

  const { data: guest } = useQuery<Guest | undefined>({
    queryKey: ['guest', reservation.guestId],
    queryFn: () => api.getGuestById(reservation.guestId)
  });

  const { data: folio, isLoading: loadingFolio } = useQuery<Folio | undefined>({
    queryKey: ['folio', reservation.id],
    queryFn: () => api.getFolio(reservation.id)
  });

  // Mutations
  const checkInMutation = useMutation({
    mutationFn: api.checkIn,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ type: 'success', title: 'Check In Successful', description: 'Room is now marked Dirty.' });
      onClose();
    }
  });

  const checkOutMutation = useMutation({
    mutationFn: api.checkOut,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reservations'] });
      queryClient.invalidateQueries({ queryKey: ['rooms'] });
      toast({ type: 'success', title: 'Check Out Successful', description: 'Guest has departed.' });
      onClose();
    },
    onError: (err: any) => {
      toast({ type: 'error', title: 'Check Out Failed', description: err.message });
    }
  });

  const addChargeMutation = useMutation({
    mutationFn: ({ amount, desc }: { amount: number, desc: string }) => 
      api.addCharge(folio!.id, amount, desc),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['folio', reservation.id] });
      toast({ type: 'success', title: 'Charge Added' });
    }
  });

  const paymentMutation = useMutation({
    mutationFn: ({ amount }: { amount: number }) => api.processPayment(folio!.id, amount),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['folio', reservation.id] });
        setShowPaymentInput(false);
        toast({ type: 'success', title: 'Payment Processed', description: 'Folio balance updated.' });
    }
  });

  if (!guest) return <div className="p-4">Loading guest...</div>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-start bg-slate-50">
          <div>
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Res #{reservation.id.slice(-4)} 
              <span className={`text-xs px-2 py-1 rounded-full ${
                  reservation.status === 'Checked In' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {reservation.status}
              </span>
            </h2>
            <p className="text-sm text-slate-500 mt-1">{guest.firstName} {guest.lastName} • {guest.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 px-6">
          <button 
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'details' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('details')}
          >
            Reservation Details
          </button>
          <button 
            className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors ${activeTab === 'folio' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
            onClick={() => setActiveTab('folio')}
          >
            Folio & Billing
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Check-in</span>
                  <div className="text-lg font-medium text-slate-900">{formatDate(reservation.checkIn)}</div>
                  <div className="text-xs text-slate-500">From 15:00</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <span className="text-xs text-slate-400 uppercase font-semibold">Check-out</span>
                  <div className="text-lg font-medium text-slate-900">{formatDate(reservation.checkOut)}</div>
                  <div className="text-xs text-slate-500">Until 11:00</div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-slate-800 mb-2">Room Information</h3>
                <div className="p-3 border rounded-lg flex justify-between items-center">
                   <div>
                      <div className="font-medium text-slate-700">Room {reservation.roomId.replace('r_', '')}</div>
                      <div className="text-xs text-slate-500">Standard King</div>
                   </div>
                   <button className="text-indigo-600 text-sm hover:underline">Change</button>
                </div>
              </div>
              
              <div className="pt-4 flex gap-3">
                {reservation.status === ReservationStatus.CONFIRMED && (
                    <button 
                        onClick={() => checkInMutation.mutate(reservation.id)}
                        disabled={checkInMutation.isPending}
                        className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-medium hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                        {checkInMutation.isPending ? 'Processing...' : <><CheckCircle size={18} /> Check In</>}
                    </button>
                )}
                
                {reservation.status === ReservationStatus.CHECKED_IN && (
                    <button 
                        onClick={() => checkOutMutation.mutate(reservation.id)}
                        disabled={checkOutMutation.isPending}
                        className="flex-1 bg-slate-800 text-white py-2.5 rounded-lg font-medium hover:bg-slate-900 flex items-center justify-center gap-2"
                    >
                        {checkOutMutation.isPending ? 'Processing...' : <><LogOut size={18} /> Check Out</>}
                    </button>
                )}
              </div>
            </div>
          )}

          {activeTab === 'folio' && (
            <div className="h-full flex flex-col">
               {loadingFolio ? (
                   <div>Loading folio...</div>
               ) : folio ? (
                   <>
                    <div className="flex-1 space-y-3">
                        <table className="w-full text-sm text-left">
                            <thead className="text-xs text-slate-500 bg-gray-50 uppercase">
                                <tr>
                                    <th className="px-3 py-2">Date</th>
                                    <th className="px-3 py-2">Description</th>
                                    <th className="px-3 py-2 text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {folio.items.map(item => (
                                    <tr key={item.id}>
                                        <td className="px-3 py-2 text-slate-500">{formatDate(item.date)}</td>
                                        <td className="px-3 py-2 font-medium text-slate-700">{item.description}</td>
                                        <td className={`px-3 py-2 text-right font-medium ${item.amount < 0 ? 'text-green-600' : 'text-slate-900'}`}>
                                            {formatCurrency(item.amount)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t flex justify-between items-end">
                        <div className="space-y-1">
                             <button 
                                onClick={() => addChargeMutation.mutate({ amount: 20, desc: 'Breakfast Add-on' })}
                                className="text-xs flex items-center gap-1 text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                            >
                                <Plus size={14}/> Add Breakfast ($20)
                             </button>
                             <button 
                                onClick={() => addChargeMutation.mutate({ amount: 15, desc: 'Late Checkout Fee' })}
                                className="text-xs flex items-center gap-1 text-indigo-600 hover:bg-indigo-50 px-2 py-1 rounded"
                            >
                                <Plus size={14}/> Add Late Fee ($15)
                             </button>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-slate-500">Balance Due</div>
                            <div className="text-2xl font-bold text-slate-900">{formatCurrency(folio.balance)}</div>
                        </div>
                    </div>

                    {folio.balance > 0 && !showPaymentInput && (
                        <button 
                            onClick={() => setShowPaymentInput(true)}
                            className="mt-4 w-full border border-slate-300 py-3 rounded-lg font-medium text-slate-700 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
                        >
                            <CreditCard size={18} /> Process Payment
                        </button>
                    )}

                    {showPaymentInput && (
                        <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200 animate-in fade-in slide-in-from-bottom-2">
                             <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-slate-800">Payment Amount</h4>
                                <button onClick={() => setShowPaymentInput(false)}><X size={16} className="text-slate-400"/></button>
                             </div>
                             <div className="flex gap-2">
                                 <button 
                                    className="flex-1 bg-indigo-600 text-white font-bold py-2 rounded shadow-sm hover:bg-indigo-700"
                                    onClick={() => paymentMutation.mutate({ amount: folio.balance })}
                                 >
                                    Pay Full {formatCurrency(folio.balance)}
                                 </button>
                             </div>
                        </div>
                    )}
                   </>
               ) : <div>No Folio Found</div>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
