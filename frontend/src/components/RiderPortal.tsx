import React from 'react';
import { Truck, LogOut, RefreshCw } from 'lucide-react';
import type { Role, Order } from '../App';

interface RiderPortalProps {
  riderOrders: Order[];
  fetchRiderOrders: () => void;
  handleMarkAsDelivered: (orderId: number) => void;
  saveToken: (role: Role, token: string | null) => void;
  setSelectedRolePortal: (role: Role | null) => void;
  isLoading: boolean;
  loadingStates: Record<string, boolean>;
}

export const RiderPortal: React.FC<RiderPortalProps> = ({
  riderOrders,
  fetchRiderOrders,
  handleMarkAsDelivered,
  saveToken,
  setSelectedRolePortal,
  isLoading,
  loadingStates,
}) => {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Delivery Rider App</h1>
          <p className="text-gray-400 text-sm mt-1">
            Accept and fulfill dispatched orders in your local area.
          </p>
        </div>
        <div className="flex gap-3">
          <button 
            className="inline-flex items-center gap-1 bg-white/5 border border-white/10 text-white px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer"
            onClick={fetchRiderOrders}
            disabled={loadingStates['refreshPool']}
          >
            <RefreshCw size={14} className={loadingStates['refreshPool'] ? "animate-spin" : ""} /> Refresh Pool
          </button>
          <button 
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer" 
            onClick={() => { saveToken('DELIVERY_RIDER', null); setSelectedRolePortal(null); }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {/* Available Pool List */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
          <Truck className="text-violet-400" size={20} />
          <span>Available Orders Pool (Dispatched)</span>
          <span className="ml-2 text-xs bg-white/10 px-2.5 py-0.5 rounded-full font-semibold">{riderOrders.length}</span>
        </h2>

        {riderOrders.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            <Truck className="w-16 h-16 mx-auto text-gray-600 mb-4" />
            <p className="text-sm">No dispatched orders currently available in the pool.</p>
            <p className="text-xs text-gray-600 mt-1">Once a Store Manager dispatches an order, it will appear here for delivery.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {riderOrders.map(order => (
              <div key={order.id} className="bg-white/5 border border-white/10 rounded-xl p-5 shadow-lg flex flex-col justify-between hover:border-violet-500/50 transition-all">
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-sm font-bold text-white">Order #{order.id}</span>
                    <span className="text-sm font-bold text-pink-500">${order.total_amount.toFixed(2)}</span>
                  </div>

                  <div className="text-xs text-gray-400 flex flex-col gap-1.5 mb-4 border-b border-white/5 pb-3">
                    <span><strong>Store ID:</strong> {order.store_id}</span>
                    <span><strong>Customer ID:</strong> {order.customer_id}</span>
                    <span><strong>Dropoff Location:</strong> {order.customer_lat.toFixed(4)}, {order.customer_lng.toFixed(4)}</span>
                  </div>

                  <div className="mb-4">
                    <h4 className="text-xs font-bold text-gray-400 mb-2">Order Items:</h4>
                    <div className="max-h-[80px] overflow-y-auto space-y-1">
                      {order.items.map(item => (
                        <div key={item.id} className="text-xs text-gray-300 flex justify-between">
                          <span>Product #{item.product_id}</span>
                          <span>Qty: {item.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <button 
                  className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white font-extrabold py-2.5 rounded-lg text-sm hover:opacity-90 shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
                  onClick={() => handleMarkAsDelivered(order.id)}
                  disabled={loadingStates['rider_order_' + order.id]}
                >
                  {loadingStates['rider_order_' + order.id] ? <RefreshCw size={14} className="animate-spin" /> : 'Mark as Delivered'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
