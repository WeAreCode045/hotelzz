
import React, { useState } from 'react';
import { Lock, Mail, ArrowRight, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

interface Props {
  onLogin: () => void;
}

export const LoginScreen: React.FC<Props> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
        await api.auth.login(email, password);
        onLogin();
    } catch (err: any) {
        setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          <div className="p-8 pb-6 border-b border-gray-100">
             <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center mb-4 text-white font-bold text-2xl shadow-lg shadow-indigo-200">
                N
             </div>
             <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
             <p className="text-slate-500 mt-2">Sign in to Nexus PMS to manage your property.</p>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-5">
              {error && (
                  <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm flex items-center gap-2">
                      <AlertCircle size={16} /> {error}
                  </div>
              )}

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
                  <div className="relative">
                      <Mail className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="email" 
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 transition-shadow"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                      />
                  </div>
              </div>

              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
                  <div className="relative">
                      <Lock className="absolute left-3 top-3 text-slate-400" size={18} />
                      <input 
                        type="password" 
                        required
                        className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-slate-800 transition-shadow"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                      />
                  </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded text-indigo-600 focus:ring-indigo-500 border-gray-300" />
                      <span className="text-slate-600">Remember me</span>
                  </label>
                  <a href="#" className="text-indigo-600 font-medium hover:underline">Forgot password?</a>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-indigo-600 text-white font-bold py-3 rounded-lg hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
              >
                {loading ? (
                    <>Processing...</>
                ) : (
                    <>Sign In <ArrowRight size={18} /></>
                )}
              </button>
          </form>

          <div className="bg-gray-50 p-4 text-center text-xs text-slate-400 border-t border-gray-100">
             Protected by enterprise-grade security. <br/> Nexus PMS v2.0.1
          </div>
      </div>
    </div>
  );
};
