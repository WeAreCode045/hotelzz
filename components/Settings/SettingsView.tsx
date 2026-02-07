import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Building, Bed, Plus, Save, Loader2, DollarSign } from 'lucide-react';
import { RoomType } from '../../types';
import { useToast } from '../../context/ToastContext';

export const SettingsView: React.FC = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'property' | 'inventory'>('property');

  // Queries
  const { data: property, isLoading: loadingProp } = useQuery({ queryKey: ['property'], queryFn: api.getProperty });
  const { data: roomTypes = [], isLoading: loadingTypes } = useQuery({ queryKey: ['roomTypes'], queryFn: api.getRoomTypes });
  const { data: rooms = [], isLoading: loadingRooms } = useQuery({ queryKey: ['rooms'], queryFn: api.getRooms });

  // Mutations
  const updatePropertyMutation = useMutation({
    mutationFn: api.updateProperty,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['property'] });
        toast({ type: 'success', title: 'Saved', description: 'Property settings updated.' });
    }
  });

  const updateRoomTypeMutation = useMutation({
    mutationFn: (data: {id: string, updates: Partial<RoomType>}) => api.updateRoomType(data.id, data.updates),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['roomTypes'] });
        toast({ type: 'success', title: 'Saved', description: 'Room type price updated.' });
    }
  });

  const createRoomMutation = useMutation({
    mutationFn: api.createRoom,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['rooms'] });
        toast({ type: 'success', title: 'Room Added' });
    }
  });

  // Local State for New Room Form
  const [newRoomName, setNewRoomName] = useState('');
  const [newRoomType, setNewRoomType] = useState('');
  const [newRoomFloor, setNewRoomFloor] = useState(1);

  const handleAddRoom = (e: React.FormEvent) => {
      e.preventDefault();
      if(!newRoomName || !newRoomType) return;
      createRoomMutation.mutate({
          name: newRoomName,
          roomTypeId: newRoomType,
          floor: newRoomFloor,
      });
      setNewRoomName('');
  };

  if (loadingProp || loadingTypes) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-indigo-600"/></div>;

  return (
    <div className="p-8 h-full flex flex-col bg-slate-50 overflow-hidden">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Settings</h1>

      <div className="flex gap-6 h-full">
         {/* Settings Sidebar */}
         <div className="w-64 flex-shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 h-fit">
            <button 
                onClick={() => setActiveTab('property')}
                className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 border-l-4 transition-colors ${
                    activeTab === 'property' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-transparent text-slate-500 hover:bg-slate-50'
                }`}
            >
                <Building size={18}/> Property Details
            </button>
            <button 
                onClick={() => setActiveTab('inventory')}
                className={`w-full text-left px-4 py-3 text-sm font-medium flex items-center gap-2 border-l-4 transition-colors ${
                    activeTab === 'inventory' 
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700' 
                    : 'border-transparent text-slate-500 hover:bg-slate-50'
                }`}
            >
                <Bed size={18}/> Room Inventory
            </button>
         </div>

         {/* Content Area */}
         <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 p-8 overflow-y-auto">
            
            {/* Property Settings */}
            {activeTab === 'property' && property && (
                <div className="max-w-xl">
                    <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">General Information</h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Property Name</label>
                            <input 
                                type="text" 
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                defaultValue={property.name}
                                onBlur={(e) => updatePropertyMutation.mutate({ name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Base Currency</label>
                            <input 
                                type="text" disabled
                                className="w-full border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                                value={property.currency}
                            />
                            <p className="text-xs text-slate-400 mt-1">Currency cannot be changed after setup.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Inventory Settings */}
            {activeTab === 'inventory' && (
                <div className="space-y-10">
                    
                    {/* Room Types Section */}
                    <section>
                        <div className="flex justify-between items-end mb-4">
                            <h2 className="text-lg font-bold text-slate-800">Room Types & Pricing</h2>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                            {roomTypes.map(rt => (
                                <div key={rt.id} className="p-4 border border-gray-200 rounded-lg flex justify-between items-center bg-gray-50/50 hover:bg-white transition-colors hover:shadow-sm">
                                    <div>
                                        <h4 className="font-bold text-slate-700">{rt.name}</h4>
                                        <p className="text-xs text-slate-500">{rt.description} • Cap: {rt.capacity} Pax</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm text-slate-500">Base Price:</span>
                                        <div className="relative">
                                            <DollarSign size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"/>
                                            <input 
                                                type="number"
                                                className="w-24 pl-6 pr-2 py-1.5 border border-gray-300 rounded text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                                                defaultValue={rt.basePrice}
                                                onBlur={(e) => {
                                                    const val = Number(e.target.value);
                                                    if(val !== rt.basePrice) updateRoomTypeMutation.mutate({ id: rt.id, updates: { basePrice: val }});
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Rooms Section */}
                    <section>
                         <h2 className="text-lg font-bold text-slate-800 mb-4 border-b pb-2">Physical Rooms</h2>
                         
                         {/* Add Room Form */}
                         <form onSubmit={handleAddRoom} className="flex gap-3 mb-6 bg-slate-50 p-4 rounded-lg items-end">
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Room Name/Number</label>
                                <input 
                                    type="text" placeholder="e.g. 401" required
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    value={newRoomName}
                                    onChange={e => setNewRoomName(e.target.value)}
                                />
                            </div>
                            <div className="w-24">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Floor</label>
                                <input 
                                    type="number" required
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                                    value={newRoomFloor}
                                    onChange={e => setNewRoomFloor(Number(e.target.value))}
                                />
                            </div>
                            <div className="flex-1">
                                <label className="block text-xs font-semibold text-slate-500 mb-1">Type</label>
                                <select 
                                    required
                                    className="w-full border border-gray-300 rounded px-3 py-2 text-sm bg-white"
                                    value={newRoomType}
                                    onChange={e => setNewRoomType(e.target.value)}
                                >
                                    <option value="">Select Type...</option>
                                    {roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.name}</option>)}
                                </select>
                            </div>
                            <button 
                                type="submit" 
                                disabled={createRoomMutation.isPending}
                                className="bg-indigo-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-indigo-700 flex items-center gap-1 h-9"
                            >
                                <Plus size={16}/> Add Room
                            </button>
                         </form>

                         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                             {rooms.map(room => (
                                 <div key={room.id} className="border border-gray-200 rounded p-3 text-center hover:border-indigo-300 transition-colors">
                                     <div className="font-bold text-slate-800">{room.name}</div>
                                     <div className="text-xs text-slate-500">{roomTypes.find(rt => rt.id === room.roomTypeId)?.name}</div>
                                 </div>
                             ))}
                         </div>
                    </section>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};
