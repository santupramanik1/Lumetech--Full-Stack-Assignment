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
  RefreshCw,
  Zap
} from 'lucide-react';

import { Header } from './components/Header';
import { PortalSelection } from './components/PortalSelection';
import { AuthForm } from './components/AuthForm';
import { ManagerDashboard } from './components/ManagerDashboard';
import { CustomerPortal } from './components/CustomerPortal';
import { RiderPortal } from './components/RiderPortal';

const API_BASE = 'http://127.0.0.1:7000';
const WS_BASE = 'ws://127.0.0.1:7000';

export type Role = 'STORE_MANAGER' | 'CUSTOMER' | 'DELIVERY_RIDER';

export interface OrderItem {
  id: number;
  product_id: number;
  quantity: number;
}

export interface Order {
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

export interface Product {
  id: number;
  store_id: number;
  name: string;
  price: number;
  stock_quantity: number;
}

export interface DarkStore {
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
      <Header
        selectedRolePortal={selectedRolePortal}
        tokens={tokens}
        wsConnected={wsConnected}
        managedStore={managedStore}
        setSelectedRolePortal={setSelectedRolePortal}
      />

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
          <PortalSelection
            setSelectedRolePortal={setSelectedRolePortal}
            setAuthError={setAuthError}
            setAuthSuccess={setAuthSuccess}
          />
        ) : !tokens[selectedRolePortal as Role] ? (
          <AuthForm
            selectedRolePortal={selectedRolePortal}
            authMode={authMode}
            setAuthMode={setAuthMode}
            authEmail={authEmail}
            setAuthEmail={setAuthEmail}
            authPassword={authPassword}
            setAuthPassword={setAuthPassword}
            authError={authError}
            setAuthError={setAuthError}
            authSuccess={authSuccess}
            setAuthSuccess={setAuthSuccess}
            handleAuth={handleAuth}
            setSelectedRolePortal={setSelectedRolePortal}
            isLoading={isLoading}
          />
        ) : (
          <div>
            {selectedRolePortal === 'STORE_MANAGER' && (
              <ManagerDashboard
                managedStore={managedStore}
                setManagedStore={setManagedStore}
                storeName={storeName}
                setStoreName={setStoreName}
                storeLat={storeLat}
                setStoreLat={setStoreLat}
                storeLng={storeLng}
                setStoreLng={setStoreLng}
                handleCreateStore={handleCreateStore}
                handleCreateProduct={handleCreateProduct}
                products={products}
                newProductName={newProductName}
                setNewProductName={setNewProductName}
                newProductPrice={newProductPrice}
                setNewProductPrice={setNewProductPrice}
                newProductStock={newProductStock}
                setNewProductStock={setNewProductStock}
                activeOrders={activeOrders}
                fetchStoreData={fetchStoreData}
                handleUpdateOrderStatus={handleUpdateOrderStatus}
                startEditing={startEditing}
                cancelEditing={cancelEditing}
                handleUpdateProduct={handleUpdateProduct}
                editingProductId={editingProductId}
                editProductName={editProductName}
                setEditProductName={setEditProductName}
                editProductPrice={editProductPrice}
                setEditProductPrice={setEditProductPrice}
                editProductStock={editProductStock}
                setEditProductStock={setEditProductStock}
                loadingStates={loadingStates}
                saveToken={saveToken}
                setSelectedRolePortal={setSelectedRolePortal}
              />
            )}

            {selectedRolePortal === 'CUSTOMER' && (
              <CustomerPortal
                customerScreen={customerScreen}
                setCustomerScreen={setCustomerScreen}
                cart={cart}
                setCart={setCart}
                customerSearch={customerSearch}
                setCustomerSearch={setCustomerSearch}
                customerProducts={customerProducts}
                customerLat={customerLat}
                setCustomerLat={setCustomerLat}
                customerLng={customerLng}
                setCustomerLng={setCustomerLng}
                handleAddToCart={handleAddToCart}
                handleRemoveFromCart={handleRemoveFromCart}
                handleConfirmOrder={handleConfirmOrder}
                saveToken={saveToken}
                setSelectedRolePortal={setSelectedRolePortal}
                isLoading={isLoading}
                loadingStates={loadingStates}
              />
            )}

            {selectedRolePortal === 'DELIVERY_RIDER' && (
              <RiderPortal
                riderOrders={riderOrders}
                fetchRiderOrders={fetchRiderOrders}
                handleMarkAsDelivered={handleMarkAsDelivered}
                saveToken={saveToken}
                setSelectedRolePortal={setSelectedRolePortal}
                isLoading={isLoading}
                loadingStates={loadingStates}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
