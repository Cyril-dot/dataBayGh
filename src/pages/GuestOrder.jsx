import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/api';
import { useNotify } from '../context/NotificationContext';
import NetworkBadge from '../components/NetworkBadge';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';
import GhanaFlag from '../components/GhanaFlag';
import BundlePicker from '../components/BundlePicker';
import { usePricingCatalog } from '../hooks/usePricingCatalog';

const PHONE_PATTERN = /^0[2359]\d{8}$/;

const TRUST_ITEMS = [
  { icon: 'bolt', label: 'Delivered in under 30s' },
  { icon: 'shield', label: 'Paystack secured' },
  { icon: 'no_accounts', label: 'No account needed' },
];

const HOW_IT_WORKS = [
  { icon: 'sim_card', title: 'Pick your bundle', text: 'Choose network, size, and the number to top up.' },
  { icon: 'payments', title: 'Pay with Paystack', text: 'Card or mobile money — your details stay with Paystack.' },
  { icon: 'send', title: 'Instant delivery', text: 'Data lands on the number in under 30 seconds.' },
];

export default function GuestOrder() {
  const notify = useNotify();
  const { priceFor, sizes, status: pricingStatus, retry: retryPricing } = usePricingCatalog();

  const [network, setNetwork] = useState('MTN');
  const [capacityGb, setCapacityGb] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const [redirecting, setRedirecting] = useState(false);

  const [refLookup, setRefLookup] = useState('');
  const [statusBusy, setStatusBusy] = useState(false);
  const [statusResult, setStatusResult] = useState(null);

  const pricingReady = pricingStatus === 'ready';
  const pricingFailed = pricingStatus === 'error';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!PHONE_PATTERN.test(phoneNumber)) {
      notify.error('Enter a valid Ghana number, e.g. 0241234567.');
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const data = await api.orders.initiateGuestOrder({ network, capacityGb: Number(capacityGb), phoneNumber });

      // The backend returns Paystack's hosted checkout URL. Without sending
      // the guest there, they have no way to actually pay — the order sits
      // PENDING forever. Send them straight to Paystack; fall back to
      // showing the reference/manual "Pay now" button only if the backend
      // response is ever missing the URL (e.g. mid-deploy skew).
      if (data.authorizationUrl) {
        setResult(data);
        setRedirecting(true);
        window.location.href = data.authorizationUrl;
        return;
      }

      setResult(data);
      notify.error('Order started, but no payment link was returned. Use "Pay now" below, or contact support.');
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not start this order.'));
    } finally {
      setBusy(false);
    }
  };

  const handleStatusCheck = async (e) => {
    e.preventDefault();
    if (!refLookup.trim()) return;
    setStatusBusy(true);
    setStatusResult(null);
    try {
      const data = await api.orders.getOrderStatusByRef(refLookup.trim());
      setStatusResult(data);
    } catch (err) {
      notify.error(apiErrorMessage(err, 'No order found for that reference.'));
    } finally {
      setStatusBusy(false);
    }
  };

  const handleCopyRef = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.paystackReference);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      notify.error('Could not copy — please copy it manually.');
    }
  };

  const handlePayNow = () => {
    if (result?.authorizationUrl) {
      window.location.href = result.authorizationUrl;
    }
  };

  return (
    <div>
      <div className="kente-strip" />

      {/* Page-specific layout styles — shares tokens/animations from the global stylesheet */}
      <style>{`
        .order-nav {
          position: sticky; top: 0; z-index: 20;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; padding: 16px clamp(14px,4vw,40px);
          background: rgba(5,11,24,0.92); backdrop-filter: blur(14px);
          border-bottom: 1px solid var(--border);
        }
        .order-nav__links { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .order-nav__links a:not(.btn) {
          color: var(--text-dim); font-weight: 600; font-size: 0.88rem; padding: 8px 4px;
          transition: color var(--dur-fast) ease;
        }
        .order-nav__links a:not(.btn):hover { color: var(--text); }

        .order-hero {
          max-width: 720px; margin: 0 auto;
          padding: clamp(36px,6vw,64px) clamp(16px,4vw,40px) clamp(20px,3vw,28px);
          text-align: center;
        }
        .order-hero__eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          color: var(--accent-bright); font-size: 0.74rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          font-family: var(--font-mono); margin-bottom: 14px;
        }
        .order-hero h1 { margin-bottom: 12px; }
        .order-hero p.muted { max-width: 480px; margin: 0 auto; }

        .trust-row { display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; margin-top: 22px; }
        .trust-pill {
          display: inline-flex; align-items: center; gap: 7px;
          background: var(--surface); border: 1px solid var(--border);
          color: var(--text-dim); padding: 7px 14px; border-radius: 999px;
          font-size: 0.78rem; font-weight: 600;
        }
        .trust-pill .material-symbols-rounded { color: var(--accent-bright); }

        .order-body { max-width: 980px; margin: 0 auto; padding: 0 clamp(14px,4vw,40px) clamp(56px,8vw,90px); }
        .order-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: start; }

        .order-main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .order-aside { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 88px; }

        @media (max-width: 860px) {
          .order-grid { grid-template-columns: 1fr; gap: 18px; }
          .order-aside { position: static; order: 2; }
          .order-main { order: 1; }
        }

        .steps-mini { display: flex; flex-direction: column; gap: 0; }
        .step-mini { display: flex; gap: 12px; padding: 14px 2px; border-bottom: 1px dashed var(--border); }
        .step-mini:last-child { border-bottom: none; padding-bottom: 2px; }
        .step-mini__icon {
          width: 36px; height: 36px; border-radius: var(--radius-sm);
          background: var(--accent-soft); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border: 1px solid var(--accent-border);
        }
        .step-mini__title { font-size: 0.88rem; font-weight: 700; margin-bottom: 2px; }
        .step-mini__text { font-size: 0.8rem; color: var(--text-dim); line-height: 1.5; }

        .ref-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 6px; }
        .ref-row code {
          background: var(--surface-raised); border: 1px solid var(--border);
          padding: 3px 8px; border-radius: var(--radius-sm); font-size: 0.85rem;
          word-break: break-all;
        }
        .copy-btn {
          display: inline-flex; align-items: center; gap: 4px; flex-shrink: 0;
          background: transparent; border: 1px solid var(--border);
          color: var(--text-dim); border-radius: var(--radius-sm);
          padding: 4px 9px; font-size: 0.74rem; font-weight: 700;
          cursor: pointer; transition: all var(--dur-fast) ease;
        }
        .copy-btn:hover { border-color: var(--accent); color: var(--accent-bright); }
        .copy-btn--done { border-color: var(--green); color: #34D399; }

        .result-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }

        .status-check__form { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 14px; }
        .status-check__form input { flex: 1; min-width: 160px; }
        .status-check__result {
          display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
          margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--border);
          font-size: 0.9rem;
        }

        .aside-cta { text-align: center; }
        .aside-cta p { font-size: 0.85rem; line-height: 1.6; }

        .pricing-error {
          display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
          background: var(--surface); border: 1px solid var(--border);
          border-radius: var(--radius-sm); padding: 12px 14px; margin-bottom: 14px;
          font-size: 0.85rem; color: var(--text-dim);
        }
        .pricing-error strong { color: var(--text); }

        @media (max-width: 540px) {
          .status-check__form { flex-direction: column; align-items: stretch; }
          .order-hero { padding-top: 24px; }
          .order-nav__links a:not(.btn) { display: none; }
        }
      `}</style>

      <header className="order-nav">
        <Link to="/" className="public-nav__brand">
          <GhanaFlag size={22} />
          Data Bay <strong>Ghana</strong>
        </Link>
        <nav className="order-nav__links">
          <Link to="/login">Log in</Link>
          <Link to="/register" className="btn btn--primary btn--sm">
            Create account
          </Link>
        </nav>
      </header>

      <section className="order-hero fade-in-up">
        <span className="order-hero__eyebrow">
          <Icon name="shopping_cart" size={14} />
          Guest Checkout
        </span>
        <h1>Buy a bundle as a guest</h1>
        <p className="muted">
          No account needed. Pay with Paystack and we deliver straight to the number you choose.
        </p>

        <div className="trust-row">
          {TRUST_ITEMS.map((t) => (
            <span className="trust-pill" key={t.label}>
              <Icon name={t.icon} size={15} />
              {t.label}
            </span>
          ))}
        </div>
      </section>

      <div className="order-body">
        <div className="order-grid">
          {/* ── Main column: order form / result + status checker ── */}
          <div className="order-main">
            {!result && (
              <form onSubmit={handleSubmit} className="form card fade-in-up delay-1">
                {pricingFailed && (
                  <div className="pricing-error">
                    <span>
                      <strong>Could not load current prices.</strong> Please try again.
                    </span>
                    <button type="button" className="btn btn--ghost btn--sm" onClick={retryPricing}>
                      <Icon name="refresh" size={14} />
                      Retry
                    </button>
                  </div>
                )}

                <BundlePicker
                  network={network}
                  onNetworkChange={setNetwork}
                  sizes={sizes}
                  capacityGb={capacityGb}
                  onCapacityChange={setCapacityGb}
                  priceFor={priceFor}
                  pricingStatus={pricingStatus}
                  note={pricingStatus === 'loading' ? 'Loading current prices…' : null}
                />

                <label className="form__field">
                  <span>Phone number to credit</span>
                  <input
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="0241234567"
                    inputMode="numeric"
                  />
                </label>

                <button className="btn btn--primary btn--block" type="submit" disabled={busy || !pricingReady}>
                  <Icon name="arrow_forward" size={18} />
                  {busy ? (redirecting ? 'Redirecting to Paystack…' : 'Starting order…') : 'Continue to payment'}
                </button>
              </form>
            )}

            {result && (
              <div className="card result-card scale-in">
                <div className="result-card__row">
                  <NetworkBadge network={result.network} />
                  <span>{result.capacityGb} GB → {result.phoneNumber}</span>
                </div>
                <div className="result-card__amount">GH₵ {Number(result.amountGhc).toFixed(2)}</div>

                <div className="ref-row">
                  <span className="muted">Paystack reference:</span>
                  <code>{result.paystackReference}</code>
                  <button
                    type="button"
                    className={`copy-btn${copied ? ' copy-btn--done' : ''}`}
                    onClick={handleCopyRef}
                  >
                    <Icon name={copied ? 'check' : 'content_copy'} size={13} />
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                {result.authorizationUrl ? (
                  <>
                    <p className="muted" style={{ marginTop: 10 }}>
                      {redirecting
                        ? "Taking you to Paystack to complete payment…"
                        : 'Click below to pay with Paystack. A receipt was also sent to '}
                      {!redirecting && <strong>{result.email}</strong>}
                      {!redirecting && '.'}
                    </p>
                    <div className="result-actions">
                      <button className="btn btn--primary" onClick={handlePayNow}>
                        <Icon name="lock" size={16} />
                        Pay with Paystack
                      </button>
                      <button className="btn btn--ghost" onClick={() => setResult(null)}>
                        Start another order
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="muted" style={{ marginTop: 10 }}>
                      We couldn't get a payment link this time. Please start again — if this keeps happening,
                      contact support with the reference above.
                    </p>
                    <div className="result-actions">
                      <button className="btn btn--ghost" onClick={() => setResult(null)}>
                        Start another order
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="card status-section fade-in-up delay-2">
              <h3>Already paid? Check your order status</h3>
              <form onSubmit={handleStatusCheck} className="status-check__form">
                <input
                  value={refLookup}
                  onChange={(e) => setRefLookup(e.target.value)}
                  placeholder="Paystack reference"
                />
                <button className="btn btn--primary" type="submit" disabled={statusBusy}>
                  <Icon name="search" size={16} />
                  Check
                </button>
              </form>
              {statusBusy && <Spinner label="Checking order…" />}
              {statusResult && (
                <div className="status-check__result">
                  <NetworkBadge network={statusResult.network} />
                  <span>{statusResult.capacityGb} GB → {statusResult.phoneNumber}</span>
                  <StatusBadge status={statusResult.status} />
                </div>
              )}
            </div>
          </div>

          {/* ── Side column: how it works + account upsell (moves below form on mobile) ── */}
          <aside className="order-aside fade-in-up delay-2">
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>How it works</h3>
              <div className="steps-mini">
                {HOW_IT_WORKS.map((s, i) => (
                  <div className="step-mini" key={s.title}>
                    <div className="step-mini__icon">
                      <Icon name={s.icon} size={17} />
                    </div>
                    <div>
                      <div className="step-mini__title">{i + 1}. {s.title}</div>
                      <div className="step-mini__text">{s.text}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card aside-cta">
              <p className="muted">Want order history, saved numbers, and reseller pricing?</p>
              <Link to="/register" className="btn btn--gold btn--block" style={{ marginTop: 12 }}>
                <Icon name="person_add" size={16} />
                Create a free account
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}