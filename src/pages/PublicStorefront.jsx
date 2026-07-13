import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import Icon from '../components/Icon';
import NetworkBadge from '../components/NetworkBadge';
import Spinner from '../components/Spinner';

const PHONE_PATTERN = /^0[2359]\d{8}$/;
const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

/* ── Paystack inline popup ───────────────────────────────────────────────── */
function loadPaystack() {
  return new Promise((resolve) => {
    if (window.PaystackPop) { resolve(); return; }
    const s  = document.createElement('script');
    s.src    = 'https://js.paystack.co/v1/inline.js';
    s.onload = resolve;
    document.head.appendChild(s);
  });
}

/* ── Network colours ─────────────────────────────────────────────────────── */
const NET_COLOUR = {
  MTN:        '#FFCC00',
  TELECEL:    '#E4002B',
  AIRTELTIGO: '#1657D6',
};

const NET_LABEL = {
  MTN:        'MTN',
  TELECEL:    'Telecel',
  AIRTELTIGO: 'AirtelTigo',
};

/* ── Group bundles by network ────────────────────────────────────────────── */
function groupByNetwork(bundles) {
  return bundles.reduce((acc, b) => {
    const net = b.network;
    if (!acc[net]) acc[net] = [];
    acc[net].push(b);
    return acc;
  }, {});
}

