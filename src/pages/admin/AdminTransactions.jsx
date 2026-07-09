import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

export default function AdminTransactions() {
  const notify = useNotify();
  const [txns, setTxns] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = (p = 0) => {
    setLoading(true);
    api.admin
      .getAllTransactions(p, 15)
      .then((data) => {
        setTxns(data.content);
        setTotalPages(data.totalPages);
        setPage(data.number);
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load the transaction ledger.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stack-lg">
      <h1>Transaction ledger</h1>
      <div className="card">
        {loading && <Spinner label="Loading transactions…" />}
        {!loading && (!txns || txns.length === 0) && <EmptyState title="No transactions recorded yet" />}
        {!loading && txns && txns.length > 0 && (
          <>
            <div className="table-wrap">
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
            <Pagination page={page} totalPages={totalPages} onChange={load} />
          </>
        )}
      </div>
    </div>
  );
}
