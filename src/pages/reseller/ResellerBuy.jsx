import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import NetworkBadge from '../../components/NetworkBadge';
import Icon from '../../components/Icon';
import BundlePicker from '../../components/BundlePicker';
import { BUNDLE_SIZES } from '../../data/bundleCatalog';

const PHONE_PATTERN = /^0[2359]\d{8}$/;

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;
const fmtGhcOrDash = (n) => (n === null || n === undefined ? '—' : fmtGhc(n));

const SELL_STEPS = [
  { icon: 'sim_card', title: 'Pick a bundle', text: 'Network, size, and the customer\u2019s number.' },
  { icon: 'account_balance_wallet', title: 'Charged at wholesale', text: 'Cost is deducted from your wallet instantly.' },
  { icon: 'trending_up', title: 'You keep the margin', text: 'Sell at your saved price, or override it per order.' },
];

export default function ResellerBuy() {
  const { setBalance } = useOutletContext() || {};
  const notify = useNotify();

  const [myPricing, setMyPricing] = useState([]);
  const [network, setNetwork] = useState('MTN');
  const [capacityGb, setCapacityGb] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    api.reseller
      .getPricingTable(0, 200)
      .then((data) => setMyPricing(data.content))
      .catch(() => setMyPricing([]));
  }, []);

  const priceFor = (net, gb) => {
    const row = myPricing.find((r) => r.network === net && Number(r.capacityGb) === Number(gb));
    return row ? row.sellingPriceGhc : null;
  };

  const costFor = (net, gb) => {
    const row = myPricing.find((r) => r.network === net && Number(r.capacityGb) === Number(gb));
    return row ? row.costPriceGhc : null;
  };

  const previewCost = costFor(network, capacityGb);
  const previewDefaultPrice = priceFor(network, capacityGb);
  const previewPrice = sellingPrice !== '' ? Number(sellingPrice) : previewDefaultPrice;
  const previewMargin =
    previewCost !== null && previewCost !== undefined && previewPrice !== null && previewPrice !== undefined
      ? previewPrice - previewCost
      : null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!PHONE_PATTERN.test(phoneNumber)) {
      notify.error('Enter a valid Ghana number, e.g. 0241234567.');
      return;
    }
    setBusy(true);
    try {
      const order = await api.orders.placeResellerWalletOrder(
        { network, capacityGb: Number(capacityGb), phoneNumber },
        sellingPrice ? Number(sellingPrice) : undefined
      );
      setResult(order);
      api.wallet.getBalance().then((b) => setBalance?.(b.balance)).catch(() => {});
      notify.success('Reseller order placed.');
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not place this order. Check your wallet balance and reseller status.'));
    } finally {
      setBusy(false);
    }
  };

  const resultMargin = result ? Number(result.sellingPriceGhc) - Number(result.costPriceGhc) : null;

  return (
    <div className="stack-lg">
      {/* Page-specific layout styles — shares tokens/animations from the global stylesheet */}
      <style>{`
        .sell-header__eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }

        .sell-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: start; }
        .sell-main { min-width: 0; }
        .sell-aside { display: flex; flex-direction: column; gap: 16px; }

        @media (max-width: 820px) {
          .sell-grid { grid-template-columns: 1fr; }
        }

        .sell-preview-row {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 0; border-bottom: 1px dashed var(--border); gap: 12px;
        }
        .sell-preview-row:last-child { border-bottom: none; }
        .sell-preview-row__label { color: var(--text-dim); font-size: 0.85rem; }
        .sell-preview-row__value { font-family: var(--font-mono); font-weight: 700; font-size: 0.92rem; }

        .sell-preview-margin { margin-top: 4px; padding-top: 14px; border-top: 1.5px solid var(--border); }
        .sell-preview-margin .sell-preview-row__label { font-weight: 700; color: var(--text); }
        .sell-preview-margin .sell-preview-row__value { font-size: 1.3rem; }
        .sell-margin--pos { color: #34D399; }
        .sell-margin--neg { color: #FF8090; }
        .sell-margin--flat { color: var(--text-faint); }

        .sell-steps { display: flex; flex-direction: column; margin-top: 4px; }
        .sell-step { display: flex; gap: 12px; padding: 12px 2px; border-bottom: 1px dashed var(--border); }
        .sell-step:last-child { border-bottom: none; padding-bottom: 0; }
        .sell-step__icon {
          width: 34px; height: 34px; border-radius: var(--radius-sm);
          background: var(--accent-soft); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border: 1px solid var(--accent-border);
        }
        .sell-step__title { font-size: 0.86rem; font-weight: 700; margin-bottom: 2px; }
        .sell-step__text { font-size: 0.78rem; color: var(--text-dim); line-height: 1.5; }

        .sell-result-actions { display: flex; gap: 10px; flex-wrap: wrap; margin-top: 8px; }
        .sell-result-actions .btn { flex: 1 1 auto; }

        @media (max-width: 480px) {
          .sell-result-actions { flex-direction: column; }
        }
      `}</style>

      <header className="fade-in-up">
        <span className="sell-header__eyebrow">
          <Icon name="sell" size={13} />
          Reseller
        </span>
        <h1>Sell a bundle</h1>
        <p className="muted">Charged from your wallet at wholesale cost. Prices below are what you've set for yourself.</p>
      </header>

      <div className="sell-grid">
        <div className="sell-main">
          {!result ? (
            <form onSubmit={handleSubmit} className="form card fade-in-up delay-1">
              <BundlePicker
                network={network}
                onNetworkChange={setNetwork}
                sizes={BUNDLE_SIZES}
                capacityGb={capacityGb}
                onCapacityChange={setCapacityGb}
                priceFor={priceFor}
                note="Showing your own saved selling prices — set one in Pricing if a size is blank."
              />

              <label className="form__field">
                <span>Customer's phone number</span>
                <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0241234567" />
              </label>

              <label className="form__field">
                <span>Override selling price (optional, GH₵)</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value)}
                  placeholder="Use my saved price"
                />
              </label>

              <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
                <Icon name="sell" size={18} />
                {busy ? 'Placing order…' : 'Sell this bundle'}
              </button>
            </form>
          ) : (
            <div className="card result-card scale-in">
              <div className="result-card__row">
                <NetworkBadge network={result.network} />
                <span>
                  {result.capacityGb} GB → <span className="mono">{result.phoneNumber}</span>
                </span>
              </div>
              <p className="muted">Cost: {fmtGhc(result.costPriceGhc)}</p>
              <p className="result-card__amount">Sold for {fmtGhc(result.sellingPriceGhc)}</p>
              <p className={resultMargin >= 0 ? 'sell-margin--pos' : 'sell-margin--neg'} style={{ fontWeight: 700 }}>
                Margin: {fmtGhc(resultMargin)}
              </p>
              <p className="muted">Status: {result.status}</p>
              <div className="sell-result-actions">
                <Link className="btn btn--primary" to="/reseller/orders">
                  View reseller orders
                </Link>
                <button className="btn btn--ghost" onClick={() => setResult(null)}>
                  Sell another
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="sell-aside fade-in-up delay-2">
          <div className="card">
            <h2 style={{ marginBottom: 4 }}>Order preview</h2>
            <p className="muted" style={{ fontSize: '0.85rem', marginBottom: 8 }}>
              Updates as you choose a bundle or price.
            </p>

            <div className="sell-preview-row">
              <span className="sell-preview-row__label">Wholesale cost</span>
              <span className="sell-preview-row__value">{fmtGhcOrDash(previewCost)}</span>
            </div>
            <div className="sell-preview-row">
              <span className="sell-preview-row__label">Selling price</span>
              <span className="sell-preview-row__value">{fmtGhcOrDash(previewPrice)}</span>
            </div>

            <div className="sell-preview-row sell-preview-margin">
              <span className="sell-preview-row__label">Your margin</span>
              <span
                className={`sell-preview-row__value ${
                  previewMargin === null
                    ? 'sell-margin--flat'
                    : previewMargin > 0
                    ? 'sell-margin--pos'
                    : previewMargin < 0
                    ? 'sell-margin--neg'
                    : 'sell-margin--flat'
                }`}
              >
                {fmtGhcOrDash(previewMargin)}
              </span>
            </div>

            {previewCost === null && (
              <p className="muted" style={{ fontSize: '0.78rem', marginTop: 10 }}>
                No saved price for this size yet — set one in{' '}
                <Link to="/reseller/pricing">Pricing</Link>, or sell using a manual override above.
              </p>
            )}
          </div>

          <div className="card">
            <h2 style={{ marginBottom: 4 }}>How selling works</h2>
            <div className="sell-steps">
              {SELL_STEPS.map((s) => (
                <div className="sell-step" key={s.title}>
                  <div className="sell-step__icon">
                    <Icon name={s.icon} size={16} />
                  </div>
                  <div>
                    <div className="sell-step__title">{s.title}</div>
                    <div className="sell-step__text">{s.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}