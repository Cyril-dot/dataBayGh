const NETWORK_STYLES = {
  MTN: { bg: 'var(--mtn)', fg: '#1A1500' },
  TELECEL: { bg: 'var(--telecel)', fg: '#FFFFFF' },
  AIRTELTIGO: { bg: 'var(--airteltigo)', fg: '#FFFFFF' },
};

export default function NetworkBadge({ network }) {
  const style = NETWORK_STYLES[network] || { bg: 'var(--border)', fg: 'var(--text)' };
  const label = network === 'AIRTELTIGO' ? 'AirtelTigo' : network === 'TELECEL' ? 'Telecel' : network;
  return (
    <span className="badge badge--network" style={{ background: style.bg, color: style.fg }}>
      {label}
    </span>
  );
}
