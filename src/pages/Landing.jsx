import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const Icon = ({ name, size = 20 }) => (
  <span
    className="material-symbols-rounded"
    style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', verticalAlign: 'middle' }}
  >
    {name}
  </span>
);

/* ─── Data ──────────────────────────────────────────────────────────────── */
const NETWORKS = [
  { key: 'MTN',        label: 'MTN',        color: '#FFCC00', bg: 'rgba(255,204,0,0.10)',  border: 'rgba(255,204,0,0.30)',  icon: 'signal_cellular_alt' },
  { key: 'TELECEL',    label: 'Telecel',    color: '#FF4060', bg: 'rgba(228,0,43,0.10)',   border: 'rgba(228,0,43,0.30)',   icon: 'signal_cellular_alt' },
  { key: 'AIRTELTIGO', label: 'AirtelTigo', color: '#5B8FFF', bg: 'rgba(22,87,214,0.10)',  border: 'rgba(22,87,214,0.30)',  icon: 'signal_cellular_alt' },
];

const FEATURES = [
  { icon: 'bolt',          title: 'Instant Delivery',     text: 'Bundles credited within 30 seconds of payment confirmation.' },
  { icon: 'shield',        title: 'Secure Payments',      text: 'Every transaction runs through Paystack — your details are never stored.' },
  { icon: 'sell',          title: 'Best Prices',          text: 'Wholesale rates for all networks, with transparent pricing upfront.' },
  { icon: 'group',         title: 'Reseller Opportunity', text: 'Set your own margins, run your own storefront, withdraw anytime.' },
];

const STEPS = [
  { icon: 'account_balance_wallet', title: 'Fund Your Wallet',  text: 'Top up with card, mobile money, or bank via Paystack.' },
  { icon: 'sim_card',               title: 'Pick a Bundle',     text: 'Choose network, data size, and the number to top up.' },
  { icon: 'send',                   title: 'Instant Delivery',  text: 'Data lands on the number in under 30 seconds.' },
  { icon: 'storefront',             title: 'Resell & Earn',     text: 'Buy wholesale, sell at your price, get paid to MoMo.' },
];

const TESTIMONIALS = [
  { name: 'Kwabena A.', role: 'Campus Reseller, Legon',  initial: 'K', quote: 'I top up data for over 40 students a week. Wholesale pricing plus instant delivery means I barely think about it anymore.' },
  { name: 'Adjoa M.',   role: 'Customer, Kumasi',        initial: 'A', quote: 'Funded my wallet once and now buying data takes less time than queuing at a kiosk.' },
  { name: 'Yaw O.',     role: 'Reseller, Takoradi',      initial: 'Y', quote: 'The dashboard shows exactly how much profit per order. Payouts to MoMo are seamless.' },
];

const FAQS = [
  { q: 'Which networks are supported?',  a: 'MTN, Telecel and AirtelTigo — all three major Ghanaian networks on one platform.' },
  { q: 'Do I need an account to buy?',   a: 'No. Guest checkout lets you pay and receive data right away. An account unlocks wallet top-ups and full order history.' },
  { q: 'How fast are deliveries?',       a: 'Most bundles land within 30 seconds. You can manually verify your reference from the wallet page if ever needed.' },
  { q: 'How does reselling work?',       a: 'Apply from your dashboard. Once approved, buy at wholesale and set your own selling price.' },
  { q: 'How do reseller payouts work?',  a: 'Request a payout to any mobile money number once you hit the minimum threshold. Fully trackable.' },
];

/* ─── FAQ Item ──────────────────────────────────────────────────────────── */
function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
          cursor: 'pointer', fontWeight: 700, background: 'none', border: 'none',
          width: '100%', textAlign: 'left', color: 'var(--text)', padding: '18px 0',
          fontFamily: 'var(--font-body)', fontSize: '0.96rem',
          transition: 'color 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--accent)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text)'}
      >
        {q}
        <span style={{
          width: 28, height: 28, borderRadius: '50%',
          background: open ? 'var(--accent)' : 'var(--surface-raised)',
          border: '1px solid var(--border)',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.2s',
        }}>
          <Icon name={open ? 'remove' : 'add'} size={16} />
        </span>
      </button>
      {open && (
        <p style={{ color: 'var(--text-dim)', paddingBottom: 18, fontSize: '0.9rem', lineHeight: 1.7, maxWidth: 620 }}>
          {a}
        </p>
      )}
    </div>
  );
}

