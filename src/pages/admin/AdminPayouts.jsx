import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;
const STATUS_FILTERS = ['ALL', 'PENDING', 'PROCESSING', 'PAID', 'REJECTED'];

export default function AdminPayouts() {
  const notify = useNotify();
  const [rows, setRows] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [status, setStatus] = useState('PENDING');
  const [loading, setLoading] = useState(true);
  const [pendingAction, setPendingAction] = useState(null); // { payout, type: 'pay' | 'reject' }
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const load = (p = 0, s = status) => {
    setLoading(true);
    api.admin
      .getPayouts({ page: p, size: 10, ...(s !== 'ALL' ? { status: s } : {}) })
      .then((data) => {
        setRows(data.content);
        setTotalPages(data.totalPages);
        setPage(data.number);
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load payouts.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0, status);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const closeModal = () => {
    setPendingAction(null);
    setNote('');
  };

  const handleConfirm = async () => {
    if (!pendingAction) return;
    if (pendingAction.type === 'reject' && !note.trim()) {
      notify.error('Give a reason for the rejection.');
      return;
    }
    setBusy(true);
    try {
      if (pendingAction.type === 'pay') {
        await api.admin.markPayoutPaid(pendingAction.payout.id, { adminNote: note });
        notify.success('Payout marked as paid.');
      } else {
        await api.admin.rejectPayout(pendingAction.payout.id, { reason: note });
        notify.success('Payout rejected.');
      }
      closeModal();
      load(page, status);
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not complete this action.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack-lg">
      <h1>Payout requests</h1>

      <div className="filter-row">
        {STATUS_FILTERS.map((s) => (
          <button key={s} className={`chip ${status === s ? 'chip--active' : ''}`} onClick={() => setStatus(s)}>
            {s}
          </button>
        ))}
      </div>

      <div className="card">
        {loading && <Spinner label="Loading payouts…" />}
        {!loading && (!rows || rows.length === 0) && <EmptyState title="No payouts in this status" />}
        {!loading && rows && rows.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Amount</th>
                    <th>Mobile money</th>
                    <th>Network</th>
                    <th>Status</th>
                    <th>Requested</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {rows.map((p) => (
                    <tr key={p.id}>
                      <td className="mono">{fmtGhc(p.amount)}</td>
                      <td className="mono">{p.mobileMoneyNumber}</td>
                      <td>{p.network}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td className="muted">{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>
                        {(p.status === 'PENDING' || p.status === 'PROCESSING') && (
                          <div className="flex-row">
                            <button className="link" onClick={() => setPendingAction({ payout: p, type: 'pay' })}>
                              Mark paid
                            </button>
                            <button
                              className="link link--danger"
                              onClick={() => setPendingAction({ payout: p, type: 'reject' })}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={(p) => load(p, status)} />
          </>
        )}
      </div>

      <ConfirmModal
        open={!!pendingAction}
        title={pendingAction?.type === 'pay' ? 'Mark this payout as paid?' : 'Reject this payout?'}
        message={
          pendingAction
            ? `${fmtGhc(pendingAction.payout.amount)} to ${pendingAction.payout.mobileMoneyNumber}`
            : ''
        }
        confirmLabel={pendingAction?.type === 'pay' ? 'Mark paid' : 'Reject'}
        tone={pendingAction?.type === 'reject' ? 'danger' : 'default'}
        busy={busy}
        onConfirm={handleConfirm}
        onCancel={closeModal}
      >
        <textarea
          className="modal__textarea"
          rows={3}
          placeholder={pendingAction?.type === 'pay' ? 'Optional note (e.g. transaction ID)' : 'Reason for rejection'}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </ConfirmModal>
    </div>
  );
}
