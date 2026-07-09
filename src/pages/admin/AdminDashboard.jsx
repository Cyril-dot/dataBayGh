import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import Spinner from '../../components/Spinner';
import Icon from '../../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

const attentionItems = (data) => [
  {
    to: '/admin/resellers',
    icon: 'fact_check',
    label: 'Reseller applications',
    hint: 'Approve or reject new resellers',
    count: data.pendingResellerApplications ?? 0,
  },
  {
    to: '/admin/payouts',
    icon: 'request_quote',
    label: 'Payout requests',
    hint: 'Review and release pending payouts',
    count: data.pendingPayouts ?? 0,
  },
];

export default function AdminDashboard() {
  const notify = useNotify();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.admin
      .getDashboard()
      .then(setData)
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load the admin dashboard.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <Spinner label="Loading platform dashboard…" />;
  if (!data) return null;

  const items = attentionItems(data);
  const pendingTotal = items.reduce((sum, item) => sum + item.count, 0);

  return (
    <div className="stack-lg">
      {/* Page-specific layout styles — shares tokens/animations from the global stylesheet */}
      <style>{`
        .admin-header__eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }
        .admin-status-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .admin-status-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--surface-raised); border: 1px solid var(--border);
          color: var(--text-faint); padding: 4px 10px; border-radius: 999px;
          font-size: 0.72rem; font-weight: 600;
        }

        .admin-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: start; }
        .admin-main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .admin-aside { display: flex; flex-direction: column; gap: 16px; }

        .admin-revenue-card {
          border-color: rgba(245,158,11,0.3);
          background: linear-gradient(160deg, var(--surface) 0%, var(--surface-raised) 100%);
          position: relative; overflow: hidden;
        }
        .admin-revenue-card::after {
          content: '';
          position: absolute; top: -60px; right: -60px;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, var(--gold-soft) 0%, transparent 70%);
          pointer-events: none;
        }
        .admin-revenue-card__icon {
          width: 38px; height: 38px; border-radius: var(--radius-sm);
          background: var(--gold-soft); color: var(--gold);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 8px; border: 1px solid rgba(245,158,11,0.25);
        }
        .admin-revenue-card__value {
          font-family: var(--font-mono); font-weight: 700;
          font-size: clamp(1.8rem, 4vw, 2.3rem); color: var(--gold); margin-top: 2px;
        }
        .admin-breakdown {
          display: flex; gap: 24px; flex-wrap: wrap;
          margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border);
        }
        .admin-breakdown__item { display: flex; flex-direction: column; gap: 3px; }
        .admin-breakdown__label {
          font-size: 0.68rem; text-transform: uppercase; letter-spacing: 0.06em;
          color: var(--text-faint); font-weight: 700;
        }
        .admin-breakdown__value { font-family: var(--font-mono); font-weight: 700; font-size: 0.92rem; }

        .admin-attention-list { display: flex; flex-direction: column; margin-top: 14px; }
        .admin-attention-item {
          display: flex; align-items: center; gap: 12px; padding: 11px 4px;
          border-bottom: 1px solid var(--border); color: var(--text);
          border-radius: var(--radius-sm); transition: background var(--dur-fast) ease;
        }
        .admin-attention-item:last-child { border-bottom: none; }
        .admin-attention-item:hover { background: var(--accent-soft); }
        .admin-attention-item__icon {
          width: 38px; height: 38px; border-radius: var(--radius-sm);
          background: var(--accent-soft); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border: 1px solid var(--accent-border);
        }
        .admin-attention-item__title { font-weight: 700; font-size: 0.9rem; }
        .admin-attention-item__hint { font-size: 0.78rem; color: var(--text-dim); margin-top: 1px; }
        .admin-attention-item__count {
          margin-left: auto; flex-shrink: 0;
          font-family: var(--font-mono); font-weight: 700; font-size: 0.82rem;
          padding: 2px 9px; border-radius: 999px;
        }
        .admin-attention-item__count--warn { background: rgba(245,158,11,0.15); color: var(--gold); }
        .admin-attention-item__count--clear { background: var(--surface-raised); color: var(--text-faint); }

        @media (max-width: 760px) {
          .admin-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <header className="fade-in-up">
        <span className="admin-header__eyebrow">
          <Icon name="admin_panel_settings" size={13} />
          Admin
        </span>
        <h1>Platform overview</h1>
        <div className="admin-status-row">
          <span className={`badge ${pendingTotal > 0 ? 'badge--warn' : 'badge--good'}`}>
            {pendingTotal > 0 ? `${pendingTotal} item${pendingTotal === 1 ? '' : 's'} need attention` : 'All caught up'}
          </span>
          <span className="admin-status-chip">
            <Icon name="group" size={13} />
            {data.totalUsers} users
          </span>
          <span className="admin-status-chip">
            <Icon name="storefront" size={13} />
            {data.totalResellers} resellers
          </span>
        </div>
      </header>

      <div className="admin-grid">
        <div className="admin-main">
          <div className="card admin-revenue-card hover-lift fade-in-up delay-1">
            <div className="admin-revenue-card__icon">
              <Icon name="payments" size={20} />
            </div>
            <span className="stat-card__label">Total revenue</span>
            <span className="admin-revenue-card__value">{fmtGhc(data.totalRevenueGhc)}</span>

            <div className="admin-breakdown">
              <div className="admin-breakdown__item">
                <span className="admin-breakdown__label">Wallet liabilities</span>
                <span className="admin-breakdown__value">{fmtGhc(data.totalWalletLiabilitiesGhc)}</span>
              </div>
              <div className="admin-breakdown__item">
                <span className="admin-breakdown__label">Pending payout value</span>
                <span className="admin-breakdown__value">{fmtGhc(data.totalPendingPayoutsGhc)}</span>
              </div>
            </div>
          </div>

          <div className="grid-stats fade-in-up delay-2">
            <div className="stat-card hover-lift">
              <div className="stat-card__icon">
                <Icon name="group" size={20} />
              </div>
              <span className="stat-card__label">Total users</span>
              <span className="stat-card__value">{data.totalUsers}</span>
            </div>
            <div className="stat-card hover-lift">
              <div className="stat-card__icon">
                <Icon name="storefront" size={20} />
              </div>
              <span className="stat-card__label">Total resellers</span>
              <span className="stat-card__value">{data.totalResellers}</span>
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

        <div className="admin-aside fade-in-up delay-3">
          <div className="card">
            <h2 style={{ marginBottom: 4 }}>Needs attention</h2>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              {pendingTotal > 0 ? 'Items waiting on a decision.' : 'Nothing pending right now.'}
            </p>

            <div className="admin-attention-list">
              {items.map((item) => (
                <Link className="admin-attention-item" to={item.to} key={item.to}>
                  <span className="admin-attention-item__icon">
                    <Icon name={item.icon} size={18} />
                  </span>
                  <span>
                    <div className="admin-attention-item__title">{item.label}</div>
                    <div className="admin-attention-item__hint">{item.hint}</div>
                  </span>
                  <span
                    className={`admin-attention-item__count ${
                      item.count > 0 ? 'admin-attention-item__count--warn' : 'admin-attention-item__count--clear'
                    }`}
                  >
                    {item.count}
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