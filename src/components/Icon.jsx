/**
 * Thin wrapper around Google's Material Symbols icon font (loaded in
 * index.html). Usage: <Icon name="account_balance_wallet" />
 * Browse names at https://fonts.google.com/icons
 */
export default function Icon({ name, size = 20, className = '', filled = false, style = {} }) {
  return (
    <span
      className={`icon material-symbols-outlined ${className}`}
      style={{
        fontSize: size,
        fontVariationSettings: `'FILL' ${filled ? 1 : 0}, 'wght' 500, 'opsz' ${size}`,
        ...style,
      }}
      aria-hidden="true"
    >
      {name}
    </span>
  );
}
