import React from 'react';
import { ShoppingCart, LogOut, RefreshCw } from 'lucide-react';
import { Role, Product } from '../App';

interface CustomerPortalProps {
  customerScreen: 'shopping' | 'checkout';
  setCustomerScreen: (screen: 'shopping' | 'checkout') => void;
  cart: Record<number, number>;
  setCart: (cart: Record<number, number> | ((prev: Record<number, number>) => Record<number, number>)) => void;
  customerSearch: string;
  setCustomerSearch: (search: string) => void;
  customerProducts: Product[];
  customerLat: string;
  setCustomerLat: (lat: string) => void;
  customerLng: string;
  setCustomerLng: (lng: string) => void;
  handleAddToCart: (product: Product) => void;
  handleRemoveFromCart: (productId: number) => void;
  handleConfirmOrder: () => void;
  saveToken: (role: Role, token: string | null) => void;
  setSelectedRolePortal: (role: Role | null) => void;
  isLoading: boolean;
  loadingStates: Record<string, boolean>;
}

export const CustomerPortal: React.FC<CustomerPortalProps> = ({
  customerScreen,
  setCustomerScreen,
  cart,
  setCart,
  customerSearch,
  setCustomerSearch,
  customerProducts,
  customerLat,
  setCustomerLat,
  customerLng,
  setCustomerLng,
  handleAddToCart,
  handleRemoveFromCart,
  handleConfirmOrder,
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
          <h1 className="text-3xl font-bold tracking-tight text-white">Customer App</h1>
          <p className="text-gray-400 text-sm mt-1">
            {customerScreen === 'shopping' 
              ? 'Browse catalog, add items to your cart, and place orders.' 
              : 'Confirm your location and place the order.'}
          </p>
        </div>
        <div className="flex gap-3">
          {customerScreen === 'shopping' && (
            <button 
              className={`inline-flex items-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-semibold px-4 py-2 rounded-lg text-sm transition-all cursor-pointer shadow-md ${Object.keys(cart).length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-90'}`}
              onClick={() => {
                if (Object.keys(cart).length > 0) setCustomerScreen('checkout');
              }}
              disabled={Object.keys(cart).length === 0}
            >
              <ShoppingCart size={15} /> Checkout ({Object.values(cart).reduce((a, b) => a + b, 0)} items)
            </button>
          )}
          <button 
            className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer" 
            onClick={() => { saveToken('CUSTOMER', null); setSelectedRolePortal(null); }}
          >
            <LogOut size={15} /> Sign Out
          </button>
        </div>
      </div>

      {customerScreen === 'shopping' ? (
        /* Shopping Screen */
        <div className="space-y-6">
          {/* Search & Filter bar */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="w-full md:max-w-md">
              <input 
                type="text"
                placeholder="Search products by name..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-2 text-white text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500/50"
              />
            </div>
            {Object.keys(cart).length > 0 && (
              <div className="text-sm text-gray-400">
                Current Cart: <strong className="text-violet-400">{Object.keys(cart).length} products</strong> from Store #{customerProducts.find(p => p.id === Number(Object.keys(cart)[0]))?.store_id}
                <button 
                  onClick={() => setCart({})} 
                  className="ml-3 text-xs bg-red-500/20 text-red-300 border border-red-500/30 px-2.5 py-1 rounded hover:bg-red-500 hover:text-white transition-all cursor-pointer"
                >
                  Clear Cart
                </button>
              </div>
            )}
          </div>

          {/* Catalog */}
          {customerProducts.length === 0 ? (
            <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center text-gray-500">
              <ShoppingCart className="w-12 h-12 mx-auto text-gray-600 mb-4" />
              <p className="text-sm">No products available in any stores right now.</p>
              <p className="text-xs text-gray-600 mt-1">Switch to Manager mode to add new dark stores and products.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {customerProducts
                .filter(p => p.name.toLowerCase().includes(customerSearch.toLowerCase()))
                .map(product => {
                  const cartQty = cart[product.id] || 0;
                  return (
                    <div key={product.id} className="bg-white/5 border border-white/10 rounded-2xl p-5 shadow-2xl flex flex-col justify-between hover:border-violet-500/50 transition-all group">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-semibold px-2 py-0.5 bg-white/5 rounded-full border border-white/5 text-gray-400">
                            Store #{product.store_id}
                          </span>
                          <span className="text-xs font-bold text-emerald-400">
                            {product.stock_quantity > 0 ? `${product.stock_quantity} left` : 'Out of stock'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-white group-hover:text-violet-300 transition-colors mb-1">{product.name}</h3>
                        <p className="text-lg font-extrabold text-pink-500 mb-4">${product.price.toFixed(2)}</p>
                      </div>

                      <div className="mt-auto">
                        {product.stock_quantity <= 0 ? (
                          <button 
                            className="w-full bg-white/5 border border-white/10 text-gray-500 py-2 rounded-lg text-sm font-semibold cursor-not-allowed"
                            disabled
                          >
                            Out of Stock
                          </button>
                        ) : cartQty === 0 ? (
                          <button 
                            className="w-full bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-2 rounded-lg text-sm hover:opacity-90 shadow-md transition-all cursor-pointer"
                            onClick={() => handleAddToCart(product)}
                          >
                            Add to Cart
                          </button>
                        ) : (
                          <div className="flex items-center justify-between bg-black/20 border border-white/10 rounded-lg p-1">
                            <button 
                              className="w-8 h-8 rounded-md bg-white/5 border border-white/5 text-white flex items-center justify-center hover:bg-white/10 font-bold transition-all cursor-pointer"
                              onClick={() => handleRemoveFromCart(product.id)}
                            >
                              -
                            </button>
                            <span className="font-bold text-white text-sm">{cartQty}</span>
                            <button 
                              className="w-8 h-8 rounded-md bg-white/5 border border-white/5 text-white flex items-center justify-center hover:bg-white/10 font-bold transition-all cursor-pointer"
                              onClick={() => handleAddToCart(product)}
                            >
                              +
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      ) : (
        /* Checkout Screen */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items & Summary */}
          <div className="lg:col-span-2 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h2 className="text-xl font-bold text-white">Order Summary</h2>
              <button 
                onClick={() => setCustomerScreen('shopping')}
                className="text-xs text-gray-400 hover:text-white border border-white/10 px-3 py-1.5 rounded-lg bg-white/5 transition-all cursor-pointer"
              >
                ← Back to Shopping
              </button>
            </div>

            <div className="divide-y divide-white/5">
              {Object.entries(cart).map(([productIdStr, qty]) => {
                const pId = parseInt(productIdStr);
                const product = customerProducts.find(p => p.id === pId);
                if (!product) return null;
                return (
                  <div key={pId} className="flex justify-between items-center py-4">
                    <div>
                      <h4 className="text-sm font-bold text-white">{product.name}</h4>
                      <p className="text-xs text-gray-400">Store #{product.store_id} • ${product.price.toFixed(2)} each</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-gray-300 font-semibold">{qty}x</span>
                      <p className="text-sm font-bold text-pink-500">${(product.price * qty).toFixed(2)}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-white/10 pt-4 flex justify-between items-center">
              <span className="text-base text-gray-300 font-bold">Total Amount</span>
              <span className="text-2xl font-extrabold text-white">
                ${Object.entries(cart).reduce((acc, [productIdStr, qty]) => {
                  const product = customerProducts.find(p => p.id === parseInt(productIdStr));
                  return acc + (product ? product.price * qty : 0);
                }, 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Simulated Coordinates & Confirm */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 flex flex-col justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-4">Set Delivery Location</h2>
              <p className="text-xs text-gray-400 mb-5">
                Enter your coordinates so we can find the closest store to prepare your order and instantly match you with a nearby delivery rider.
              </p>

              <div className="space-y-4">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-semibold">Customer Latitude</span>
                  <input 
                    type="text" 
                    className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500" 
                    value={customerLat}
                    onChange={e => setCustomerLat(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-semibold">Customer Longitude</span>
                  <input 
                    type="text" 
                    className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500" 
                    value={customerLng}
                    onChange={e => setCustomerLng(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button 
              className="w-full mt-6 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-extrabold py-3 rounded-lg text-sm hover:opacity-90 shadow-lg shadow-violet-500/10 transition-all cursor-pointer flex items-center justify-center gap-2"
              onClick={handleConfirmOrder}
              disabled={loadingStates['confirmOrder']}
            >
              {loadingStates['confirmOrder'] ? <RefreshCw size={14} className="animate-spin" /> : 'Confirm & Place Order'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
