import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import Icon from '../../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

const PAYOUT_STEPS = [
  { icon: 'send', title: 'Request a payout', text: 'Enter an amount and your mobile money number.' },
  { icon: 'fact_check', title: 'Reviewed by admin', text: 'Most requests are reviewed within 24–48 hours.' },
  { icon: 'account_balance_wallet', title: 'Sent to your MoMo', text: 'Funds are paid out directly once approved.' },
];

export default function ResellerPayouts() {
  const { balance } = useOutletContext() || {};
  const notify = useNotify();
  const [form, setForm] = useState({ amount: '', mobileMoneyNumber: '', network: 'MTN' });
  const [busy, setBusy] = useState(false);

  const [payouts, setPayouts] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = (p = 0) => {
    setLoading(true);
    api.reseller
      .getPayoutHistory(p, 10)
      .then((data) => {
        setPayouts(data.content);
        setTotalPages(data.totalPages);
        setPage(data.number);
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load payout history.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.reseller.requestPayout({ ...form, amount: Number(form.amount) });
      notify.success('Payout requested — pending admin review.');
      setForm({ amount: '', mobileMoneyNumber: '', network: form.network });
      load(0);
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not request a payout. Check your balance and reseller status.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack-lg">
      {/* Page-specific layout styles — shares tokens/animations from the global stylesheet */}
      <style>{`
        .po-header__eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }
        .po-balance-chip {
          display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap;
          background: var(--green-soft); border: 1px solid rgba(16,185,129,0.3);
          color: #34D399; padding: 7px 14px; border-radius: 999px;
          font-size: 0.8rem; font-weight: 700; margin: 10px 0 16px;
        }
        .po-balance-chip button {
          background: none; border: none; color: inherit; font-weight: 800;
          text-decoration: underline; cursor: pointer; padding: 0; font-size: inherit;
        }

        .po-steps { display: flex; flex-direction: column; margin-top: 4px; }
        .po-step { display: flex; gap: 12px; padding: 12px 2px; border-bottom: 1px dashed var(--border); }
        .po-step:last-child { border-bottom: none; padding-bottom: 0; }
        .po-step__icon {
          width: 34px; height: 34px; border-radius: var(--radius-sm);
          background: var(--accent-soft); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0; border: 1px solid var(--accent-border);
        }
        .po-step__title { font-size: 0.86rem; font-weight: 700; margin-bottom: 2px; }
        .po-step__text { font-size: 0.78rem; color: var(--text-dim); line-height: 1.5; }

        /* Payout history: table on wide screens, stacked cards on narrow */
        .po-table-view { display: block; }
        .po-list-view { display: none; flex-direction: column; gap: 10px; margin-top: 4px; }
        .po-row { border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px; background: var(--surface-raised); }
        .po-row__top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .po-row__amount { font-family: var(--font-mono); font-weight: 700; font-size: 0.98rem; }
        .po-row__meta { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 0.82rem; color: var(--text-dim); margin-top: 8px; }
        .po-row__note { font-size: 0.8rem; color: var(--text-faint); margin-top: 6px; font-style: italic; }
        .po-row__date { font-size: 0.74rem; color: var(--text-faint); margin-top: 8px; }

        @media (max-width: 700px) {
          .po-table-view { display: none; }
          .po-list-view { display: flex; }
        }
      `}</style>

      <header className="fade-in-up">
        <span className="po-header__eyebrow">
          <Icon name="payments" size={13} />
          Reseller
        </span>
        <h1>Payouts</h1>
        <p className="muted">Cash out your reseller earnings straight to mobile money.</p>
      </header>

      <div className="grid-2">
        <div className="card fade-in-up delay-1">
          <h2>Request a payout</h2>
          {balance !== undefined && (
            <div className="po-balance-chip">
              <Icon name="account_balance_wallet" size={14} />
              Available: {fmtGhc(balance)}
              <button type="button" onClick={() => setForm((f) => ({ ...f, amount: String(balance) }))}>
                Use max
              </button>
            </div>
          )}
          <form onSubmit={handleSubmit} className="form">
            <label className="form__field">
              <span>Amount (GH₵)</span>
              <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={update('amount')} />
            </label>
            <label className="form__field">
              <span>Mobile money number</span>
              <input required value={form.mobileMoneyNumber} onChange={update('mobileMoneyNumber')} placeholder="0241234567" />
            </label>
            <label className="form__field">
              <span>Network</span>
              <select value={form.network} onChange={update('network')}>
                <option value="MTN">MTN</option>
                <option value="TELECEL">Telecel</option>
                <option value="AIRTELTIGO">AirtelTigo</option>
              </select>
            </label>
            <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
              <Icon name="send" size={16} />
              {busy ? 'Requesting…' : 'Request payout'}
            </button>
          </form>
        </div>

        <div className="card fade-in-up delay-2">
          <h2 style={{ marginBottom: 4 }}>How payouts work</h2>
          <div className="po-steps">
            {PAYOUT_STEPS.map((s) => (
              <div className="po-step" key={s.title}>
                <div className="po-step__icon">
                  <Icon name={s.icon} size={16} />
                </div>
                <div>
                  <div className="po-step__title">{s.title}</div>
                  <div className="po-step__text">{s.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card fade-in-up delay-3">
        <h2>Payout history</h2>
        {loading && <Spinner label="Loading payouts…" />}
        {!loading && (!payouts || payouts.length === 0) && (
          <EmptyState title="No payouts yet" hint="Your payout requests will be listed here." />
        )}
        {!loading && payouts && payouts.length > 0 && (
          <>
            <div className="table-wrap po-table-view">
              <table className="table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Mobile money</th>
                    <th>Network</th>
                    <th>Status</th>
                    <th>Admin note</th>
                    <th>Requested</th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{fmtGhc(p.amount)}</td>
                      <td className="mono">{p.mobileMoneyNumber}</td>
                      <td>{p.network}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="muted">{p.adminNote || '—'}</td>
                      <td className="muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="po-list-view">
              {payouts.map((p) => (
                <div className="po-row" key={p.id}>
                  <div className="po-row__top">
                    <span className="po-row__amount">{fmtGhc(p.amount)}</span>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="po-row__meta">
                    <span>{p.network}</span>
                    <span className="mono">{p.mobileMoneyNumber}</span>
                  </div>
                  {p.adminNote && <div className="po-row__note">"{p.adminNote}"</div>}
                  <div className="po-row__date">{new Date(p.createdAt).toLocaleDateString()}</div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={load} />
          </>
        )}
      </div>
    </div>
  );
}