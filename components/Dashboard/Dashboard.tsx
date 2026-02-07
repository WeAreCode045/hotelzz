import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { ReservationStatus, RoomStatus } from '../../types';
import { formatCurrency, formatDate } from '../../utils/helpers';
import { ArrowDownRight, ArrowUpRight, Users, Bed, LogIn, LogOut, CheckCircle2 } from 'lucide-react';

export const Dashboard: React.FC = () => {
  const today = new Date().toISOString().split('T')[0];
  
  // Fetch data
  const { data: rooms = [] } = useQuery({ queryKey: ['rooms'], queryFn: api.getRooms });
  const { data: reservations = [] } = useQuery({ 
      queryKey: ['reservations', today], 
      queryFn: () => api.getReservations(today, today) 
  });
  const { data: guests = [] } = useQuery({ queryKey: ['guests'], queryFn: api.getGuests });

  // Calculate Metrics
  const totalRooms = rooms.length;
  const outOfOrder = rooms.filter(r => r.status === RoomStatus.OUT_OF_ORDER).length;
  const sellableRooms = totalRooms - outOfOrder;

  const arrivals = reservations.filter(r => r.checkIn === today && r.status === ReservationStatus.CONFIRMED);
  const departures = reservations.filter(r => r.checkOut === today && r.status === ReservationStatus.CHECKED_IN);
  const stayovers = reservations.filter(r => 
      r.status === ReservationStatus.CHECKED_IN && 
      r.checkOut !== today
  );
  
  const occupiedCount = arrivals.length + stayovers.length + reservations.filter(r => r.checkIn === today && r.status === ReservationStatus.CHECKED_IN).length;
  const occupancyRate = sellableRooms > 0 ? Math.round((occupiedCount / sellableRooms) * 100) : 0;

  // Calculate Revenue (Simple estimation based on active reservations for today)
  const dailyRevenue = [...arrivals, ...stayovers].reduce((acc, curr) => acc + (curr.totalPrice / Math.max(1, (new Date(curr.checkOut).getTime() - new Date(curr.checkIn).getTime()) / (1000 * 3600 * 24))), 0);

  const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500">{title}</p>
        <h3 className="text-2xl font-bold text-slate-900 mt-1">{value}</h3>
        {subtext && <p className={`text-xs mt-1 font-medium ${subtext.includes('+') ? 'text-green-600' : 'text-slate-400'}`}>{subtext}</p>}
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon size={20} className="text-white" />
      </div>
    </div>
  );

  return (
    <div className="p-8 h-full overflow-y-auto bg-slate-50">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview for {formatDate(today)}</p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard 
            title="Occupancy" 
            value={`${occupancyRate}%`} 
            subtext={`${sellableRooms - occupiedCount} rooms available`}
            icon={Bed} 
            color="bg-indigo-500" 
        />
        <StatCard 
            title="Arrivals" 
            value={arrivals.length} 
            subtext="Expecting today"
            icon={LogIn} 
            color="bg-blue-500" 
        />
        <StatCard 
            title="Departures" 
            value={departures.length} 
            subtext="Due out today"
            icon={LogOut} 
            color="bg-orange-500" 
        />
        <StatCard 
            title="Est. Revenue" 
            value={formatCurrency(dailyRevenue)} 
            subtext="+12% vs last week"
            icon={ArrowUpRight} 
            color="bg-emerald-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Arrivals List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-96">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><LogIn size={16} className="text-blue-500"/> Incoming Arrivals</h3>
                <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{arrivals.length} pending</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
                {arrivals.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                        <CheckCircle2 size={32} className="mb-2 opacity-50"/>
                        All arrivals checked in
                    </div>
                ) : (
                    arrivals.map(res => {
                        const guest = guests.find(g => g.id === res.guestId);
                        return (
                            <div key={res.id} className="p-3 hover:bg-slate-50 rounded-lg flex justify-between items-center transition-colors border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                                        {guest?.firstName[0]}{guest?.lastName[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-900">{guest?.lastName}, {guest?.firstName}</div>
                                        <div className="text-xs text-slate-500">Room {res.roomId.replace('r_', '')} • {res.guestCount} Guests</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs font-bold text-slate-700">{formatCurrency(res.totalPrice)}</div>
                                    <span className="text-[10px] text-blue-600 font-medium">CONFIRMED</span>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>

        {/* Departures List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col h-96">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h3 className="font-bold text-slate-800 flex items-center gap-2"><LogOut size={16} className="text-orange-500"/> Due Departures</h3>
                <span className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{departures.length} pending</span>
            </div>
            <div className="overflow-y-auto flex-1 p-2">
                {departures.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm">
                        <CheckCircle2 size={32} className="mb-2 opacity-50"/>
                        All departures processed
                    </div>
                ) : (
                    departures.map(res => {
                        const guest = guests.find(g => g.id === res.guestId);
                        return (
                            <div key={res.id} className="p-3 hover:bg-slate-50 rounded-lg flex justify-between items-center transition-colors border-b border-gray-50 last:border-0">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-xs font-bold">
                                        {guest?.firstName[0]}{guest?.lastName[0]}
                                    </div>
                                    <div>
                                        <div className="text-sm font-medium text-slate-900">{guest?.lastName}, {guest?.firstName}</div>
                                        <div className="text-xs text-slate-500">Room {res.roomId.replace('r_', '')}</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {res.balance && res.balance > 0 ? (
                                        <div className="text-xs font-bold text-red-600">Due: {formatCurrency(res.balance)}</div>
                                    ) : (
                                        <div className="text-xs font-bold text-green-600">Paid</div>
                                    )}
                                    <button className="text-[10px] bg-slate-800 text-white px-2 py-0.5 rounded mt-1 hover:bg-slate-700">Check Out</button>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