export default function PublicStorefront() {
  const { slug }    = useParams();
  const navigate    = useNavigate();
  const { isAuth }  = useAuth?.() ?? {};     // graceful — storefront is public
  const notify      = useNotify();

  /* ── Store data ─────────────────────────────────────────────── */
  const [store,        setStore]        = useState(null);
  const [storeLoading, setStoreLoading] = useState(true);
  const [storeError,   setStoreError]   = useState(false);

  /* ── Selection + form ───────────────────────────────────────── */
  const [selected,    setSelected]    = useState(null);   // bundle object
  const [phone,       setPhone]       = useState('');
  const [phoneErr,    setPhoneErr]    = useState('');
  const [checkoutMode, setCheckoutMode] = useState(null); // 'paystack' | 'wallet'
  const [busy,        setBusy]        = useState(false);
  const [result,      setResult]      = useState(null);

  /* ── Active network tab ─────────────────────────────────────── */
  const [activeNet, setActiveNet] = useState(null);

  /* ── Load storefront ────────────────────────────────────────── */
  useEffect(() => {
    setStoreLoading(true);
    api.storefront
      .getStore(slug)
      .then((data) => {
        setStore(data);
        // Default to first network available
        const first = data.bundles?.[0]?.network ?? null;
        setActiveNet(first);
      })
      .catch(() => setStoreError(true))
      .finally(() => setStoreLoading(false));
  }, [slug]);

  const grouped  = store ? groupByNetwork(store.bundles ?? []) : {};
  const networks = Object.keys(grouped);

  /* ── Validate phone ─────────────────────────────────────────── */
  const validatePhone = () => {
    if (!PHONE_PATTERN.test(phone)) {
      setPhoneErr('Enter a valid Ghana number, e.g. 0241234567');
      return false;
    }
    setPhoneErr('');
    return true;
  };

  /* ── Guest Paystack checkout ─────────────────────────────────── */
const handlePaystackCheckout = async () => {
  if (!validatePhone()) return;
  setBusy(true);
  try {
    // 1. Initiate — get Paystack reference + amount
    const order = await api.storefront.guestOrder(slug, {
      network:     selected.network,
      capacityGb:  selected.capacityGb,
      phoneNumber: phone,
    });

    // 2. Load Paystack popup
    await loadPaystack();

    const handler = window.PaystackPop.setup({
      key:      import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email:    `guest@${window.location.hostname}`,
      amount:   Math.round(Number(selected.sellingPriceGhc) * 100),
      currency: 'GHS',
      ref:      order.paystackRef,
      callback: function (response) {
        setResult({ ...order, paidVia: 'paystack' });
        notify.success('Payment successful! Your bundle is on its way.');
        setBusy(false);
      },
      onClose: function () {
        notify.error('Payment cancelled.');
        setBusy(false);
      },
    });

    handler.openIframe();
  } catch (err) {
    notify.error(apiErrorMessage(err, 'Could not initiate payment. Please try again.'));
    setBusy(false);
  }
};
  /* ── Wallet checkout (logged-in customers only) ──────────────── */
  const handleWalletCheckout = async () => {
    if (!validatePhone()) return;
    setBusy(true);
    try {
      const order = await api.storefront.walletOrder(slug, {
        network:     selected.network,
        capacityGb:  selected.capacityGb,
        phoneNumber: phone,
      });
      setResult({ ...order, paidVia: 'wallet' });
      notify.success('Bundle purchased from your wallet!');
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not place this order.'));
    } finally {
      setBusy(false);
    }
  };

  const handleCheckout = () => {
    if (checkoutMode === 'paystack') handlePaystackCheckout();
    else handleWalletCheckout();
  };

  /* ── Derived theme ───────────────────────────────────────────── */
  const themeColour = store?.themeColour ?? '#2C7BE5';
  const themeSoft   = themeColour + '22';
  const themeBorder = themeColour + '55';

  /* ── Loading / error states ─────────────────────────────────── */
  if (storeLoading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#050B18' }}>
        <Spinner label="Loading store…" />
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#050B18', color: '#E8F0FF', gap: 16 }}>
        <Icon name="storefront" size={48} style={{ color: '#3D5A82' }} />
        <h1 style={{ fontFamily: 'Archivo, sans-serif', margin: 0 }}>Store not found</h1>
        <p style={{ color: '#7A9AC4' }}>This store link may be invalid or the store is not yet active.</p>
        <button
          onClick={() => navigate('/')}
          style={{ padding: '10px 24px', borderRadius: 9, background: '#2C7BE5', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer', marginTop: 8 }}
        >
          Go to homepage
        </button>
      </div>
    );
  }

  /* ── Result screen ───────────────────────────────────────────── */
  if (result) {
    return (
      <Wrapper themeColour={themeColour} store={store}>
        <div style={{ maxWidth: 460, margin: '60px auto', padding: '0 20px' }}>
          <div className="sf-result-card">
            <div className="sf-result-card__icon">
              <Icon name="check_circle" size={40} style={{ color: '#10B981' }} />
            </div>
            <h2 className="sf-result-card__title">Bundle on its way!</h2>
            <p className="sf-result-card__sub">
              {result.capacityGb}GB {NET_LABEL[result.network] ?? result.network} →{' '}
              <span style={{ fontFamily: 'Space Mono, monospace' }}>{result.phoneNumber}</span>
            </p>
            <div className="sf-result-card__row">
              <span>Amount paid</span>
              <span style={{ fontFamily: 'Space Mono, monospace', fontWeight: 700 }}>
                {fmtGhc(result.sellingPriceGhc)}
              </span>
            </div>
            <div className="sf-result-card__row">
              <span>Method</span>
              <span>{result.paidVia === 'wallet' ? 'Wallet' : 'Paystack'}</span>
            </div>
            <button
              className="sf-cta-btn"
              style={{ marginTop: 20, '--tc': themeColour }}
              onClick={() => { setResult(null); setSelected(null); setPhone(''); }}
            >
              Buy another bundle
            </button>
          </div>
        </div>
      </Wrapper>
    );
  }

  const visibleBundles = activeNet ? (grouped[activeNet] ?? []) : [];

  return (
    <Wrapper themeColour={themeColour} store={store}>
      <style>{`
        /* ── Layout ── */
        .sf-page { max-width: 900px; margin: 0 auto; padding: 32px 20px 60px; }

        /* ── Network tabs ── */
        .sf-net-tabs { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
        .sf-net-tab {
          display: flex; align-items: center; gap: 7px; padding: 8px 18px;
          border-radius: 999px; font-size: .82rem; font-weight: 700; cursor: pointer;
          border: 1.5px solid var(--sf-border); background: var(--sf-surface);
          color: var(--sf-text-dim); transition: all .15s;
        }
        .sf-net-tab:hover { border-color: var(--sf-border-bright); color: var(--sf-text); }
        .sf-net-tab--active { color: #fff; }
        .sf-net-dot { width: 8px; height: 8px; border-radius: 50%; }

        /* ── Bundle grid ── */
        .sf-bundle-grid {
          display: grid; grid-template-columns: repeat(auto-fill, minmax(180px,1fr)); gap: 12px;
          margin-bottom: 32px;
        }
        .sf-bundle-card {
          padding: 16px; border-radius: 12px; cursor: pointer;
          border: 1.5px solid var(--sf-border); background: var(--sf-surface);
          transition: border-color .15s, background .15s, transform .12s;
          display: flex; flex-direction: column; gap: 6px;
        }
        .sf-bundle-card:hover { background: var(--sf-surface-raised); transform: translateY(-2px); }
        .sf-bundle-card--active { border-color: var(--sf-theme) !important; background: var(--sf-theme-soft) !important; }
        .sf-bundle-card__size { font-family: 'Archivo', sans-serif; font-weight: 900; font-size: 1.4rem; }
        .sf-bundle-card__price { font-family: 'Space Mono', monospace; font-weight: 700; font-size: .92rem; }
        .sf-bundle-card__net { font-size: .72rem; color: var(--sf-text-dim); }

        /* ── Checkout panel ── */
        .sf-checkout { background: var(--sf-surface-raised); border: 1px solid var(--sf-border); border-radius: 14px; padding: 24px; }
        .sf-checkout h3 { font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 1rem; margin: 0 0 16px; }
        .sf-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .sf-field label { font-size: .72rem; text-transform: uppercase; letter-spacing: .07em; font-weight: 700; color: var(--sf-text-dim); }
        .sf-field input {
          background: var(--sf-surface); border: 1.5px solid var(--sf-border-bright); color: var(--sf-text);
          border-radius: 9px; padding: 11px 13px; font-family: 'Work Sans', sans-serif; font-size: .93rem;
          outline: none; transition: border-color .15s; width: 100%;
        }
        .sf-field input:focus { border-color: var(--sf-theme); }
        .sf-field__err { font-size: .76rem; color: #FF6B6B; font-weight: 600; }

        /* Mode toggle */
        .sf-mode-toggle { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 16px; }
        .sf-mode-btn {
          padding: 10px; border-radius: 9px; font-size: .82rem; font-weight: 700; cursor: pointer;
          border: 1.5px solid var(--sf-border); background: var(--sf-surface);
          color: var(--sf-text-dim); transition: all .15s; display: flex; align-items: center; justify-content: center; gap: 6px;
        }
        .sf-mode-btn:hover { border-color: var(--sf-border-bright); color: var(--sf-text); }
        .sf-mode-btn--active { color: #fff; }

        .sf-summary-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 0; border-bottom: 1px dashed var(--sf-border); font-size: .88rem;
        }
        .sf-summary-row:last-of-type { border-bottom: none; }
        .sf-summary-row__label { color: var(--sf-text-dim); }
        .sf-summary-row__value { font-family: 'Space Mono', monospace; font-weight: 700; }

        .sf-cta-btn {
          width: 100%; padding: 14px; border: none; border-radius: 10px; cursor: pointer;
          font-family: 'Archivo', sans-serif; font-weight: 800; font-size: .95rem; color: #fff;
          background: var(--sf-theme); transition: opacity .15s, transform .12s;
          display: flex; align-items: center; justify-content: center; gap: 8px;
        }
        .sf-cta-btn:hover:not(:disabled) { opacity: .88; transform: translateY(-1px); }
        .sf-cta-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* Result card */
        .sf-result-card {
          background: var(--sf-surface-raised); border: 1px solid var(--sf-border);
          border-radius: 16px; padding: 32px 24px; text-align: center;
        }
        .sf-result-card__icon { margin-bottom: 12px; }
        .sf-result-card__title { font-family: 'Archivo', sans-serif; font-weight: 800; font-size: 1.3rem; margin: 0 0 6px; }
        .sf-result-card__sub { color: var(--sf-text-dim); margin-bottom: 20px; }
        .sf-result-card__row {
          display: flex; justify-content: space-between; padding: 10px 0;
          border-bottom: 1px dashed var(--sf-border); font-size: .9rem;
        }
        .sf-result-card__row:last-of-type { border-bottom: none; }

        /* Grid layout */
        .sf-main-grid { display: grid; grid-template-columns: 1.4fr 1fr; gap: 24px; align-items: start; }
        @media (max-width: 680px) { .sf-main-grid { grid-template-columns: 1fr; } }

        .sf-empty { text-align: center; padding: 40px 20px; color: var(--sf-text-dim); }

        /* Powered-by footer */
        .sf-powered { text-align: center; margin-top: 40px; font-size: .72rem; color: var(--sf-text-faint); }
        .sf-powered a { color: var(--sf-text-faint); }
        .sf-powered a:hover { color: var(--sf-text-dim); }
      `}</style>

      <div
        className="sf-page"
        style={{
          '--sf-theme':        themeColour,
          '--sf-theme-soft':   themeSoft,
          '--sf-theme-border': themeBorder,
        }}
      >

        {/* Network tabs */}
        {networks.length > 1 && (
          <div className="sf-net-tabs">
            {networks.map((net) => {
              const colour = NET_COLOUR[net] ?? themeColour;
              const active = activeNet === net;
              return (
                <button
                  key={net}
                  className={`sf-net-tab${active ? ' sf-net-tab--active' : ''}`}
                  style={active ? { background: colour, borderColor: colour } : {}}
                  onClick={() => { setActiveNet(net); setSelected(null); }}
                >
                  <span className="sf-net-dot" style={{ background: colour }} />
                  {NET_LABEL[net] ?? net}
                </button>
              );
            })}
          </div>
        )}

        <div className="sf-main-grid">

          {/* ── Bundle grid ── */}
          <div>
            <p style={{ fontSize: '.8rem', color: 'var(--sf-text-dim)', marginBottom: 14 }}>
              {networks.length > 0
                ? `Select a bundle below — delivered instantly to any ${NET_LABEL[activeNet] ?? activeNet} number.`
                : 'No bundles available yet.'}
            </p>

            {visibleBundles.length === 0 ? (
              <div className="sf-empty">
                <Icon name="inventory_2" size={32} style={{ marginBottom: 8, opacity: .4 }} />
                <p>No bundles for this network yet.</p>
              </div>
            ) : (
              <div className="sf-bundle-grid">
                {visibleBundles
                  .slice()
                  .sort((a, b) => Number(a.capacityGb) - Number(b.capacityGb))
                  .map((b) => {
                    const isActive = selected?.capacityGb === b.capacityGb && selected?.network === b.network;
                    const colour   = NET_COLOUR[b.network] ?? themeColour;
                    return (
                      <button
                        key={`${b.network}-${b.capacityGb}`}
                        className={`sf-bundle-card${isActive ? ' sf-bundle-card--active' : ''}`}
                        style={isActive ? { '--sf-theme': colour, '--sf-theme-soft': colour + '18' } : {}}
                        onClick={() => setSelected(b)}
                      >
                        <span className="sf-bundle-card__size">{b.capacityGb}GB</span>
                        <span className="sf-bundle-card__price" style={{ color: isActive ? colour : undefined }}>
                          {fmtGhc(b.sellingPriceGhc)}
                        </span>
                        <span className="sf-bundle-card__net">{NET_LABEL[b.network] ?? b.network}</span>
                      </button>
                    );
                  })}
              </div>
            )}
          </div>

          {/* ── Checkout panel ── */}
          <div className="sf-checkout">
            {!selected ? (
              <div className="sf-empty" style={{ padding: '30px 10px' }}>
                <Icon name="touch_app" size={28} style={{ opacity: .4, marginBottom: 8 }} />
                <p style={{ fontSize: '.85rem' }}>Select a bundle to continue</p>
              </div>
            ) : (
              <>
                <h3>
                  <NetworkBadge network={selected.network} />
                  {' '}{selected.capacityGb}GB — {fmtGhc(selected.sellingPriceGhc)}
                </h3>

                {/* Phone */}
                <div className="sf-field">
                  <label>Recipient's phone number</label>
                  <input
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setPhoneErr(''); }}
                    placeholder="0241234567"
                    type="tel"
                    maxLength={10}
                  />
                  {phoneErr && <span className="sf-field__err">{phoneErr}</span>}
                </div>

                {/* Payment mode */}
                <div className="sf-mode-toggle">
                  <button
                    className={`sf-mode-btn${checkoutMode === 'paystack' ? ' sf-mode-btn--active' : ''}`}
                    style={checkoutMode === 'paystack' ? { background: themeColour, borderColor: themeColour } : {}}
                    onClick={() => setCheckoutMode('paystack')}
                  >
                    <Icon name="credit_card" size={15} />
                    Paystack
                  </button>
                  {isAuth && (
                    <button
                      className={`sf-mode-btn${checkoutMode === 'wallet' ? ' sf-mode-btn--active' : ''}`}
                      style={checkoutMode === 'wallet' ? { background: themeColour, borderColor: themeColour } : {}}
                      onClick={() => setCheckoutMode('wallet')}
                    >
                      <Icon name="account_balance_wallet" size={15} />
                      Wallet
                    </button>
                  )}
                </div>

                {!isAuth && (
                  <p style={{ fontSize: '.76rem', color: 'var(--sf-text-faint)', marginBottom: 12 }}>
                    Have an account?{' '}
                    <a href="/login" style={{ color: themeColour }}>Log in</a>
                    {' '}to pay from your wallet.
                  </p>
                )}

                {/* Summary */}
                <div style={{ marginBottom: 16 }}>
                  <div className="sf-summary-row">
                    <span className="sf-summary-row__label">Bundle</span>
                    <span className="sf-summary-row__value">{selected.capacityGb}GB</span>
                  </div>
                  <div className="sf-summary-row">
                    <span className="sf-summary-row__label">Network</span>
                    <span className="sf-summary-row__value">{NET_LABEL[selected.network] ?? selected.network}</span>
                  </div>
                  <div className="sf-summary-row">
                    <span className="sf-summary-row__label">Total</span>
                    <span className="sf-summary-row__value" style={{ color: themeColour }}>
                      {fmtGhc(selected.sellingPriceGhc)}
                    </span>
                  </div>
                </div>

                <button
                  className="sf-cta-btn"
                  style={{ '--sf-theme': themeColour }}
                  disabled={busy || !checkoutMode}
                  onClick={handleCheckout}
                >
                  {busy
                    ? 'Processing…'
                    : checkoutMode === 'wallet'
                    ? 'Pay from wallet'
                    : checkoutMode === 'paystack'
                    ? 'Pay with Paystack'
                    : 'Choose a payment method'}
                  {!busy && <Icon name="arrow_forward" size={16} />}
                </button>
              </>
            )}
          </div>

        </div>

        <p className="sf-powered">
          Powered by <a href="/">Data Bay Ghana</a>
        </p>
      </div>
    </Wrapper>
  );
}