/* ─── Mobile Menu ───────────────────────────────────────────────────────── */
function MobileMenu({ open, onClose }) {
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(5,8,20,0.85)',
          zIndex: 200, opacity: open ? 1 : 0, pointerEvents: open ? 'auto' : 'none',
          transition: 'opacity 0.25s', backdropFilter: 'blur(8px)',
        }}
      />
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, width: 290,
        background: 'var(--surface)', borderLeft: '1px solid var(--border)',
        zIndex: 201, padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 6,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.28s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
          <span style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: '1rem', color: 'var(--accent)' }}>
            Data Bay
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer' }}>
            <Icon name="close" size={22} />
          </button>
        </div>
        {[
          { to: '/guest-order',    label: 'Buy Data',          icon: 'shopping_cart' },
          { to: '/reseller/apply', label: 'Reseller',          icon: 'storefront' },
          { to: '/pricing',        label: 'Pricing',           icon: 'sell' },
          { to: '/contact',        label: 'Contact',           icon: 'mail' },
          { to: '/login',          label: 'Login',             icon: 'login' },
        ].map(({ to, label, icon }) => (
          <Link
            key={to}
            to={to}
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px',
              borderRadius: 8, color: 'var(--text)', fontWeight: 600,
              fontSize: '0.95rem', textDecoration: 'none', transition: 'background 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-raised)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <Icon name={icon} size={18} />{label}
          </Link>
        ))}
        <div style={{ marginTop: 'auto', paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <Link
            to="/register"
            onClick={onClose}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: 13, borderRadius: 8, background: 'var(--accent)', color: '#fff',
              fontWeight: 700, fontSize: '0.95rem', textDecoration: 'none',
            }}
          >
            <Icon name="person_add" size={18} />Register
          </Link>
        </div>
      </div>
    </>
  );
}

