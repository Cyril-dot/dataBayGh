import { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import NetworkBadge from '../components/NetworkBadge';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Icon from '../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

export default function Dashboard() {
  const { user, isReseller, isAdmin } = useAuth();
  const { balance } = useOutletContext() || {};
  const notify = useNotify();
  const [orders, setOrders] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.orders
      .getOrders(0, 5)
      .then((data) => setOrders(data.content))
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load recent orders.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stack-lg">
      <div>
        <h1>Hi {user?.fullName?.split(' ')[0] || 'there'} 👋</h1>
        <p className="muted">Here's what's happening with your account today.</p>
      </div>

      <div className="grid-stats">
        <div className="stat-card">
          <div className="stat-card__icon">
            <Icon name="account_balance_wallet" size={20} />
          </div>
          <span className="stat-card__label">Wallet balance</span>
          <span className="stat-card__value">{fmtGhc(balance)}</span>
          <Link to="/wallet" className="stat-card__link">
            Top up →
          </Link>
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">
            <Icon name={isAdmin ? 'admin_panel_settings' : isReseller ? 'storefront' : 'person'} size={20} />
          </div>
          <span className="stat-card__label">Account type</span>
          <span className="stat-card__value">{isAdmin ? 'Admin' : isReseller ? 'Reseller' : 'Customer'}</span>
          {!isReseller && !isAdmin && (
            <Link to="/reseller/apply" className="stat-card__link">
              Apply as reseller →
            </Link>
          )}
          {isReseller && (
            <Link to="/reseller" className="stat-card__link">
              Reseller dashboard →
            </Link>
          )}
        </div>
        <div className="stat-card">
          <div className="stat-card__icon">
            <Icon name="shopping_cart" size={20} />
          </div>
          <span className="stat-card__label">Quick action</span>
          <span className="stat-card__value stat-card__value--sm">Buy a data bundle</span>
          <Link to="/buy" className="stat-card__link">
            Buy now →
          </Link>
        </div>
      </div>

      <div className="card">
        <div className="card__header">
          <h2>Recent orders</h2>
          <Link to="/orders" className="link">
            View all
          </Link>
        </div>

        {loading && <Spinner label="Loading orders…" />}
        {!loading && (!orders || orders.length === 0) && (
          <EmptyState title="No orders yet" hint="Your purchased bundles will show up here." />
        )}
        {!loading && orders && orders.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Network</th>
                  <th>Size</th>
                  <th>Number</th>
                  <th>Price</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <NetworkBadge network={o.network} />
                    </td>
                    <td>{o.capacityGb} GB</td>
                    <td className="mono">{o.phoneNumber}</td>
                    <td className="mono">{fmtGhc(o.sellingPriceGhc)}</td>
                    <td>
                      <StatusBadge status={o.status} />
                    </td>
                    <td className="muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
