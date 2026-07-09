import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/api';
import { useNotify } from '../context/NotificationContext';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

const QUICK_AMOUNTS = [20, 50, 100, 200];

export default function Wallet() {
  const { balance, setBalance } = useOutletContext() || {};
  const notify = useNotify();

  const [amount, setAmount] = useState('');
  const [busy, setBusy] = useState(false);
  const [pendingTopUp, setPendingTopUp] = useState(null);
  const [verifying, setVerifying] = useState(false);

  const [txns, setTxns] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingTxns, setLoadingTxns] = useState(true);

  const loadTransactions = (p = 0) => {
    setLoadingTxns(true);
    api.wallet
      .getTransactions(p, 10)
      .then((data) => {
        setTxns(data.content);
        setTotalPages(data.totalPages);
        setPage(data.number);
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load transactions.')))
      .finally(() => setLoadingTxns(false));
  };

  useEffect(() => {
    loadTransactions(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleInitiate = async (e) => {
    e.preventDefault();
    const value = Number(amount);
    if (!value || value < 1) {
      notify.error('Enter an amount of at least GH₵ 1.');
      return;
    }
    setBusy(true);
    try {
      const data = await api.orders.initiateTopUp({ amount: value });
      setPendingTopUp(data);

      // Redirect to Paystack checkout
      if (data.authorizationUrl) {
        notify.success('Redirecting to Paystack…');
        window.location.href = data.authorizationUrl;
      } else {
        notify.error('No Paystack checkout URL returned. Contact support.');
      }
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not initiate top-up.'));
    } finally {
      setBusy(false);
    }
  };

  const handleVerify = async () => {
    if (!pendingTopUp?.paystackReference) return;
    setVerifying(true);
    try {
      const data = await api.orders.verifyTopUp({ paystackRef: pendingTopUp.paystackReference });
      setBalance?.(data.balance);
      notify.success('Wallet topped up successfully!');
      setPendingTopUp(null);
      setAmount('');
      loadTransactions(0);
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Payment not confirmed yet. Try again shortly.'));
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="stack-lg">
      <style>{`
        .wallet-header__eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }

        .wallet-balance-card {
          display: flex; flex-direction: column; gap: 4px;
          border-color: var(--accent-border);
          background: linear-gradient(160deg, var(--surface) 0%, var(--surface-raised) 100%);
          position: relative; overflow: hidden;
        }
        .wallet-balance-card::after {
          content: '';
          position: absolute; top: -60px; right: -60px;
          width: 200px; height: 200px; border-radius: 50%;
          background: radial-gradient(circle, var(--accent-glow) 0%, transparent 70%);
          pointer-events: none;
        }
        .wallet-balance-card__value {
          font-family: var(--font-mono); font-weight: 700;
          font-size: clamp(1.9rem, 4vw, 2.5rem);
          color: var(--text); margin-top: 2px;
        }
        .wallet-balance-card__note { font-size: 0.82rem; margin-top: 8px; }

        .amount-chip-row { display: flex; gap: 8px; flex-wrap: wrap; }

        .ref-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin: 4px 0; }
        .ref-row code {
          background: var(--surface-raised); border: 1px solid var(--border);
          padding: 3px 8px; border-radius: var(--radius-sm); font-size: 0.85rem;
          word-break: break-all;
        }

        .wallet-verify-actions { flex-wrap: wrap; gap: 10px; }

        .txn-table-view { display: block; }
        .txn-list-view { display: none; flex-direction: column; gap: 10px; margin-top: 4px; }

        .txn-row {
          border: 1px solid var(--border); border-radius: var(--radius);
          padding: 12px 14px; background: var(--surface-raised);
        }
        .txn-row__top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .txn-row__amount { font-family: var(--font-mono); font-weight: 700; font-size: 0.98rem; }
        .txn-row__amount--pos { color: #34D399; }
        .txn-row__amount--neg { color: #FF8090; }
        .txn-row__desc { font-size: 0.86rem; color: var(--text); margin-top: 8px; }
        .txn-row__meta {
          display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap;
          font-size: 0.76rem; color: var(--text-faint); margin-top: 8px;
        }
        .txn-row__balance { font-size: 0.8rem; color: var(--text-dim); margin-top: 6px; }

        @media (max-width: 720px) {
          .txn-table-view { display: none; }
          .txn-list-view { display: flex; }
        }

        @media (max-width: 480px) {
          .amount-chip-row .chip { flex: 1 1 calc(50% - 4px); text-align: center; }
        }
      `}</style>

      <header className="fade-in-up">
        <span className="wallet-header__eyebrow">
          <Icon name="account_balance_wallet" size={13} />
          Wallet
        </span>
        <h1>Wallet</h1>
        <p className="muted">Fund your wallet with Paystack, then spend it on bundles instantly.</p>
      </header>

      <div className="grid-2">
        <div className="card wallet-balance-card hover-lift fade-in-up delay-1">
          <div className="stat-card__icon">
            <Icon name="account_balance_wallet" size={20} />
          </div>
          <span className="stat-card__label">Current balance</span>
          <span className="wallet-balance-card__value">{fmtGhc(balance)}</span>
          <p className="muted wallet-balance-card__note">Spendable instantly on any bundle, any network.</p>
        </div>

        <div className="card fade-in-up delay-2">
          <h2>Top up wallet</h2>
          {!pendingTopUp ? (
            <form onSubmit={handleInitiate} className="form">
              <div className="form__field">
                <span>Quick amounts</span>
                <div className="amount-chip-row">
                  {QUICK_AMOUNTS.map((v) => (
                    <button
                      type="button"
                      key={v}
                      className={`chip${Number(amount) === v ? ' chip--active' : ''}`}
                      onClick={() => setAmount(String(v))}
                    >
                      GH₵{v}
                    </button>
                  ))}
                </div>
              </div>

              <label className="form__field">
                <span>Amount (GH₵)</span>
                <input
                  type="number"
                  min="1"
                  max="10000"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50"
                />
              </label>

              <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
                <Icon name="add_card" size={18} />
                {busy ? 'Redirecting to Paystack…' : 'Top up with Paystack'}
              </button>
            </form>
          ) : (
            <div className="result-card scale-in">
              <p className="result-card__amount">GH₵ {Number(pendingTopUp.amountGhc).toFixed(2)}</p>
              <div className="ref-row">
                <span className="muted">Reference:</span>
                <code>{pendingTopUp.paystackReference}</code>
              </div>
              <p className="muted">
                If you were not redirected automatically,{' '}
                <a
                  href={pendingTopUp.authorizationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent-bright)', fontWeight: 600 }}
                >
                  click here to pay on Paystack
                </a>
                . Once done, verify below.
              </p>
              <div className="flex-row wallet-verify-actions">
                <button className="btn btn--primary" onClick={handleVerify} disabled={verifying}>
                  <Icon name="verified" size={17} />
                  {verifying ? 'Verifying…' : "I've paid — verify now"}
                </button>
                <button
                  className="btn btn--ghost"
                  onClick={() => { setPendingTopUp(null); setAmount(''); }}
                  disabled={verifying}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="card fade-in-up delay-3">
        <div className="card__header">
          <h2>Transaction history</h2>
        </div>

        {loadingTxns && <Spinner label="Loading transactions…" />}
        {!loadingTxns && (!txns || txns.length === 0) && (
          <EmptyState title="No transactions yet" hint="Top-ups and purchases will appear here." />
        )}
        {!loadingTxns && txns && txns.length > 0 && (
          <>
            {/* Wide-screen table */}
            <div className="table-wrap txn-table-view">
              <table className="table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Amount</th>
                    <th>Balance after</th>
                    <th>Reference</th>
                    <th>Description</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {txns.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className={`badge ${t.amount < 0 ? 'badge--bad' : 'badge--good'}`}>{t.type}</span>
                      </td>
                      <td className="mono">{fmtGhc(t.amount)}</td>
                      <td className="mono">{fmtGhc(t.balanceAfter)}</td>
                      <td className="mono muted">{t.reference}</td>
                      <td>{t.description}</td>
                      <td className="muted">{new Date(t.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Narrow-screen stacked cards */}
            <div className="txn-list-view">
              {txns.map((t) => (
                <div className="txn-row" key={t.id}>
                  <div className="txn-row__top">
                    <span className={`badge ${t.amount < 0 ? 'badge--bad' : 'badge--good'}`}>{t.type}</span>
                    <span className={`txn-row__amount ${t.amount < 0 ? 'txn-row__amount--neg' : 'txn-row__amount--pos'}`}>
                      {fmtGhc(t.amount)}
                    </span>
                  </div>
                  {t.description && <div className="txn-row__desc">{t.description}</div>}
                  <div className="txn-row__meta">
                    <span className="mono">{t.reference}</span>
                    <span>{new Date(t.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="txn-row__balance">
                    Balance after: <span className="mono">{fmtGhc(t.balanceAfter)}</span>
                  </div>
                </div>
              ))}
            </div>

            <Pagination page={page} totalPages={totalPages} onChange={loadTransactions} />
          </>
        )}
      </div>
    </div>
  );
}