import { useEffect, useMemo, useState } from 'react';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import NetworkBadge from '../../components/NetworkBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

const NETWORKS = [
  { value: 'ALL',        label: 'All',        cls: '' },
  { value: 'MTN',        label: 'MTN',        cls: 'network-tab--mtn' },
  { value: 'TELECEL',    label: 'Telecel',    cls: 'network-tab--telecel' },
  { value: 'AIRTELTIGO', label: 'AirtelTigo', cls: 'network-tab--airteltigo' },
];

// Maps our internal network enum → Big Dreams API network key
const BD_NETWORK_KEY = {
  MTN:        'mtn',
  TELECEL:    'telecel',
  AIRTELTIGO: 'ishare',
};

export default function AdminPricing() {
  const notify = useNotify();

  // ── Selling-price table (our DB) ──────────────────────────────────────────
  const [rows,          setRows]          = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [networkFilter, setNetworkFilter] = useState('ALL');
  const [togglingId,    setTogglingId]    = useState(null);

  // ── Big Dreams buying-price panel ─────────────────────────────────────────
  const [bdBundles, setBdBundles] = useState(null);
  const [bdLoading, setBdLoading] = useState(true);
  const [bdError,   setBdError]   = useState(false);

  // ── Add / update form ─────────────────────────────────────────────────────
  const [form, setForm] = useState({
    network:          'MTN',
    capacityGb:       1,
    publicPriceGhc:   '',
    resellerPriceGhc: '',
    active:           true,
  });
  const [busy, setBusy] = useState(false);

  // ── Loaders ───────────────────────────────────────────────────────────────

  const loadPricingTable = () => {
    setLoading(true);
    api.admin
      .getPricingTable(0, 100)
      .then((data) => setRows(data.content))
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load pricing.')))
      .finally(() => setLoading(false));
  };

  const loadBdBundles = () => {
    setBdLoading(true);
    setBdError(false);
    api.admin
      .getBigDreamsBundles()
      .then((data) => setBdBundles(data))
      .catch(() => {
        setBdBundles(null);
        setBdError(true);
      })
      .finally(() => setBdLoading(false));
  };

  useEffect(() => {
    loadPricingTable();
    loadBdBundles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch BD bundles whenever the selected network changes so the panel
  // only shows what's actually available for that network on Big Dreams.
  useEffect(() => {
    setBdLoading(true);
    setBdError(false);
    const networkKey = BD_NETWORK_KEY[form.network] ?? null;
    api.admin
      .getBigDreamsBundles(networkKey)
      .then((data) => setBdBundles(data))
      .catch(() => {
        setBdBundles(null);
        setBdError(true);
      })
      .finally(() => setBdLoading(false));
  }, [form.network]);

  // ── Form helpers ──────────────────────────────────────────────────────────

  const update = (key) => (e) =>
    setForm((f) => ({
      ...f,
      [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value,
    }));

  /** Click a Big Dreams bundle row → pre-fill capacity and hint at a margin */
  const prefillFromBdBundle = (bundle) => {
    setForm((f) => ({
      ...f,
      capacityGb: bundle.sizeGb,
      // Leave prices blank so the admin consciously sets their margin
      publicPriceGhc:   '',
      resellerPriceGhc: '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.admin.upsertPricing({
        ...form,
        capacityGb:       Number(form.capacityGb),
        publicPriceGhc:   Number(form.publicPriceGhc),
        resellerPriceGhc: Number(form.resellerPriceGhc),
      });
      notify.success('Pricing saved.');
      setForm((f) => ({ ...f, publicPriceGhc: '', resellerPriceGhc: '' }));
      loadPricingTable();
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Reseller price must be lower than the public price.'));
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (row) => {
    setTogglingId(row.id);
    try {
      await api.admin.toggleBundleActive(row.id, !row.active);
      notify.success(`Bundle ${!row.active ? 'enabled' : 'disabled'}.`);
      loadPricingTable();
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not toggle this bundle.'));
    } finally {
      setTogglingId(null);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────────

  const activeCount   = rows ? rows.filter((r) => r.active).length : 0;
  const disabledCount = rows ? rows.length - activeCount : 0;

  const visibleRows = useMemo(() => {
    if (!rows) return rows;
    if (networkFilter === 'ALL') return rows;
    return rows.filter((r) => r.network === networkFilter);
  }, [rows, networkFilter]);

  // Cost of the bundle currently selected in the form (for the margin hint)
  const selectedBdBundle = useMemo(() => {
    if (!bdBundles) return null;
    return bdBundles.find((b) => Number(b.sizeGb) === Number(form.capacityGb)) ?? null;
  }, [bdBundles, form.capacityGb]);

  const marginHint = useMemo(() => {
    if (!selectedBdBundle || !form.publicPriceGhc) return null;
    const cost   = Number(selectedBdBundle.buyingPriceGhc);
    const sell   = Number(form.publicPriceGhc);
    const margin = sell - cost;
    if (isNaN(margin)) return null;
    return { margin, pct: cost > 0 ? ((margin / cost) * 100).toFixed(1) : null };
  }, [selectedBdBundle, form.publicPriceGhc]);

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="stack-lg">
      <style>{`
        /* ── Header ──────────────────────────────────────────────────────── */
        .ap-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }
        .ap-status-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .ap-status-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--surface-raised); border: 1px solid var(--border);
          color: var(--text-faint); padding: 4px 10px; border-radius: 999px;
          font-size: 0.72rem; font-weight: 600;
        }

        /* ── Layout ──────────────────────────────────────────────────────── */
        .ap-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: start; }
        .ap-main { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .ap-aside { display: flex; flex-direction: column; gap: 16px; }

        /* ── Pricing table card ──────────────────────────────────────────── */
        .ap-table-card { padding: 0; overflow: hidden; }
        .ap-table-card__head {
          display: flex; align-items: center; justify-content: space-between; gap: 12px;
          padding: 16px 18px; border-bottom: 1px solid var(--border); flex-wrap: wrap;
        }
        .ap-table-card__head h2 { margin: 0; font-size: 1rem; }
        .ap-table-card .table-wrap { padding: 0 18px 18px; }
        .ap-tabs { display: flex; gap: 6px; flex-wrap: wrap; }
        .ap-tabs .network-tab { flex: none; padding: 6px 14px; font-size: 0.78rem; border-radius: 999px; }

        /* ── Big Dreams panel ────────────────────────────────────────────── */
        .ap-bd-card { padding: 16px 18px; }
        .ap-bd-card__title { margin: 0 0 2px; font-size: 0.95rem; }
        .ap-bd-card__sub { font-size: 0.78rem; }
        .ap-bd-table { margin-top: 10px; width: 100%; }
        .ap-bd-table tr { cursor: pointer; }
        .ap-bd-table tr:hover td { background: var(--surface-raised); }
        .ap-bd-hint {
          font-size: 0.72rem; color: var(--text-faint);
          margin-top: 6px; display: flex; align-items: center; gap: 4px;
        }
        .ap-bd-error {
          display: flex; align-items: center; gap: 6px;
          color: var(--text-faint); font-size: 0.82rem; margin-top: 10px;
        }
        .ap-bd-retry {
          background: none; border: none; padding: 0; font-size: 0.82rem;
          color: var(--accent-bright); cursor: pointer; text-decoration: underline;
        }

        /* ── Form card ───────────────────────────────────────────────────── */
        .ap-form-card { padding: 16px 18px; }
        .ap-form-card form { display: flex; flex-direction: column; gap: 14px; margin-top: 14px; }
        .ap-form-card .form__field--checkbox {
          flex-direction: row !important; align-items: center; gap: 8px;
        }
        .ap-form-card .form__field--checkbox span { text-transform: none; font-weight: 600; font-size: 0.85rem; }

        /* ── Margin hint ─────────────────────────────────────────────────── */
        .ap-margin-hint {
          display: flex; align-items: center; gap: 6px;
          padding: 8px 12px; border-radius: 8px;
          font-size: 0.8rem; font-weight: 600;
          background: var(--surface-raised); border: 1px solid var(--border);
        }
        .ap-margin-hint--positive { color: var(--color-success, #22c55e); border-color: var(--color-success, #22c55e); }
        .ap-margin-hint--negative { color: var(--color-danger,  #ef4444); border-color: var(--color-danger,  #ef4444); }

        /* ── Cost badge in table ─────────────────────────────────────────── */
        .ap-cost-badge {
          display: inline-flex; align-items: center; gap: 4px;
          font-size: 0.7rem; color: var(--text-faint); font-family: var(--font-mono);
        }

        @media (max-width: 760px) { .ap-grid { grid-template-columns: 1fr; } }
      `}</style>

      {/* ── Page header ───────────────────────────────────────────────── */}
      <header className="fade-in-up">
        <span className="ap-eyebrow">
          <Icon name="price_change" size={13} />
          Admin
        </span>
        <h1>Platform pricing</h1>
        <div className="ap-status-row">
          <span className="ap-status-chip">
            <Icon name="sell" size={13} />
            {rows ? rows.length : 0} bundles
          </span>
          {!loading && rows && (
            <>
              <span className="ap-status-chip">
                <Icon name="check_circle" size={13} />
                {activeCount} active
              </span>
              {disabledCount > 0 && (
                <span className="ap-status-chip">
                  <Icon name="cancel" size={13} />
                  {disabledCount} disabled
                </span>
              )}
            </>
          )}
        </div>
      </header>

      <div className="ap-grid">

        {/* ── Left: selling-price table ──────────────────────────────── */}
        <div className="ap-main">
          <div className="card ap-table-card hover-lift fade-in-up delay-1">
            <div className="ap-table-card__head">
              <h2>All bundles</h2>
              <div className="ap-tabs">
                {NETWORKS.map((n) => (
                  <button
                    key={n.value}
                    type="button"
                    className={`network-tab ${n.cls} ${networkFilter === n.value ? 'network-tab--active' : ''}`}
                    onClick={() => setNetworkFilter(n.value)}
                  >
                    {n.label}
                  </button>
                ))}
              </div>
            </div>

            {loading && (
              <div style={{ padding: '32px 18px' }}>
                <Spinner label="Loading pricing…" />
              </div>
            )}
            {!loading && (!visibleRows || visibleRows.length === 0) && (
              <div style={{ padding: '32px 18px' }}>
                <EmptyState
                  title={
                    rows && rows.length > 0
                      ? 'No bundles for this network'
                      : 'No pricing configured yet'
                  }
                />
              </div>
            )}
            {!loading && visibleRows && visibleRows.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Network</th>
                      <th>Capacity</th>
                      <th>Public price</th>
                      <th>Reseller price</th>
                      <th>Status</th>
                      <th>Updated</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRows.map((r) => (
                      <tr key={r.id}>
                        <td><NetworkBadge network={r.network} /></td>
                        <td>{r.capacityGb} GB</td>
                        <td className="mono">{fmtGhc(r.publicPriceGhc)}</td>
                        <td className="mono">{fmtGhc(r.resellerPriceGhc)}</td>
                        <td>
                          <span className={`badge ${r.active ? 'badge--good' : 'badge--bad'}`}>
                            {r.active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="muted">{new Date(r.updatedAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="link"
                            disabled={togglingId === r.id}
                            onClick={() => handleToggleActive(r)}
                          >
                            {r.active ? 'Disable' : 'Enable'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* ── Right: aside ──────────────────────────────────────────── */}
        <div className="ap-aside fade-in-up delay-2">

          {/* Big Dreams buying-price reference panel */}
          <div className="card ap-bd-card">
            <h2 className="ap-bd-card__title">Our buying prices</h2>
            <p className="muted ap-bd-card__sub">
              Live from Big Dreams — filtered to the network selected below.
              Click a row to pre-fill the capacity field.
            </p>

            {bdLoading && <Spinner label="Fetching prices…" />}

            {!bdLoading && bdError && (
              <div className="ap-bd-error">
                <Icon name="wifi_off" size={14} />
                Could not reach Big Dreams.
                <button className="ap-bd-retry" onClick={loadBdBundles}>Retry</button>
              </div>
            )}

            {!bdLoading && !bdError && (!bdBundles || bdBundles.length === 0) && (
              <p className="muted" style={{ fontSize: '0.82rem', marginTop: 10 }}>
                No bundles available for {form.network} on Big Dreams.
              </p>
            )}

            {!bdLoading && !bdError && bdBundles && bdBundles.length > 0 && (
              <>
                <table className="table ap-bd-table">
                  <thead>
                    <tr>
                      <th>Size</th>
                      <th>We pay</th>
                      <th>Validity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bdBundles.map((b) => {
                      const isSelected = Number(b.sizeGb) === Number(form.capacityGb);
                      return (
                        <tr
                          key={b.id}
                          onClick={() => prefillFromBdBundle(b)}
                          style={isSelected ? { background: 'var(--surface-raised)' } : {}}
                        >
                          <td>
                            <span style={{ fontWeight: isSelected ? 700 : 400 }}>{b.size}</span>
                            {isSelected && (
                              <Icon name="arrow_right" size={12} style={{ marginLeft: 4, color: 'var(--accent-bright)' }} />
                            )}
                          </td>
                          <td className="mono">{fmtGhc(b.buyingPriceGhc)}</td>
                          <td className="muted" style={{ fontSize: '0.78rem' }}>{b.validity}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="ap-bd-hint">
                  <Icon name="touch_app" size={11} />
                  Click a row to pre-fill the form below.
                </p>
              </>
            )}
          </div>

          {/* Add / update form */}
          <div className="card ap-form-card">
            <h2 style={{ marginBottom: 4 }}>Add or update a bundle</h2>
            <p className="muted" style={{ fontSize: '0.85rem' }}>
              Public price is what customers pay; reseller price is the wholesale rate.
            </p>

            <form onSubmit={handleSubmit}>
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
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  required
                  value={form.capacityGb}
                  onChange={update('capacityGb')}
                />
              </label>

              {/* Cost reference under the capacity field */}
              {selectedBdBundle && (
                <p className="muted" style={{ fontSize: '0.78rem', marginTop: -8 }}>
                  We pay <strong className="mono">{fmtGhc(selectedBdBundle.buyingPriceGhc)}</strong> for this bundle on Big Dreams.
                </p>
              )}

              <label className="form__field">
                <span>Public price (GH₵)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.publicPriceGhc}
                  onChange={update('publicPriceGhc')}
                />
              </label>

              {/* Margin hint — shows once admin types a public price */}
              {marginHint && (
                <div className={`ap-margin-hint ${marginHint.margin >= 0 ? 'ap-margin-hint--positive' : 'ap-margin-hint--negative'}`}>
                  <Icon name={marginHint.margin >= 0 ? 'trending_up' : 'trending_down'} size={14} />
                  {marginHint.margin >= 0 ? 'Margin' : 'Loss'}: {fmtGhc(Math.abs(marginHint.margin))}
                  {marginHint.pct && ` (${marginHint.pct}%)`}
                </div>
              )}

              <label className="form__field">
                <span>Reseller price (GH₵)</span>
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  required
                  value={form.resellerPriceGhc}
                  onChange={update('resellerPriceGhc')}
                />
              </label>

              <label className="form__field form__field--checkbox">
                <input type="checkbox" checked={form.active} onChange={update('active')} />
                <span>Active</span>
              </label>

              <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
                {busy ? 'Saving…' : 'Save bundle'}
              </button>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
}