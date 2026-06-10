import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { ApiProvider, CartProvider, NotificationProvider, useApi } from './contexts/index.jsx';
import Header from './components/Header';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import ActiveOrderBar from './components/ActiveOrderBar';
import SplashScreen from './components/SplashScreen';
import MiniCart from './components/MiniCart';
import BottomNav from './components/BottomNav';
import PushSync from './components/PushSync';
import EngagementPrompts from './components/EngagementPrompts';

import Home from './pages/Home/Home';
import Shop from './pages/Shop/Shop';
import About from './pages/About/About';
import Contact from './pages/Contact/Contact';
import Specials from './pages/Specials/Specials';

import Login from './pages/Login/Login';
import Account from './pages/Account/Account';
import Profile from './pages/Profile/Profile';
import Cart from './pages/Cart/Cart';
import Checkout from './pages/Checkout/Checkout';
import Orders from './pages/Orders/Orders';
import Support from './pages/Support/Support';
import Admin from './pages/Admin/Admin';
import OrderDetails from './pages/Admin/OrderDetails';
import ProductDetail from './pages/ProductDetail/ProductDetail';
import OrderSuccess from './pages/OrderSuccess/OrderSuccess';
import NotFound from './pages/NotFound/NotFound';

const AppContent = () => {
  const location = useLocation();
  const { categories } = useApi();
  const [showSplash, setShowSplash] = useState(true);

  // ✅ Scroll to top on route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [location.pathname]);

  // Hide splash once homepage data is in (with a small beat for the animation).
  useEffect(() => {
    if (categories.length > 0) {
      const t = setTimeout(() => setShowSplash(false), 900);
      return () => clearTimeout(t);
    }
  }, [categories]);

  // Hard cap so the splash never blocks the app if the API is slow/down.
  useEffect(() => {
    const cap = setTimeout(() => setShowSplash(false), 5000);
    return () => clearTimeout(cap);
  }, []);

  // ✅ Detect admin routes
  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <div className="App min-h-screen flex flex-col">
      {/* First-load brand splash (covers initial data fetch) */}
      <SplashScreen show={showSplash} />
      {/* Header only for non-admin */}
      {!isAdminRoute && <Header />}

      {/* Main content area */}
      <main className={`flex-1 ${isAdminRoute ? 'route-container' : 'route-container pt-[120px]'}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/specials" element={<Specials />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />

          <Route path="/login" element={<Login />} />
          <Route path="/account" element={<Account />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order-success" element={<OrderSuccess />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/support" element={<Support />} />

          {/* Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/orders"
            element={
              <ProtectedRoute requireAdmin={true}>
                <Admin />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/order/:orderId"
            element={
              <ProtectedRoute requireAdmin={true}>
                <OrderDetails />
              </ProtectedRoute>
            }
          />

          {/* Catch-all 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Footer only for non-admin */}
      {!isAdminRoute && <Footer />}

      {/* Spacer so the mobile bottom nav never covers footer content */}
      {!isAdminRoute && <div className="h-14 lg:hidden" />}

      {/* Sticky active-order tracker (non-admin) */}
      {!isAdminRoute && <ActiveOrderBar />}

      {/* Slide-out cart + app-like mobile bottom nav (non-admin) */}
      {!isAdminRoute && <MiniCart />}
      {!isAdminRoute && <BottomNav />}

      {/* PWA: keep push subscription synced to the logged-in user */}
      <PushSync />
      {/* Front-and-center: enable order notifications + install the app (storefront only) */}
      {!isAdminRoute && <EngagementPrompts />}
    </div>
  );
};

function App() {
  useEffect(() => {
    document.body.style.visibility = 'visible';
  }, []);

  return (
    <ApiProvider>
      <NotificationProvider>
        <CartProvider>
          <Router>
            <AppContent />
          </Router>
        </CartProvider>
      </NotificationProvider>
    </ApiProvider>
  );
}

export default App;
