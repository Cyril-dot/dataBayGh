/**
 * ============================================================================
 *  CENTRAL API FILE — every single network request the app makes goes
 *  through this file. Pages/components never import axios directly; they
 *  call the functions exported from `api` below.
 *
 *  - Tokens are persisted in localStorage (see the `tokenStore` section).
 *  - A request interceptor attaches the access token to every call.
 *  - A response interceptor catches 401s, silently refreshes the access
 *    token using the stored refresh token, and retries the original call
 *    once. If that also fails, tokens are cleared and the user is sent
 *    back to /login.
 *  - withCredentials is enabled so the browser sends referral cookies
 *    (ref_reseller_id, ref_affiliate) along with requests — the backend
 *    reads these on /api/v1/auth/register to attribute new sign-ups to
 *    the reseller/affiliate whose link the user followed.
 *
 *  API groups:
 *    auth        — login, register, profile, password
 *    wallet      — balance, transactions
 *    orders      — wallet orders, top-ups, guest orders, reseller orders
 *    pricing     — effective per-user pricing (admin public price, or the
 *                  referring reseller's override if the user was referred)
 *    reseller    — dashboard, pricing, store settings, share, sub-customers, payouts
 *    storefront  — public store browse + guest/wallet checkout
 *    affiliate   — activate, deactivate, dashboard, commission history, payouts
 *    admin       — pricing, users, resellers, payouts, orders, transactions, Big Dreams
 * ============================================================================
 */

import axios from 'axios';

const BASE_URL = 'https://databaybackend-production.up.railway.app';

/* ----------------------------------------------------------------------- */
/*  Token storage (localStorage)                                           */
/* ----------------------------------------------------------------------- */

const ACCESS_TOKEN_KEY  = 'dbg_access_token';
const REFRESH_TOKEN_KEY = 'dbg_refresh_token';
const USER_KEY          = 'dbg_user';

export const tokenStore = {
  getAccessToken:  () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),

  getUser: () => {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  setSession: ({ accessToken, refreshToken, ...user }) => {
    if (accessToken)              localStorage.setItem(ACCESS_TOKEN_KEY,  accessToken);
    if (refreshToken)             localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    if (Object.keys(user).length) localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  updateUser: (partialUser) => {
    const current = tokenStore.getUser() || {};
    localStorage.setItem(USER_KEY, JSON.stringify({ ...current, ...partialUser }));
  },

  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },
};

/* ----------------------------------------------------------------------- */
/*  Axios instance + interceptors                                          */
/* ----------------------------------------------------------------------- */

const http = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

let onSessionExpired = () => {};
export const setSessionExpiredHandler = (fn) => {
  onSessionExpired = fn;
};

