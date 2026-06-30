import React from 'react';
import { Store, ShoppingCart, Truck } from 'lucide-react';
import type { Role } from '../App';

interface PortalSelectionProps {
  setSelectedRolePortal: (role: Role | null) => void;
  setAuthError: (error: string) => void;
  setAuthSuccess: (success: string) => void;
}

export const PortalSelection: React.FC<PortalSelectionProps> = ({
  setSelectedRolePortal,
  setAuthError,
  setAuthSuccess,
}) => {
  const handleSelectPortal = (role: Role) => {
    setSelectedRolePortal(role);
    setAuthError('');
    setAuthSuccess('');
  };

  return (
    <div className="max-w-4xl mx-auto mt-12 text-center space-y-8">
      <div className="space-y-3">
        <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
          Welcome to SwiftMart
        </h2>
        <p className="text-gray-400 text-base max-w-lg mx-auto">
          Please select your access portal below to sign in or register for your dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {/* Manager Card */}
        <div 
          className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-violet-500/50 rounded-2xl p-8 shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center space-y-4"
          onClick={() => handleSelectPortal('STORE_MANAGER')}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/25 to-pink-500/25 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-all duration-300">
            <Store size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">Store Manager</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Register stores, control stock, publish inventory, and coordinate active packing lists.
            </p>
          </div>
        </div>

        {/* Customer Card */}
        <div 
          className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-violet-500/50 rounded-2xl p-8 shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center space-y-4"
          onClick={() => handleSelectPortal('CUSTOMER')}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/25 to-pink-500/25 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-all duration-300">
            <ShoppingCart size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">Customer App</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Search products, manage interactive shopping cart, simulate locations, and confirm checkout orders.
            </p>
          </div>
        </div>

        {/* Rider Card */}
        <div 
          className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-violet-500/50 rounded-2xl p-8 shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center space-y-4"
          onClick={() => handleSelectPortal('DELIVERY_RIDER')}
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500/25 to-pink-500/25 border border-violet-500/30 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-all duration-300">
            <Truck size={28} />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white mb-2 group-hover:text-violet-300 transition-colors">Rider Portal</h3>
            <p className="text-xs text-gray-400 leading-relaxed">
              Check available dispatched pool, accept deliveries, and mark orders as fulfilled.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
