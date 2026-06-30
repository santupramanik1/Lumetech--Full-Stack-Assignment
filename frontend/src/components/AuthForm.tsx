import React from 'react';
import { Key, RefreshCw } from 'lucide-react';
import type { Role } from '../App';

interface AuthFormProps {
  selectedRolePortal: Role;
  authMode: 'login' | 'register';
  setAuthMode: (mode: 'login' | 'register') => void;
  authEmail: string;
  setAuthEmail: (email: string) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  authError: string;
  setAuthError: (error: string) => void;
  authSuccess: string;
  setAuthSuccess: (success: string) => void;
  handleAuth: (mode: 'login' | 'register') => void;
  setSelectedRolePortal: (role: Role | null) => void;
  isLoading: boolean;
}

export const AuthForm: React.FC<AuthFormProps> = ({
  selectedRolePortal,
  authMode,
  setAuthMode,
  authEmail,
  setAuthEmail,
  authPassword,
  setAuthPassword,
  authError,
  setAuthError,
  authSuccess,
  setAuthSuccess,
  handleAuth,
  setSelectedRolePortal,
  isLoading,
}) => {
  return (
    <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl max-w-md mx-auto mt-16 text-center">
      <div className="text-lg font-semibold mb-3 flex items-center justify-center gap-2 text-white">
        <Key size={18} className="text-violet-400" />
        <span>Authenticate as {selectedRolePortal.replace('_', ' ')}</span>
      </div>
      
      <p className="text-sm text-gray-400 mb-6">
        Sign in or register to access the dashboard.
      </p>

      <div className="flex flex-col gap-1.5 mb-4 text-left">
        <span className="text-xs text-gray-400 font-semibold">Email Address</span>
        <input 
          type="email" 
          className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
          placeholder={`${selectedRolePortal.toLowerCase()}@swiftmart.com`}
          value={authEmail}
          onChange={e => setAuthEmail(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1.5 mb-6 text-left">
        <span className="text-xs text-gray-400 font-semibold">Password</span>
        <input 
          type="password" 
          className="bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
          placeholder="••••••••"
          value={authPassword}
          onChange={e => setAuthPassword(e.target.value)}
        />
      </div>

      {authError && <div className="text-red-500 text-xs mb-4 font-semibold">{authError}</div>}
      {authSuccess && <div className="text-emerald-500 text-xs mb-4 font-semibold">{authSuccess}</div>}

      {/* Tabs for Login / Register */}
      <div className="flex bg-white/5 border border-white/10 rounded-lg p-1 mb-6">
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${authMode === 'login' ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          onClick={() => {
            setAuthMode('login');
            setAuthError('');
            setAuthSuccess('');
          }}
        >
          Sign In
        </button>
        <button
          type="button"
          className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all cursor-pointer ${authMode === 'register' ? 'bg-gradient-to-r from-violet-500 to-pink-500 text-white shadow' : 'text-gray-400 hover:text-white'}`}
          onClick={() => {
            setAuthMode('register');
            setAuthError('');
            setAuthSuccess('');
          }}
        >
          Register
        </button>
      </div>

      <div className="mb-6">
        <button 
          className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold py-2.5 rounded-lg text-sm hover:opacity-90 transition-all cursor-pointer flex items-center justify-center gap-2"
          onClick={() => handleAuth(authMode)}
          disabled={isLoading}
        >
          {isLoading ? <RefreshCw size={14} className="animate-spin" /> : (authMode === 'login' ? 'Sign In' : 'Register')}
        </button>
      </div>

      <div className="border-t border-white/10 pt-4">
        <button 
          onClick={() => setSelectedRolePortal(null)}
          className="text-xs font-semibold text-gray-400 hover:text-white transition-all cursor-pointer"
        >
          ← Back to Portal Selection
        </button>
      </div>
    </div>
  );
};