/* ── Wrapper: storefront shell with branded header ───────────────────────── */
function Wrapper({ themeColour, store, children }) {
  const themeSoft   = themeColour + '18';
  const themeBorder = themeColour + '44';

  return (
    <div
      style={{
        minHeight:   '100vh',
        background:  '#050B18',
        color:       '#E8F0FF',
        fontFamily:  'Work Sans, sans-serif',
        '--sf-bg':           '#050B18',
        '--sf-surface':      '#0A1628',
        '--sf-surface-raised':'#0F1E3A',
        '--sf-border':       '#1A2E50',
        '--sf-border-bright':'#243A64',
        '--sf-text':         '#E8F0FF',
        '--sf-text-dim':     '#7A9AC4',
        '--sf-text-faint':   '#3D5A82',
        '--sf-theme':        themeColour,
        '--sf-theme-soft':   themeSoft,
        '--sf-theme-border': themeBorder,
      }}
    >
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Work+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,1,0&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        .material-symbols-rounded { font-family: 'Material Symbols Rounded'; line-height: 1; user-select: none; }
      `}</style>

      {/* Kente bar */}
      <div style={{ height: 4, background: 'linear-gradient(90deg,#FFCC00 0% 33.33%,#E4002B 33.33% 66.66%,#1657D6 66.66% 100%)' }} />

      {/* Store header */}
      <header
        style={{
          borderBottom: `1px solid ${themeBorder}`,
          background:   `linear-gradient(135deg, #0A1628 0%, ${themeSoft} 100%)`,
          padding:      '20px clamp(20px,4vw,48px)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Logo or icon */}
          <div
            style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
              background: themeSoft, border: `1.5px solid ${themeBorder}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: themeColour,
            }}
          >
            {store?.storeLogoUrl
              ? <img src={store.storeLogoUrl} alt="logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; }} />
              : <span className="material-symbols-rounded" style={{ fontSize: 24 }}>storefront</span>
            }
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontFamily: 'Archivo, sans-serif', fontWeight: 900, fontSize: 'clamp(1.1rem,3vw,1.5rem)', color: '#E8F0FF', letterSpacing: '-.02em' }}>
              {store?.storeName ?? 'Data Store'}
            </h1>
            {store?.storeTagline && (
              <p style={{ fontSize: '.82rem', color: '#7A9AC4', marginTop: 2 }}>{store.storeTagline}</p>
            )}
          </div>

          {/* Live badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '5px 12px', borderRadius: 999, fontSize: '.7rem', fontWeight: 700,
            background: 'rgba(16,185,129,.12)', border: '1px solid rgba(16,185,129,.3)', color: '#10B981',
            flexShrink: 0,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', animation: 'sfPulse 2s infinite' }} />
            Live
          </div>
        </div>
        <style>{`@keyframes sfPulse { 0%,100%{opacity:1} 50%{opacity:.3} }`}</style>
      </header>

      {children}
    </div>
  );
}