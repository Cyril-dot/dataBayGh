// src/components/BundlePicker.jsx
import { useState, useEffect } from 'react';
import Icon from './Icon';

const NETWORKS = [
  {
    code: 'MTN',
    label: 'MTN',
    logo: 'https://i.pinimg.com/736x/0a/f0/0e/0af00e1d78100d4019d3344873902d5a.jpg',
    initials: 'MTN',
    style: { bg: 'var(--mtn)', fg: '#1A1500' },
  },
  {
    code: 'TELECEL',
    label: 'Telecel',
    logo: 'https://managingghana.com/wp-content/uploads/2026/01/Telecel-Ghana-Addresses-False-Claims-Explains-Its-Support-for-AT-Ghana-1-1140x445.webp',
    initials: 'TC',
    // bg is white so a transparent-background logo file sits cleanly on
    // top; fallback initials use the brand red so they stay legible
    style: { bg: '#FFFFFF', fg: 'var(--telecel)' },
  },
  {
    code: 'AIRTELTIGO',
    label: 'AirtelTigo',
    logo: 'https://www.gsma.com/get-involved/gsma-membership/wp-content/uploads/2014/06/AirtelTigo-Logo-White-background.png',
    initials: 'AT',
    // bg is white so a transparent-background logo file sits cleanly on
    // top; fallback initials use the brand color so they stay legible
    style: { bg: '#FFFFFF', fg: 'var(--airteltigo)' },
  },
];

function NetworkLogo({ src, alt, initials, style }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <span
        className="network-logo network-logo--fallback"
        style={{ background: style.bg, color: style.fg }}
      >
        {initials}
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="network-logo"
      onError={() => setFailed(true)}
    />
  );
}

