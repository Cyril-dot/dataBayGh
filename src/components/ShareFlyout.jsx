import { useEffect, useRef, useState } from 'react';
import Icon from './Icon';

/**
 * ShareFlyout
 * Props:
 *   open        boolean  — whether the flyout is visible
 *   onClose     fn       — called when the user clicks outside or presses close
 *   storeUrl    string   — e.g. "https://domain.com/store/kwame-data"
 *   referralUrl string   — e.g. "https://domain.com/ref/kwame-data"
 *   storeName   string   — e.g. "Kwame's Data Store"
 */
export default function ShareFlyout({ open, onClose, storeUrl, referralUrl, storeName }) {
  const [storeCopied,    setStoreCopied]    = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const qrRef   = useRef(null);
  const flyRef  = useRef(null);

  /* ── Close on outside click ─────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (flyRef.current && !flyRef.current.contains(e.target)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  /* ── QR code (client-side via qrcode CDN) ───────────────────── */
  useEffect(() => {
    if (!open || !storeUrl || !qrRef.current) return;

    qrRef.current.innerHTML = '';

    // Dynamically load qrcode.js from CDN if not already loaded
    const generate = () => {
      if (window.QRCode) {
        // eslint-disable-next-line no-new
        new window.QRCode(qrRef.current, {
          text:          storeUrl,
          width:         160,
          height:        160,
          colorDark:     '#E8F0FF',
          colorLight:    '#0A1628',
          correctLevel:  window.QRCode.CorrectLevel.H,
        });
      }
    };

    if (!window.QRCode) {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js';
      script.onload = generate;
      document.head.appendChild(script);
    } else {
      generate();
    }
  }, [open, storeUrl]);

  /* ── Copy helper ─────────────────────────────────────────────── */
  const copy = (text, setCopied) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  /* ── Download QR as PNG ──────────────────────────────────────── */
  const downloadQr = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current.querySelector('canvas');
    if (!canvas) return;
    const link    = document.createElement('a');
    link.download = `${storeName ?? 'store'}-qr.png`;
    link.href     = canvas.toDataURL('image/png');
    link.click();
  };

  /* ── Social share URLs ───────────────────────────────────────── */
  const shareText = encodeURIComponent(
    `Buy data bundles from ${storeName ?? 'my store'} — fast, reliable, and affordable!`
  );
  const shareUrl  = encodeURIComponent(storeUrl ?? '');

  const socials = [
    {
      label: 'WhatsApp',
      icon:  'chat',
      color: '#25D366',
      href:  `https://wa.me/?text=${shareText}%20${shareUrl}`,
    },
    {
      label: 'Facebook',
      icon:  'thumb_up',
      color: '#1877F2',
      href:  `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    },
    {
      label: 'X / Twitter',
      icon:  'alternate_email',
      color: '#1DA1F2',
      href:  `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
    },
    {
      label: 'SMS',
      icon:  'sms',
      color: '#F59E0B',
      href:  `sms:?body=${shareText}%20${storeUrl ?? ''}`,
    },
  ];

  if (!open) return null;

  return (
    <>
      <style>{`
        .sf-backdrop {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(5,8,20,.55); backdrop-filter: blur(4px);
          animation: sfFadeIn .18s ease;
        }
        .sf-panel {
          position: fixed; right: 0; top: 0; bottom: 0; z-index: 401;
          width: min(420px, 100vw);
          background: var(--surface);
          border-left: 1px solid var(--border);
          box-shadow: -24px 0 60px rgba(0,0,0,.45);
          display: flex; flex-direction: column;
          animation: sfSlideIn .22s cubic-bezier(.4,0,.2,1);
          overflow-y: auto;
        }
        @keyframes sfFadeIn  { from { opacity: 0; } to { opacity: 1; } }
        @keyframes sfSlideIn { from { transform: translateX(40px); opacity: 0; } to { transform: none; opacity: 1; } }

        .sf-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 22px 18px; border-bottom: 1px solid var(--border); flex-shrink: 0;
        }
        .sf-head__title { font-family: var(--font-display); font-weight: 800; font-size: 1.05rem; margin: 0; }
        .sf-head__sub   { font-size: .78rem; color: var(--text-dim); margin-top: 2px; }
        .sf-close {
          width: 36px; height: 36px; border-radius: 9px; border: 1px solid var(--border);
          background: var(--surface-raised); color: var(--text-dim); cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          transition: border-color .15s, color .15s; flex-shrink: 0;
        }
        .sf-close:hover { border-color: var(--accent-border); color: var(--accent-bright); }

        .sf-body { padding: 20px 22px; display: flex; flex-direction: column; gap: 22px; flex: 1; }

        .sf-section__label {
          font-size: .68rem; text-transform: uppercase; letter-spacing: .1em;
          font-weight: 700; font-family: var(--font-mono);
          color: var(--text-faint); margin-bottom: 10px;
          display: flex; align-items: center; gap: 6px;
        }
        .sf-section__label-badge {
          padding: 2px 8px; border-radius: 999px; font-size: .6rem;
          background: var(--accent-soft); color: var(--accent-bright);
          border: 1px solid var(--accent-border);
        }

        .sf-link-row {
          display: flex; align-items: center; gap: 8px;
          background: var(--surface-raised); border: 1px solid var(--border);
          border-radius: 10px; padding: 10px 12px;
        }
        .sf-link-row__url {
          flex: 1; font-family: var(--font-mono); font-size: .72rem;
          color: var(--text-dim); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .sf-copy-btn {
          display: inline-flex; align-items: center; gap: 5px; flex-shrink: 0;
          padding: 6px 12px; border-radius: 7px; font-size: .76rem; font-weight: 700;
          border: 1px solid var(--accent-border); background: var(--accent-soft);
          color: var(--accent-bright); cursor: pointer; transition: background .15s;
          white-space: nowrap;
        }
        .sf-copy-btn:hover { background: rgba(44,123,229,.25); }
        .sf-copy-btn--done { border-color: rgba(16,185,129,.4); background: rgba(16,185,129,.12); color: #10B981; }

        .sf-qr-box {
          display: flex; flex-direction: column; align-items: center; gap: 14px;
          padding: 20px 16px; background: var(--surface-raised);
          border: 1px solid var(--border); border-radius: 12px;
        }
        .sf-qr-canvas { border-radius: 8px; overflow: hidden; }
        .sf-qr-hint { font-size: .75rem; color: var(--text-faint); text-align: center; }
        .sf-dl-btn {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 8px 18px; border-radius: 8px; font-size: .8rem; font-weight: 700;
          border: 1px solid var(--border); background: var(--surface);
          color: var(--text-dim); cursor: pointer; transition: border-color .15s, color .15s;
        }
        .sf-dl-btn:hover { border-color: var(--accent-border); color: var(--accent-bright); }

        .sf-socials { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
        .sf-social-btn {
          display: flex; align-items: center; gap: 8px; padding: 10px 12px;
          border-radius: 9px; font-size: .8rem; font-weight: 700;
          border: 1px solid var(--border); background: var(--surface-raised);
          color: var(--text-dim); cursor: pointer; text-decoration: none;
          transition: border-color .15s, color .15s, background .15s;
        }
        .sf-social-btn:hover { background: var(--surface); color: var(--text); }
      `}</style>

      <div className="sf-backdrop" />

      <div className="sf-panel" ref={flyRef}>
        {/* Header */}
        <div className="sf-head">
          <div>
            <h2 className="sf-head__title">Share your store</h2>
            <p className="sf-head__sub">{storeName}</p>
          </div>
          <button className="sf-close" onClick={onClose} aria-label="Close">
            <Icon name="close" size={18} />
          </button>
        </div>

        <div className="sf-body">

          {/* Store link */}
          <div>
            <p className="sf-section__label">
              <Icon name="storefront" size={12} />
              Store link
            </p>
            <div className="sf-link-row">
              <span className="sf-link-row__url">{storeUrl}</span>
              <button
                className={`sf-copy-btn${storeCopied ? ' sf-copy-btn--done' : ''}`}
                onClick={() => copy(storeUrl, setStoreCopied)}
              >
                <Icon name={storeCopied ? 'check' : 'content_copy'} size={13} />
                {storeCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Referral link */}
          <div>
            <p className="sf-section__label">
              <Icon name="group_add" size={12} />
              Referral link
              <span className="sf-section__label-badge">Earn on signups</span>
            </p>
            <div className="sf-link-row">
              <span className="sf-link-row__url">{referralUrl}</span>
              <button
                className={`sf-copy-btn${referralCopied ? ' sf-copy-btn--done' : ''}`}
                onClick={() => copy(referralUrl, setReferralCopied)}
              >
                <Icon name={referralCopied ? 'check' : 'content_copy'} size={13} />
                {referralCopied ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <p style={{ fontSize: '.74rem', color: 'var(--text-faint)', marginTop: 6 }}>
              When someone signs up through this link they're linked to your store.
            </p>
          </div>

          {/* QR code */}
          <div>
            <p className="sf-section__label">
              <Icon name="qr_code_2" size={12} />
              QR code
            </p>
            <div className="sf-qr-box">
              <div className="sf-qr-canvas" ref={qrRef} />
              <p className="sf-qr-hint">Points to your store link — print it, share it, done.</p>
              <button className="sf-dl-btn" onClick={downloadQr}>
                <Icon name="download" size={15} />
                Download PNG
              </button>
            </div>
          </div>

          {/* Social chips */}
          <div>
            <p className="sf-section__label">
              <Icon name="share" size={12} />
              Share on
            </p>
            <div className="sf-socials">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="sf-social-btn"
                  style={{ '--social-color': s.color }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = s.color + '55'; e.currentTarget.style.color = s.color; }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.color = ''; }}
                >
                  <Icon name={s.icon} size={16} />
                  {s.label}
                </a>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}