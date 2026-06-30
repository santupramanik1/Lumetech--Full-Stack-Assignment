import React from 'react';
import { 
  Store, 
  LogOut, 
  Plus, 
  Package, 
  Info, 
  Activity, 
  RefreshCw 
} from 'lucide-react';
import type { Role, Product, Order, DarkStore } from '../App';

interface ManagerDashboardProps {
  managedStore: DarkStore | null;
  setManagedStore: (store: DarkStore | null) => void;
  storeName: string;
  setStoreName: (name: string) => void;
  storeLat: string;
  setStoreLat: (lat: string) => void;
  storeLng: string;
  setStoreLng: (lng: string) => void;
  handleCreateStore: (e: React.FormEvent) => void;
  handleCreateProduct: (e: React.FormEvent) => void;
  products: Product[];
  newProductName: string;
  setNewProductName: (name: string) => void;
  newProductPrice: string;
  setNewProductPrice: (price: string) => void;
  newProductStock: string;
  setNewProductStock: (stock: string) => void;
  activeOrders: Order[];
  fetchStoreData: () => void;
  handleUpdateOrderStatus: (orderId: number, nextStatus: 'PACKING' | 'DISPATCHED') => void;
  startEditing: (p: Product) => void;
  cancelEditing: () => void;
  handleUpdateProduct: (productId: number) => void;
  editingProductId: number | null;
  editProductName: string;
  setEditProductName: (name: string) => void;
  editProductPrice: string;
  setEditProductPrice: (price: string) => void;
  editProductStock: string;
  setEditProductStock: (stock: string) => void;
  loadingStates: Record<string, boolean>;
  saveToken: (role: Role, token: string | null) => void;
  setSelectedRolePortal: (role: Role | null) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  managedStore,
  setManagedStore,
  storeName,
  setStoreName,
  storeLat,
  setStoreLat,
  storeLng,
  setStoreLng,
  handleCreateStore,
  handleCreateProduct,
  products,
  newProductName,
  setNewProductName,
  newProductPrice,
  setNewProductPrice,
  newProductStock,
  setNewProductStock,
  activeOrders,
  fetchStoreData,
  handleUpdateOrderStatus,
  startEditing,
  cancelEditing,
  handleUpdateProduct,
  editingProductId,
  editProductName,
  setEditProductName,
  editProductPrice,
  setEditProductPrice,
  editProductStock,
  setEditProductStock,
  loadingStates,
  saveToken,
  setSelectedRolePortal,
}) => {
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white">Store Manager Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            Configure dark stores, monitor inventory, and process active orders.
          </p>
        </div>
        <button 
          className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-white font-semibold px-4 py-2 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer" 
          onClick={() => { saveToken('STORE_MANAGER', null); setSelectedRolePortal(null); }}
        >
          <LogOut size={15} /> Sign Out
        </button>
      </div>

      {/* Setup Panels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        {/* Store Registration Panel */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="text-lg font-semibold mb-5 flex items-center gap-2 text-white">
            <Store size={18} className="text-violet-400" />
            <span>{managedStore ? 'Dark Store Settings' : 'Setup Dark Store'}</span>
          </div>

          {!managedStore ? (
            <form onSubmit={handleCreateStore}>
              <div className="flex flex-col gap-1.5 mb-4">
                <span className="text-xs text-gray-400 font-semibold">Store Name</span>
                <input 
                  type="text" 
                  className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500" 
                  placeholder="Vibe Outlet Indiranagar" 
                  value={storeName}
                  onChange={e => setStoreName(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-semibold">Latitude</span>
                  <input 
                    type="text" 
                    className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500" 
                    value={storeLat}
                    onChange={e => setStoreLat(e.target.value)}
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <span className="text-xs text-gray-400 font-semibold">Longitude</span>
                  <input 
                    type="text" 
                    className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500" 
                    value={storeLng}
                    onChange={e => setStoreLng(e.target.value)}
                  />
                </div>
              </div>
              <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-2.5 rounded-lg text-sm hover:opacity-90 shadow-md shadow-violet-500/10 cursor-pointer" disabled={loadingStates['createStore']}>
                {loadingStates['createStore'] ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />} Register Store
              </button>
            </form>
          ) : (
            <div>
              <div className="bg-white/3 border border-white/10 rounded-xl p-4 mb-6">
                <h3 className="text-lg font-semibold text-white mb-2">{managedStore.name}</h3>
                <div className="flex flex-col gap-1.5 text-xs text-gray-400">
                  <span><strong>Store ID:</strong> {managedStore.id}</span>
                  <span><strong>Coordinates:</strong> {managedStore.latitude.toFixed(4)}, {managedStore.longitude.toFixed(4)}</span>
                </div>
              </div>
              <button className="w-full bg-white/5 border border-white/10 text-white font-semibold py-2 rounded-lg text-sm hover:bg-white/10 transition-all cursor-pointer" onClick={() => setManagedStore(null)}>
                Change / Reset Store
              </button>
            </div>
          )}
        </div>

        {/* Manage Products Panel */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="text-lg font-semibold mb-5 flex items-center gap-2 text-white">
            <Package size={18} className="text-pink-400" />
            <span>Manage Products Inventory</span>
          </div>

          {!managedStore ? (
            <div className="flex flex-col items-center justify-center py-10 text-gray-500">
              <Info size={32} className="mb-3 text-gray-600" />
              <p className="text-sm">Create a Dark Store to manage products</p>
            </div>
          ) : (
            <div>
              <form onSubmit={handleCreateProduct} className="mb-6">
                <div className="flex flex-col gap-1.5 mb-4">
                  <span className="text-xs text-gray-400 font-semibold">Product Name</span>
                  <input 
                    type="text" 
                    className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500" 
                    placeholder="Fresh Whole Milk 1L" 
                    value={newProductName}
                    onChange={e => setNewProductName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4 mb-5">
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-400 font-semibold">Price (USD)</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500" 
                      placeholder="3.50" 
                      value={newProductPrice}
                      onChange={e => setNewProductPrice(e.target.value)}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs text-gray-400 font-semibold">Stock Quantity</span>
                    <input 
                      type="number" 
                      className="bg-black/20 border border-white/10 rounded-lg px-4 py-2.5 text-white text-sm outline-none focus:border-violet-500" 
                      placeholder="50" 
                      value={newProductStock}
                      onChange={e => setNewProductStock(e.target.value)}
                    />
                  </div>
                </div>
                <button type="submit" className="w-full inline-flex items-center justify-center gap-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white font-bold py-2.5 rounded-lg text-sm hover:opacity-90 shadow-md shadow-violet-500/10 cursor-pointer" disabled={loadingStates['createProduct']}>
                  {loadingStates['createProduct'] ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />} Add Product to Store
                </button>
              </form>

              <div className="max-h-[160px] overflow-y-auto">
                <h4 className="text-xs font-bold text-gray-400 mb-2">Current Stock</h4>
                {products.length === 0 ? (
                  <p className="text-xs text-gray-500">No products added yet</p>
                ) : (
                  <table className="w-full text-left text-sm text-gray-300">
                    <thead>
                      <tr className="text-xs text-gray-400 border-b border-white/10">
                        <th className="pb-2">Name</th>
                        <th className="pb-2">Price</th>
                        <th className="pb-2">Stock</th>
                        <th className="pb-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => {
                        const isEditing = editingProductId === p.id;
                        return (
                          <tr key={p.id} className="border-b border-white/5">
                            {isEditing ? (
                              <>
                                <td className="py-1">
                                  <input
                                    type="text"
                                    className="w-full bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:border-violet-500"
                                    value={editProductName}
                                    onChange={e => setEditProductName(e.target.value)}
                                  />
                                </td>
                                <td className="py-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    className="w-16 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:border-violet-500"
                                    value={editProductPrice}
                                    onChange={e => setEditProductPrice(e.target.value)}
                                  />
                                </td>
                                <td className="py-1">
                                  <input
                                    type="number"
                                    className="w-12 bg-black/40 border border-white/10 rounded px-1.5 py-0.5 text-xs text-white outline-none focus:border-violet-500"
                                    value={editProductStock}
                                    onChange={e => setEditProductStock(e.target.value)}
                                  />
                                </td>
                                <td className="py-1 text-right space-x-1.5">
                                  <button
                                    onClick={() => handleUpdateProduct(p.id)}
                                    disabled={loadingStates['editProduct_' + p.id]}
                                    className="text-[10px] bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-all inline-flex items-center gap-1"
                                  >
                                    {loadingStates['editProduct_' + p.id] && <RefreshCw size={8} className="animate-spin" />}
                                    Save
                                  </button>
                                  <button
                                    onClick={cancelEditing}
                                    className="text-[10px] bg-white/5 text-gray-400 hover:bg-white/10 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-all"
                                  >
                                    Cancel
                                  </button>
                                </td>
                              </>
                            ) : (
                              <>
                                <td className="py-2">{p.name}</td>
                                <td className="py-2">${p.price.toFixed(2)}</td>
                                <td className="py-2">{p.stock_quantity}</td>
                                <td className="py-2 text-right">
                                  <button
                                    onClick={() => startEditing(p)}
                                    className="text-[10px] bg-white/5 border border-white/10 text-violet-300 hover:bg-violet-500 hover:text-white px-2 py-0.5 rounded cursor-pointer transition-all"
                                  >
                                    Edit
                                  </button>
                                </td>
                              </>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Orders Tracking Board */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl mt-8">
        <div className="flex justify-between items-center border-b border-white/10 pb-4 mb-6">
          <div className="text-lg font-semibold flex items-center gap-2 text-white">
            <Activity size={18} className="text-emerald-400" />
            <span>Live Active Orders Tracking Board</span>
          </div>
          <button 
            className="inline-flex items-center gap-1 bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 transition-all cursor-pointer" 
            onClick={fetchStoreData} 
            disabled={loadingStates['refreshBoard']}
          >
            <RefreshCw size={12} className={loadingStates['refreshBoard'] ? "animate-spin" : ""} /> Refresh Board
          </button>
        </div>

        {!managedStore ? (
          <div className="py-12 text-center text-gray-500">
            Register or select a dark store to track live orders stream.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Received Placed Column */}
            <div className="bg-white/2 border border-white/10 rounded-2xl p-5 min-h-[380px]">
              <div className="flex justify-between items-center text-sm font-bold text-white mb-5">
                <span>Received / Placed</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-semibold">{activeOrders.filter(o => o.status === 'PLACED').length}</span>
              </div>
              {activeOrders.filter(o => o.status === 'PLACED').length === 0 ? (
                <p className="text-xs text-gray-500 text-center mt-12">No pending orders</p>
              ) : (
                activeOrders.filter(o => o.status === 'PLACED').map(order => (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 shadow-lg hover:border-violet-500 hover:-translate-y-0.5 transition-all" key={order.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white">Order #{order.id}</span>
                      <span className="text-sm font-bold text-pink-500">${order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 flex flex-col gap-1 mb-3">
                      <span><strong>Customer ID:</strong> {order.customer_id}</span>
                      <span><strong>Coordinates:</strong> {order.customer_lat.toFixed(4)}, {order.customer_lng.toFixed(4)}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="w-full py-1.5 rounded-lg bg-violet-500/25 text-violet-300 border border-violet-500/40 text-xs font-bold hover:bg-violet-500 hover:text-white cursor-pointer flex items-center justify-center gap-1.5"
                        onClick={() => handleUpdateOrderStatus(order.id, 'PACKING')}
                        disabled={loadingStates['order_' + order.id]}
                      >
                        {loadingStates['order_' + order.id] ? <RefreshCw size={12} className="animate-spin" /> : null}
                        Pack Order →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Packing Column */}
            <div className="bg-white/2 border border-white/10 rounded-2xl p-5 min-h-[380px]">
              <div className="flex justify-between items-center text-sm font-bold text-white mb-5">
                <span>Packing Inventory</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-semibold">{activeOrders.filter(o => o.status === 'PACKING').length}</span>
              </div>
              {activeOrders.filter(o => o.status === 'PACKING').length === 0 ? (
                <p className="text-xs text-gray-500 text-center mt-12">No orders being packed</p>
              ) : (
                activeOrders.filter(o => o.status === 'PACKING').map(order => (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 shadow-lg hover:border-violet-500 hover:-translate-y-0.5 transition-all" key={order.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white">Order #{order.id}</span>
                      <span className="text-sm font-bold text-pink-500">${order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 flex flex-col gap-1 mb-3">
                      <span><strong>Customer ID:</strong> {order.customer_id}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        className="w-full py-1.5 rounded-lg bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-bold hover:bg-amber-500 hover:text-white cursor-pointer flex items-center justify-center gap-1.5"
                        onClick={() => handleUpdateOrderStatus(order.id, 'DISPATCHED')}
                        disabled={loadingStates['order_' + order.id]}
                      >
                        {loadingStates['order_' + order.id] ? <RefreshCw size={12} className="animate-spin" /> : null}
                        Dispatch Order →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Dispatched Column */}
            <div className="bg-white/2 border border-white/10 rounded-2xl p-5 min-h-[380px]">
              <div className="flex justify-between items-center text-sm font-bold text-white mb-5">
                <span>Dispatched / Rider Queue</span>
                <span className="bg-white/10 px-2 py-0.5 rounded-full text-xs font-semibold">{activeOrders.filter(o => o.status === 'DISPATCHED').length}</span>
              </div>
              {activeOrders.filter(o => o.status === 'DISPATCHED').length === 0 ? (
                <p className="text-xs text-gray-500 text-center mt-12">No dispatched orders</p>
              ) : (
                activeOrders.filter(o => o.status === 'DISPATCHED').map(order => (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-4 shadow-lg hover:border-violet-500 hover:-translate-y-0.5 transition-all" key={order.id}>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-bold text-white">Order #{order.id}</span>
                      <span className="text-sm font-bold text-pink-500">${order.total_amount.toFixed(2)}</span>
                    </div>
                    <div className="text-[11px] text-gray-400 flex flex-col gap-1 mb-3">
                      <span><strong>Rider ID:</strong> {order.delivery_rider_id || 'Awaiting Claim...'}</span>
                    </div>
                    <div className="text-xs bg-white/5 py-1.5 border border-white/5 rounded-lg text-center text-gray-300">
                      🚚 Out for Delivery
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
