import React, { useState, useEffect, useRef } from 'react';
import { 
  Store, 
  Package, 
  ShoppingCart, 
  Truck, 
  Activity, 
  Plus, 
  LogOut, 
  Key, 
  Info,
  RefreshCw
} from 'lucide-react';

const API_BASE = 'http://127.0.0.1:7000';
const WS_BASE = 'ws://127.0.0.1:7000';

type Role = 'STORE_MANAGER' | 'CUSTOMER' | 'DELIVERY_RIDER';

interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
}

interface Order {
  id: number;
  customer_id: number;
  store_id: number;
  delivery_rider_id: number | null;
  total_amount: number;
  status: 'PLACED' | 'PACKING' | 'DISPATCHED' | 'DELIVERED';
  customer_lat: number;
  customer_lng: number;
  items: OrderItem[];
}

interface Product {
  id: number;
  store_id: number;
  name: string;
  price: number;
  stock_quantity: number;
}

interface DarkStore {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  manager_id: number;
}

function App() {
  // Authentication & Role Switch State
  const [selectedRolePortal, setSelectedRolePortal] = useState<Role | null>(null);
  const [tokens, setTokens] = useState<Record<Role, string | null>>({
    STORE_MANAGER: localStorage.getItem('token_STORE_MANAGER'),
    CUSTOMER: localStorage.getItem('token_CUSTOMER'),
    DELIVERY_RIDER: localStorage.getItem('token_DELIVERY_RIDER'),
  });

  // Auth Panel States
  const [authMode, setAuthMode] = useState<'login' | 'register'>('register');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const setOpLoading = (op: string, val: boolean) => {
    setLoadingStates(prev => ({ ...prev, [op]: val }));
  };

  // Store Manager States
  const [managedStore, setManagedStore] = useState<DarkStore | null>(null);
  const [storeName, setStoreName] = useState('');
  const [storeLat, setStoreLat] = useState('12.9720');
  const [storeLng, setStoreLng] = useState('77.5950');
  
  // Product States
  const [products, setProducts] = useState<Product[]>([]);
  const [newProductName, setNewProductName] = useState('');
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductStock, setNewProductStock] = useState('');

  // Product Edit States
  const [editingProductId, setEditingProductId] = useState<number | null>(null);
  const [editProductName, setEditProductName] = useState('');
  const [editProductPrice, setEditProductPrice] = useState('');
  const [editProductStock, setEditProductStock] = useState('');

  // Active Orders & WebSocket
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  // Toast / Status Message
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showStatus = (text: string, type: 'success' | 'error' | 'info' = 'info') => {
    setStatusMessage({ text, type });
    setTimeout(() => setStatusMessage(null), 5000);
  };

  // Customer States
  const [customerSearch, setCustomerSearch] = useState('');
  const [cart, setCart] = useState<Record<number, number>>({}); // product_id -> quantity
  const [customerLat, setCustomerLat] = useState('12.9716');
  const [customerLng, setCustomerLng] = useState('77.5946');
  const [customerProducts, setCustomerProducts] = useState<Product[]>([]);
  const [customerScreen, setCustomerScreen] = useState<'shopping' | 'checkout'>('shopping');

  const fetchCustomerProducts = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/products/search?q=`);
      if (response.ok) {
        const data = await response.json();
        setCustomerProducts(data);
      }
    } catch (err) {
      console.error('Error fetching customer products:', err);
    }
  };

  const handleAddToCart = (product: Product) => {
    const cartItems = Object.keys(cart).map(Number);
    if (cartItems.length > 0) {
      const firstProductId = cartItems[0];
      const firstProduct = customerProducts.find(p => p.id === firstProductId);
      if (firstProduct && firstProduct.store_id !== product.store_id) {
        showStatus('All items in your cart must belong to the same store. Clear your cart first.', 'error');
        return;
      }
    }
    
    if (product.stock_quantity <= 0) {
      showStatus('Product is out of stock', 'error');
      return;
    }

    setCart(prev => {
      const currentQty = prev[product.id] || 0;
      if (currentQty >= product.stock_quantity) {
        showStatus('Cannot add more than available stock', 'error');
        return prev;
      }
      return { ...prev, [product.id]: currentQty + 1 };
    });
  };

  const handleRemoveFromCart = (productId: number) => {
    setCart(prev => {
      const next = { ...prev };
      if (next[productId] > 1) {
        next[productId] -= 1;
      } else {
        delete next[productId];
      }
      return next;
    });
  };

  const handleConfirmOrder = async () => {
    if (Object.keys(cart).length === 0) return;
    setIsLoading(true);
    setOpLoading('confirmOrder', true);
    try {
      const items = Object.entries(cart).map(([productId, qty]) => ({
        product_id: parseInt(productId),
        quantity: qty
      }));

      const response = await fetch(`${API_BASE}/api/orders`, {
        method: 'POST',
        headers: getHeaders('CUSTOMER'),
        body: JSON.stringify({
          customer_latitude: parseFloat(customerLat),
          customer_longitude: parseFloat(customerLng),
          items: items
        })
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to place order');
      }

      const orderData = await response.json();
      showStatus(`Order #${orderData.id} placed successfully!`, 'success');
      setCart({});
      setCustomerScreen('shopping');
      fetchCustomerProducts(); // Refresh stock
    } catch (err: any) {
      showStatus(err.message, 'error');
    } finally {
      setIsLoading(false);
      setOpLoading('confirmOrder', false);
    }
  };

  // Rider States
  const [riderOrders, setRiderOrders] = useState<Order[]>([]);

  const fetchRiderOrders = async () => {
    setOpLoading('refreshPool', true);
    try {
      const response = await fetch(`${API_BASE}/api/delivery/orders/available`, {
        headers: getHeaders('DELIVERY_RIDER')
      });
      if (response.ok) {
        const data = await response.json();
        setRiderOrders(data);
      }
    } catch (err) {
      console.error('Error fetching rider orders:', err);
    } finally {
      setOpLoading('refreshPool', false);
    }
  };

  const handleMarkAsDelivered = async (orderId: number) => {
    setIsLoading(true);
    setOpLoading('rider_order_' + orderId, true);
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/deliver`, {
        method: 'PATCH',
        headers: getHeaders('DELIVERY_RIDER')
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to deliver order');
      }
      showStatus(`Order #${orderId} marked as DELIVERED!`, 'success');
      fetchRiderOrders(); // Refresh pool
    } catch (err: any) {
      showStatus(err.message, 'error');
    } finally {
      setIsLoading(false);
      setOpLoading('rider_order_' + orderId, false);
    }
  };

  // Keep localStorage in sync with tokens
  const saveToken = (role: Role, token: string | null) => {
    const newTokens = { ...tokens, [role]: token };
    setTokens(newTokens);
    if (token) {
      localStorage.setItem(`token_${role}`, token);
    } else {
      localStorage.removeItem(`token_${role}`);
    }
  };

  const getHeaders = (role: Role) => {
    const token = tokens[role];
    return {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    };
  };

  // Perform Registration or Login
  const handleAuth = async (action: 'login' | 'register') => {
    if (!authEmail || !authPassword || !selectedRolePortal) {
      setAuthError('Email and Password are required');
      return;
    }
    setAuthError('');
    setAuthSuccess('');
    setIsLoading(true);

    try {
      if (action === 'register') {
        const response = await fetch(`${API_BASE}/api/auth/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword, role: selectedRolePortal }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Registration failed');
        }
        setAuthSuccess('Registration successful! Please sign in with your credentials.');
        setAuthMode('login');
        setIsLoading(false);
        return;
      }

      if (action === 'login') {
        const response = await fetch(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: authEmail, password: authPassword }),
        });
        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.detail || 'Login failed');
        }
        const data = await response.json();
        if (data.role !== selectedRolePortal) {
          throw new Error(`Unauthorized: You are registered as ${data.role.replace('_', ' ')} and cannot access the ${selectedRolePortal.replace('_', ' ')} Portal.`);
        }
        saveToken(selectedRolePortal, data.token);
        showStatus('Logged in successfully!', 'success');
        setAuthEmail('');
        setAuthPassword('');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };


  // Store Manager Actions: Create Store
  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName || !storeLat || !storeLng) {
      showStatus('Store details are incomplete', 'error');
      return;
    }
    setOpLoading('createStore', true);
    try {
      const response = await fetch(`${API_BASE}/api/stores`, {
        method: 'POST',
        headers: getHeaders('STORE_MANAGER'),
        body: JSON.stringify({
          name: storeName,
          latitude: parseFloat(storeLat),
          longitude: parseFloat(storeLng),
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to create Dark Store');
      }
      const storeData = await response.json();
      setManagedStore(storeData);
      showStatus(`Dark Store "${storeData.name}" created!`, 'success');
      setStoreName('');
    } catch (err: any) {
      showStatus(err.message, 'error');
    } finally {
      setOpLoading('createStore', false);
    }
  };

  // Store Manager Actions: Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!managedStore) {
      showStatus('Please create/select a Dark Store first', 'error');
      return;
    }
    if (!newProductName || !newProductPrice || !newProductStock) {
      showStatus('Product fields cannot be blank', 'error');
      return;
    }

    setOpLoading('createProduct', true);
    try {
      const response = await fetch(`${API_BASE}/api/products`, {
        method: 'POST',
        headers: getHeaders('STORE_MANAGER'),
        body: JSON.stringify({
          store_id: managedStore.id,
          name: newProductName,
          price: parseFloat(newProductPrice),
          stock_quantity: parseInt(newProductStock),
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to add product');
      }
      const productData = await response.json();
      setProducts([...products, productData]);
      showStatus(`Product "${productData.name}" added successfully!`, 'success');
      setNewProductName('');
      setNewProductPrice('');
      setNewProductStock('');
    } catch (err: any) {
      showStatus(err.message, 'error');
    } finally {
      setOpLoading('createProduct', false);
    }
  };

  const startEditing = (p: Product) => {
    setEditingProductId(p.id);
    setEditProductName(p.name);
    setEditProductPrice(p.price.toString());
    setEditProductStock(p.stock_quantity.toString());
  };

  const cancelEditing = () => {
    setEditingProductId(null);
    setEditProductName('');
    setEditProductPrice('');
    setEditProductStock('');
  };

  const handleUpdateProduct = async (productId: number) => {
    if (!editProductName || !editProductPrice || !editProductStock) {
      showStatus('Product fields cannot be blank', 'error');
      return;
    }
    setOpLoading('editProduct_' + productId, true);
    try {
      const response = await fetch(`${API_BASE}/api/products/${productId}`, {
        method: 'PATCH',
        headers: getHeaders('STORE_MANAGER'),
        body: JSON.stringify({
          name: editProductName,
          price: parseFloat(editProductPrice),
          stock_quantity: parseInt(editProductStock),
        }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update product');
      }
      const updatedProduct = await response.json();
      setProducts(products.map(p => p.id === productId ? updatedProduct : p));
      showStatus(`Product "${updatedProduct.name}" updated successfully!`, 'success');
      setEditingProductId(null);
    } catch (err: any) {
      showStatus(err.message, 'error');
    } finally {
      setOpLoading('editProduct_' + productId, false);
    }
  };

  // Fetch Store Manager Data (Store and Orders)
  const fetchStoreData = async () => {
    if (!tokens.STORE_MANAGER) return;
    setOpLoading('refreshBoard', true);
    try {
      let store = managedStore;
      if (!store) {
        const storeResp = await fetch(`${API_BASE}/api/stores/managed`, {
          headers: getHeaders('STORE_MANAGER'),
        });
        if (storeResp.ok) {
          store = await storeResp.json();
          setManagedStore(store);
        }
      }

      if (store) {
        // Fetch products using search endpoint
        const prodResp = await fetch(`${API_BASE}/api/products/search?q=`);
        if (prodResp.ok) {
          const allProducts = await prodResp.json();
          setProducts(allProducts.filter((p: Product) => p.store_id === store.id));
        }

        // Fetch active orders
        const ordersResp = await fetch(`${API_BASE}/api/stores/${store.id}/orders`, {
          headers: getHeaders('STORE_MANAGER'),
        });
        if (ordersResp.ok) {
          const ordersData = await ordersResp.json();
          setActiveOrders(ordersData);
        }
      }
    } catch (err: any) {
      console.error('Error fetching manager store data:', err);
    } finally {
      setOpLoading('refreshBoard', false);
    }
  };

  // Cycle Order Status
  const handleUpdateOrderStatus = async (orderId: number, nextStatus: 'PACKING' | 'DISPATCHED') => {
    setOpLoading('order_' + orderId, true);
    try {
      const response = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: getHeaders('STORE_MANAGER'),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Failed to update order status');
      }
      const updatedOrder = await response.json();
      
      // Update local orders list
      setActiveOrders(activeOrders.map(o => o.id === orderId ? { ...o, status: updatedOrder.status } : o));
      showStatus(`Order #${orderId} marked as ${nextStatus}!`, 'success');
    } catch (err: any) {
      showStatus(err.message, 'error');
    } finally {
      setOpLoading('order_' + orderId, false);
    }
  };

  // Initialize WebSockets for Live Orders Board
  useEffect(() => {
    if (selectedRolePortal === 'STORE_MANAGER' && managedStore) {
      const wsUrl = `${WS_BASE}/ws/stores/${managedStore.id}/live-orders`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setWsConnected(true);
        console.log('WS Connection Established');
      };

      ws.onmessage = (event) => {
        try {
          const newOrder: Order = JSON.parse(event.data);
          setActiveOrders((prev) => {
            const exists = prev.some((o) => o.id === newOrder.id);
            if (exists) {
              return prev.map((o) => (o.id === newOrder.id ? newOrder : o));
            } else {
              return [newOrder, ...prev];
            }
          });
          showStatus(`New order received! Order ID: #${newOrder.id}`, 'info');
        } catch (err) {
          console.error('Error parsing WS message:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        console.log('WS Connection Closed');
      };

      ws.onerror = (err) => {
        console.error('WS Error:', err);
        setWsConnected(false);
      };

      return () => {
        ws.close();
      };
    }
  }, [selectedRolePortal, managedStore]);

  // Fetch store data on load/token refresh
  useEffect(() => {
    fetchStoreData();
  }, [tokens.STORE_MANAGER, managedStore?.id]);

  useEffect(() => {
    if (selectedRolePortal === 'CUSTOMER' && tokens.CUSTOMER) {
      fetchCustomerProducts();
    }
  }, [selectedRolePortal, tokens.CUSTOMER]);

  useEffect(() => {
    if (selectedRolePortal === 'DELIVERY_RIDER' && tokens.DELIVERY_RIDER) {
      fetchRiderOrders();
    }
  }, [selectedRolePortal, tokens.DELIVERY_RIDER]);

  return (
    <div className="pb-12 min-h-screen">
      {/* Top Header Bar */}
      <header className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-black/60 backdrop-blur-xl border-b border-white/10 sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-pink-500 rounded-lg flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(139,92,246,0.35)]" onClick={() => !tokens[selectedRolePortal || 'STORE_MANAGER'] && setSelectedRolePortal(null)} style={{ cursor: 'pointer' }}>
            L
          </div>
          <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent cursor-pointer" onClick={() => !tokens[selectedRolePortal || 'STORE_MANAGER'] && setSelectedRolePortal(null)}>
            Lumetech Hyperlocal
          </span>
        </div>

        {/* WebSocket Status Indicator */}
        {selectedRolePortal && tokens[selectedRolePortal] && selectedRolePortal === 'STORE_MANAGER' && (
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
            {!tokens[selectedRolePortal] && (
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

      {/* Toast Alert */}
      {statusMessage && (
        <div 
          className={`fixed bottom-5 right-5 text-white px-5 py-3 rounded-lg shadow-2xl z-50 font-semibold text-sm transition-all duration-300 ${
            statusMessage.type === 'success' ? 'bg-emerald-500' : statusMessage.type === 'error' ? 'bg-red-500' : 'bg-violet-600'
          }`}
        >
          {statusMessage.text}
        </div>
      )}

      {/* Main Area */}
      <main className="max-w-7xl mx-auto px-6 w-full mt-8">
        {selectedRolePortal === null ? (
          /* Portal Selection View */
          <div className="max-w-4xl mx-auto mt-12 text-center space-y-8">
            <div className="space-y-3">
              <h2 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-white via-purple-200 to-pink-300 bg-clip-text text-transparent">
                Welcome to Lumetech Hyperlocal
              </h2>
              <p className="text-gray-400 text-base max-w-lg mx-auto">
                Please select your access portal below to sign in or register for your dashboard.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
              {/* Manager Card */}
              <div 
                className="bg-white/5 backdrop-blur-xl border border-white/10 hover:border-violet-500/50 rounded-2xl p-8 shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-pointer group flex flex-col items-center text-center space-y-4"
                onClick={() => {
                  setSelectedRolePortal('STORE_MANAGER');
                  setAuthError('');
                  setAuthSuccess('');
                }}
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
                onClick={() => {
                  setSelectedRolePortal('CUSTOMER');
                  setAuthError('');
                  setAuthSuccess('');
                }}
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
                onClick={() => {
                  setSelectedRolePortal('DELIVERY_RIDER');
                  setAuthError('');
                  setAuthSuccess('');
                }}
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
        ) : !tokens[selectedRolePortal] ? (
          /* Authentication View */
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
                placeholder={`${selectedRolePortal.toLowerCase()}@lumetech.com`}
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
        ) : (
          /* Main Authenticated Dashboard Content */
          <div>
            {selectedRolePortal === 'STORE_MANAGER' && (
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
                    <button className="inline-flex items-center gap-1 bg-white/5 border border-white/10 text-white px-3 py-1.5 rounded-lg text-xs hover:bg-white/10 transition-all cursor-pointer" onClick={fetchStoreData} disabled={loadingStates['refreshBoard']}>
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
            )}

            {/* Customer view */}
            {selectedRolePortal === 'CUSTOMER' && (
              <div>
                {/* Header */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight text-white">Customer App</h1>
                    <p className="text-gray-400 text-sm mt-1">
                      {customerScreen === 'shopping' ? 'Browse catalog, add items to your cart, and place orders.' : 'Confirm your location and place the order.'}
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
                        <h2 className="text-xl font-bold text-white mb-4">Simulate Coordinates</h2>
                        <p className="text-xs text-gray-400 mb-5">
                          Specify your delivery location coordinates. This will trigger the backend nearest-store check and dynamic delivery assignment algorithms.
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
            )}

            {/* Rider view */}
            {selectedRolePortal === 'DELIVERY_RIDER' && (
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
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
