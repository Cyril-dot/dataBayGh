const TONE_MAP = {
  SUCCESS: 'good',
  COMPLETED: 'good',
  PAID: 'good',
  APPROVED: 'good',
  ACTIVE: 'good',
  PENDING: 'warn',
  PROCESSING: 'warn',
  INITIATED: 'warn',
  FAILED: 'bad',
  REJECTED: 'bad',
  CANCELLED: 'bad',
  SUSPENDED: 'bad',
  INACTIVE: 'bad',
};

export default function StatusBadge({ status }) {
  const tone = TONE_MAP[(status || '').toUpperCase()] || 'neutral';
  return <span className={`badge badge--${tone}`}>{status}</span>;
}
