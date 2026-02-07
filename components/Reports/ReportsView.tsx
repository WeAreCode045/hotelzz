import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { formatCurrency, getDaysArray, formatDate } from '../../utils/helpers';
import { TrendingUp, Users, DollarSign, CalendarRange, Loader2 } from 'lucide-react';

export const ReportsView: React.FC = () => {
  // Mock data simulation for charts (since we don't have a full historical backend)
  const today = new Date();
  const last7Days = getDaysArray(new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000), 7);
  
  const { data: rooms = [], isLoading } = useQuery({ queryKey: ['rooms'], queryFn: api.getRooms });
  
  // Simulated metrics
  const totalRooms = rooms.length || 10;
  
  const dailyData = last7Days.map(date => {
     // Pseudo-random generation based on date string hash for consistency
     const hash = date.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
     const occupancyCount = Math.floor((hash % 8) + 2); // Random 2 to 9 rooms occupied
     const avgRate = 150 + (hash % 50);
     const revenue = occupancyCount * avgRate;
     
     return {
         date,
         revenue,
         occupancy: Math.round((occupancyCount / totalRooms) * 100),
         revpar: Math.round(revenue / totalRooms)
     };
  });

  const totalRevenue7Days = dailyData.reduce((acc, d) => acc + d.revenue, 0);
  const avgOccupancy7Days = Math.round(dailyData.reduce((acc, d) => acc + d.occupancy, 0) / 7);
  const avgRevPar7Days = Math.round(dailyData.reduce((acc, d) => acc + d.revpar, 0) / 7);

  const maxRevenue = Math.max(...dailyData.map(d => d.revenue));

  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50 overflow-y-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">Financial Reports</h1>
        <p className="text-slate-500 text-sm mt-1">Performance metrics for the last 7 days</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                      <DollarSign size={20} />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Total Revenue (7d)</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(totalRevenue7Days)}</div>
              <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp size={12}/> +12% vs previous period
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                      <Users size={20} />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Avg. Occupancy</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{avgOccupancy7Days}%</div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                  Target: 80%
              </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                      <CalendarRange size={20} />
                  </div>
                  <span className="text-sm font-medium text-slate-500">Avg. RevPAR</span>
              </div>
              <div className="text-2xl font-bold text-slate-900">{formatCurrency(avgRevPar7Days)}</div>
              <div className="text-xs text-green-600 font-medium mt-1 flex items-center gap-1">
                  <TrendingUp size={12}/> +5% vs previous period
              </div>
          </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8 flex-1 min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Revenue Trend</h3>
          
          <div className="h-64 flex items-end gap-4">
              {dailyData.map((d) => (
                  <div key={d.date} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                      <div className="relative w-full flex items-end justify-center h-full">
                          {/* Tooltip */}
                          <div className="absolute -top-12 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-xs rounded px-2 py-1 whitespace-nowrap z-10 pointer-events-none">
                              {formatCurrency(d.revenue)}
                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
                          </div>
                          
                          {/* Bar */}
                          <div 
                            className="w-full max-w-[60px] bg-indigo-500 rounded-t-lg hover:bg-indigo-600 transition-all duration-300 relative overflow-hidden"
                            style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                          >
                             <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                          </div>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{new Date(d.date).toLocaleDateString('en-US', { weekday: 'short' })}</span>
                  </div>
              ))}
          </div>
      </div>
      
      {/* Occupancy Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-bold text-slate-800 mb-4">Occupancy by Day</h3>
            <div className="space-y-3">
                {dailyData.map(d => (
                    <div key={d.date} className="flex items-center gap-4 text-sm">
                        <span className="w-24 text-slate-500 font-medium">{formatDate(d.date)}</span>
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                                className={`h-full rounded-full ${d.occupancy > 80 ? 'bg-green-500' : d.occupancy > 50 ? 'bg-blue-500' : 'bg-orange-500'}`}
                                style={{ width: `${d.occupancy}%` }}
                            ></div>
                        </div>
                        <span className="w-12 text-right font-bold text-slate-700">{d.occupancy}%</span>
                    </div>
                ))}
            </div>
         </div>
         
         <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <div>
               <h3 className="text-lg font-bold opacity-90">Manager's Note</h3>
               <p className="text-indigo-100 text-sm mt-2 leading-relaxed">
                   Revenue is tracking 12% above forecast for this week. Weekend occupancy is strong, but mid-week checks are slightly below target. Consider launching a "Mid-Week Getaway" promotion for next Tuesday-Wednesday to boost RevPAR.
               </p>
            </div>
            <div className="mt-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">M</div>
                <div>
                    <div className="font-bold text-sm">System Insight</div>
                    <div className="text-xs text-indigo-200">Generated 2 mins ago</div>
                </div>
            </div>
         </div>
      </div>

    </div>
  );
};