/* ─── Floating Card (animated on scroll) ───────────────────────────────── */
function FloatCard({ children, delay = 0, style = {} }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.12 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(28px)',
        transition: `opacity 0.55s ease ${delay}ms, transform 0.55s ease ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ─── Main Landing ──────────────────────────────────────────────────────── */
export default function Landing() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);

  return (
    <>
      {/* Fonts */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link
        href="https://fonts.googleapis.com/css2?family=Archivo:wght@600;700;800;900&family=Work+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,1,0&display=swap"
        rel="stylesheet"
      />

      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        :root {
          --bg:             #050B18;
          --surface:        #0A1628;
          --surface-raised: #0F1E3A;
          --surface-glow:   #112244;
          --border:         #1A2E50;
          --border-bright:  #243A64;
          --text:           #E8F0FF;
          --text-dim:       #7A9AC4;
          --text-faint:     #3D5A82;
          --accent:         #2C7BE5;
          --accent-dim:     #1A5FC8;
          --accent-bright:  #4A9BFF;
          --accent-soft:    rgba(44,123,229,0.14);
          --accent-border:  rgba(44,123,229,0.35);
          --accent-glow:    rgba(44,123,229,0.40);
          --green:          #10B981;
          --amber:          #F59E0B;
          --font-display:   'Archivo', sans-serif;
          --font-body:      'Work Sans', sans-serif;
          --font-mono:      'Space Mono', monospace;
        }

        body {
          background: var(--bg);
          color: var(--text);
          font-family: var(--font-body);
          font-size: 15px;
          line-height: 1.6;
          -webkit-font-smoothing: antialiased;
          overflow-x: hidden;
        }

        h1,h2,h3 { font-family: var(--font-display); font-weight: 800; line-height: 1.12; letter-spacing: -0.02em; }
        h1 { font-size: clamp(2.4rem, 5.5vw, 4rem); }
        h2 { font-size: clamp(1.6rem, 3.5vw, 2.2rem); }
        h3 { font-size: 1rem; font-weight: 700; }
        a  { color: var(--accent); text-decoration: none; }
        p  { margin: 0; }
        .material-symbols-rounded { font-family:'Material Symbols Rounded'; line-height:1; user-select:none; }

        /* ── Kente strip */
        .kente { height: 4px; background: linear-gradient(90deg,#FFCC00 0% 33.33%,#E4002B 33.33% 66.66%,#1657D6 66.66% 100%); }

        /* ── Nav */
        .nav {
          position: sticky; top: 0; z-index: 100;
          padding: 0 clamp(16px,4vw,60px); height: 68px;
          display: flex; align-items: center; justify-content: space-between; gap: 24px;
          background: rgba(5,11,24,0.90); backdrop-filter: blur(20px);
          border-bottom: 1px solid transparent;
          transition: border-color .2s, box-shadow .2s;
        }
        .nav--scrolled { border-bottom-color: var(--border); box-shadow: 0 4px 30px rgba(0,0,0,.6); }

        .nav__brand {
          font-family: var(--font-display); font-weight: 800; font-size: 1.05rem;
          color: var(--text); text-decoration: none;
          display: flex; align-items: center; gap: 10px;
        }
        .nav__brand-icon {
          width: 34px; height: 34px; border-radius: 8px;
          background: var(--accent);
          display: flex; align-items: center; justify-content: center;
          box-shadow: 0 0 18px var(--accent-glow);
        }
        .nav__links { display: flex; align-items: center; gap: 32px; }
        .nav__links a:not(.btn) {
          color: var(--text-dim); font-weight: 600; font-size: .88rem;
          transition: color .15s; text-decoration: none; position: relative;
        }
        .nav__links a:not(.btn):hover { color: var(--text); }
        .nav__links a.active:not(.btn)::after {
          content: ''; position: absolute; bottom: -4px; left: 0; right: 0;
          height: 2px; background: var(--accent); border-radius: 2px;
        }
        .nav__burger {
          display: none; background: none;
          border: 1px solid var(--border); border-radius: 8px;
          width: 40px; height: 40px; align-items: center; justify-content: center;
          color: var(--text-dim); cursor: pointer;
        }
        @media(max-width:800px){ .nav__links { display: none; } .nav__burger { display: inline-flex; } }

        /* ── Buttons */
        .btn {
          display: inline-flex; align-items: center; justify-content: center; gap: 8px;
          border: 1.5px solid transparent; border-radius: 10px;
          padding: 12px 22px; font-weight: 700; font-size: .9rem;
          cursor: pointer; transition: all .18s; font-family: var(--font-body);
          text-decoration: none;
        }
        .btn:active { transform: translateY(1px); }
        .btn--primary {
          background: var(--accent); color: #fff;
          box-shadow: 0 4px 20px var(--accent-glow);
        }
        .btn--primary:hover { background: var(--accent-dim); box-shadow: 0 6px 28px var(--accent-glow); transform: translateY(-1px); }
        .btn--outline {
          background: transparent; border-color: var(--accent-border);
          color: var(--text);
        }
        .btn--outline:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-soft); }
        .btn--lg { padding: 15px 30px; font-size: 1rem; border-radius: 12px; }
        .btn--ghost {
          background: rgba(255,255,255,0.06);
          border-color: rgba(255,255,255,0.15);
          color: #fff; backdrop-filter: blur(8px);
        }
        .btn--ghost:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.3); }

        /* ── Hover-lift effect */
        .hover-lift { transition: transform 0.22s ease, box-shadow 0.22s ease; }
        .hover-lift:hover { transform: translateY(-5px); box-shadow: 0 16px 40px rgba(0,0,0,0.4); }

        /* ── Pulse dot */
        .pulse-dot {
          width: 8px; height: 8px; border-radius: 50%; background: var(--green);
          animation: pulseDot 2s infinite;
        }
        @keyframes pulseDot { 0%,100%{opacity:1;box-shadow:0 0 0 0 rgba(16,185,129,0.5)} 50%{opacity:.8;box-shadow:0 0 0 6px transparent} }

        /* ── Hero */
        .hero-section {
          display: flex; flex-direction: column; align-items: center; text-align: center;
          padding: clamp(70px,10vh,120px) clamp(16px,4vw,40px) clamp(50px,8vh,90px);
          position: relative; overflow: hidden;
        }
        .hero-section::before {
          content: '';
          position: absolute; top: -200px; left: 50%; transform: translateX(-50%);
          width: 900px; height: 600px; border-radius: 50%;
          background: radial-gradient(ellipse, rgba(44,123,229,0.12) 0%, transparent 70%);
          pointer-events: none;
        }

        .hero-eyebrow {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--accent-soft); border: 1px solid var(--accent-border);
          border-radius: 999px; padding: 6px 16px;
          font-size: 0.73rem; font-weight: 700; color: var(--accent-bright);
          text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 26px;
          font-family: var(--font-mono);
        }

        .hero-title { margin-bottom: 22px; max-width: 700px; }
        .hero-title .accent { color: var(--accent-bright); display: block; }

        .hero-sub {
          color: var(--text-dim); font-size: 1.08rem; line-height: 1.7;
          max-width: 520px; margin-bottom: 36px;
        }

        .hero-actions { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; margin-bottom: 48px; }

        .hero-stats {
          display: flex; gap: clamp(24px,5vw,60px); justify-content: center; flex-wrap: wrap;
        }
        .hero-stat__value {
          font-family: var(--font-display); font-weight: 800;
          font-size: clamp(1.6rem,3vw,2.1rem); color: var(--accent-bright);
          line-height: 1;
        }
        .hero-stat__label {
          font-size: 0.72rem; color: var(--text-faint); font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.06em; margin-top: 4px;
        }
        .hero-stat + .hero-stat { position: relative; }
        .hero-stat + .hero-stat::before {
          content: ''; position: absolute; left: calc(-1 * clamp(12px,2.5vw,30px));
          top: 10%; bottom: 10%; width: 1px; background: var(--border);
        }

        /* ── Section wrapper */
        .section {
          max-width: 1160px; margin: 0 auto;
          padding: clamp(60px,8vw,100px) clamp(16px,4vw,40px);
        }
        .section-heading { text-align: center; margin-bottom: clamp(40px,5vw,60px); }
        .section-eyebrow {
          display: inline-block; color: var(--accent-bright);
          font-size: 0.7rem; font-weight: 700; text-transform: uppercase;
          letter-spacing: 0.12em; margin-bottom: 12px; font-family: var(--font-mono);
        }
        .section-sub { color: var(--text-dim); font-size: 0.96rem; margin-top: 10px; line-height: 1.65; }

        /* ── Network cards */
        .networks-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 18px; }
        @media(max-width:640px){ .networks-grid { grid-template-columns: 1fr; } }
        .network-card {
          border-radius: 16px; border: 1px solid var(--border);
          background: var(--surface);
          padding: 28px 24px 26px;
          display: flex; flex-direction: column; align-items: flex-start; gap: 14px;
          text-decoration: none; cursor: pointer;
          transition: border-color 0.22s, box-shadow 0.22s, transform 0.22s;
          position: relative; overflow: hidden;
        }
        .network-card:hover { transform: translateY(-5px); }

        .network-card__badge {
          display: inline-flex; align-items: center; gap: 6px;
          padding: 5px 14px; border-radius: 999px;
          font-size: 0.8rem; font-weight: 800; font-family: var(--font-display);
          border: 1px solid transparent; letter-spacing: 0.01em;
        }
        .network-card__name {
          font-family: var(--font-display); font-weight: 800; font-size: 1.25rem;
        }
        .network-card__desc { color: var(--text-dim); font-size: 0.88rem; line-height: 1.55; }
        .network-card__arrow {
          margin-top: auto; display: flex; align-items: center; gap: 6px;
          font-size: 0.82rem; font-weight: 700; transition: gap 0.2s;
        }
        .network-card:hover .network-card__arrow { gap: 10px; }

        /* ── Features grid */
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(230px,1fr)); gap: 18px; }
        .feature-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 28px 24px;
          transition: border-color 0.22s, transform 0.22s, box-shadow 0.22s;
        }
        .feature-card:hover { border-color: var(--accent-border); transform: translateY(-4px); box-shadow: 0 12px 36px rgba(0,0,0,0.35); }
        .feature-card__icon {
          width: 50px; height: 50px; border-radius: 12px;
          background: var(--accent-soft); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px; border: 1px solid var(--accent-border);
          transition: background 0.2s;
        }
        .feature-card:hover .feature-card__icon { background: var(--accent); color: #fff; }
        .feature-card h3 { margin-bottom: 8px; }
        .feature-card p  { color: var(--text-dim); font-size: 0.88rem; line-height: 1.65; }

        /* ── How it works — borderless stepper, cards stand on their own */
        .steps-row {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: clamp(16px, 3vw, 32px);
          position: relative;
        }
        .steps-line {
          position: absolute;
          top: 27px;
          left: 7%;
          right: 7%;
          height: 0;
          border-top: 1px dashed var(--border-bright);
          z-index: 0;
        }
        .step-item {
          flex: 1 1 0;
          min-width: 0;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 2px;
          position: relative;
          z-index: 1;
        }
        .step-item__circle {
          width: 56px; height: 56px; border-radius: 50%;
          background: var(--bg);
          border: 1.5px solid var(--accent-border);
          color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 18px;
          position: relative;
          transition: background 0.22s, border-color 0.22s, transform 0.22s, color 0.22s;
        }
        .step-item:hover .step-item__circle {
          background: var(--accent); border-color: var(--accent); color: #fff;
          transform: translateY(-3px);
        }
        .step-item__num {
          position: absolute; top: -4px; right: -4px;
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--accent); color: #fff;
          font-family: var(--font-mono); font-size: 0.62rem; font-weight: 700;
          display: flex; align-items: center; justify-content: center;
          border: 2px solid var(--bg);
        }
        .step-item h3 { margin-bottom: 6px; }
        .step-item p { color: var(--text-dim); font-size: 0.85rem; line-height: 1.6; max-width: 210px; }

        @media(max-width: 760px) {
          .steps-row { flex-direction: column; align-items: stretch; gap: 30px; }
          .steps-line { display: none; }
          .step-item {
            flex-direction: row; text-align: left; align-items: flex-start;
            gap: 16px; max-width: none;
          }
          .step-item__circle { margin-bottom: 0; flex-shrink: 0; }
          .step-item p { max-width: none; }
        }

        /* ── Reseller banner */
        .reseller-banner {
          background: linear-gradient(135deg, #0D2250 0%, #0A1A40 100%);
          border-radius: 20px; padding: clamp(36px,5vw,56px) clamp(24px,4vw,48px);
          display: flex; align-items: center; justify-content: space-between;
          gap: 28px; flex-wrap: wrap; position: relative; overflow: hidden;
          border: 1px solid var(--accent-border);
          box-shadow: 0 0 60px rgba(44,123,229,0.12);
        }
        .reseller-banner::after {
          content: '';
          position: absolute; top: 0; left: 0; right: 0; height: 3px;
          background: linear-gradient(90deg, var(--accent), #4A9BFF);
        }
        .reseller-banner__glow {
          position: absolute; right: -80px; top: -80px;
          width: 300px; height: 300px; border-radius: 50%;
          background: radial-gradient(circle, rgba(44,123,229,0.15) 0%, transparent 70%);
          pointer-events: none;
        }
        .reseller-banner h2 { color: #fff; margin-bottom: 10px; font-size: clamp(1.4rem,3vw,1.9rem); }
        .reseller-banner p  { color: var(--text-dim); font-size: 0.96rem; max-width: 420px; }
        @media(max-width:680px){ .reseller-banner { flex-direction: column; text-align: center; } }

        /* ── Testimonials */
        .testi-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px,1fr)); gap: 18px; }
        .testi-card {
          background: var(--surface); border: 1px solid var(--border);
          border-radius: 16px; padding: 26px; display: flex; flex-direction: column;
          transition: border-color 0.22s, transform 0.22s;
        }
        .testi-card:hover { border-color: var(--accent-border); transform: translateY(-4px); }
        .testi-stars { color: var(--amber); font-size: 0.84rem; letter-spacing: 3px; margin-bottom: 14px; }
        .testi-quote { color: var(--text); font-size: 0.94rem; line-height: 1.7; flex: 1; margin-bottom: 20px; font-style: italic; }
        .testi-meta { display: flex; align-items: center; gap: 12px; padding-top: 16px; border-top: 1px solid var(--border); }
        .testi-avatar {
          width: 38px; height: 38px; border-radius: 50%;
          background: var(--accent-soft); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 800; font-size: 0.88rem;
          border: 1.5px solid var(--accent-border); flex-shrink: 0;
        }
        .testi-name { font-weight: 700; font-size: 0.88rem; }
        .testi-role { font-size: 0.75rem; color: var(--text-faint); margin-top: 2px; }

        /* ── Paystack badge */
        .ps-badge {
          display: inline-flex; align-items: center; gap: 6px;
          background: rgba(0,192,125,0.1); border: 1px solid rgba(0,192,125,0.3);
          border-radius: 999px; padding: 5px 14px;
          font-size: 0.72rem; font-weight: 700; color: #00C07D; font-family: var(--font-mono);
        }

        /* ── Dark teal section (networks only) */
        .dark-section {
          background: linear-gradient(135deg, #060F22 0%, #08152E 100%);
          border-top: 1px solid var(--border); border-bottom: 1px solid var(--border);
        }

        /* ── Footer */
        .footer { background: var(--surface); border-top: 1px solid var(--border); padding: clamp(48px,6vw,72px) clamp(16px,4vw,40px) 0; }
        .footer__inner { max-width: 1160px; margin: 0 auto; }
        .footer__top { display: flex; justify-content: space-between; gap: 48px; flex-wrap: wrap; padding-bottom: 48px; }
        .footer__brand-name {
          font-family: var(--font-display); font-weight: 800; font-size: 1.05rem;
          color: var(--accent-bright); display: flex; align-items: center; gap: 9px; margin-bottom: 12px;
        }
        .footer__brand-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--accent); box-shadow: 0 0 8px var(--accent); }
        .footer__brand p { color: var(--text-dim); font-size: 0.88rem; line-height: 1.65; max-width: 280px; }
        .footer__links { display: flex; gap: 56px; flex-wrap: wrap; }
        .footer__col h4 { font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.1em; color: var(--text-faint); font-weight: 700; margin-bottom: 16px; }
        .footer__col a { display: block; color: var(--text-dim); font-size: 0.88rem; margin-bottom: 10px; font-weight: 500; transition: color .12s; }
        .footer__col a:hover { color: var(--accent-bright); }
        .footer__bottom {
          display: flex; justify-content: space-between; align-items: center;
          flex-wrap: wrap; gap: 12px; padding: 22px 0; border-top: 1px solid var(--border);
          color: var(--text-faint); font-size: 0.76rem; font-family: var(--font-mono);
        }
        @media(max-width:600px){ .footer__top{flex-direction:column} .footer__bottom{flex-direction:column;text-align:center} }

        /* ── Contact info row */
        .contact-info { display: flex; align-items: center; gap: 6px; color: var(--text-dim); font-size: 0.88rem; }
      `}</style>

      <div style={{ minHeight: '100vh', overflowX: 'hidden' }}>
        {/* Kente strip */}
        <div className="kente" />

        {/* NAV */}
        <nav className={`nav${scrolled ? ' nav--scrolled' : ''}`}>
          <Link to="/" className="nav__brand">
            <span className="nav__brand-icon">
              <Icon name="wifi" size={18} />
            </span>
            Data Bay <span style={{ color: 'var(--accent-bright)', marginLeft: 2 }}>Ghana</span>
          </Link>

          <div className="nav__links">
            <Link to="/" className="active">Home</Link>
            <Link to="/guest-order">Buy Data</Link>
            <Link to="/reseller/apply">Reseller</Link>
            <Link to="/pricing">Pricing</Link>
            <Link to="/contact">Contact</Link>
            <Link
              to="/login"
              style={{
                padding: '8px 18px', borderRadius: 8,
                border: '1.5px solid var(--border)',
                color: 'var(--text)', fontWeight: 700, transition: 'all .15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text)'; }}
            >
              Login
            </Link>
            <Link to="/register" className="btn btn--primary" style={{ padding: '8px 20px', borderRadius: 8 }}>
              Register
            </Link>
          </div>

          <button className="nav__burger" onClick={() => setMenuOpen(true)}>
            <Icon name="menu" size={22} />
          </button>
        </nav>

        <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />

        {/* ── HERO ── */}
        <section className="hero-section">
          <FloatCard delay={0}>
            <div className="hero-eyebrow">
              <span className="pulse-dot" />
              Trusted by thousands across Ghana
            </div>
          </FloatCard>

          <FloatCard delay={80}>
            <h1 className="hero-title">
              Buy Data
              <span className="accent">In Seconds.</span>
            </h1>
          </FloatCard>

          <FloatCard delay={160}>
            <p className="hero-sub">
              MTN, Telecel, and AirtelTigo bundles for any number — no queue, no kiosk.
            </p>
          </FloatCard>

          <FloatCard delay={240}>
            <div className="hero-actions">
              <Link to="/guest-order" className="btn btn--primary btn--lg">
                <Icon name="shopping_cart" size={20} />
                Buy Data
              </Link>
              <Link to="/reseller/apply" className="btn btn--ghost btn--lg">
                <Icon name="storefront" size={20} />
                Become a Reseller
              </Link>
            </div>
          </FloatCard>

          <FloatCard delay={320}>
            <div className="hero-stats">
              {[
                { value: '3',    label: 'Networks' },
                { value: '<30s', label: 'Delivery' },
                { value: '24/7', label: 'Self-Serve' },
              ].map((s, i) => (
                <div key={i} className={`hero-stat${i > 0 ? ' hero-stat' : ''}`} style={{ textAlign: 'center' }}>
                  <div className="hero-stat__value">{s.value}</div>
                  <div className="hero-stat__label">{s.label}</div>
                </div>
              ))}
            </div>
          </FloatCard>
        </section>

        {/* ── CHOOSE NETWORK ── */}
        <div className="dark-section">
          <div className="section">
            <div className="section-heading">
              <FloatCard>
                <span className="section-eyebrow">Supported Networks</span>
                <h2>Choose Network</h2>
                <p className="section-sub">All three major Ghanaian networks. One platform.</p>
              </FloatCard>
            </div>

            <div className="networks-grid">
              {NETWORKS.map((n, i) => (
                <FloatCard key={n.key} delay={i * 100}>
                  <Link
                    to={`/guest-order?network=${n.key}`}
                    className="network-card hover-lift"
                    style={{ borderColor: n.border }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = n.color;
                      e.currentTarget.style.boxShadow = `0 16px 40px ${n.bg.replace('0.10', '0.25')}`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = n.border;
                      e.currentTarget.style.boxShadow = '';
                    }}
                  >
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: n.color, borderRadius: '16px 16px 0 0' }} />

                    <div style={{ paddingTop: 6 }}>
                      <span
                        className="network-card__badge"
                        style={{ background: n.bg, borderColor: n.border, color: n.color }}
                      >
                        <Icon name="signal_cellular_alt" size={14} />
                        {n.label}
                      </span>
                    </div>

                    <div className="network-card__name" style={{ color: n.color }}>
                      {n.label}
                    </div>

                    <div className="network-card__desc">
                      Instant data bundles at wholesale prices. Any number, any size.
                    </div>

                    <div className="network-card__arrow" style={{ color: n.color }}>
                      Buy now <Icon name="arrow_forward" size={16} />
                    </div>
                  </Link>
                </FloatCard>
              ))}
            </div>
          </div>
        </div>

        {/* ── WHY CHOOSE US ── */}
        <div className="section">
          <div className="section-heading">
            <FloatCard>
              <span className="section-eyebrow">Why Choose Us</span>
              <h2>Why Data Bay Ghana</h2>
            </FloatCard>
          </div>

          <div className="features-grid">
            {FEATURES.map((f, i) => (
              <FloatCard key={f.title} delay={i * 90}>
                <div className="feature-card">
                  <div className="feature-card__icon">
                    <Icon name={f.icon} size={24} />
                  </div>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                </div>
              </FloatCard>
            ))}
          </div>
        </div>

        {/* ── RESELLER BANNER ── */}
        <div className="section" style={{ paddingTop: 0 }}>
          <FloatCard>
            <div className="reseller-banner">
              <div className="reseller-banner__glow" />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2>Start Your Reselling Journey</h2>
                <p style={{ marginTop: 10 }}>
                  Buy at wholesale, set your own margins, get paid to mobile money.
                </p>
              </div>
              <div style={{ position: 'relative', zIndex: 1, flexShrink: 0 }}>
                <Link to="/reseller/apply" className="btn btn--primary btn--lg">
                  <Icon name="storefront" size={20} />
                  Register Now
                  <Icon name="arrow_forward" size={18} />
                </Link>
              </div>
            </div>
          </FloatCard>
        </div>

        {/* ── HOW IT WORKS ── borderless stepper, no card background */}
        <div className="section">
          <div className="section-heading">
            <FloatCard>
              <span className="section-eyebrow">How It Works</span>
              <h2>Wallet to bundle in four steps</h2>
            </FloatCard>
          </div>

          <div className="steps-row">
            <div className="steps-line" />
            {STEPS.map((s, i) => (
              <FloatCard key={s.title} delay={i * 100} style={{ flex: '1 1 0', minWidth: 0 }}>
                <div className="step-item">
                  <div className="step-item__circle">
                    <Icon name={s.icon} size={22} />
                    <span className="step-item__num">{i + 1}</span>
                  </div>
                  <h3>{s.title}</h3>
                  <p>{s.text}</p>
                </div>
              </FloatCard>
            ))}
          </div>
        </div>

        {/* ── TESTIMONIALS ── */}
        <div className="section" style={{ paddingTop: 0 }}>
          <div className="section-heading">
            <FloatCard>
              <span className="section-eyebrow">Customers &amp; Resellers</span>
              <h2>What people are saying</h2>
            </FloatCard>
          </div>

          <div className="testi-grid">
            {TESTIMONIALS.map((t, i) => (
              <FloatCard key={t.name} delay={i * 100}>
                <div className="testi-card">
                  <div className="testi-stars">★★★★★</div>
                  <p className="testi-quote">"{t.quote}"</p>
                  <div className="testi-meta">
                    <div className="testi-avatar">{t.initial}</div>
                    <div>
                      <div className="testi-name">{t.name}</div>
                      <div className="testi-role">{t.role}</div>
                    </div>
                  </div>
                </div>
              </FloatCard>
            ))}
          </div>
        </div>

        {/* ── FAQ ── */}
        <div className="dark-section">
          <div className="section">
            <div className="section-heading">
              <FloatCard>
                <span className="section-eyebrow">FAQ</span>
                <h2>Good to know</h2>
              </FloatCard>
            </div>
            <FloatCard delay={100}>
              <div style={{ maxWidth: 700, margin: '0 auto' }}>
                {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
              </div>
            </FloatCard>
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="footer">
          <div className="footer__inner">
            <div className="footer__top">
              <div>
                <div className="footer__brand-name">
                  <span className="footer__brand-dot" />
                  Data Bay Ghana
                </div>
                <p style={{ color: 'var(--text-dim)', fontSize: '.88rem', lineHeight: 1.65, maxWidth: 280 }}>
                  Instant MTN, Telecel, and AirtelTigo data bundles — for everyday customers and resellers alike.
                </p>
                <div style={{ marginTop: 18 }}>
                  <span className="ps-badge">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" fill="rgba(0,192,125,0.2)" />
                      <path d="M8 12l3 3 5-5" stroke="#00C07D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Paystack secured
                  </span>
                </div>
              </div>

              <div className="footer__links">
                <div className="footer__col">
                  <h4>Quick Links</h4>
                  <Link to="/">Home</Link>
                  <Link to="/guest-order">Buy Data</Link>
                  <Link to="/reseller/apply">Reseller</Link>
                  <Link to="/pricing">Pricing</Link>
                  <Link to="/contact">Contact</Link>
                </div>
                <div className="footer__col">
                  <h4>Support</h4>
                  <Link to="/faq">FAQ</Link>
                  <Link to="/terms">Terms</Link>
                  <Link to="/privacy">Privacy Policy</Link>
                </div>
                <div className="footer__col">
                  <h4>Contact Us</h4>
                  <div className="contact-info">
                    <Icon name="phone" size={14} />
                    055 123 4567
                  </div>
                  <div className="contact-info" style={{ marginTop: 8 }}>
                    <Icon name="mail" size={14} />
                    info@databaygh.com
                  </div>
                  <div className="contact-info" style={{ marginTop: 8 }}>
                    <Icon name="location_on" size={14} />
                    Accra, Ghana
                  </div>
                </div>
              </div>
            </div>

            <div className="footer__bottom">
              <span>© {new Date().getFullYear()} Data Bay Ghana. All rights reserved.</span>
              <span style={{ display: 'flex', gap: 16 }}>
                <Link to="/privacy" style={{ color: 'var(--text-faint)', textDecoration: 'none' }}>Privacy</Link>
                <Link to="/terms"   style={{ color: 'var(--text-faint)', textDecoration: 'none' }}>Terms</Link>
              </span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}