export default function BundlePicker({
  network,
  onNetworkChange,
  sizes,
  capacityGb,
  onCapacityChange,
  priceFor,
  pricingStatus, // 'loading' | 'ready' | 'error' — used to disambiguate
  // "no priced bundles for this network" from "we couldn't fetch prices
  // at all" / "still fetching". priceFor() alone returns null for all
  // three cases, so the grid needs this to show the right empty state.
  note,
  selectable = true,
}) {
  const activeNetwork = NETWORKS.find((n) => n.code === network);

  // Never let the picker sit on a disabled network — if a parent's default
  // state (or a stale prop) points at MTN, hop to the first enabled one.
  useEffect(() => {
    if (activeNetwork?.disabled) {
      const firstEnabled = NETWORKS.find((n) => !n.disabled);
      if (firstEnabled && firstEnabled.code !== network) {
        onNetworkChange?.(firstEnabled.code);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [network]);

  const pricedSizes = activeNetwork?.disabled
    ? []
    : sizes.filter((gb) => priceFor(network, gb) != null);

  return (
    <div className="bundle-picker">
      <style>{`
        .network-tab {
          position: relative;
          display: block;
          min-height: 64px;
          padding: 0;
          overflow: visible; /* button itself stays open so the tooltip can escape */
        }

        /* Everything visual (the logo) lives in this inner layer, which is
           the thing that actually gets clipped to the tab's rounded shape —
           the outer button stays unclipped so the label tooltip can pop
           outside its bounds on hover.

           background here is set per-network (inline style, below) to each
           brand's own color, so when the logo is letterboxed by
           object-fit: contain there's a matching brand-colored backdrop
           instead of ugly white/transparent bars. */
        .network-tab__bg {
          position: absolute;
          inset: 0;
          overflow: hidden;
          border-radius: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          /* breathing room so the logo never touches the tab edges */
          padding: 8px;
          box-sizing: border-box;
        }

        /* object-fit: contain (not cover) is the key fix: these are brand
           logos, not photography — several of the source files are wide
           lockups (e.g. a ~1140x445 wordmark) or have their own internal
           padding/whitespace. Forcing them edge-to-edge with 'cover' zoomed
           in and cropped the mark unpredictably depending on each image's
           native aspect ratio. 'contain' guarantees the whole logo is
           always visible, uncropped, and correctly proportioned, and the
           brand-colored background behind it (see .network-tab__bg) fills
           any remaining space cleanly.
           The !important pins here guard against common global resets
           (e.g. "img { max-width: 100%; height: auto }") that would
           otherwise let the image ignore this sizing. */
        .network-tab__bg .network-logo {
          width: 100% !important;
          height: 100% !important;
          max-width: 100% !important;
          max-height: 100% !important;
          object-fit: contain;
          object-position: center;
          border-radius: 0;
          display: block;
        }
        .network-logo--fallback {
          width: 100%;
          height: 100%;
          border-radius: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.9rem;
          font-weight: 800;
          letter-spacing: 0.03em;
        }

        /* Network name — hidden by default, appears as a tooltip above
           the tab on hover/focus instead of being drawn over the logo. */
        .network-tab__label {
          position: absolute;
          top: 2px;
          left: 50%;
          transform: translate(-50%, -100%);
          opacity: 0;
          pointer-events: none;
          background: var(--surface-raised, var(--surface));
          border: 1px solid var(--border);
          color: var(--text);
          padding: 4px 10px;
          border-radius: var(--radius-sm);
          font-size: 0.72rem;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: var(--shadow-soft);
          transition: opacity var(--dur-fast) ease, transform var(--dur-fast) ease;
          z-index: 5;
        }
        .network-tab:not(.network-tab--disabled):hover .network-tab__label,
        .network-tab:not(.network-tab--disabled):focus-visible .network-tab__label {
          opacity: 1;
          transform: translate(-50%, -130%);
        }

        .network-tab--disabled .network-tab__bg {
          filter: grayscale(0.5);
          opacity: 0.55;
        }
        .network-tab--disabled {
          cursor: not-allowed;
        }

        .network-tab__badge {
          position: absolute;
          top: -7px;
          right: -6px;
          font-size: 0.58rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          background: var(--surface-raised, var(--surface));
          border: 1px solid var(--border);
          color: var(--text-dim);
          padding: 2px 6px;
          border-radius: 999px;
          white-space: nowrap;
          z-index: 5;
        }

        .bundle-picker__empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          text-align: center;
          padding: 28px 16px;
          color: var(--text-dim);
          font-size: 0.85rem;
          border: 1px dashed var(--border);
          border-radius: var(--radius-sm);
          background: var(--surface);
        }
        .bundle-picker__empty .material-symbols-rounded {
          color: var(--accent-bright);
        }
        .bundle-picker__empty--error .material-symbols-rounded {
          color: var(--red, #F87171);
        }
      `}</style>

      <div className="bundle-picker__networks">
        {NETWORKS.map((n) => {
          const isActive = network === n.code;
          return (
            <button
              key={n.code}
              type="button"
              disabled={n.disabled}
              aria-disabled={n.disabled}
              title={n.label}
              className={[
                'network-tab',
                `network-tab--${n.code.toLowerCase()}`,
                isActive && !n.disabled ? 'network-tab--active' : '',
                n.disabled ? 'network-tab--disabled' : '',
              ]
                .filter(Boolean)
                .join(' ')}
              onClick={() => !n.disabled && onNetworkChange?.(n.code)}
            >
              <span className="network-tab__label">{n.label}</span>
              {/* brand-color backdrop lives behind the contained logo so
                  any letterboxed space blends with the network's own
                  color instead of showing bare white/transparent */}
              <span className="network-tab__bg" style={{ background: n.style.bg }}>
                <NetworkLogo
                  src={n.logo}
                  alt={n.label}
                  initials={n.initials}
                  style={n.style}
                />
              </span>
              {n.disabled && <span className="network-tab__badge">Soon</span>}
            </button>
          );
        })}
      </div>

      <div className="bundle-picker__grid">
        {activeNetwork?.disabled ? (
          <div className="bundle-picker__empty">
            <Icon name="hourglass_top" size={20} />
            <p>{activeNetwork.label} bundles aren't live yet — check back soon.</p>
          </div>
        ) : pricingStatus === 'error' ? (
          // Distinct from "no priced bundles" below — this means we never
          // got an answer at all, so don't imply the network was checked
          // and came back empty.
          <div className="bundle-picker__empty bundle-picker__empty--error">
            <Icon name="error" size={20} />
            <p>Couldn't load prices for {activeNetwork?.label ?? network}. Use retry above.</p>
          </div>
        ) : pricingStatus === 'loading' ? (
          <div className="bundle-picker__empty">
            <Icon name="hourglass_top" size={20} />
            <p>Loading {activeNetwork?.label ?? network} bundles…</p>
          </div>
        ) : pricedSizes.length === 0 ? (
          <div className="bundle-picker__empty">
            <Icon name="info" size={20} />
            <p>No priced bundles for {activeNetwork?.label ?? network} right now.</p>
          </div>
        ) : (
          pricedSizes.map((gb) => {
            const price = priceFor(network, gb);
            const active = selectable && Number(capacityGb) === Number(gb);
            return (
              <button
                type="button"
                key={gb}
                className={`bundle-card ${active ? 'bundle-card--active' : ''} ${
                  !selectable ? 'bundle-card--static' : ''
                }`}
                onClick={() => selectable && onCapacityChange?.(gb)}
              >
                {active && (
                  <Icon name="check_circle" size={16} className="bundle-card__check" filled />
                )}
                <span className="bundle-card__size">{gb} GB</span>
                <span className="bundle-card__price">GH₵ {price.toFixed(2)}</span>
              </button>
            );
          })
        )}
      </div>

      {note && (
        <p className="bundle-picker__note">
          <Icon name="info" size={15} />
          {note}
        </p>
      )}
    </div>
  );
}
