import { useEffect } from 'react';
import { Routes, Route, useParams, useNavigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import GuestOrder from './pages/GuestOrder';
import NotFound from './pages/NotFound';

import Dashboard from './pages/Dashboard';
import Wallet from './pages/Wallet';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import BuyBundle from './pages/BuyBundle';
import Profile from './pages/Profile';
import ChangePassword from './pages/ChangePassword';

// ── Reseller pages ────────────────────────────────────────────────────────────
import ResellerApply        from './pages/reseller/ResellerApply';
import ResellerDashboard    from './pages/reseller/ResellerDashboard';
import ResellerPricing      from './pages/reseller/ResellerPricing';
import ResellerOrders       from './pages/reseller/ResellerOrders';
import ResellerBuy          from './pages/reseller/ResellerBuy';
import ResellerPayouts      from './pages/reseller/ResellerPayouts';
import ResellerStorePage    from './pages/reseller/ResellerStorePage';      // NEW
import ResellerSubCustomers from './pages/reseller/ResellerSubCustomers';  // NEW

// ── Public storefront ─────────────────────────────────────────────────────────
import PublicStorefront from './pages/PublicStorefront';  // NEW

// ── Affiliate ─────────────────────────────────────────────────────────────────
import AffiliateDashboard from './pages/affiliate/AffiliateDashboard'; // NEW

// ── Admin pages ───────────────────────────────────────────────────────────────
import AdminDashboard    from './pages/admin/AdminDashboard';
import AdminUsers        from './pages/admin/AdminUsers';
import AdminPricing      from './pages/admin/AdminPricing';
import AdminResellers    from './pages/admin/AdminResellers';
import AdminPayouts      from './pages/admin/AdminPayouts';
import AdminOrders       from './pages/admin/AdminOrders';
import AdminTransactions from './pages/admin/AdminTransactions';

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <Routes>
          {/* ── Fully public ───────────────────────────────────────────────── */}
          <Route path="/"               element={<Landing />} />
          <Route path="/login"          element={<Login />} />
          <Route path="/register"       element={<Register />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/guest-order"    element={<GuestOrder />} />

          {/* Public storefront — no auth required */}
          <Route path="/store/:slug" element={<PublicStorefront />} />

          {/* Referral redirect — sets cookie then sends the visitor straight
              into the registration flow, since that's the whole point of a
              referral link. */}
          <Route path="/ref/:slug" element={<ReferralRedirect />} />

          {/* ── Authenticated app shell ─────────────────────────────────────── */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            {/* Customer */}
            <Route path="/dashboard"              element={<Dashboard />} />
            <Route path="/wallet"                 element={<Wallet />} />
            <Route path="/buy"                    element={<BuyBundle />} />
            <Route path="/orders"                 element={<Orders />} />
            <Route path="/orders/:orderId"        element={<OrderDetail />} />
            <Route path="/profile"                element={<Profile />} />
            <Route path="/change-password"        element={<ChangePassword />} />

            {/* Reseller — apply (any logged-in user) */}
            <Route path="/reseller/apply" element={<ResellerApply />} />

            {/* Reseller — RESELLER role only */}
            <Route
              path="/reseller"
              element={<ProtectedRoute role="reseller"><ResellerDashboard /></ProtectedRoute>}
            />
            <Route
              path="/reseller/store"
              element={<ProtectedRoute role="reseller"><ResellerStorePage /></ProtectedRoute>}
            />
            <Route
              path="/reseller/pricing"
              element={<ProtectedRoute role="reseller"><ResellerPricing /></ProtectedRoute>}
            />
            <Route
              path="/reseller/orders"
              element={<ProtectedRoute role="reseller"><ResellerOrders /></ProtectedRoute>}
            />
            <Route
              path="/reseller/buy"
              element={<ProtectedRoute role="reseller"><ResellerBuy /></ProtectedRoute>}
            />
            <Route
              path="/reseller/payouts"
              element={<ProtectedRoute role="reseller"><ResellerPayouts /></ProtectedRoute>}
            />
            <Route
              path="/reseller/sub-customers"
              element={<ProtectedRoute role="reseller"><ResellerSubCustomers /></ProtectedRoute>}
            />

            {/* Affiliate — any authenticated user, no role restriction */}
            <Route path="/affiliate" element={<AffiliateDashboard />} />

            {/* Admin */}
            <Route path="/admin"               element={<ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users"         element={<ProtectedRoute role="admin"><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/pricing"       element={<ProtectedRoute role="admin"><AdminPricing /></ProtectedRoute>} />
            <Route path="/admin/resellers"     element={<ProtectedRoute role="admin"><AdminResellers /></ProtectedRoute>} />
            <Route path="/admin/payouts"       element={<ProtectedRoute role="admin"><AdminPayouts /></ProtectedRoute>} />
            <Route path="/admin/orders"        element={<ProtectedRoute role="admin"><AdminOrders /></ProtectedRoute>} />
            <Route path="/admin/transactions"  element={<ProtectedRoute role="admin"><AdminTransactions /></ProtectedRoute>} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </NotificationProvider>
  );
}

/**
 * ReferralRedirect
 * Sets a ref_reseller_id cookie from the slug param then redirects to /register.
 * Backend reads this cookie at registration time.
 */
function ReferralRedirect() {
  const { slug } = useParams();
  const navigate  = useNavigate();

  useEffect(() => {
    // Set cookie for 7 days — backend reads at registration
    document.cookie = `ref_reseller_id=${encodeURIComponent(slug)}; path=/; max-age=${7 * 24 * 3600}`;
    navigate('/register', { replace: true });
  }, [slug, navigate]);

  return null;
}