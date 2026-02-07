
import React from 'react';
import { LayoutDashboard, CalendarDays, Users, BedDouble, Settings, LogOut, BarChart3, Calculator } from 'lucide-react';

interface Props {
  currentView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<Props> = ({ currentView, onNavigate, onLogout }) => {
  const getLinkClass = (view: string) => 
    `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
      currentView === view 
      ? 'bg-indigo-600/10 text-indigo-400 font-medium' 
      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
    }`;

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-full border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          <span className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-lg">N</span>
          Nexus PMS
        </h1>
      </div>
      
      <nav className="flex-1 px-4 space-y-2">
        <div onClick={() => onNavigate('dashboard')} className={getLinkClass('dashboard')}>
          <LayoutDashboard size={20} />
          <span>Dashboard</span>
        </div>
        <div onClick={() => onNavigate('tapechart')} className={getLinkClass('tapechart')}>
          <CalendarDays size={20} />
          <span>Tape Chart</span>
        </div>
        <div onClick={() => onNavigate('guests')} className={getLinkClass('guests')}>
          <Users size={20} />
          <span>Guests</span>
        </div>
        <div onClick={() => onNavigate('rates')} className={getLinkClass('rates')}>
          <Calculator size={20} />
          <span>Rates & Grid</span>
        </div>
        <div onClick={() => onNavigate('housekeeping')} className={getLinkClass('housekeeping')}>
          <BedDouble size={20} />
          <span>Housekeeping</span>
        </div>
        <div onClick={() => onNavigate('reports')} className={getLinkClass('reports')}>
          <BarChart3 size={20} />
          <span>Reports</span>
        </div>
        <div onClick={() => onNavigate('settings')} className={getLinkClass('settings')}>
          <Settings size={20} />
          <span>Settings</span>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-2 text-slate-400 hover:text-white transition-colors w-full"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
