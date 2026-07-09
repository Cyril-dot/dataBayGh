import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import NetworkBadge from '../../components/NetworkBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import ConfirmModal from '../../components/ConfirmModal';
import Icon from '../../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;
const NETWORKS = ['MTN', 'TELECEL', 'AIRTELTIGO'];

export default function ResellerPricing() {
  const notify = useNotify();
  const [rows, setRows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ network: 'MTN', capacityGb: 1, sellingPriceGhc: '' });
  const [busy, setBusy] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    api.reseller
      .getPricingTable(0, 100)
      .then((data) => setRows(data.content))
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load your pricing table.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.reseller.upsertPricing({
        ...form,
        capacityGb: Number(form.capacityGb),
        sellingPriceGhc: Number(form.sellingPriceGhc),
      });
      notify.success('Pricing saved.');
      setForm((f) => ({ ...f, sellingPriceGhc: '' }));
      load();
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Selling price must be at or above your cost price.'));
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!pendingDelete) return;
    setDeleting(true);
    try {
      await api.reseller.deletePricing(pendingDelete.id);
      notify.success('Pricing row deleted.');
      setPendingDelete(null);
      load();
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not delete this pricing row.'));
    } finally {
      setDeleting(false);
    }
  };

  const networksCovered = rows ? new Set(rows.map((r) => r.network)).size : 0;

  return (
    <div className="stack-lg">
      {/* Page-specific layout styles — shares tokens/animations from the global stylesheet */}
      <style>{`
        .pp-header__eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }

        .pp-stats { display: flex; gap: 24px; flex-wrap: wrap; margin-top: 6px; }
        .pp-stat { display: flex; flex-direction: column; gap: 2px; }
        .pp-stat__label { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-faint); font-weight: 700; }
        .pp-stat__value { font-family: var(--font-mono); font-weight: 700; font-size: 1.2rem; }

        .pp-tips { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; padding-top: 16px; border-top: 1px dashed var(--border); }
        .pp-tip { display: flex; gap: 8px; font-size: 0.82rem; color: var(--text-dim); line-height: 1.5; }
        .pp-tip .material-symbols-rounded { color: var(--accent-bright); flex-shrink: 0; margin-top: 1px; }

        /* Saved prices: table on wide screens, stacked cards on narrow */
        .pp-table-view { display: block; }
        .pp-list-view { display: none; flex-direction: column; gap: 10px; }
        .pp-row { border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 14px; background: var(--surface-raised); }
        .pp-row__top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .pp-row__price { font-family: var(--font-mono); font-weight: 700; font-size: 1rem; color: var(--accent-bright); }
        .pp-row__bottom { display: flex; align-items: center; justify-content: space-between; gap: 10px; margin-top: 10px; }
        .pp-row__meta { font-size: 0.8rem; color: var(--text-dim); }

        @media (max-width: 640px) {
          .pp-table-view { display: none; }
          .pp-list-view { display: flex; }
        }
      `}</style>

      <header className="fade-in-up">
        <span className="pp-header__eyebrow">
          <Icon name="price_change" size={13} />
          Reseller
        </span>
        <h1>My selling prices</h1>
        <p className="muted">Set the price your customers pay. It must be at least your wholesale cost price.</p>
      </header>

      <div className="grid-2">
        <div className="card fade-in-up delay-1">
          <h2>Add or update a price</h2>
          <form onSubmit={handleSubmit} className="form" style={{ marginTop: 12 }}>
            <label className="form__field">
              <span>Network</span>
              <select value={form.network} onChange={update('network')}>
                <option value="MTN">MTN</option>
                <option value="TELECEL">Telecel</option>
                <option value="AIRTELTIGO">AirtelTigo</option>
              </select>
            </label>
            <label className="form__field">
              <span>Capacity (GB)</span>
              <input type="number" min="0.1" step="0.1" required value={form.capacityGb} onChange={update('capacityGb')} />
            </label>
            <label className="form__field">
              <span>Selling price (GH₵)</span>
              <input type="number" min="0.01" step="0.01" required value={form.sellingPriceGhc} onChange={update('sellingPriceGhc')} />
            </label>
            <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save price'}
            </button>
          </form>
        </div>

        <div className="card fade-in-up delay-2">
          <h2 style={{ marginBottom: 4 }}>Your pricing at a glance</h2>
          <div className="pp-stats">
            <div className="pp-stat">
              <span className="pp-stat__label">Bundles priced</span>
              <span className="pp-stat__value">{rows ? rows.length : '—'}</span>
            </div>
            <div className="pp-stat">
              <span className="pp-stat__label">Networks covered</span>
              <span className="pp-stat__value">{networksCovered} / {NETWORKS.length}</span>
            </div>
          </div>

          <div className="pp-tips">
            <div className="pp-tip">
              <Icon name="lightbulb" size={15} />
              Price too high and customers go elsewhere — too low and you lose margin.
            </div>
            <div className="pp-tip">
              <Icon name="update" size={15} />
              You can update or delete a price any time — changes apply to new orders only.
            </div>
          </div>
        </div>
      </div>

      <div className="card fade-in-up delay-3">
        <h2>Saved prices</h2>
        {loading && <Spinner label="Loading pricing…" />}
        {!loading && (!rows || rows.length === 0) && (
          <EmptyState title="No prices set yet" hint="Add your first selling price above." />
        )}
        {!loading && rows && rows.length > 0 && (
          <>
            <div className="table-wrap pp-table-view">
              <table className="table">
                <thead>
                  <tr>
                    <th>Network</th>
                    <th>Capacity</th>
                    <th>Selling price</th>
                    <th>Updated</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id}>
                      <td>
                        <NetworkBadge network={r.network} />
                      </td>
                      <td>{r.capacityGb} GB</td>
                      <td className="mono">{fmtGhc(r.sellingPriceGhc)}</td>
                      <td className="muted">{new Date(r.updatedAt).toLocaleDateString()}</td>
                      <td>
                        <button className="link link--danger" onClick={() => setPendingDelete(r)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="pp-list-view">
              {rows.map((r) => (
                <div className="pp-row" key={r.id}>
                  <div className="pp-row__top">
                    <NetworkBadge network={r.network} />
                    <span className="pp-row__price">{fmtGhc(r.sellingPriceGhc)}</span>
                  </div>
                  <div className="pp-row__bottom">
                    <span className="pp-row__meta">
                      {r.capacityGb} GB · Updated {new Date(r.updatedAt).toLocaleDateString()}
                    </span>
                    <button className="link link--danger" onClick={() => setPendingDelete(r)}>
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={!!pendingDelete}
        title="Delete this price?"
        message={pendingDelete ? `Remove your ${pendingDelete.capacityGb}GB ${pendingDelete.network} price.` : ''}
        confirmLabel="Delete"
        tone="danger"
        busy={deleting}
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}