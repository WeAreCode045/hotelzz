import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { RoomStatus } from '../../types';
import { CheckCircle, XCircle, AlertTriangle, RefreshCcw, Filter } from 'lucide-react';

export const HousekeepingView: React.FC = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<RoomStatus | 'ALL'>('ALL');
  
  const { data: rooms = [], isLoading } = useQuery({ queryKey: ['rooms'], queryFn: api.getRooms });
  const { data: roomTypes = [] } = useQuery({ queryKey: ['roomTypes'], queryFn: api.getRoomTypes });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string, status: RoomStatus }) => api.updateRoomStatus(id, status),
    onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['rooms'] });
    }
  });

  const filteredRooms = rooms.filter(r => filter === 'ALL' || r.status === filter).sort((a, b) => a.name.localeCompare(b.name));

  const getStatusBadge = (status: RoomStatus) => {
      switch(status) {
          case RoomStatus.CLEAN: return <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-semibold"><CheckCircle size={12}/> Clean</span>;
          case RoomStatus.DIRTY: return <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 px-2.5 py-1 rounded-full text-xs font-semibold"><XCircle size={12}/> Dirty</span>;
          case RoomStatus.INSPECTED: return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full text-xs font-semibold"><CheckCircle size={12}/> Inspected</span>;
          case RoomStatus.OUT_OF_ORDER: return <span className="inline-flex items-center gap-1 bg-gray-800 text-gray-200 px-2.5 py-1 rounded-full text-xs font-semibold"><AlertTriangle size={12}/> OOO</span>;
      }
  };

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Housekeeping</h1>
           <p className="text-slate-500 text-sm mt-1">Manage room status and maintenance</p>
        </div>
        
        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
            {(['ALL', RoomStatus.DIRTY, RoomStatus.CLEAN, RoomStatus.INSPECTED] as const).map(f => (
                <button 
                    key={f}
                    onClick={() => setFilter(f)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        filter === f 
                        ? 'bg-indigo-600 text-white shadow-sm' 
                        : 'text-slate-500 hover:bg-slate-50'
                    }`}
                >
                    {f === 'ALL' ? 'All Rooms' : f}
                </button>
            ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex-1 flex flex-col">
          <div className="overflow-y-auto flex-1">
              <table className="w-full text-left">
                  <thead className="bg-gray-50 border-b border-gray-100 text-xs text-slate-500 uppercase font-semibold sticky top-0 z-10">
                      <tr>
                          <th className="px-6 py-4">Room</th>
                          <th className="px-6 py-4">Type</th>
                          <th className="px-6 py-4">Current Status</th>
                          <th className="px-6 py-4 text-right">Actions</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                      {filteredRooms.map(room => (
                          <tr key={room.id} className="hover:bg-slate-50 transition-colors">
                              <td className="px-6 py-4">
                                  <span className="font-bold text-lg text-slate-800">{room.name}</span>
                                  <div className="text-xs text-slate-400">Floor {room.floor}</div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="text-sm text-slate-700">{roomTypes.find(t => t.id === room.roomTypeId)?.name}</div>
                              </td>
                              <td className="px-6 py-4">
                                  {getStatusBadge(room.status)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                      {room.status === RoomStatus.DIRTY && (
                                          <button 
                                              onClick={() => updateStatusMutation.mutate({ id: room.id, status: RoomStatus.CLEAN })}
                                              className="flex items-center gap-1 bg-white border border-green-200 text-green-700 hover:bg-green-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                          >
                                              <RefreshCcw size={14} /> Mark Clean
                                          </button>
                                      )}
                                      {room.status === RoomStatus.CLEAN && (
                                          <button 
                                              onClick={() => updateStatusMutation.mutate({ id: room.id, status: RoomStatus.INSPECTED })}
                                              className="flex items-center gap-1 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                                          >
                                              <CheckCircle size={14} /> Inspect
                                          </button>
                                      )}
                                      {room.status !== RoomStatus.DIRTY && (
                                          <button 
                                              onClick={() => updateStatusMutation.mutate({ id: room.id, status: RoomStatus.DIRTY })}
                                              className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                                              title="Mark as Dirty"
                                          >
                                              <XCircle size={16} />
                                          </button>
                                      )}
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
              {filteredRooms.length === 0 && (
                  <div className="p-12 text-center text-slate-400">
                      No rooms match the selected filter.
                  </div>
              )}
          </div>
      </div>
    </div>
  );
};
