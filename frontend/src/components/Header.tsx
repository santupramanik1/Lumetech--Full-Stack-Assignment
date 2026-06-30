import React from 'react';
import { Zap } from 'lucide-react';
import type { Role, DarkStore } from '../App';

interface HeaderProps {
  selectedRolePortal: Role | null;
  tokens: Record<Role, string | null>;
  wsConnected: boolean;
  managedStore: DarkStore | null;
  setSelectedRolePortal: (role: Role | null) => void;
}

export const Header: React.FC<HeaderProps> = ({
  selectedRolePortal,
  tokens,
  wsConnected,
  managedStore,
  setSelectedRolePortal,
}) => {
  return (
    <header className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-black/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 gap-4">
      <div 
        className="flex items-center gap-3 select-none" 
        onClick={() => !tokens[selectedRolePortal || 'STORE_MANAGER'] && setSelectedRolePortal(null)} 
        style={{ cursor: 'pointer' }}
      >
        <div className="w-10 h-10 bg-gradient-to-br from-amber-400 via-violet-600 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(139,92,246,0.4)] border border-white/20 transition-all hover:scale-105 duration-300">
          <Zap size={20} className="fill-white text-white drop-shadow-[0_2px_8px_rgba(251,191,36,0.5)]" />
        </div>
        <div className="flex flex-col">
          <span className="text-xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-white to-purple-300 bg-clip-text text-transparent">
            Swift<span className="bg-gradient-to-r from-pink-400 to-violet-400 bg-clip-text text-transparent font-medium">Mart</span>
          </span>
          <span className="text-[9px] font-bold tracking-widest text-violet-300 uppercase leading-none mt-1">
            On-Demand
          </span>
        </div>
      </div>

      {/* WebSocket Status Indicator */}
      {selectedRolePortal && tokens[selectedRolePortal as Role] && selectedRolePortal === 'STORE_MANAGER' && (
        <div className="flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
          <div className={`w-2.5 h-2.5 rounded-full ${wsConnected ? 'bg-emerald-500 dot-glow-connected' : 'bg-red-500 dot-glow-disconnected'}`}></div>
          <span>
            {wsConnected 
              ? `Store #${managedStore?.id || '?'}: Live Orders Stream` 
              : 'WebSocket Offline'}
          </span>
        </div>
      )}

      {/* Selected Portal Indicator & Navigation */}
      {selectedRolePortal && (
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold px-4 py-1.5 bg-gradient-to-r from-violet-500/20 to-pink-500/20 border border-violet-500/30 rounded-full text-violet-200">
            {selectedRolePortal.replace('_', ' ')} PORTAL
          </span>
          {!tokens[selectedRolePortal as Role] && (
            <button 
              onClick={() => setSelectedRolePortal(null)}
              className="text-xs font-semibold text-gray-400 hover:text-white border border-white/10 hover:bg-white/5 px-3 py-1.5 rounded-lg transition-all cursor-pointer"
            >
              ← Switch Portal
            </button>
          )}
        </div>
      )}
    </header>
  );
};
