# Data Bay Ghana

A React (Vite) front end for the OnetBundleHub data-bundle API — buy MTN,
Telecel and AirtelTigo bundles from your wallet, manage a reseller storefront,
or run the whole platform as an admin.

## Design system

- **Palette**: light fintech theme — indigo (`--primary`) for actions, gold
  (`--gold`) for money/pricing, emerald (`--emerald`) for success/profit,
  plus the three real MTN/Telecel/AirtelTigo network colors used everywhere
  a network is shown (badges, the bundle picker, network tabs).
- **Type**: Manrope for headings, Inter for body text, JetBrains Mono for
  amounts, phone numbers and references.
- **Icons**: Google's Material Symbols icon font (loaded in `index.html`,
  wrapped by `src/components/Icon.jsx`) — no icon image assets to manage.
- **Flag**: the brand mark uses a real Ghana flag image from flagcdn.com
  (`src/components/GhanaFlag.jsx`) instead of an emoji.
- **Bundle pricing**: `src/components/BundlePicker.jsx` shows a price next
  to every bundle size, on the buy flow *and* on the homepage. Since the
  backend only exposes a live pricing table to admins, the picker shows
  real numbers when it can and a clearly-labelled indicative estimate
  otherwise — see `src/data/bundleCatalog.js` and
  `src/hooks/usePricingCatalog.js`.

## Stack

- React 18 + React Router 6
- Axios for HTTP, wrapped in a **single central API file**: `src/api/api.js`
- Plain CSS (no framework) — design tokens live at the top of `src/styles.css`
- Tokens (`accessToken` / `refreshToken`) are stored in `localStorage` and
  attached automatically to every request

## Getting started

```bash
npm install
cp .env.example .env   # point VITE_API_BASE_URL at your backend if it isn't on localhost:8080
npm run dev
```

The app runs at `http://localhost:5173` by default and expects the
OnetBundleHub backend at `http://localhost:8080` (override via `.env`).

```bash
npm run build      # production build into dist/
npm run preview    # preview the production build locally
```

## How the API layer works

Every single network call in the app goes through **`src/api/api.js`** — no
page or component ever imports `axios` directly. That file:

- creates one configured axios instance (`baseURL` from `VITE_API_BASE_URL`)
- exposes `tokenStore` for reading/writing `accessToken`, `refreshToken` and
  the cached user profile in `localStorage`
- attaches `Authorization: Bearer <token>` to every outgoing request
- on a `401`, automatically calls `/api/v1/auth/refresh`, stores the new
  tokens, and retries the original request once — if that also fails, it
  clears the session and sends the user back to `/login`
- exports a single `api` object grouped exactly like the backend's OpenAPI
  tags: `api.auth`, `api.wallet`, `api.orders`, `api.reseller`, `api.admin`

Example of how a page calls it:

```js
import { api, apiErrorMessage } from '../api/api';

const balance = await api.wallet.getBalance();
// or, with error handling:
try {
  await api.orders.placeWalletOrder({ network: 'MTN', capacityGb: 5, phoneNumber: '0241234567' });
} catch (err) {
  notify.error(apiErrorMessage(err));
}
```

## App map

- **Public**: landing page, login, register, reset password, guest checkout
  (buy a bundle with no account, check status by Paystack reference)
- **Customer**: dashboard, buy a bundle, order history + detail, wallet
  (top up via Paystack, verify, transaction ledger), profile, change password
- **Reseller**: apply to become a reseller, reseller dashboard, sell a
  bundle at wholesale, manage selling prices, view wholesale orders, request
  and track payouts
- **Admin**: platform KPIs, manage all users (activate/deactivate), platform
  pricing (public vs. reseller price per bundle), review reseller
  applications (approve/reject), manage payout requests (mark paid/reject),
  view every order and the full wallet transaction ledger

Role-based navigation and route guards live in `src/components/Layout.jsx`
and `src/components/ProtectedRoute.jsx`, driven by the `role` field on the
logged-in user.

## Notes

- This app does not embed the Paystack JS checkout widget — it shows the
  `paystackReference` returned by the backend and a manual "verify" step.
  Swap in Paystack's inline checkout in `Wallet.jsx` / `GuestOrder.jsx` /
  `BuyBundle.jsx` if you want a fully automatic flow.
- Network/bundle dropdowns use a fixed list of common sizes (0.5–50GB); wire
  these up to your real catalogue (`api.admin.getPricingTable` /
  `api.reseller.getPricingTable`) if you'd like them to be dynamic.
