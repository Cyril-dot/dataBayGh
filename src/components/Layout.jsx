import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/api';
import Icon from './Icon';
import GhanaFlag from './GhanaFlag';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

const initialsOf = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

/* ─── Nav group ─────────────────────────────────────────────────────────── */
function NavGroup({ label, items, collapsed, onNavigate }) {
  return (
    <div className="dl-nav__group">
      <p className="dl-nav__label">{label}</p>
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          title={collapsed ? item.label : undefined}
          className={({ isActive }) => `dl-link${isActive ? ' active' : ''}`}
        >
          <span className="dl-link__icon">
            <Icon name={item.icon} size={19} />
          </span>
          <span className="dl-link__text">{item.label}</span>
        </NavLink>
      ))}
    </div>
  );
}

export default function Layout() {
  const { user, isAdmin, isReseller, logout } = useAuth();
  const location = useLocation();

  const [balance,      setBalance]      = useState(user?.walletBalance ?? 0);
  const [navOpen,      setNavOpen]      = useState(false);
  const [collapsed,    setCollapsed]    = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const userMenuRef = useRef(null);

  useEffect(() => {
    api.wallet
      .getBalance()
      .then((res) => setBalance(res.balance))
      .catch(() => {});
  }, []);

  useEffect(() => {
    const onClick = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  useEffect(() => setNavOpen(false), [location.pathname]);

  /* ── Nav items ───────────────────────────────────────────────── */
  const navItems = [
    { to: '/dashboard', label: 'Overview',       icon: 'dashboard',             end: true },
    { to: '/buy',       label: 'Buy a bundle',   icon: 'shopping_cart' },
    { to: '/orders',    label: 'Order history',  icon: 'receipt_long' },
    { to: '/wallet',    label: 'Wallet',         icon: 'account_balance_wallet' },
    { to: '/profile',   label: 'Profile',        icon: 'person' },
  ];

  // Full reseller nav — shown when user has RESELLER role
  const resellerItems = [
    { to: '/reseller',               label: 'Dashboard',       icon: 'storefront',   end: true },
    { to: '/reseller/buy',           label: 'Sell a bundle',   icon: 'sell' },
    { to: '/reseller/orders',        label: 'Orders',          icon: 'list_alt' },
    { to: '/reseller/pricing',       label: 'My pricing',      icon: 'price_change' },
    { to: '/reseller/store',         label: 'My store',        icon: 'store' },         // NEW
    { to: '/reseller/sub-customers', label: 'Sub-customers',   icon: 'group' },         // NEW
    { to: '/reseller/payouts',       label: 'Payouts',         icon: 'payments' },
  ];

  const adminItems = [
    { to: '/admin',               label: 'Admin dashboard',      icon: 'admin_panel_settings', end: true },
    { to: '/admin/orders',        label: 'All orders',           icon: 'inventory_2' },
    { to: '/admin/users',         label: 'Users',                icon: 'group' },
    { to: '/admin/resellers',     label: 'Reseller applications',icon: 'fact_check' },
    { to: '/admin/pricing',       label: 'Platform pricing',     icon: 'sell' },
    { to: '/admin/payouts',       label: 'Payout requests',      icon: 'request_quote' },
    { to: '/admin/transactions',  label: 'Transaction ledger',   icon: 'receipt' },
  ];

  // Shown to non-reseller, non-admin users as a teaser
  const becomeResellerItem = {
    to: '/reseller/apply', label: 'Become a reseller', icon: 'add_business',
  };

  // Affiliate — shown to all authenticated users regardless of role
  const affiliateItem = {
    to: '/affiliate', label: 'Affiliate programme', icon: 'group_add',
  };

  /* ── Page title from current route ──────────────────────────── */
  const allItems = [...navItems, ...resellerItems, ...adminItems, becomeResellerItem, affiliateItem];
  const current  = allItems
    .filter((i) => location.pathname === i.to || location.pathname.startsWith(`${i.to}/`))
    .sort((a, b) => b.to.length - a.to.length)[0];

  const section = isAdmin && location.pathname.startsWith('/admin')
    ? 'Admin'
    : location.pathname.startsWith('/reseller')
    ? 'Reseller'
    : 'Account';

  const pageTitle = current?.label || 'Dashboard';
  const initials  = initialsOf(user?.fullName);

  return (
    <div className={`dl-shell${navOpen ? ' dl-nav-open' : ''}`}>
      <style>{`
        .dl-shell {
          --bg:             #050B18;
          --surface:        #0A1628;
          --surface-raised: #0F1E3A;
          --border:         #1A2E50;
          --border-bright:  #243A64;
          --text:           #E8F0FF;
          --text-dim:       #7A9AC4;
          --text-faint:     #3D5A82;
          --accent:         #2C7BE5;
          --accent-bright:  #4A9BFF;
          --accent-soft:    rgba(44,123,229,0.14);
          --accent-border:  rgba(44,123,229,0.35);
          --green:          #10B981;
          --amber:          #F59E0B;
          --danger:         #FF6B6B;
          --gold:           #F59E0B;
          --gold-soft:      rgba(245,158,11,0.12);
          --font-display:   'Archivo', sans-serif;
          --font-body:      'Work Sans', sans-serif;
          --font-mono:      'Space Mono', monospace;
          --radius:         12px;
          --radius-sm:      8px;
          --dur-fast:       120ms;

          display: flex; min-height: 100vh;
          background: var(--bg); color: var(--text);
          font-family: var(--font-body); font-size: 15px;
        }
        .dl-shell *, .dl-shell *::before, .dl-shell *::after { box-sizing: border-box; }
        .dl-shell h1, .dl-shell h2 { font-family: var(--font-display); letter-spacing: -.01em; margin: 0; }
        .dl-shell button { font-family: inherit; }
        .dl-shell a { color: var(--accent-bright); }

        /* ── Global helpers used across all pages ── */
        .dl-shell .card {
          background: var(--surface-raised); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 18px;
        }
        .dl-shell .card.hover-lift { transition: transform .2s, box-shadow .2s; }
        .dl-shell .card.hover-lift:hover { transform: translateY(-2px); box-shadow: 0 8px 30px rgba(0,0,0,.3); }
        .dl-shell .stack-lg { display: flex; flex-direction: column; gap: 24px; }
        .dl-shell .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        @media (max-width: 640px) { .dl-shell .grid-2 { grid-template-columns: 1fr; } }
        .dl-shell .muted { color: var(--text-dim); }
        .dl-shell .mono  { font-family: var(--font-mono); }
        .dl-shell .table-wrap { overflow-x: auto; }
        .dl-shell .table { width: 100%; border-collapse: collapse; font-size: .87rem; }
        .dl-shell .table th {
          text-align: left; font-size: .68rem; text-transform: uppercase; letter-spacing: .07em;
          color: var(--text-faint); font-weight: 700; padding: 8px 10px 10px;
          border-bottom: 1px solid var(--border);
        }
        .dl-shell .table td { padding: 11px 10px; border-bottom: 1px solid var(--border); }
        .dl-shell .table tr:last-child td { border-bottom: none; }
        .dl-shell .badge {
          display: inline-flex; align-items: center; gap: 4px; padding: 3px 9px;
          border-radius: 999px; font-size: .7rem; font-weight: 700;
        }
        .dl-shell .badge--good { background: rgba(16,185,129,.12); color: #10B981; border: 1px solid rgba(16,185,129,.25); }
        .dl-shell .badge--bad  { background: rgba(255,107,107,.12); color: #FF6B6B; border: 1px solid rgba(255,107,107,.25); }
        .dl-shell .badge--warn { background: rgba(245,158,11,.12);  color: #F59E0B; border: 1px solid rgba(245,158,11,.25); }
        .dl-shell .badge--info { background: var(--accent-soft);    color: var(--accent-bright); border: 1px solid var(--accent-border); }
        .dl-shell .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 7px;
          padding: 10px 20px; border-radius: var(--radius-sm); font-size: .88rem; font-weight: 700;
          border: none; cursor: pointer; text-decoration: none; transition: background .15s, opacity .15s;
        }
        .dl-shell .btn:disabled { opacity: .5; cursor: not-allowed; }
        .dl-shell .btn--primary { background: var(--accent); color: #fff; }
        .dl-shell .btn--primary:hover:not(:disabled) { background: #1a6bd4; }
        .dl-shell .btn--ghost {
          background: var(--surface-raised); color: var(--text-dim);
          border: 1px solid var(--border);
        }
        .dl-shell .btn--ghost:hover:not(:disabled) { border-color: var(--accent-border); color: var(--accent-bright); }
        .dl-shell .btn--block { width: 100%; }
        .dl-shell .btn--sm { padding: 7px 14px; font-size: .8rem; }
        .dl-shell .link { background: none; border: none; color: var(--accent-bright); cursor: pointer; font-size: .85rem; font-weight: 700; padding: 0; text-decoration: underline; }
        .dl-shell .link--danger { color: var(--danger); }
        .dl-shell .form { display: flex; flex-direction: column; gap: 14px; }
        .dl-shell .form__field { display: flex; flex-direction: column; gap: 6px; }
        .dl-shell .form__field > span {
          font-size: .72rem; text-transform: uppercase; letter-spacing: .07em;
          font-weight: 700; color: var(--text-dim);
        }
        .dl-shell .form__field input,
        .dl-shell .form__field select,
        .dl-shell .form__field textarea {
          background: var(--surface); border: 1.5px solid var(--border-bright); color: var(--text);
          border-radius: 9px; padding: 11px 13px; font-family: var(--font-body); font-size: .93rem;
          outline: none; transition: border-color .15s;
        }
        .dl-shell .form__field input:focus,
        .dl-shell .form__field select:focus { border-color: var(--accent); }
        .dl-shell .stat-card {
          background: var(--surface-raised); border: 1px solid var(--border);
          border-radius: var(--radius); padding: 18px; display: flex; flex-direction: column; gap: 6px;
        }
        .dl-shell .stat-card__icon {
          width: 38px; height: 38px; border-radius: var(--radius-sm);
          background: var(--accent-soft); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 4px; border: 1px solid var(--accent-border);
        }
        .dl-shell .stat-card__label { font-size: .72rem; text-transform: uppercase; letter-spacing: .06em; color: var(--text-faint); font-weight: 700; }
        .dl-shell .stat-card__value { font-family: var(--font-mono); font-weight: 700; font-size: 1.6rem; }
        .dl-shell .grid-stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 14px; }
        .dl-shell .text-gold { color: var(--gold); }

        /* Animations */
        .dl-shell .fade-in-up { animation: dlFadeUp .35s ease both; }
        .dl-shell .delay-1 { animation-delay: .06s; }
        .dl-shell .delay-2 { animation-delay: .12s; }
        .dl-shell .delay-3 { animation-delay: .18s; }
        @keyframes dlFadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
        .dl-shell .scale-in { animation: dlScaleIn .2s ease both; }
        @keyframes dlScaleIn { from { opacity: 0; transform: scale(.97); } to { opacity: 1; transform: none; } }

        .dl-shell .result-card { padding: 20px; }
        .dl-shell .result-card__row { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; font-weight: 700; }
        .dl-shell .result-card__amount { font-family: var(--font-mono); font-size: 1.4rem; font-weight: 700; margin: 6px 0; }

        /* ── Sidebar ── */
        .dl-sidebar {
          width: 268px; flex-shrink: 0; position: sticky; top: 0; height: 100vh;
          background: var(--surface); border-right: 1px solid var(--border);
          display: flex; flex-direction: column; padding: 18px 14px 16px;
          overflow-y: auto; overflow-x: hidden;
          transition: width .25s cubic-bezier(.4,0,.2,1);
          z-index: 250;
        }
        .dl-sidebar::-webkit-scrollbar { width: 6px; }
        .dl-sidebar::-webkit-scrollbar-thumb { background: var(--border-bright); border-radius: 4px; }
        .dl-sidebar--collapsed { width: 78px; }
        .dl-sidebar__kente {
          height: 3px; border-radius: 3px; margin-bottom: 16px; flex-shrink: 0;
          background: linear-gradient(90deg,#FFCC00 0% 33.33%,#E4002B 33.33% 66.66%,#1657D6 66.66% 100%);
        }
        .dl-sidebar__top {
          display: flex; align-items: center; justify-content: space-between; gap: 6px;
          margin-bottom: 22px; padding: 0 4px;
        }
        .dl-brand { display: flex; align-items: center; gap: 10px; text-decoration: none; color: var(--text); overflow: hidden; min-width: 0; }
        .dl-brand__text { font-family: var(--font-display); font-weight: 800; font-size: .92rem; white-space: nowrap; transition: opacity .2s, width .2s; }
        .dl-brand__text strong { color: var(--accent-bright); }
        .dl-sidebar--collapsed .dl-brand__text { opacity: 0; width: 0; }
        .dl-collapse-btn {
          width: 30px; height: 30px; border-radius: 8px; border: 1px solid var(--border);
          background: var(--surface-raised); color: var(--text-dim); cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; transition: border-color .15s, color .15s;
        }
        .dl-collapse-btn:hover { border-color: var(--accent-border); color: var(--accent-bright); }

        .dl-nav { flex: 1; display: flex; flex-direction: column; }
        .dl-nav__group { margin-bottom: 4px; }
        .dl-nav__label {
          font-size: .64rem; text-transform: uppercase; letter-spacing: .1em; font-weight: 700;
          font-family: var(--font-mono); color: var(--text-faint); margin: 18px 10px 8px; white-space: nowrap;
          transition: opacity .15s; height: 14px;
        }
        .dl-sidebar--collapsed .dl-nav__label { opacity: 0; }
        .dl-link {
          display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 2px;
          border-radius: 10px; color: var(--text-dim); font-weight: 600; font-size: .87rem;
          text-decoration: none; position: relative; white-space: nowrap; overflow: hidden;
          transition: background .15s, color .15s;
        }
        .dl-link:hover { background: var(--surface-raised); color: var(--text); }
        .dl-link.active { background: var(--accent-soft); color: var(--accent-bright); }
        .dl-link.active::before {
          content: ''; position: absolute; left: 0; top: 8px; bottom: 8px; width: 3px;
          border-radius: 0 3px 3px 0; background: var(--accent);
        }
        .dl-link__icon { display: flex; flex-shrink: 0; }
        .dl-link__text { transition: opacity .15s; }
        .dl-sidebar--collapsed .dl-link { justify-content: center; padding: 10px; }
        .dl-sidebar--collapsed .dl-link__text { display: none; }

        .dl-sidebar__footer {
          border-top: 1px solid var(--border); margin-top: 12px; padding-top: 14px;
          display: flex; align-items: center; gap: 8px;
        }
        .dl-mini-profile { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; overflow: hidden; }
        .dl-mini-profile__info { display: flex; flex-direction: column; min-width: 0; }
        .dl-mini-profile__name { font-size: .84rem; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dl-mini-profile__role { font-size: .7rem; color: var(--text-faint); text-transform: capitalize; }
        .dl-sidebar--collapsed .dl-mini-profile__info { display: none; }
        .dl-sidebar--collapsed .dl-sidebar__footer { justify-content: center; }

        .dl-logout-btn {
          width: 34px; height: 34px; border-radius: 9px; border: 1px solid var(--border);
          background: var(--surface-raised); color: var(--text-dim); cursor: pointer; flex-shrink: 0;
          display: flex; align-items: center; justify-content: center; transition: border-color .15s, color .15s, background .15s;
        }
        .dl-logout-btn:hover { border-color: rgba(255,107,107,.4); color: var(--danger); background: rgba(255,107,107,.08); }

        .dl-avatar {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          background: var(--accent-soft); border: 1.5px solid var(--accent-border); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 800; font-size: .8rem;
        }
        .dl-avatar--sm { width: 30px; height: 30px; font-size: .72rem; }

        /* ── Mobile ── */
        .dl-overlay {
          position: fixed; inset: 0; background: rgba(5,8,20,.75); backdrop-filter: blur(4px);
          z-index: 240; opacity: 0; pointer-events: none; transition: opacity .2s;
        }
        .dl-nav-open .dl-overlay { opacity: 1; pointer-events: auto; }
        @media (max-width: 900px) {
          .dl-sidebar {
            position: fixed; left: 0; top: 0; width: 270px !important;
            transform: translateX(-100%); box-shadow: 0 0 50px rgba(0,0,0,.55);
            transition: transform .25s cubic-bezier(.4,0,.2,1);
          }
          .dl-nav-open .dl-sidebar { transform: translateX(0); }
          .dl-collapse-btn { display: none; }
        }
        @media (min-width: 901px) { .dl-overlay { display: none; } }

        /* ── Main column ── */
        .dl-main { flex: 1; display: flex; flex-direction: column; min-width: 0; }
        .dl-topbar {
          position: sticky; top: 0; z-index: 90; height: 68px;
          display: flex; align-items: center; gap: 14px; padding: 0 clamp(16px,3vw,30px);
          background: rgba(5,11,24,.86); backdrop-filter: blur(18px);
          border-bottom: 1px solid var(--border);
        }
        .dl-icon-btn {
          width: 38px; height: 38px; border-radius: 10px; border: 1px solid var(--border);
          background: var(--surface); color: var(--text-dim); cursor: pointer; position: relative;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
          transition: border-color .15s, color .15s;
        }
        .dl-icon-btn:hover { border-color: var(--accent-border); color: var(--accent-bright); }
        .dl-topbar__burger { display: none; }
        @media (max-width: 900px) { .dl-topbar__burger { display: flex; } }
        .dl-topbar__title { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
        .dl-topbar__eyebrow {
          font-family: var(--font-mono); font-size: .64rem; text-transform: uppercase;
          letter-spacing: .12em; color: var(--text-faint);
        }
        .dl-topbar__title h1 { font-size: 1.05rem; font-weight: 800; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dl-topbar__actions { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .dl-wallet-chip {
          display: flex; align-items: center; gap: 8px; padding: 6px 7px 6px 14px;
          border-radius: 999px; background: var(--accent-soft); border: 1px solid var(--accent-border);
          color: var(--accent-bright); text-decoration: none; font-weight: 700; font-size: .85rem;
          transition: background .15s, border-color .15s;
        }
        .dl-wallet-chip:hover { background: rgba(44,123,229,.24); border-color: var(--accent); }
        .dl-wallet-chip__add {
          width: 22px; height: 22px; border-radius: 50%; background: var(--accent); color: #fff;
          display: flex; align-items: center; justify-content: center; flex-shrink: 0;
        }
        @media (max-width: 560px) { .dl-wallet-chip__amount { display: none; } }
        .dl-notif-dot {
          position: absolute; top: 7px; right: 7px; width: 7px; height: 7px; border-radius: 50%;
          background: var(--amber); border: 1.5px solid var(--bg);
        }
        .dl-user-menu { position: relative; }
        .dl-user-trigger {
          display: flex; align-items: center; gap: 4px; background: none; border: none; cursor: pointer;
          color: var(--text-dim); padding: 4px 6px; border-radius: 10px; transition: background .15s;
        }
        .dl-user-trigger:hover { background: var(--surface-raised); }
        .dl-user-dropdown {
          position: absolute; right: 0; top: calc(100% + 12px); width: 234px;
          background: var(--surface-raised); border: 1px solid var(--border-bright); border-radius: 14px;
          box-shadow: 0 20px 50px rgba(0,0,0,.55); padding: 12px; display: flex; flex-direction: column; gap: 2px;
          z-index: 120; animation: dlDropIn .15s ease;
        }
        @keyframes dlDropIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .dl-user-dropdown__header {
          display: flex; align-items: center; gap: 10px; padding-bottom: 12px; margin-bottom: 8px;
          border-bottom: 1px solid var(--border);
        }
        .dl-user-dropdown__name { font-weight: 700; font-size: .87rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .dl-user-dropdown__role { font-size: .71rem; color: var(--text-faint); text-transform: capitalize; }
        .dl-dropdown-link {
          display: flex; align-items: center; gap: 10px; padding: 9px 10px; border-radius: 8px;
          color: var(--text-dim); font-size: .85rem; font-weight: 600; text-decoration: none;
          background: none; border: none; width: 100%; text-align: left; cursor: pointer;
          transition: background .15s, color .15s;
        }
        .dl-dropdown-link:hover { background: var(--surface); color: var(--text); }
        .dl-dropdown-link--danger { color: var(--danger); }
        .dl-dropdown-link--danger:hover { background: rgba(255,107,107,.1); color: #FF8989; }
        .dl-content { flex: 1; padding: clamp(18px,3vw,30px); min-width: 0; }
      `}</style>

      {/* ── Sidebar ── */}
      <aside className={`dl-sidebar${collapsed ? ' dl-sidebar--collapsed' : ''}`}>
        <div className="dl-sidebar__kente" />

        <div className="dl-sidebar__top">
          <Link to="/dashboard" className="dl-brand">
            <GhanaFlag size={22} />
            <span className="dl-brand__text">
              Data Bay <strong>Ghana</strong>
            </span>
          </Link>
          <button
            className="dl-collapse-btn"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <Icon name={collapsed ? 'chevron_right' : 'chevron_left'} size={18} />
          </button>
        </div>

        <nav className="dl-nav">
          <NavGroup label="Customer" items={navItems} collapsed={collapsed} onNavigate={() => setNavOpen(false)} />

          {isReseller && !isAdmin && (
            <NavGroup label="Reseller" items={resellerItems} collapsed={collapsed} onNavigate={() => setNavOpen(false)} />
          )}

          {!isReseller && !isAdmin && (
            <NavGroup label="Reseller" items={[becomeResellerItem]} collapsed={collapsed} onNavigate={() => setNavOpen(false)} />
          )}

          {isAdmin && (
            <NavGroup label="Admin" items={adminItems} collapsed={collapsed} onNavigate={() => setNavOpen(false)} />
          )}

          {/* Affiliate — available to every authenticated user */}
          <NavGroup label="Earn" items={[affiliateItem]} collapsed={collapsed} onNavigate={() => setNavOpen(false)} />
        </nav>

        <div className="dl-sidebar__footer">
          <div className="dl-mini-profile">
            <span className="dl-avatar">{initials}</span>
            <div className="dl-mini-profile__info">
              <span className="dl-mini-profile__name">{user?.fullName || 'Account'}</span>
              <span className="dl-mini-profile__role">{user?.role}</span>
            </div>
          </div>
          <button className="dl-logout-btn" onClick={logout} aria-label="Log out" title="Log out">
            <Icon name="logout" size={17} />
          </button>
        </div>
      </aside>

      <div className="dl-overlay" onClick={() => setNavOpen(false)} />

      {/* ── Main column ── */}
      <div className="dl-main">
        <header className="dl-topbar">
          <button
            className="dl-icon-btn dl-topbar__burger"
            onClick={() => setNavOpen((v) => !v)}
            aria-label="Toggle navigation"
          >
            <Icon name="menu" size={20} />
          </button>

          <div className="dl-topbar__title">
            <span className="dl-topbar__eyebrow">{section}</span>
            <h1>{pageTitle}</h1>
          </div>

          <div className="dl-topbar__actions">
            <Link to="/wallet" className="dl-wallet-chip" title="Wallet balance">
              <Icon name="account_balance_wallet" size={16} />
              <span className="dl-wallet-chip__amount">{fmtGhc(balance)}</span>
              <span className="dl-wallet-chip__add">
                <Icon name="add" size={14} />
              </span>
            </Link>

            <button className="dl-icon-btn" aria-label="Notifications">
              <Icon name="notifications" size={19} />
              <span className="dl-notif-dot" />
            </button>

            <div className="dl-user-menu" ref={userMenuRef}>
              <button
                className="dl-user-trigger"
                onClick={() => setUserMenuOpen((v) => !v)}
                aria-label="Account menu"
              >
                <span className="dl-avatar dl-avatar--sm">{initials}</span>
                <Icon name={userMenuOpen ? 'expand_less' : 'expand_more'} size={16} />
              </button>

              {userMenuOpen && (
                <div className="dl-user-dropdown">
                  <div className="dl-user-dropdown__header">
                    <span className="dl-avatar">{initials}</span>
                    <div style={{ minWidth: 0 }}>
                      <div className="dl-user-dropdown__name">{user?.fullName || 'Account'}</div>
                      <div className="dl-user-dropdown__role">{user?.role}</div>
                    </div>
                  </div>
                  <Link to="/profile" className="dl-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                    <Icon name="person" size={17} /> Profile
                  </Link>
                  <Link to="/wallet" className="dl-dropdown-link" onClick={() => setUserMenuOpen(false)}>
                    <Icon name="account_balance_wallet" size={17} /> Wallet
                  </Link>
                  <button
                    className="dl-dropdown-link dl-dropdown-link--danger"
                    onClick={() => { setUserMenuOpen(false); logout(); }}
                  >
                    <Icon name="logout" size={17} /> Log out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="dl-content">
          <Outlet context={{ balance, setBalance }} />
        </main>
      </div>
    </div>
  );
}