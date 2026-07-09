import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import NetworkBadge from '../../components/NetworkBadge';
import StatusBadge from '../../components/StatusBadge';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;


export default function ResellerOrders() {
  const notify = useNotify();
  const [orders, setOrders] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = (p = 0) => {
    setLoading(true);
    api.reseller
      .getOrders(p, 10)
      .then((data) => {
        setOrders(data.content);
        setTotalPages(data.totalPages);
        setPage(data.number);
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load your orders.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stack-lg">
      <div className="card__header">
        <h1>Reseller orders</h1>
        <Link to="/reseller/buy" className="btn btn--primary btn--sm">
          Sell a bundle
        </Link>
      </div>

      <div className="card">
        {loading && <Spinner label="Loading orders…" />}
        {!loading && (!orders || orders.length === 0) && (
          <EmptyState title="No reseller orders yet" hint="Orders you sell at wholesale will appear here." />
        )}
        {!loading && orders && orders.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Network</th>
                    <th>Size</th>
                    <th>Number</th>
                    <th>Cost</th>
                    <th>Sold for</th>
                    <th>Profit</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <NetworkBadge network={o.network} />
                      </td>
                      <td>{o.capacityGb} GB</td>
                      <td className="mono">{o.phoneNumber}</td>
                      <td className="mono muted">{fmtGhc(o.costPriceGhc)}</td>
                      <td className="mono">{fmtGhc(o.sellingPriceGhc)}</td>
                      <td className="mono text-gold">{fmtGhc(o.profitGhc)}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="muted">{new Date(o.createdAt).toLocaleDateString()}</td>
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
