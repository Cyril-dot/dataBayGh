import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import NetworkBadge from '../../components/NetworkBadge';
import StatusBadge from '../../components/StatusBadge';
import Pagination from '../../components/Pagination';
import Icon from '../../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

const maskName = (name) => name ?? '—';

export default function AffiliateDashboard() {
  const notify = useNotify();

  // ── Activate state ─────────────────────────────────────────────
  const [activateData, setActivateData] = useState(null);  // { affiliateCode, referralUrl, active }
  const [activating,   setActivating]   = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  // ── Dashboard stats ────────────────────────────────────────────
  const [dashboard, setDashboard] = useState(null);
  const [dashLoading, setDashLoading] = useState(false);

  // ── Commission history ─────────────────────────────────────────
  const [commissions,  setCommissions]  = useState(null);
  const [commPage,     setCommPage]     = useState(0);
  const [commTotal,    setCommTotal]    = useState(0);
  const [commLoading,  setCommLoading]  = useState(false);

  // ── Payout request + history ────────────────────────────────────
  // NOTE: payouts draw ONLY from availableEarningsGhc (commission earned),
  // never from the user's wallet balance — these are separate balances.
  const [payoutForm, setPayoutForm] = useState({ amount: '', mobileMoneyNumber: '', network: 'MTN' });
  const [payoutBusy, setPayoutBusy] = useState(false);
  const [payouts, setPayouts] = useState(null);
  const [payoutPage, setPayoutPage] = useState(0);
  const [payoutTotalPages, setPayoutTotalPages] = useState(0);
  const [payoutLoading, setPayoutLoading] = useState(false);

  // ── Copy state ─────────────────────────────────────────────────
  const [copied, setCopied] = useState(false);

  // ── On mount: try loading dashboard (works if already active) ──
  useEffect(() => {
    loadDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadDashboard = () => {
    setDashLoading(true);
    api.affiliate
      .getDashboard()
      .then((data) => {
        setDashboard(data);
        // Reconstruct activateData from dashboard fields
        setActivateData({
          affiliateCode: data.affiliateCode,
          referralUrl:   data.referralUrl,
          active:        true,
        });
        loadCommissions(0);
        loadPayouts(0);
      })
      .catch(() => {
        // Not yet active — that's fine, show the activate prompt
        setDashboard(null);
        setActivateData(null);
      })
      .finally(() => setDashLoading(false));
  };

  const loadCommissions = (p = 0) => {
    setCommLoading(true);
    api.affiliate
      .getCommissionHistory(p, 10)
      .then((data) => {
        setCommissions(data.content);
        setCommTotal(data.totalPages);
        setCommPage(data.number);
      })
      .catch(() => setCommissions([]))
      .finally(() => setCommLoading(false));
  };

  const loadPayouts = (p = 0) => {
    setPayoutLoading(true);
    api.affiliate
      .getPayoutHistory(p, 10)
      .then((data) => {
        setPayouts(data.content);
        setPayoutTotalPages(data.totalPages);
        setPayoutPage(data.number);
      })
      .catch(() => setPayouts([]))
      .finally(() => setPayoutLoading(false));
  };

  // ── Activate ───────────────────────────────────────────────────
  const handleActivate = async () => {
    setActivating(true);
    try {
      const data = await api.affiliate.activate();
      setActivateData(data);
      notify.success('Affiliate programme activated!');
      loadDashboard();
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not activate affiliate programme.'));
    } finally {
      setActivating(false);
    }
  };

  // ── Deactivate ─────────────────────────────────────────────────
  const handleDeactivate = async () => {
    if (!window.confirm('Deactivate your affiliate programme? Your code is kept — you can reactivate anytime.')) return;
    setDeactivating(true);
    try {
      await api.affiliate.deactivate();
      setActivateData((prev) => ({ ...prev, active: false }));
      setDashboard(null);
      setCommissions(null);
      setPayouts(null);
      notify.success('Affiliate programme deactivated.');
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not deactivate.'));
    } finally {
      setDeactivating(false);
    }
  };

  // ── Copy referral link ─────────────────────────────────────────
  const copyLink = () => {
    const url = activateData?.referralUrl ?? dashboard?.referralUrl ?? '';
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // ── Payout request ───────────────────────────────────────────────
  const updatePayoutForm = (key) => (e) =>
    setPayoutForm((f) => ({ ...f, [key]: e.target.value }));

  const handlePayoutSubmit = async (e) => {
    e.preventDefault();
    setPayoutBusy(true);
    try {
      await api.affiliate.requestPayout({ ...payoutForm, amount: Number(payoutForm.amount) });
      notify.success('Payout requested — pending admin review.');
      setPayoutForm({ amount: '', mobileMoneyNumber: '', network: payoutForm.network });
      loadPayouts(0);
      loadDashboard(); // refresh availableEarningsGhc, now reduced by the reserved amount
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not request a payout. Check your available earnings.'));
    } finally {
      setPayoutBusy(false);
    }
  };

  const isActive = activateData?.active === true;

  return (
    <div className="stack-lg">
      <style>{`
        .af-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: .72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }

        /* Activate card */
        .af-activate-card {
          border: 1.5px dashed var(--border-bright);
          background: linear-gradient(135deg, var(--surface) 0%, var(--surface-raised) 100%);
          text-align: center; padding: 40px 24px;
        }
        .af-activate-card__icon {
          width: 56px; height: 56px; border-radius: 14px; margin: 0 auto 16px;
          background: var(--accent-soft); border: 1px solid var(--accent-border);
          color: var(--accent-bright); display: flex; align-items: center; justify-content: center;
        }
        .af-activate-card h2 { margin-bottom: 8px; }
        .af-activate-card p  { color: var(--text-dim); font-size: .9rem; max-width: 400px; margin: 0 auto 24px; line-height: 1.6; }

        /* How it works steps */
        .af-steps { display: grid; grid-template-columns: repeat(3,1fr); gap: 14px; }
        @media (max-width: 620px) { .af-steps { grid-template-columns: 1fr; } }
        .af-step {
          padding: 16px; border-radius: 12px; background: var(--surface-raised);
          border: 1px solid var(--border); text-align: center;
        }
        .af-step__icon {
          width: 38px; height: 38px; border-radius: 10px; margin: 0 auto 10px;
          background: var(--accent-soft); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          border: 1px solid var(--accent-border);
        }
        .af-step__title { font-weight: 700; font-size: .88rem; margin-bottom: 4px; }
        .af-step__text  { font-size: .76rem; color: var(--text-dim); line-height: 1.5; }

        /* Stat grid */
        .af-stat-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px,1fr)); gap: 14px; }
        .af-stat {
          background: var(--surface-raised); border: 1px solid var(--border);
          border-radius: 12px; padding: 16px;
        }
        .af-stat__label {
          font-size: .68rem; text-transform: uppercase; letter-spacing: .07em;
          color: var(--text-faint); font-weight: 700; margin-bottom: 4px;
        }
        .af-stat__value { font-family: var(--font-mono); font-weight: 700; font-size: 1.5rem; }
        .af-stat--highlight { border-color: rgba(245,158,11,.35); }
        .af-stat--highlight .af-stat__value { color: var(--gold, #F59E0B); }

        /* Referral link box */
        .af-link-box {
          display: flex; align-items: center; gap: 10px; flex-wrap: wrap;
          padding: 12px 14px; background: var(--surface-raised);
          border: 1px solid var(--border); border-radius: 10px;
        }
        .af-link-box__url {
          flex: 1; font-family: var(--font-mono); font-size: .76rem;
          color: var(--text-dim); word-break: break-all;
        }
        .af-copy-btn {
          display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
          padding: 7px 14px; border-radius: 8px; font-size: .78rem; font-weight: 700;
          border: 1px solid var(--accent-border); background: var(--accent-soft);
          color: var(--accent-bright); cursor: pointer; transition: background .15s;
          white-space: nowrap;
        }
        .af-copy-btn:hover { background: rgba(44,123,229,.25); }
        .af-copy-btn--done { border-color: rgba(16,185,129,.4); background: rgba(16,185,129,.1); color: #10B981; }

        /* Code badge */
        .af-code-badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 999px; font-family: var(--font-mono);
          font-weight: 700; font-size: .82rem;
          background: var(--accent-soft); border: 1px solid var(--accent-border);
          color: var(--accent-bright);
        }

        /* Status badge */
        .af-status {
          display: inline-flex; align-items: center; gap: 5px;
          padding: 4px 10px; border-radius: 999px; font-size: .72rem; font-weight: 700;
        }
        .af-status--active   { background: rgba(16,185,129,.12); color: #10B981; border: 1px solid rgba(16,185,129,.3); }
        .af-status--inactive { background: rgba(255,107,107,.1);  color: #FF6B6B; border: 1px solid rgba(255,107,107,.25); }

        /* Deactivate btn */
        .af-deact-btn {
          display: inline-flex; align-items: center; gap: 6px; padding: 7px 14px;
          border-radius: 8px; font-size: .8rem; font-weight: 700; cursor: pointer;
          border: 1px solid rgba(255,107,107,.3); background: rgba(255,107,107,.08);
          color: #FF6B6B; transition: background .15s;
        }
        .af-deact-btn:hover:not(:disabled) { background: rgba(255,107,107,.16); }
        .af-deact-btn:disabled { opacity: .5; cursor: not-allowed; }

        /* Commission table */
        .af-reversed { text-decoration: line-through; opacity: .5; }

        /* Pagination */
        .af-pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 16px; }
        .af-page-btn {
          display: flex; align-items: center; gap: 4px; padding: 7px 14px;
          border-radius: 8px; font-size: .82rem; font-weight: 700;
          border: 1px solid var(--border); background: var(--surface-raised);
          color: var(--text-dim); cursor: pointer; transition: border-color .15s, color .15s;
        }
        .af-page-btn:hover:not(:disabled) { border-color: var(--accent-border); color: var(--accent-bright); }
        .af-page-btn:disabled { opacity: .4; cursor: not-allowed; }
        .af-page-info { font-size: .82rem; color: var(--text-faint); padding: 0 6px; }

        .af-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 20px; align-items: start; }
        @media (max-width: 760px) { .af-grid { grid-template-columns: 1fr; } }
        .af-aside { display: flex; flex-direction: column; gap: 16px; }

        .af-tip {
          display: flex; gap: 8px; font-size: .8rem; color: var(--text-dim);
          line-height: 1.55; padding: 10px 12px;
          background: var(--surface-raised); border: 1px solid var(--border); border-radius: 9px;
        }

        /* Payout form + history */
        .af-payout-balance-chip {
          display: inline-flex; align-items: center; gap: 8px; flex-wrap: wrap;
          background: var(--green-soft); border: 1px solid rgba(16,185,129,0.3);
          color: #34D399; padding: 7px 14px; border-radius: 999px;
          font-size: 0.8rem; font-weight: 700; margin: 10px 0 16px;
        }
        .af-payout-balance-chip button {
          background: none; border: none; color: inherit; font-weight: 800;
          text-decoration: underline; cursor: pointer; padding: 0; font-size: inherit;
        }
        .af-po-table-view { display: block; }
        .af-po-list-view { display: none; flex-direction: column; gap: 10px; margin-top: 4px; }
        .af-po-row { border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px; background: var(--surface-raised); }
        .af-po-row__top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .af-po-row__amount { font-family: var(--font-mono); font-weight: 700; font-size: 0.98rem; }
        .af-po-row__meta { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; font-size: 0.82rem; color: var(--text-dim); margin-top: 8px; }
        .af-po-row__note { font-size: 0.8rem; color: var(--text-faint); margin-top: 6px; font-style: italic; }
        .af-po-row__date { font-size: 0.74rem; color: var(--text-faint); margin-top: 8px; }
        @media (max-width: 700px) {
          .af-po-table-view { display: none; }
          .af-po-list-view { display: flex; }
        }
      `}</style>

      {/* ── Header ── */}
      <header className="fade-in-up">
        <span className="af-eyebrow">
          <Icon name="group_add" size={13} />
          Affiliate
        </span>
        <h1>Affiliate programme</h1>
        <p className="muted">Earn 2% commission on every order placed by users you refer.</p>
      </header>

      {/* ── Not yet active: activate prompt ── */}
      {!isActive && !dashLoading && (
        <>
          <div className="card af-activate-card fade-in-up delay-1">
            <div className="af-activate-card__icon">
              <Icon name="group_add" size={26} />
            </div>
            <h2>Earn while you share</h2>
            <p>
              Share your unique referral link. Every time someone you refer places an order,
              you earn <strong>2% commission</strong> — tracked in your own earnings balance,
              separate from your wallet, and paid out to mobile money on request.
            </p>
            <button
              className="btn btn--primary"
              onClick={handleActivate}
              disabled={activating}
              style={{ minWidth: 180 }}
            >
              <Icon name="rocket_launch" size={17} />
              {activating ? 'Activating…' : 'Activate affiliate'}
            </button>
          </div>

          {/* How it works */}
          <div className="fade-in-up delay-2">
            <h2 style={{ marginBottom: 14 }}>How it works</h2>
            <div className="af-steps">
              {[
                { icon: 'share',         title: 'Share your link',    text: 'Send your unique referral URL to friends, family, or your audience.' },
                { icon: 'person_add',    title: 'They sign up',       text: 'Anyone who registers through your link is tagged to your account.' },
                { icon: 'trending_up',   title: 'Earn 2% commission', text: 'Every order they place earns you 2%, added to your earnings balance — cash it out anytime.' },
              ].map((s) => (
                <div className="af-step" key={s.title}>
                  <div className="af-step__icon"><Icon name={s.icon} size={18} /></div>
                  <div className="af-step__title">{s.title}</div>
                  <div className="af-step__text">{s.text}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {dashLoading && <Spinner label="Loading affiliate dashboard…" />}

      {/* ── Active: full dashboard ── */}
      {isActive && dashboard && !dashLoading && (
        <>
          {/* Status + code + deactivate */}
          <div className="card fade-in-up delay-1" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <span className="af-status af-status--active">
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10B981', display: 'inline-block' }} />
              Active
            </span>
            <span className="af-code-badge">
              <Icon name="tag" size={12} />
              {activateData?.affiliateCode ?? dashboard.affiliateCode}
            </span>
            <span style={{ flex: 1 }} />
            <button
              className="af-deact-btn"
              onClick={handleDeactivate}
              disabled={deactivating}
            >
              <Icon name="pause_circle" size={15} />
              {deactivating ? 'Deactivating…' : 'Deactivate'}
            </button>
          </div>

          <div className="af-grid">
            <div className="stack-lg" style={{ gap: 16 }}>

              {/* Stats */}
              <div className="af-stat-grid fade-in-up delay-1">
                <div className="af-stat af-stat--highlight">
                  <div className="af-stat__label">Total earned</div>
                  <div className="af-stat__value">{fmtGhc(dashboard.totalCommissionEarnedGhc)}</div>
                </div>
                <div className="af-stat">
                  <div className="af-stat__label">This month</div>
                  <div className="af-stat__value">{fmtGhc(dashboard.thisMonthCommissionGhc)}</div>
                </div>
                <div className="af-stat">
                  <div className="af-stat__label">Total sign-ups</div>
                  <div className="af-stat__value">{dashboard.totalSignUps}</div>
                </div>
                <div className="af-stat">
                  <div className="af-stat__label">Active buyers</div>
                  <div className="af-stat__value">{dashboard.referredUsersWithOrders}</div>
                </div>
              </div>

              {/* Commission history */}
              <div className="card fade-in-up delay-2" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '16px 18px', borderBottom: '1px solid var(--border)' }}>
                  <h2 style={{ margin: 0, fontSize: '1rem' }}>Commission history</h2>
                </div>

                {commLoading && <div style={{ padding: 24 }}><Spinner label="Loading commissions…" /></div>}

                {!commLoading && (!commissions || commissions.length === 0) && (
                  <div style={{ padding: 24 }}>
                    <EmptyState
                      title="No commissions yet"
                      hint="Share your referral link — commissions appear here when referred users place orders."
                    />
                  </div>
                )}

                {!commLoading && commissions && commissions.length > 0 && (
                  <div style={{ padding: '0 18px 18px' }}>
                    <div className="table-wrap">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Date</th>
                            <th>Referred user</th>
                            <th>Bundle</th>
                            <th>Commission</th>
                            <th>Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {commissions.map((c) => (
                            <tr key={c.id} className={c.reversed ? 'af-reversed' : ''}>
                              <td className="muted" style={{ fontSize: '.78rem', whiteSpace: 'nowrap' }}>
                                {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : '—'}
                              </td>
                              <td>{maskName(c.referredUserMasked)}</td>
                              <td>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                  <NetworkBadge network={c.orderNetwork} />
                                  <span style={{ fontSize: '.82rem' }}>{c.orderCapacityGb}GB</span>
                                </div>
                              </td>
                              <td className="mono" style={{ fontWeight: 700 }}>
                                {fmtGhc(c.commissionGhc)}
                              </td>
                              <td>
                                {c.reversed
                                  ? <span className="badge badge--bad">Reversed</span>
                                  : <span className="badge badge--good">Earned</span>
                                }
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {commTotal > 1 && (
                      <div className="af-pagination">
                        <button
                          className="af-page-btn"
                          disabled={commPage === 0}
                          onClick={() => loadCommissions(commPage - 1)}
                        >
                          <Icon name="chevron_left" size={16} />Prev
                        </button>
                        <span className="af-page-info">Page {commPage + 1} of {commTotal}</span>
                        <button
                          className="af-page-btn"
                          disabled={commPage >= commTotal - 1}
                          onClick={() => loadCommissions(commPage + 1)}
                        >
                          Next<Icon name="chevron_right" size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Payout request + history */}
              <div className="card fade-in-up delay-2">
                <h2>Request a payout</h2>
                <p className="muted" style={{ fontSize: '.85rem', marginBottom: 4 }}>
                  Cash out your earned commission to mobile money. This never touches your wallet balance.
                </p>
                <div className="af-payout-balance-chip">
                  <Icon name="savings" size={14} />
                  Available: {fmtGhc(dashboard.availableEarningsGhc)}
                  <button
                    type="button"
                    onClick={() => setPayoutForm((f) => ({ ...f, amount: String(dashboard.availableEarningsGhc) }))}
                  >
                    Use max
                  </button>
                </div>
                <form onSubmit={handlePayoutSubmit} className="form">
                  <label className="form__field">
                    <span>Amount (GH₵)</span>
                    <input
                      type="number" min="0.01" step="0.01" required
                      value={payoutForm.amount} onChange={updatePayoutForm('amount')}
                    />
                  </label>
                  <label className="form__field">
                    <span>Mobile money number</span>
                    <input
                      required value={payoutForm.mobileMoneyNumber}
                      onChange={updatePayoutForm('mobileMoneyNumber')} placeholder="0241234567"
                    />
                  </label>
                  <label className="form__field">
                    <span>Network</span>
                    <select value={payoutForm.network} onChange={updatePayoutForm('network')}>
                      <option value="MTN">MTN</option>
                      <option value="TELECEL">Telecel</option>
                      <option value="AIRTELTIGO">AirtelTigo</option>
                    </select>
                  </label>
                  <button className="btn btn--primary btn--block" type="submit" disabled={payoutBusy}>
                    <Icon name="send" size={16} />
                    {payoutBusy ? 'Requesting…' : 'Request payout'}
                  </button>
                </form>

                <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <h2 style={{ fontSize: '1rem', marginBottom: 8 }}>Payout history</h2>

                  {payoutLoading && <Spinner label="Loading payouts…" />}
                  {!payoutLoading && (!payouts || payouts.length === 0) && (
                    <EmptyState title="No payouts yet" hint="Your payout requests will be listed here." />
                  )}
                  {!payoutLoading && payouts && payouts.length > 0 && (
                    <>
                      <div className="table-wrap af-po-table-view">
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
                                <td><StatusBadge status={p.status} /></td>
                                <td className="muted">{p.adminNote || '—'}</td>
                                <td className="muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div className="af-po-list-view">
                        {payouts.map((p) => (
                          <div className="af-po-row" key={p.id}>
                            <div className="af-po-row__top">
                              <span className="af-po-row__amount">{fmtGhc(p.amount)}</span>
                              <StatusBadge status={p.status} />
                            </div>
                            <div className="af-po-row__meta">
                              <span>{p.network}</span>
                              <span className="mono">{p.mobileMoneyNumber}</span>
                            </div>
                            {p.adminNote && <div className="af-po-row__note">"{p.adminNote}"</div>}
                            <div className="af-po-row__date">{new Date(p.createdAt).toLocaleDateString()}</div>
                          </div>
                        ))}
                      </div>

                      <Pagination page={payoutPage} totalPages={payoutTotalPages} onChange={loadPayouts} />
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Aside ── */}
            <div className="af-aside fade-in-up delay-2">

              {/* Referral link */}
              <div className="card">
                <h2 style={{ marginBottom: 4, fontSize: '.95rem' }}>Your referral link</h2>
                <p className="muted" style={{ fontSize: '.78rem', marginBottom: 12 }}>
                  Share this — anyone who signs up through it is tagged to you.
                </p>
                <div className="af-link-box">
                  <span className="af-link-box__url">
                    {activateData?.referralUrl ?? dashboard.referralUrl}
                  </span>
                  <button
                    className={`af-copy-btn${copied ? ' af-copy-btn--done' : ''}`}
                    onClick={copyLink}
                  >
                    <Icon name={copied ? 'check' : 'content_copy'} size={13} />
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              {/* Available earnings — separate balance from wallet */}
              <div className="card">
                <h2 style={{ marginBottom: 4, fontSize: '.95rem' }}>Available earnings</h2>
                <p className="muted" style={{ fontSize: '.78rem', marginBottom: 8 }}>
                  This is your affiliate commission balance — separate from your wallet.
                  Request a payout below to cash it out.
                </p>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.4rem' }}>
                  {fmtGhc(dashboard.availableEarningsGhc)}
                </span>
              </div>

              {/* Tips */}
              <div className="af-tip">
                <Icon name="lightbulb" size={15} style={{ color: 'var(--accent-bright)', flexShrink: 0, marginTop: 1 }} />
                Commissions are added to your earnings balance instantly when a referred user's
                order is confirmed. If the order is refunded, the commission is reversed.
              </div>

              <div className="af-tip">
                <Icon name="info" size={15} style={{ color: 'var(--accent-bright)', flexShrink: 0, marginTop: 1 }} />
                You cannot earn commission on your own purchases (self-referral is blocked server-side).
              </div>

            </div>
          </div>
        </>
      )}

      {/* ── Previously active but now deactivated ── */}
      {activateData && !isActive && !dashLoading && (
        <div className="card fade-in-up" style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <span className="af-status af-status--inactive">
            <Icon name="pause_circle" size={13} />
            Inactive
          </span>
          <span className="af-code-badge">
            <Icon name="tag" size={12} />
            {activateData.affiliateCode}
          </span>
          <p className="muted" style={{ flex: 1, fontSize: '.82rem' }}>
            Your code is preserved. Reactivate to start earning again.
          </p>
          <button className="btn btn--primary btn--sm" onClick={handleActivate} disabled={activating}>
            <Icon name="play_circle" size={15} />
            {activating ? 'Activating…' : 'Reactivate'}
          </button>
        </div>
      )}
    </div>
  );
}