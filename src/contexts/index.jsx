import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { CheckCircle2, XCircle, Info, AlertTriangle, X } from 'lucide-react';
import { getEffectivePrice } from '../utils/index.js';

// ============================================================================
// NOTIFICATION CONTEXT  (stacked toasts + promise-based confirm dialog)
// ============================================================================
const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

const TOAST_STYLES = {
  success: { icon: CheckCircle2, ring: 'border-emerald-200', accent: 'text-emerald-500' },
  error: { icon: XCircle, ring: 'border-red-200', accent: 'text-red-500' },
  info: { icon: Info, ring: 'border-blue-200', accent: 'text-blue-500' },
  warning: { icon: AlertTriangle, ring: 'border-amber-200', accent: 'text-amber-500' },
};

let toastSeq = 0;

export const NotificationProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  const [dialog, setDialog] = useState(null); // { title, message, confirmText, cancelText, tone, resolve }
  const timers = useRef({});

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    if (timers.current[id]) {
      clearTimeout(timers.current[id]);
      delete timers.current[id];
    }
  }, []);

  const showNotification = useCallback((message, type = 'success', duration = 3500) => {
    const id = ++toastSeq;
    setToasts((prev) => [...prev, { id, message, type: TOAST_STYLES[type] ? type : 'info' }]);
    timers.current[id] = setTimeout(() => dismiss(id), duration);
    return id;
  }, [dismiss]);

  // Promise-based confirm — replaces window.confirm with a styled dialog.
  const confirm = useCallback((options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        title: options.title || 'Are you sure?',
        message: options.message || '',
        confirmText: options.confirmText || 'Confirm',
        cancelText: options.cancelText || 'Cancel',
        tone: options.tone || 'danger',
        resolve,
      });
    });
  }, []);

  const closeDialog = (result) => {
    if (dialog?.resolve) dialog.resolve(result);
    setDialog(null);
  };

  useEffect(() => () => Object.values(timers.current).forEach(clearTimeout), []);

  return (
    <NotificationContext.Provider value={{ showNotification, confirm }}>
      {children}

      {/* Toasts */}
      <div className="pointer-events-none fixed right-3 top-20 z-[120] flex w-[min(92vw,22rem)] flex-col gap-2 sm:right-5">
        {toasts.map((t) => {
          const cfg = TOAST_STYLES[t.type];
          const Icon = cfg.icon;
          return (
            <div
              key={t.id}
              role="status"
              className={`animate-toast-in pointer-events-auto flex items-start gap-3 rounded-2xl border ${cfg.ring} bg-white px-4 py-3 shadow-lg shadow-black/5`}
            >
              <Icon className={`mt-0.5 h-5 w-5 shrink-0 ${cfg.accent}`} />
              <p className="flex-1 text-sm font-medium text-gray-800">{t.message}</p>
              <button onClick={() => dismiss(t.id)} className="shrink-0 rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Confirm dialog */}
      {dialog && (
        <div className="fixed inset-0 z-[130] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => closeDialog(false)}>
          <div className="animate-dialog-in w-full max-w-sm overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              <div className="mb-3 flex items-start gap-3">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${dialog.tone === 'danger' ? 'bg-red-50 text-red-500' : 'bg-rose-50 text-[#d80a4e]'}`}>
                  <AlertTriangle className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-display text-lg font-bold text-gray-900">{dialog.title}</h3>
                  {dialog.message && <p className="mt-1 text-sm text-gray-500">{dialog.message}</p>}
                </div>
              </div>
              <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button onClick={() => closeDialog(false)} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">
                  {dialog.cancelText}
                </button>
                <button
                  onClick={() => closeDialog(true)}
                  className={`rounded-xl px-5 py-2.5 text-sm font-semibold text-white ${dialog.tone === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-[#d80a4e] hover:bg-[#b8083e]'}`}
                >
                  {dialog.confirmText}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
};

// ============================================================================
// API CONTEXT
// ============================================================================
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within ApiProvider');
  }
  return context;
};

class ApiService {
  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const token = localStorage.getItem('token');
    const isFormData = options.body instanceof FormData;
    
    const config = {
      headers: {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { message: `HTTP error! status: ${response.status}` };
        }
        
        const errorMessage = errorData.message || errorData.error || `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  get(endpoint) { return this.request(endpoint); }
  post(endpoint, data) { return this.request(endpoint, { method: 'POST', body: data instanceof FormData ? data : JSON.stringify(data) }); }
  put(endpoint, data) { return this.request(endpoint, { method: 'PUT', body: data instanceof FormData ? data : JSON.stringify(data) }); }
  patch(endpoint, data) { return this.request(endpoint, { method: 'PATCH', body: data instanceof FormData ? data : JSON.stringify(data) }); }
  delete(endpoint) { return this.request(endpoint, { method: 'DELETE' }); }
}

const apiService = new ApiService();

export const ApiProvider = ({ children }) => {
  const [categories, setCategories] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dashboardRefreshTrigger, setDashboardRefreshTrigger] = useState(0);

  const api = {
    baseUrl: BASE_URL,
    service: apiService,
    categories, items, loading, dashboardRefreshTrigger,
    
    // Categories
    fetchCategories: async () => {
      setLoading(true);
      try {
        const data = await apiService.get('/api/categories?limit=1000');
        const categoriesData = data.categories || data;
        setCategories(categoriesData);
        return categoriesData;
      } catch (error) {
        return [];
      } finally {
        setLoading(false);
      }
    },
    getCategoryById: async (id) => {
      try {
        return await apiService.get(`/api/categories/get/${id}`);
      } catch (error) {
        return null;
      }
    },
    
    // Items
    fetchItems: async () => {
      if (items.length > 0) return items;
      setLoading(true);
      try {
        const data = await apiService.get('/api/items/all?limit=1000');
        setItems(data.items || data);
        return data.items || data;
      } catch (error) {
        return [];
      } finally {
        setLoading(false);
      }
    },
    getItemById: async (id) => {
      try {
        return await apiService.get(`/api/items/get/${id}`);
      } catch (error) {
        return null;
      }
    },
    getItemsByCategory: async (categoryId) => {
      try {
        const data = await apiService.get(`/api/items/category/${categoryId}`);
        return data.items || data;
      } catch (error) {
        return [];
      }
    },
    getItemsBySubcategory: async (subcategoryId) => {
      try {
        const allItems = await apiService.get('/api/items/all');
        const items = allItems.items || allItems;
        
        const filtered = items.filter(item => {
          const itemSubcategories = Array.isArray(item.subcategories) ? item.subcategories : [];
          
          return itemSubcategories.some(subcat => {
            let subcatId;
            if (typeof subcat === 'string') {
              subcatId = subcat;
            } else if (subcat && subcat._id) {
              subcatId = subcat._id;
            } else if (subcat && subcat.$oid) {
              subcatId = subcat.$oid;
            } else {
              subcatId = subcat;
            }
            
            return subcatId === subcategoryId;
          });
        });
        
        return filtered;
      } catch (error) {
        return [];
      }
    },
    getFeaturedItems: async (type = 'bestseller') => {
      try {
        const data = await apiService.get(`/api/items/featured/${type}`);
        return data.items || data;
      } catch (error) {
        return [];
      }
    },
    
    // Subcategories
    getSubcategories: async () => {
      try {
        const data = await apiService.get('/api/subcategories/all');
        return data.subcategories || data;
      } catch (error) {
        return [];
      }
    },
    getSubcategoriesByCategory: async (categoryId) => {
      try {
        const data = await apiService.get(`/api/subcategories/category/${categoryId}`);
        return data.subcategories || data;
      } catch (error) {
        return [];
      }
    },
    
    // Auth
    register: async (userData) => {
      try {
        return await apiService.post('/api/auth/register', userData);
      } catch (error) {
        throw error;
      }
    },
    login: async (credentials) => {
      try {
        return await apiService.post('/api/auth/login', credentials);
      } catch (error) {
        throw error;
      }
    },
    getCurrentUser: async () => {
      try {
        return await apiService.get('/api/auth/me');
      } catch (error) {
        throw error;
      }
    },
    getProfile: async (id) => {
      try {
        return await apiService.get(`/api/auth/profile/${id}`);
      } catch (error) {
        throw error;
      }
    },
    updateProfile: async (id, profileData) => {
      try {
        const response = await apiService.put(`/api/auth/profile/${id}`, profileData);
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    // Address APIs
    getUserAddresses: async (userId) => {
      try {
        const response = await apiService.get(`/api/users/${userId}/addresses`);
        return response;
      } catch (error) {
        return { addresses: [] };
      }
    },
    addUserAddress: async (userId, addressData) => {
      try {
        const response = await apiService.post(`/api/users/${userId}/addresses`, addressData);
        return response;
      } catch (error) {
        throw error;
      }
    },
    updateUserAddress: async (userId, addressId, addressData) => {
      try {
        const response = await apiService.put(`/api/users/${userId}/addresses/${addressId}`, addressData);
        return response;
      } catch (error) {
        throw error;
      }
    },
    deleteUserAddress: async (userId, addressId) => {
      try {
        const response = await apiService.delete(`/api/users/${userId}/addresses/${addressId}`);
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    // Categories CRUD
    addCategory: async (categoryData) => {
      try {
        return await apiService.post('/api/categories/add', categoryData);
      } catch (error) {
        throw error;
      }
    },
    updateCategory: async (id, categoryData) => {
      try {
        const response = await apiService.put(`/api/categories/update/${id}`, categoryData);
        return response;
      } catch (error) {
        throw error;
      }
    },
    deleteCategory: async (id) => {
      try {
        return await apiService.delete(`/api/categories/delete/${id}`);
      } catch (error) {
        throw error;
      }
    },
    getAllCategories: async () => {
      try {
        return await apiService.get('/api/categories/all');
      } catch (error) {
        return [];
      }
    },
    
    // Subcategories CRUD
    getAllSubcategories: async (page = 1, limit = 10) => {
      try {
        const data = await apiService.get(`/api/subcategories/all?page=${page}&limit=${limit}`);
        return data;
      } catch (error) {
        return { subcategories: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      }
    },
    getSubcategoryById: async (id) => {
      try {
        return await apiService.get(`/api/subcategories/get/${id}`);
      } catch (error) {
        return null;
      }
    },
    addSubcategory: async (subcategoryData) => {
      try {
        return await apiService.post('/api/subcategories/add', subcategoryData);
      } catch (error) {
        throw error;
      }
    },
    updateSubcategory: async (id, subcategoryData) => {
      try {
        return await apiService.put(`/api/subcategories/update/${id}`, subcategoryData);
      } catch (error) {
        throw error;
      }
    },
    deleteSubcategory: async (id) => {
      try {
        return await apiService.delete(`/api/subcategories/delete/${id}`);
      } catch (error) {
        throw error;
      }
    },
    
    // Items CRUD
    getAllItems: async () => {
      try {
        return await apiService.get('/api/items/all');
      } catch (error) {
        return [];
      }
    },
    addItem: async (itemData) => {
      try {
        return await apiService.post('/api/items/add', itemData);
      } catch (error) {
        throw error;
      }
    },
    updateItem: async (id, itemData) => {
      try {
        return await apiService.put(`/api/items/update/${id}`, itemData);
      } catch (error) {
        throw error;
      }
    },
    deleteItem: async (id) => {
      try {
        return await apiService.delete(`/api/items/delete/${id}`);
      } catch (error) {
        throw error;
      }
    },
    
    // Search
    search: async (query) => {
      try {
        const data = await apiService.get(`/api/search?q=${encodeURIComponent(query)}`);
        return data;
      } catch (error) {
        return [];
      }
    },
    searchItems: async (query) => {
      try {
        const data = await apiService.get(`/api/search/items?q=${encodeURIComponent(query)}`);
        return data.items || data;
      } catch (error) {
        return [];
      }
    },
    searchCustomers: async (query) => {
      try {
        const data = await apiService.get(`/api/search/customers?q=${encodeURIComponent(query)}`);
        return data.customers || data;
      } catch (error) {
        return [];
      }
    },
    searchOrders: async (query) => {
      try {
        const data = await apiService.get(`/api/search/orders?q=${encodeURIComponent(query)}`);
        return data.orders || data;
      } catch (error) {
        return [];
      }
    },
    
    // Tickets
    createTicket: async (ticketData) => {
      try {
        return await apiService.post('/api/tickets', ticketData);
      } catch (error) {
        throw error;
      }
    },
    getTickets: async (page = 1, limit = 10) => {
      try {
        const data = await apiService.get(`/api/tickets?page=${page}&limit=${limit}`);
        return data;
      } catch (error) {
        return { tickets: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      }
    },
    getTicketById: async (id) => {
      try {
        return await apiService.get(`/api/tickets/${id}`);
      } catch (error) {
        return null;
      }
    },
    getMyTickets: async (userId) => {
      try {
        const data = await apiService.get(`/api/tickets/my/${userId}`);
        return data.tickets || [];
      } catch (error) {
        return [];
      }
    },
    replyToTicket: async (id, message) => {
      const response = await apiService.post(`/api/tickets/${id}/reply`, { message });
      return response;
    },
    updateTicket: async (id, ticketData) => {
      try {
        return await apiService.put(`/api/tickets/${id}`, ticketData);
      } catch (error) {
        throw error;
      }
    },
    deleteTicket: async (id) => {
      try {
        return await apiService.delete(`/api/tickets/${id}`);
      } catch (error) {
        throw error;
      }
    },
    
    // Admin Dashboard APIs
    getDashboardStats: async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        const response = await apiService.get('/api/dashboard/stats');
        return response;
      } catch (error) {
        if (error.message === 'Invalid token') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/account';
        }
        return null;
      }
    },
    getAdminDashboard: async () => {
      try {
        return await apiService.get('/admin');
      } catch (error) {
        return null;
      }
    },
    isAdmin: (user) => {
      return user && user.role === 'admin';
    },
    
    // Orders
    getAllOrders: async (page = 1, limit = 10) => {
      try {
        const data = await apiService.get(`/api/orders?page=${page}&limit=${limit}`);
        return data;
      } catch (error) {
        return { orders: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      }
    },
    getFailedOrders: async (page = 1, limit = 10) => {
      try {
        const data = await apiService.get(`/api/orders/failed?page=${page}&limit=${limit}`);
        return data;
      } catch (error) {
        return { orders: [], pagination: { page: 1, limit: 10, total: 0, pages: 0 } };
      }
    },
    updateOrderStatus: async (orderId, status) => {
      try {
        const response = await apiService.patch(`/api/orders/${orderId}/status`, { status });
        return response;
      } catch (error) {
        throw error;
      }
    },
    updatePaymentStatus: async (orderId, paymentStatus) => {
      try {
        const response = await apiService.patch(`/api/orders/${orderId}/payment-status`, { paymentStatus });
        if (paymentStatus === 'paid') {
          setDashboardRefreshTrigger(prev => prev + 1);
        }
        return response;
      } catch (error) {
        throw error;
      }
    },
    refreshDashboard: () => {
      setDashboardRefreshTrigger(prev => prev + 1);
    },
    updateItemStock: async (itemId, quantity) => {
      try {
        const response = await apiService.put(`/api/items/update-stock/${itemId}`, { quantity });
        return response;
      } catch (error) {
        throw error;
      }
    },
    getMyOrders: async (userId) => {
      try {
        try {
          const data = await apiService.get(`/api/orders/my/${userId}`);
          const orders = data.orders || data;
          return orders;
        } catch (specificError) {
          const allOrdersData = await apiService.get('/api/orders');
          const allOrders = allOrdersData.orders || allOrdersData;
          
          const userOrders = Array.isArray(allOrders) 
            ? allOrders.filter(order => 
                (order.userId === userId) || 
                (typeof order.userId === 'object' && order.userId._id === userId)
              )
            : [];
          
          return userOrders;
        }
      } catch (error) {
        return [];
      }
    },
    cleanFailedOrders: async () => {
      try {
        const response = await apiService.post('/api/payment/clean-failed');
        return response;
      } catch (error) {
        throw error;
      }
    },
    createOrder: async (orderData) => {
      try {
        if (!orderData.userId) {
          throw new Error('User ID is required');
        }
        if (!orderData.items || orderData.items.length === 0) {
          throw new Error('Order items are required');
        }
        if (!orderData.totalAmount) {
          throw new Error('Total amount is required');
        }
        
        const response = await apiService.post('/api/orders', orderData);
        return response;
      } catch (error) {
        throw error;
      }
    },
    
    // Basic API info
    getApiInfo: async () => {
      try {
        return await apiService.get('/');
      } catch (error) {
        return null;
      }
    },
    
    // Sweet Deals
    getSweetDeals: async () => {
      try {
        const data = await apiService.get('/api/sweet-deals');
        return data;
      } catch (error) {
        return [];
      }
    },
    getActiveSweetDeal: async () => {
      try {
        const data = await apiService.get('/api/sweet-deals/active');
        return data;
      } catch (error) {
        return null;
      }
    },

    // Delhivery APIs
    checkPincode: async (pincode) => {
      try {
        const data = await apiService.get(`/api/delhivery/pincode/${pincode}`);
        return data;
      } catch (error) {
        return { success: false, serviceable: false, message: 'Pincode check failed' };
      }
    },
    calculateShippingRate: async (deliveryPincode, weight, paymentMode = 'PREPAID') => {
      try {
        const data = await apiService.post('/api/delhivery/calculate-rate', {
          deliveryPincode,
          weight,
          paymentMode
        });
        return data;
      } catch (error) {
        return { success: false, rate: 0, message: 'Rate calculation failed' };
      }
    },
    trackOrder: async (orderId) => {
      try {
        const data = await apiService.get(`/api/delhivery/track-order/${orderId}`);
        return data;
      } catch (error) {
        return { success: false, message: 'Order tracking failed' };
      }
    },
    trackShipment: async (waybill) => {
      try {
        const data = await apiService.get(`/api/delhivery/track/${waybill}`);
        return data;
      } catch (error) {
        return { success: false, message: 'Shipment tracking failed' };
      }
    },
    createShipment: async (orderId) => {
      try {
        const data = await apiService.post('/api/delhivery/create-shipment', { orderId });
        return data;
      } catch (error) {
        return { success: false, message: 'Shipment creation failed' };
      }
    },
    updateDeliveryStatus: async (orderId, deliveryStatus) => {
      try {
        const response = await apiService.patch(`/api/orders/${orderId}/delivery-status`, { deliveryStatus });
        return response;
      } catch (error) {
        throw error;
      }
    },
    // Customer: update contact number(s) on their own order
    updateOrderContact: async (orderId, data) => {
      const response = await apiService.patch(`/api/orders/${orderId}/contact`, data);
      return response;
    },
    // Admin: set the delivery date after accepting an order
    updateOrderDeliveryDate: async (orderId, deliveryDate) => {
      const response = await apiService.patch(`/api/orders/${orderId}/delivery-date`, { deliveryDate });
      return response;
    },
    // Admin: cancel an order (restock + refund state)
    cancelOrder: async (orderId, data) => {
      const response = await apiService.patch(`/api/orders/${orderId}/cancel`, data);
      return response;
    },
    // Admin: mark delayed / reschedule
    markOrderDelayed: async (orderId, data) => {
      const response = await apiService.patch(`/api/orders/${orderId}/delay`, data);
      return response;
    },
    // Admin: internal notes
    updateOrderNotes: async (orderId, adminNotes) => {
      const response = await apiService.patch(`/api/orders/${orderId}/notes`, { adminNotes });
      return response;
    }
  };

  return (
    <ApiContext.Provider value={api}>
      {children}
    </ApiContext.Provider>
  );
};

// ============================================================================
// CART CONTEXT
// ============================================================================
const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  const { showNotification } = useNotification();
  const [cartItems, setCartItems] = useState([]);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [isMiniCartOpen, setMiniCartOpen] = useState(false);
  const openMiniCart = () => setMiniCartOpen(true);
  const closeMiniCart = () => setMiniCartOpen(false);

  useEffect(() => {
    const checkUserStatus = () => {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      if (token && user) {
        try {
          const userData = JSON.parse(user);
          const userId = userData.id || userData._id;
          if (userId !== currentUserId) {
            setCurrentUserId(userId);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          if (currentUserId !== null) {
            setCurrentUserId(null);
          }
        }
      } else {
        if (currentUserId !== null) {
          setCurrentUserId(null);
        }
      }
    };
    
    checkUserStatus();
    window.addEventListener('storage', checkUserStatus);
    
    return () => {
      window.removeEventListener('storage', checkUserStatus);
    };
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      try {
        const savedCart = localStorage.getItem(`cart_${currentUserId}`);
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
      } catch (error) {
        console.error('Error loading cart from localStorage:', error);
        setCartItems([]);
      }
    } else {
      setCartItems([]);
      try {
        const savedCart = localStorage.getItem('guest_cart');
        setCartItems(savedCart ? JSON.parse(savedCart) : []);
      } catch (error) {
        console.error('Error loading guest cart from localStorage:', error);
        setCartItems([]);
      }
    }
  }, [currentUserId]);

  useEffect(() => {
    if (currentUserId) {
      try {
        localStorage.setItem(`cart_${currentUserId}`, JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving cart to localStorage:', error);
      }
    } else {
      try {
        localStorage.setItem('guest_cart', JSON.stringify(cartItems));
      } catch (error) {
        console.error('Error saving guest cart to localStorage:', error);
      }
    }
  }, [cartItems, currentUserId]);

  const addToCart = (product, quantity = 1) => {
    setCartItems(prevItems => {
      const existingItem = prevItems.find(item => item._id === product._id);
      
      if (existingItem) {
        showNotification(`${product.name} quantity updated in cart!`);
        return prevItems.map(item =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      } else {
        showNotification(`${product.name} added to cart!`);
        return [...prevItems, { ...product, quantity }];
      }
    });
  };

  const removeFromCart = (productId) => {
    setCartItems(prevItems => {
      const item = prevItems.find(item => item._id === productId);
      if (item) {
        showNotification(`${item.name} removed from cart!`);
      }
      return prevItems.filter(item => item._id !== productId);
    });
  };

  const updateQuantity = async (productId, quantity, maxStock = null) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    
    const item = cartItems.find(item => item._id === productId);
    if (!item) return;
    
    let stockLimit = maxStock || item.stockQty || item.stock || item.quantity_available || item.quantityAvailable || item.availableQuantity;
    
    if (stockLimit === null || stockLimit === undefined) {
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/items/get/${productId}`);
        if (response.ok) {
          const productData = await response.json();
          stockLimit = productData.stockQty || productData.stock || productData.quantity_available || productData.quantityAvailable || productData.availableQuantity || productData.quantity || productData.stockQuantity;
        }
      } catch (error) {
        console.error('Error fetching stock:', error);
      }
    }
    
    if (stockLimit !== null && stockLimit !== undefined && quantity > stockLimit) {
      showNotification(`Only ${stockLimit} items available in stock!`, 'error');
      return;
    }
    
    setCartItems(prevItems => {
      showNotification(`${item.name} quantity updated!`);
      return prevItems.map(cartItem =>
        cartItem._id === productId ? { ...cartItem, quantity } : cartItem
      );
    });
  };

  const clearCart = () => {
    setCartItems([]);
    if (currentUserId) {
      localStorage.removeItem(`cart_${currentUserId}`);
    } else {
      localStorage.removeItem('guest_cart');
    }
    showNotification('Cart cleared!');
  };

  const clearUserCart = () => {
    if (currentUserId) {
      localStorage.removeItem(`cart_${currentUserId}`);
      setCartItems([]);
    }
  };

  const handleLogout = () => {
    if (currentUserId) {
      localStorage.removeItem(`cart_${currentUserId}`);
    }
    localStorage.removeItem('guest_cart');
    setCartItems([]);
    setCurrentUserId(null);
  };

  const transferGuestCartToUser = (userId) => {
    if (!userId) return;
    try {
      const guestCart = localStorage.getItem('guest_cart');
      const guestItems = guestCart ? JSON.parse(guestCart) : [];

      if (guestItems.length > 0) {
        const existingUserCart = localStorage.getItem(`cart_${userId}`);
        const existingItems = existingUserCart ? JSON.parse(existingUserCart) : [];
        const mergedItems = [...existingItems];

        guestItems.forEach(guestItem => {
          const existingIndex = mergedItems.findIndex(item => item._id === guestItem._id);
          if (existingIndex >= 0) {
            mergedItems[existingIndex] = {
              ...mergedItems[existingIndex],
              quantity: mergedItems[existingIndex].quantity + guestItem.quantity
            };
          } else {
            mergedItems.push(guestItem);
          }
        });

        localStorage.setItem(`cart_${userId}`, JSON.stringify(mergedItems));
        localStorage.removeItem('guest_cart');
      }
    } catch (error) {
      console.error('Error transferring guest cart:', error);
    } finally {
      // Always switch the active cart to this user, even with an empty guest cart,
      // so their saved cart loads and subsequent items persist under cart_<userId>.
      setCurrentUserId(userId);
    }
  };

  const getCartTotal = () => {
    return cartItems.reduce((total, item) => total + getEffectivePrice(item) * item.quantity, 0);
  };

  const getCartItemsCount = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const value = {
    cartItems,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    clearUserCart,
    handleLogout,
    transferGuestCartToUser,
    getCartTotal,
    getCartItemsCount,
    isMiniCartOpen,
    openMiniCart,
    closeMiniCart,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================
export { NotificationContext, ApiContext, CartContext };