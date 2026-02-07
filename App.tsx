
import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from './context/ToastContext';
import { Sidebar } from './components/Layout/Sidebar';
import { TapeChart } from './components/TapeChart/TapeChart';
import { GuestList } from './components/Guests/GuestList';
import { Dashboard } from './components/Dashboard/Dashboard';
import { HousekeepingView } from './components/Housekeeping/HousekeepingView';
import { SettingsView } from './components/Settings/SettingsView';
import { ReportsView } from './components/Reports/ReportsView';
import { LoginScreen } from './components/Auth/LoginScreen';
import { RatesCalendar } from './components/Rates/RatesCalendar';
import { api } from './services/api';
import { Loader2 } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minute
      refetchOnWindowFocus: false,
    },
  },
});

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
      const checkSession = async () => {
          try {
              const account = await api.auth.getAccount();
              if (account) setIsAuthenticated(true);
          } catch {
              setIsAuthenticated(false);
          } finally {
              setIsLoading(false);
          }
      };
      checkSession();
  }, []);

  const handleLogout = async () => {
      await api.auth.logout();
      setIsAuthenticated(false);
  };

  if (isLoading) {
      return <div className="h-screen w-full flex items-center justify-center bg-slate-900 text-indigo-500"><Loader2 className="animate-spin w-10 h-10"/></div>;
  }

  if (!isAuthenticated) {
      return (
          <QueryClientProvider client={queryClient}>
             <LoginScreen onLogin={() => setIsAuthenticated(true)} />
          </QueryClientProvider>
      );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <div className="flex h-screen w-full bg-slate-100 font-sans text-slate-900">
          <Sidebar 
            currentView={currentView} 
            onNavigate={setCurrentView} 
            onLogout={handleLogout}
          />
          <main className="flex-1 flex flex-col h-full overflow-hidden relative">
            {/* Top Bar */}
            <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10 flex-shrink-0">
              <div>
                  <h1 className="text-xl font-bold text-slate-800">Front Desk</h1>
                  <p className="text-xs text-slate-500">Welcome back, Manager</p>
              </div>
              <div className="flex items-center gap-4">
                  <div className="flex flex-col items-end">
                      <span className="text-xs text-slate-500">System Status</span>
                      <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                          Operational
                      </span>
                  </div>
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200">
                      M
                  </div>
              </div>
            </header>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden">
              {currentView === 'dashboard' && <Dashboard />}
              {currentView === 'tapechart' && <TapeChart />}
              {currentView === 'guests' && <GuestList />}
              {currentView === 'rates' && <RatesCalendar />}
              {currentView === 'housekeeping' && <HousekeepingView />}
              {currentView === 'reports' && <ReportsView />}
              {currentView === 'settings' && <SettingsView />}
            </div>
          </main>
        </div>
      </ToastProvider>
    </QueryClientProvider>
  );
};

export default App;
