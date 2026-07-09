import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import Spinner from '../../components/Spinner';
import Icon from '../../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

const statusBadgeClass = (status) => {
  if (status === 'APPROVED') return 'badge--good';
  if (status === 'PENDING') return 'badge--warn';
  return 'badge--bad';
};

const QUICK_ACTIONS = [
  { to: '/reseller/pricing', icon: 'price_change', label: 'Manage pricing', hint: 'Set your own margins' },
  { to: '/reseller/orders', icon: 'list_alt', label: 'View orders', hint: 'Track every sale' },
  { to: '/reseller/payouts', icon: 'payments', label: 'Request payout', hint: 'Cash out to mobile money' },
];

export default function ResellerDashboard() {
  const notify = useNotify();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.reseller
      .getDashboard()
      .then(setData)
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load your reseller dashboard.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Spinner label="Loading reseller dashboard…" />;
  if (!data) return null;

  return (
    <div className="stack-lg">
      {/* Page-specific layout styles — shares tokens/animations from the global stylesheet */}
      <style>{`
        .reseller-header__eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }
        .reseller-status-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .reseller-status-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--surface-raised); border: 1px solid var(--border);
          color: var(--text-faint); padding: 4px 10px; border-radius: 999px;
          font-size: 0.72rem; font-weight: 600;
        }

        .reseller-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: start; }
        .reseller-main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .reseller-aside { display: flex; flex-direction: column; gap: 16px; }

        .reseller-profit-card {
          border-color: rgba(245,158,11,0.3);
          background: linear-gradient(160deg, var(--surface) 0%, var(--surface-raised) 100%);
          position: relative; overflow: hidden;
        }
        .reseller-profit-card::after {
          content: '';
          position: absolute; top: -60px; right: -60px;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, var(--gold-soft) 0%, transparent 70%);
          pointer-events: none;
        }
        .reseller-profit-card__icon {
          width: 38px; height: 38px; border-radius: var(--radius-sm);
          background: var(--gold-soft); color: var(--gold);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 8px; border: 1px solid rgba(245,158,11,0.25);
        }
        .reseller-profit-card__value {
          font-family: var(--font-mono); font-weight: 700;
          font-size: clamp(1.8rem, 4vw, 2.3rem); color: var(--gold); margin-top: 2px;
        }
        .reseller-breakdown {
          display: flex; gap: 24px; flex-wrap: wrap;
          margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border);
        }
        .reseller-breakdown__item { display: flex; flex-direction: column; gap: 3px; }
        .reseller-breakdown__label {
          font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-faint); font-weight: 700;
        }
        .reseller-breakdown__value { font-family: var(--font-mono); font-weight: 700; font-size: 0.92rem; }

        .reseller-actions { display: flex; flex-direction: column; margin-top: 14px; }
        .reseller-action {
          display: flex; align-items: center; gap: 12px; padding: 11px 4px;
          border-bottom: 1px solid var(--border); color: var(--text);
          border-radius: var(--radius-sm); transition: background var(--dur-fast) ease;
        }
        .reseller-action:last-child { border-bottom: none; }
        .reseller-action:hover { background: var(--accent-soft); }
        .reseller-action__icon {
          width: 38px; height: 38px; border-radius: var(--radius-sm);
          background: var(--accent-soft); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border: 1px solid var(--accent-border);
        }
        .reseller-action__title { font-weight: 700; font-size: 0.9rem; }
        .reseller-action__hint { font-size: 0.78rem; color: var(--text-dim); margin-top: 1px; }
        .reseller-action__arrow { margin-left: auto; color: var(--text-faint); flex-shrink: 0; display: flex; }

        @media (max-width: 760px) {
          .reseller-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="fade-in-up">
        <span className="reseller-header__eyebrow">
          <Icon name="storefront" size={13} />
          Reseller
        </span>
        <h1>Reseller dashboard</h1>
        <div className="reseller-status-row">
          <span className={`badge ${statusBadgeClass(data.status)}`}>{data.status}</span>
          <span className="reseller-status-chip">
            <Icon name="calendar_month" size={13} />
            Approved {data.approvedAt ? new Date(data.approvedAt).toLocaleDateString() : '—'}
          </span>
        </div>
      </header>

      <div className="reseller-grid">
        <div className="reseller-main">
          <div className="card reseller-profit-card hover-lift fade-in-up delay-1">
            <div className="reseller-profit-card__icon">
              <Icon name="trending_up" size={20} />
            </div>
            <span className="stat-card__label">Total profit</span>
            <span className="reseller-profit-card__value">{fmtGhc(data.totalProfitGhc)}</span>

            <div className="reseller-breakdown">
              <div className="reseller-breakdown__item">
                <span className="reseller-breakdown__label">Revenue</span>
                <span className="reseller-breakdown__value">{fmtGhc(data.totalRevenueGhc)}</span>
              </div>
              <div className="reseller-breakdown__item">
                <span className="reseller-breakdown__label">Cost</span>
                <span className="reseller-breakdown__value">{fmtGhc(data.totalCostGhc)}</span>
              </div>
            </div>
          </div>

          <div className="grid-stats fade-in-up delay-2">
            <div className="stat-card hover-lift">
              <div className="stat-card__icon">
                <Icon name="account_balance_wallet" size={20} />
              </div>
              <span className="stat-card__label">Wallet balance</span>
              <span className="stat-card__value">{fmtGhc(data.walletBalanceGhc)}</span>
            </div>
            <div className="stat-card hover-lift">
              <div className="stat-card__icon">
                <Icon name="receipt_long" size={20} />
              </div>
              <span className="stat-card__label">Total orders</span>
              <span className="stat-card__value">{data.totalOrders}</span>
            </div>
          </div>
        </div>

        <div className="reseller-aside fade-in-up delay-3">
          <div className="card">
            <h2 style={{ marginBottom: 4 }}>Quick actions</h2>
            <p className="muted" style={{ fontSize: '0.85rem' }}>Buy wholesale and deliver instantly.</p>

            <Link className="btn btn--primary btn--block" to="/reseller/buy" style={{ marginTop: 14 }}>
              <Icon name="sell" size={18} />
              Sell a bundle
            </Link>

            <div className="reseller-actions">
              {QUICK_ACTIONS.map((action) => (
                <Link className="reseller-action" to={action.to} key={action.to}>
                  <span className="reseller-action__icon">
                    <Icon name={action.icon} size={18} />
                  </span>
                  <span>
                    <div className="reseller-action__title">{action.label}</div>
                    <div className="reseller-action__hint">{action.hint}</div>
                  </span>
                  <span className="reseller-action__arrow">
                    <Icon name="chevron_right" size={18} />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}