http.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  const refreshToken = tokenStore.getRefreshToken();
  if (!refreshToken) throw new Error('No refresh token available');

  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${BASE_URL}/api/v1/auth/refresh`, { refreshToken }, { withCredentials: true })
      .then((res) => {
        tokenStore.setSession(res.data);
        return res.data;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

http.interceptors.response.use(
  (response) => response,
  async (error) => {
    const { config, response } = error;

    const isAuthEndpoint =
      config?.url?.includes('/api/v1/auth/login')    ||
      config?.url?.includes('/api/v1/auth/register') ||
      config?.url?.includes('/api/v1/auth/refresh');

    if (response?.status === 401 && !config._retried && !isAuthEndpoint) {
      config._retried = true;
      try {
        await refreshAccessToken();
        return http(config);
      } catch (refreshError) {
        tokenStore.clear();
        onSessionExpired();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

/* ----------------------------------------------------------------------- */
/*  Helpers                                                                */
/* ----------------------------------------------------------------------- */

const unwrap = (promise) => promise.then((res) => res.data);

export function apiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error   ||
    (typeof error?.response?.data === 'string' ? error.response.data : null) ||
    error?.message ||
    fallback
  );
}

/* ----------------------------------------------------------------------- */
/*  API surface                                                            */
/* ----------------------------------------------------------------------- */

export const api = {

  // ── Auth ──────────────────────────────────────────────────────────────────
  auth: {
    register:       (payload)      => unwrap(http.post('/api/v1/auth/register',        payload)),
    login:          (payload)      => unwrap(http.post('/api/v1/auth/login',           payload)),
    refresh:        (refreshToken) => unwrap(http.post('/api/v1/auth/refresh',         { refreshToken })),
    logout:         ()             => unwrap(http.post('/api/v1/auth/logout')),
    changePassword: (payload)      => unwrap(http.post('/api/v1/auth/change-password', payload)),
    resetPassword:  (payload)      => unwrap(http.post('/api/v1/auth/reset-password',  payload)),
    getProfile:     ()             => unwrap(http.get('/api/v1/auth/profile')),
    updateProfile:  (payload)      => unwrap(http.put('/api/v1/auth/profile',          payload)),
  },

  // ── Wallet ────────────────────────────────────────────────────────────────
  wallet: {
    getBalance: () =>
      unwrap(http.get('/api/v1/wallet/balance')),
    getTransactions: (page = 0, size = 20) =>
      unwrap(http.get('/api/v1/wallet/transactions', { params: { page, size } })),
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  orders: {
    placeWalletOrder: (payload) =>
      unwrap(http.post('/api/v1/orders/wallet', payload)),
    initiateTopUp: (payload) =>
      unwrap(http.post('/api/v1/orders/topup/initiate', payload)),
    verifyTopUp: (payload) =>
      unwrap(http.post('/api/v1/orders/topup/verify', payload)),
    placeResellerWalletOrder: (payload, sellingPrice) =>
      unwrap(
        http.post('/api/v1/orders/reseller/wallet', payload, {
          params: sellingPrice ? { sellingPrice } : {},
        })
      ),
    initiateGuestOrder: (payload) =>
      unwrap(http.post('/api/v1/orders/guest', payload)),
    getOrders: (page = 0, size = 20) =>
      unwrap(http.get('/api/v1/orders', { params: { page, size } })),
    getOrder: (orderId) =>
      unwrap(http.get(`/api/v1/orders/${orderId}`)),
    getOrderStatusByRef: (ref) =>
      unwrap(http.get('/api/v1/orders/status', { params: { ref } })),
  },

  // ── Pricing ───────────────────────────────────────────────────────────────
  //
  // GET /api/v1/pricing/effective — returns the price the LOGGED-IN caller
  // actually pays for every active bundle: the referring reseller's custom
  // price where one exists, admin's public price everywhere else (including
  // for users with no referring reseller). Requires authentication — there
  // is no guest-facing version of this endpoint, since pricing is resolved
  // from the caller's own account (User.referredByReseller), not a slug.
  // Rows: [{ network, capacityGb, publicPriceGhc }]
  //
  // NOTE: getEffective/getPublic/getResellerEffective are all BUYER-facing —
  // "what does the caller (or a buyer under them) pay?" They intentionally
  // fall back to the admin's PUBLIC price. For "what does a reseller pay as
  // their own wholesale cost?", use getResellerCost below instead — do not
  // reuse getEffective for that, it resolves to the wrong number for
  // resellers with no referring reseller.
  pricing: {
    getEffective: () => unwrap(http.get('/api/v1/pricing/effective')),
    getPublic:    () => unwrap(http.get('/api/v1/pricing/public')),
    // Reseller-only: full effective pricing table as a referred buyer would
    // see it — this reseller's own ResellerPricing rows where set, admin
    // public price as fallback everywhere else. isCustomPrice on each row
    // tells you which branch was used.
    getResellerEffective: () => unwrap(http.get('/api/v1/pricing/reseller/effective')),
    // Reseller-only: what THIS reseller pays as their own wholesale cost —
    // the floor their own selling price must sit above. Falls back to the
    // admin's WHOLESALE reseller price (not the public price), or to the
    // upstream reseller's price if this reseller was itself referred.
    getResellerCost: () => unwrap(http.get('/api/v1/pricing/reseller/cost')),
  },
  // ── Reseller ──────────────────────────────────────────────────────────────
  reseller: {
    apply:        (payload) => unwrap(http.post('/api/v1/reseller/apply', payload)),
    getDashboard: ()        => unwrap(http.get('/api/v1/reseller/dashboard')),
    getPricingTable: (page = 0, size = 50) =>
      unwrap(http.get('/api/v1/reseller/pricing', { params: { page, size } })),
    upsertPricing: (payload)   => unwrap(http.put('/api/v1/reseller/pricing',              payload)),
    deletePricing: (pricingId) => unwrap(http.delete(`/api/v1/reseller/pricing/${pricingId}`)),
    getOrders: (page = 0, size = 20) =>
      unwrap(http.get('/api/v1/reseller/orders', { params: { page, size } })),
    getStoreSettings:    ()        => unwrap(http.get('/api/v1/reseller/store')),
    updateStoreSettings: (payload) => unwrap(http.put('/api/v1/reseller/store', payload)),
    getShareInfo: ()               => unwrap(http.get('/api/v1/reseller/store/share')),
    getSubCustomers: (page = 0, size = 20) =>
      unwrap(http.get('/api/v1/reseller/sub-customers', { params: { page, size } })),
    requestPayout:    (payload)             => unwrap(http.post('/api/v1/reseller/payouts', payload)),
    getPayoutHistory: (page = 0, size = 20) =>
      unwrap(http.get('/api/v1/reseller/payouts', { params: { page, size } })),
  },

  // ── Storefront ────────────────────────────────────────────────────────────
  storefront: {
    getStore:    (slug)          => unwrap(http.get(`/api/v1/storefront/${slug}`)),
    guestOrder:  (slug, payload) => unwrap(http.post(`/api/v1/storefront/${slug}/orders/guest`,  payload)),
    walletOrder: (slug, payload) => unwrap(http.post(`/api/v1/storefront/${slug}/orders/wallet`, payload)),
  },

  // ── Affiliate ─────────────────────────────────────────────────────────────
  //
  // Any authenticated user (USER, RESELLER, ADMIN) can join the affiliate programme.
  // No fee, no approval. Commission = 2% of sellingPriceGhc on referred user orders.
  //
  // IMPORTANT: commissions are credited to a SEPARATE earnings balance
  // (affiliateEarningsGhc on the backend) — NOT the wallet. They are reversed
  // if the underlying order is refunded, and are cashed out via requestPayout(),
  // exactly like reseller payouts, but drawing from earnings, never the wallet.
  affiliate: {
    // POST /api/v1/affiliate/activate
    // Idempotent — returns { affiliateCode, referralUrl, active }
    activate: () =>
      unwrap(http.post('/api/v1/affiliate/activate')),

    // DELETE /api/v1/affiliate/deactivate
    // Code is retained; existing commissions are not reversed.
    deactivate: () =>
      unwrap(http.delete('/api/v1/affiliate/deactivate')),

    // GET /api/v1/affiliate/dashboard
    // Returns sign-up counts, commission totals, availableEarningsGhc
    // (the payout-eligible balance — separate from wallet balance),
    // and referral URL. 403 if not currently active.
    getDashboard: () =>
      unwrap(http.get('/api/v1/affiliate/dashboard')),

    // GET /api/v1/affiliate/commissions?page=0&size=10
    // Paginated commission history — date, bundle, masked user, amount, reversed flag.
    // 403 if not currently active.
    getCommissionHistory: (page = 0, size = 10) =>
      unwrap(http.get('/api/v1/affiliate/commissions', { params: { page, size } })),

    // POST /api/v1/affiliate/payouts
    // Request a cash-out against availableEarningsGhc. Never touches wallet balance.
    requestPayout: (payload) =>
      unwrap(http.post('/api/v1/affiliate/payouts', payload)),

    // GET /api/v1/affiliate/payouts?page=0&size=10
    // Paginated affiliate payout history (separate from reseller payout history).
    getPayoutHistory: (page = 0, size = 10) =>
      unwrap(http.get('/api/v1/affiliate/payouts', { params: { page, size } })),
  },

  // ── Admin ─────────────────────────────────────────────────────────────────
  admin: {
    getDashboard: () => unwrap(http.get('/api/v1/admin/dashboard')),
    getPricingTable: (page = 0, size = 50) =>
      unwrap(http.get('/api/v1/admin/pricing', { params: { page, size } })),
    upsertPricing: (payload) =>
      unwrap(http.put('/api/v1/admin/pricing', payload)),
    toggleBundleActive: (settingsId, active) =>
      unwrap(http.patch(`/api/v1/admin/pricing/${settingsId}/active`, null, { params: { active } })),
    getBigDreamsBundles: (network) =>
      unwrap(http.get('/api/admin/bundles', { params: network ? { network } : {} })),
    getUsers:     (params = {}) => unwrap(http.get('/api/v1/admin/users',   { params })),
    getUser:      (userId)      => unwrap(http.get(`/api/v1/admin/users/${userId}`)),
    setUserActive: (userId, active) =>
      unwrap(http.patch(`/api/v1/admin/users/${userId}/active`, null, { params: { active } })),
    getResellers:    (params = {})             => unwrap(http.get('/api/v1/admin/resellers',                       { params })),
    approveReseller: (profileId, payload = {}) => unwrap(http.post(`/api/v1/admin/resellers/${profileId}/approve`, payload)),
    rejectReseller:  (profileId, payload = {}) => unwrap(http.post(`/api/v1/admin/resellers/${profileId}/reject`,  payload)),
    getPayouts:     (params = {})             => unwrap(http.get('/api/v1/admin/payouts',                   { params })),
    markPayoutPaid: (payoutId, payload = {})  => unwrap(http.post(`/api/v1/admin/payouts/${payoutId}/pay`,    payload)),
    rejectPayout:   (payoutId, payload)       => unwrap(http.post(`/api/v1/admin/payouts/${payoutId}/reject`, payload)),
    getAllOrders:       (params = {})         => unwrap(http.get('/api/v1/admin/orders',       { params })),
    getAllTransactions: (page = 0, size = 20) =>
      unwrap(http.get('/api/v1/admin/transactions', { params: { page, size } })),
  },
};

export default api;