import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Guest } from '../../types';
import { Search, Mail, Phone, MoreVertical, Shield } from 'lucide-react';

export const GuestList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { data: guests = [], isLoading } = useQuery({ queryKey: ['guests'], queryFn: api.getGuests });

  const filteredGuests = guests.filter(g => 
    g.lastName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 h-full flex flex-col overflow-hidden bg-slate-50">
      <div className="flex justify-between items-center mb-8">
        <div>
           <h1 className="text-2xl font-bold text-slate-800">Guest Profiles</h1>
           <p className="text-slate-500 text-sm mt-1">Manage guest information and history</p>
        </div>
        <div className="relative w-72">
           <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
           <input 
             type="text" 
             placeholder="Search by name or email..." 
             className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 overflow-hidden flex flex-col">
          {isLoading ? (
             <div className="p-8 text-center text-slate-500">Loading Guests...</div>
          ) : (
            <div className="overflow-auto flex-1">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-100 text-xs text-slate-500 uppercase font-semibold sticky top-0">
                   <tr>
                      <th className="px-6 py-4">Name</th>
                      <th className="px-6 py-4">Contact</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Last Stay</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {filteredGuests.map(guest => (
                      <tr key={guest.id} className="hover:bg-slate-50/80 transition-colors group">
                         <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold">
                                   {guest.firstName[0]}{guest.lastName[0]}
                                </div>
                                <div>
                                   <div className="font-medium text-slate-900">{guest.lastName}, {guest.firstName}</div>
                                   <div className="text-xs text-slate-500">ID: {guest.id}</div>
                                </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            <div className="flex flex-col gap-1 text-sm text-slate-600">
                               <div className="flex items-center gap-2">
                                  <Mail size={14} className="text-slate-400"/> {guest.email}
                               </div>
                               <div className="flex items-center gap-2">
                                  <Phone size={14} className="text-slate-400"/> {guest.phone}
                               </div>
                            </div>
                         </td>
                         <td className="px-6 py-4">
                            {guest.vipStatus ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                   <Shield size={12} fill="currentColor" /> VIP
                                </span>
                            ) : (
                                <span className="text-slate-500 text-sm">Regular</span>
                            )}
                         </td>
                         <td className="px-6 py-4 text-sm text-slate-500">
                            -
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button className="p-2 hover:bg-gray-100 rounded-lg text-slate-400 hover:text-indigo-600 transition-colors">
                               <MoreVertical size={18} />
                            </button>
                         </td>
                      </tr>
                   ))}
                </tbody>
              </table>
            </div>
          )}
      </div>
    </div>
  );
};
