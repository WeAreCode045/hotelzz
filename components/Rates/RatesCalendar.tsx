
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { getDaysArray, addDays, formatDate } from '../../utils/helpers';
import { ChevronLeft, ChevronRight, Loader2, Ban, DollarSign } from 'lucide-react';
import { useToast } from '../../context/ToastContext';
import { DailyRate } from '../../types';

export const RatesCalendar: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  
  // 14 day view
  const days = useMemo(() => getDaysArray(new Date(startDate), 14), [startDate]);
  const endDate = days[days.length - 1];

  const { data: roomTypes = [], isLoading: loadingTypes } = useQuery({ queryKey: ['roomTypes'], queryFn: api.getRoomTypes });
  
  // Use a query object to enable queryKey dependence on dates
  const { data: dailyRates = [], isLoading: loadingRates } = useQuery({ 
      queryKey: ['dailyRates', startDate, endDate], 
      queryFn: () => api.getDailyRates(startDate, endDate) 
  });

  const updateRateMutation = useMutation({
      mutationFn: api.updateDailyRate,
      onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: ['dailyRates'] });
      },
      onError: () => {
          toast({ type: 'error', title: 'Update failed', description: 'Could not save rate change.' });
      }
  });

  const handlePriceChange = (rate: DailyRate, newPrice: number) => {
      if (newPrice < 0) return;
      // Optimistic update could go here, but relying on invalidate for simplicity
      updateRateMutation.mutate({ 
          roomTypeId: rate.roomTypeId, 
          date: rate.date, 
          price: newPrice 
      });
  };

  const toggleClosed = (rate: DailyRate) => {
      updateRateMutation.mutate({ 
          roomTypeId: rate.roomTypeId, 
          date: rate.date, 
          isClosed: !rate.isClosed 
      });
  };

  const handlePrev = () => setStartDate(prev => addDays(prev, -7));
  const handleNext = () => setStartDate(prev => addDays(prev, 7));
  const handleToday = () => setStartDate(new Date().toISOString().split('T')[0]);

  if (loadingTypes || loadingRates) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
    <div className="p-6 h-full flex flex-col bg-slate-50 overflow-hidden">
      <div className="flex justify-between items-center mb-6">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Rates & Availability</h1>
           <p className="text-slate-500 text-sm mt-1">Manage pricing and restrictions</p>
        </div>
        
        <div className="flex items-center bg-white rounded-lg p-1 border border-gray-200 shadow-sm">
             <button onClick={handlePrev} className="p-1 hover:bg-gray-100 rounded transition"><ChevronLeft size={20} className="text-slate-600" /></button>
             <button onClick={handleToday} className="px-4 text-sm font-medium text-slate-700 hover:text-indigo-600">Today</button>
             <button onClick={handleNext} className="p-1 hover:bg-gray-100 rounded transition"><ChevronRight size={20} className="text-slate-600" /></button>
        </div>
      </div>

      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-auto relative">
         <div className="min-w-max">
             {/* Header Row */}
             <div className="flex border-b border-gray-200 sticky top-0 bg-white z-20">
                 <div className="w-48 p-4 font-bold text-slate-700 bg-gray-50 border-r border-gray-200 sticky left-0 z-30">Room Type</div>
                 {days.map(day => {
                     const isWeekend = new Date(day).getDay() === 0 || new Date(day).getDay() === 6;
                     return (
                         <div key={day} className={`w-32 p-3 text-center border-r border-gray-100 ${isWeekend ? 'bg-slate-50' : ''}`}>
                             <div className="text-xs text-slate-500 uppercase font-semibold">{new Date(day).toLocaleDateString('en-US', { weekday: 'short' })}</div>
                             <div className={`font-bold ${isWeekend ? 'text-indigo-600' : 'text-slate-800'}`}>
                                 {new Date(day).getDate()} {new Date(day).toLocaleDateString('en-US', { month: 'short' })}
                             </div>
                         </div>
                     );
                 })}
             </div>

             {/* Body Rows */}
             <div className="divide-y divide-gray-100">
                 {roomTypes.map(rt => (
                     <div key={rt.id} className="flex">
                         {/* Room Type Header (Left Sticky) */}
                         <div className="w-48 p-4 bg-gray-50 border-r border-gray-200 sticky left-0 z-10">
                             <div className="font-bold text-slate-800 text-sm">{rt.name}</div>
                             <div className="text-xs text-slate-500 mt-1">{rt.code}</div>
                         </div>

                         {/* Rate Cells */}
                         {days.map(day => {
                             const rate = dailyRates.find(r => r.roomTypeId === rt.id && r.date === day);
                             const isWeekend = new Date(day).getDay() === 0 || new Date(day).getDay() === 6;
                             
                             if (!rate) return <div key={day} className="w-32 bg-gray-50"></div>;

                             return (
                                 <div 
                                    key={day} 
                                    className={`w-32 p-2 border-r border-gray-100 relative group transition-colors ${
                                        rate.isClosed ? 'bg-red-50' : isWeekend ? 'bg-slate-50/50' : 'bg-white'
                                    }`}
                                 >
                                     <div className="relative">
                                         <DollarSign size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/>
                                         <input 
                                            type="number" 
                                            className={`w-full pl-5 py-1.5 text-sm font-bold border rounded text-center focus:ring-2 focus:ring-indigo-500 outline-none ${
                                                rate.isClosed ? 'bg-red-50 text-red-400 border-red-200 decoration-slice line-through' : 'border-gray-200 text-slate-700'
                                            }`}
                                            value={rate.price}
                                            onChange={(e) => handlePriceChange(rate, parseInt(e.target.value) || 0)}
                                         />
                                     </div>
                                     
                                     <button 
                                        onClick={() => toggleClosed(rate)}
                                        className={`mt-2 w-full py-1 text-[10px] font-bold uppercase rounded flex items-center justify-center gap-1 transition-colors ${
                                            rate.isClosed 
                                            ? 'bg-red-200 text-red-800 hover:bg-red-300' 
                                            : 'bg-green-100 text-green-700 hover:bg-green-200 opacity-0 group-hover:opacity-100'
                                        }`}
                                     >
                                        {rate.isClosed ? <><Ban size={10}/> Closed</> : 'Open'}
                                     </button>
                                 </div>
                             );
                         })}
                     </div>
                 ))}
             </div>
         </div>
      </div>
    </div>
  );
};
