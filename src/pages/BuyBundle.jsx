import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/api';
import { useNotify } from '../context/NotificationContext';
import NetworkBadge from '../components/NetworkBadge';
import Icon from '../components/Icon';
import BundlePicker from '../components/BundlePicker';
import { usePricingCatalog } from '../hooks/usePricingCatalog';

const PHONE_PATTERN = /^0[2359]\d{8}$/;

export default function BuyBundle() {
  const { setBalance } = useOutletContext() || {};
  const notify = useNotify();
  const { priceFor, sizes, status: pricingStatus, retry: retryPricing } = usePricingCatalog();

  const [network, setNetwork] = useState('MTN');
  const [capacityGb, setCapacityGb] = useState(1);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  const pricingReady = pricingStatus === 'ready';
  const pricingFailed = pricingStatus === 'error';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!PHONE_PATTERN.test(phoneNumber)) {
      notify.error('Enter a valid Ghana number, e.g. 0241234567.');
      return;
    }
    setBusy(true);
    try {
      const order = await api.orders.placeWalletOrder({ network, capacityGb: Number(capacityGb), phoneNumber });
      setResult(order);
      api.wallet.getBalance().then((b) => setBalance?.(b.balance)).catch(() => {});
      notify.success('Order placed — provisioning started.');
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not place this order. Check your wallet balance.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack-lg narrow">
      <div>
        <h1>Buy a data bundle</h1>
        <p className="muted">Paid from your wallet balance at your account's pricing.</p>
      </div>

      {!result ? (
        <form onSubmit={handleSubmit} className="form card">
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
            note={pricingStatus === 'loading' ? 'Loading current prices…' : null}
          />

          <label className="form__field">
            <span>Phone number to credit</span>
            <input value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="0241234567" />
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy || !pricingReady}>
            <Icon name="shopping_cart_checkout" size={18} />
            {busy ? 'Placing order…' : 'Buy bundle from wallet'}
          </button>
        </form>
      ) : (
        <div className="card result-card">
          <div className="result-card__row">
            <NetworkBadge network={result.network} />
            <span>
              {result.capacityGb} GB → <span className="mono">{result.phoneNumber}</span>
            </span>
          </div>
          <p className="result-card__amount">GH₵ {Number(result.sellingPriceGhc).toFixed(2)}</p>
          <p className="muted">Status: {result.status}</p>
          <div className="flex-row">
            <Link className="btn btn--primary" to={`/orders/${result.id}`}>
              View order
            </Link>
            <button className="btn btn--ghost" onClick={() => setResult(null)}>
              Buy another
            </button>
          </div>
        </div>
      )}
    </div>
  );
}