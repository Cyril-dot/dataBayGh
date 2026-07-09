import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/api';
import { useNotify } from '../context/NotificationContext';
import NetworkBadge from '../components/NetworkBadge';
import StatusBadge from '../components/StatusBadge';
import Spinner from '../components/Spinner';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

// Statuses that can still change on their own (backend poller may flip
// VERIFIED → COMPLETED, or either → FAILED). Once an order reaches one of
// the terminal states below, polling stops.
const NON_FINAL_STATUSES = ['PENDING', 'VERIFIED'];
const POLL_INTERVAL_MS = 5000;

export default function OrderDetail() {
  const { orderId } = useParams();
  const notify = useNotify();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    const fetchOrder = () => {
      api.orders
        .getOrder(orderId)
        .then((data) => {
          if (cancelled) return;
          setOrder(data);

          // Keep polling only while the order is still in-flight. Stop as
          // soon as it reaches a terminal status (COMPLETED / FAILED), or
          // if the order somehow disappears.
          if (data && NON_FINAL_STATUSES.includes(data.status)) {
            pollRef.current = setTimeout(fetchOrder, POLL_INTERVAL_MS);
          }
        })
        .catch((err) => {
          if (cancelled) return;
          notify.error(apiErrorMessage(err, 'Could not load this order.'));
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    };

    fetchOrder();

    return () => {
      cancelled = true;
      if (pollRef.current) clearTimeout(pollRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (loading) return <Spinner label="Loading order…" />;
  if (!order) return <p className="muted">Order not found. <Link to="/orders">Back to orders</Link></p>;

  const rows = [
    ['Order ID', `#${order.id}`],
    ['Network', <NetworkBadge key="n" network={order.network} />],
    ['Bundle size', `${order.capacityGb} GB`],
    ['Phone number', order.phoneNumber],
    ['Cost price', fmtGhc(order.costPriceGhc)],
    ['Selling price', fmtGhc(order.sellingPriceGhc)],
    ['Payment method', order.paymentMethod],
    ['Paystack reference', order.paystackRef || '—'],
    ['Guest order', order.guest ? 'Yes' : 'No'],
    ['Created', new Date(order.createdAt).toLocaleString()],
    ['Last updated', new Date(order.updatedAt).toLocaleString()],
  ];

  return (
    <div className="stack-lg narrow">
      <Link to="/orders" className="link">
        ← Back to orders
      </Link>
      <div className="card__header">
        <h1>Order #{order.id}</h1>
        <StatusBadge status={order.status} />
      </div>

      {NON_FINAL_STATUSES.includes(order.status) && (
        <p className="muted small">
          <Spinner size={14} inline /> Checking for delivery confirmation…
        </p>
      )}

      <div className="card detail-table">
        {rows.map(([label, value]) => (
          <div className="detail-table__row" key={label}>
            <span className="detail-table__label">{label}</span>
            <span className="detail-table__value">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}