import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;
const STATUS_FILTERS = ['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'];

export default function AdminResellers() {
  const notify = useNotify();
  const [rows, setRows] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);
  const [noteDraft, setNoteDraft] = useState({});

  const load = (p = 0, s = status) => {
    setLoading(true);
    api.admin
      .getResellers({ page: p, size: 10, ...(s !== 'ALL' ? { status: s } : {}) })
      .then((data) => {
        setRows(data.content);
        setTotalPages(data.totalPages);
        setPage(data.number);
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load reseller applications.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const act = async (profileId, action) => {
    setActioningId(profileId);
    try {
      const note = noteDraft[profileId] || '';
      if (action === 'approve') {
        await api.admin.approveReseller(profileId, { note });
        notify.success('Reseller approved.');
      } else {
        await api.admin.rejectReseller(profileId, { note });
        notify.success('Reseller rejected and fee refunded.');
      }
      load(page, status);
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not complete this action.'));
    } finally {
      setActioningId(null);
    }
  };

  return (
    <div className="stack-lg">
      <h1>Reseller applications</h1>

      <div className="filter-row">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            className={`chip ${status === s ? 'chip--active' : ''}`}
            onClick={() => setStatus(s)}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        {loading && <Spinner label="Loading applications…" />}
        {!loading && (!rows || rows.length === 0) && <EmptyState title="No applications in this status" />}
        {!loading && rows && rows.length > 0 && (
          <>
            <div className="stack">
              {rows.map((r) => (
                <div className="application-card" key={r.profileId}>
                  <div className="application-card__header">
                    <div>
                      <strong>{r.fullName}</strong>
                      <p className="muted">{r.email} · {r.phone}</p>
                    </div>
                    <StatusBadge status={r.status} />
                  </div>
                  <p className="application-card__note">"{r.applicationNote}"</p>
                  {r.rejectionReason && <p className="muted">Rejection reason: {r.rejectionReason}</p>}
                  <div className="application-card__stats">
                    <span>Revenue: {fmtGhc(r.totalRevenueGhc)}</span>
                    <span>Cost: {fmtGhc(r.totalCostGhc)}</span>
                    <span>Profit: {fmtGhc(r.totalProfitGhc)}</span>
                  </div>
                  {r.status === 'PENDING' && (
                    <div className="application-card__actions">
                      <input
                        placeholder="Optional note"
                        value={noteDraft[r.profileId] || ''}
                        onChange={(e) => setNoteDraft((d) => ({ ...d, [r.profileId]: e.target.value }))}
                      />
                      <button
                        className="btn btn--primary btn--sm"
                        disabled={actioningId === r.profileId}
                        onClick={() => act(r.profileId, 'approve')}
                      >
                        Approve
                      </button>
                      <button
                        className="btn btn--danger btn--sm"
                        disabled={actioningId === r.profileId}
                        onClick={() => act(r.profileId, 'reject')}
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={(p) => load(p, status)} />
          </>
        )}
      </div>
    </div>
  );
}
