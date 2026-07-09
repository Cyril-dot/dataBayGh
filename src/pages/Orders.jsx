import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/api';
import { useNotify } from '../context/NotificationContext';
import NetworkBadge from '../components/NetworkBadge';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';
import EmptyState from '../components/EmptyState';
import Pagination from '../components/Pagination';
import Icon from '../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

export default function Orders() {
  const notify = useNotify();
  const [orders, setOrders] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = (p = 0) => {
    setLoading(true);
    api.orders
      .getOrders(p, 10)
      .then((data) => {
        setOrders(data.content);
        setTotalPages(data.totalPages);
        setPage(data.number);
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load orders.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stack-lg">
      <div className="card__header">
        <h1>Order history</h1>
        <Link to="/buy" className="btn btn--primary btn--sm">
          <Icon name="shopping_cart" size={16} />
          Buy a bundle
        </Link>
      </div>

      <div className="card">
        {loading && <Spinner label="Loading orders…" />}
        {!loading && (!orders || orders.length === 0) && (
          <EmptyState title="No orders yet" hint="Once you buy a bundle, it will show up here." />
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
                    <th>Price</th>
                    <th>Payment</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th />
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
                      <td className="mono">{fmtGhc(o.sellingPriceGhc)}</td>
                      <td className="muted">{o.paymentMethod}</td>
                      <td>
                        <StatusBadge status={o.status} />
                      </td>
                      <td className="muted">{new Date(o.createdAt).toLocaleDateString()}</td>
                      <td>
                        <Link className="link" to={`/orders/${o.id}`}>
                          View
                        </Link>
                      </td>
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
