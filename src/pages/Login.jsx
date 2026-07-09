import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth, apiErrorMessage } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';

const Icon = ({ name, size = 18 }) => (
  <span className="material-symbols-rounded" style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', verticalAlign: 'middle' }}>{name}</span>
);

export default function Login() {
  const { login } = useAuth();
  const notify = useNotify();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [busy, setBusy] = useState(false);

  const up = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await login(form);
      notify.success('Welcome back!');
      navigate(location.state?.from || '/dashboard', { replace: true });
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Invalid email or password.'));
    } finally { setBusy(false); }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo:wght@700;800;900&family=Work+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@20..48,400,1,0&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #040C1E; --surface: #081224; --surface-raised: #0C1A32;
          --border: #162B4A; --border-lit: #1E3B68;
          --text: #EAF0FF; --text-dim: #6E8FB8; --text-faint: #344E72;
          --accent: #2563EB; --accent-hi: #3B82F6; --accent-bright: #60A5FA;
          --accent-soft: rgba(59,130,246,0.12); --accent-border: rgba(59,130,246,0.30); --accent-glow: rgba(59,130,246,0.35);
          --green: #10B981; --red: #EF4444;
          --font-display: 'Archivo', sans-serif; --font-body: 'Work Sans', sans-serif; --font-mono: 'Space Mono', monospace;
        }
        body { background: var(--bg); color: var(--text); font-family: var(--font-body); font-size: 15px; -webkit-font-smoothing: antialiased; min-height: 100svh; }
        h1,h2 { font-family: var(--font-display); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
        a { color: var(--accent-bright); text-decoration: none; }
        a:hover { text-decoration: underline; }
        .material-symbols-rounded { font-family: 'Material Symbols Rounded'; line-height: 1; user-select: none; }

        /* LAYOUT — split */
        .login-page { min-height: 100svh; display: grid; grid-template-columns: 1fr 1fr; }
        @media(max-width:860px){ .login-page { grid-template-columns: 1fr; } }

        /* LEFT — cinematic image panel */
        .login-visual {
          position: relative; overflow: hidden;
          background: #050e1c;
        }
        @media(max-width:860px){ .login-visual { display: none; } }
        .login-visual__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; filter: brightness(0.45) saturate(0.7); }
        .login-visual__overlay { position: absolute; inset: 0; background: linear-gradient(135deg, rgba(4,12,30,0.85) 0%, rgba(4,12,30,0.3) 100%); }
        .login-visual__content { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 40px; }
        .login-kente { height: 4px; background: linear-gradient(90deg,#FFCC00 0% 33.33%,#E4002B 33.33% 66.66%,#1657D6 66.66% 100%); flex-shrink: 0; }
        .login-visual__brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .login-visual__brand-icon { width: 38px; height: 38px; border-radius: 10px; background: var(--accent); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px var(--accent-glow); }
        .login-visual__brand-name { font-family: var(--font-display); font-weight: 800; font-size: 1.05rem; color: #fff; }
        .login-visual__brand-name span { color: var(--accent-bright); }
        .login-visual__bottom { }
        .login-visual__quote { font-family: var(--font-display); font-weight: 700; font-size: clamp(1.3rem,2.2vw,1.8rem); color: #fff; line-height: 1.25; margin-bottom: 16px; }
        .login-visual__quote em { color: var(--accent-bright); font-style: normal; display: block; }
        .login-visual__sub { color: rgba(255,255,255,0.55); font-size: 0.88rem; line-height: 1.6; max-width: 300px; }

        /* Network live pills */
        .live-pills { display: flex; flex-direction: column; gap: 8px; margin-bottom: 32px; }
        .live-pill { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 12px; background: rgba(255,255,255,0.06); border: 1px solid rgba(255,255,255,0.1); backdrop-filter: blur(8px); }
        .live-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; animation: blink 2.2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }
        .live-pill__label { font-family: var(--font-display); font-weight: 800; font-size: 0.82rem; }
        .live-pill__status { font-family: var(--font-mono); font-size: 0.62rem; color: rgba(255,255,255,0.4); margin-left: auto; }

        /* RIGHT — form */
        .login-right { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: clamp(40px,6vw,60px) clamp(24px,5vw,60px); background: var(--bg); position: relative; overflow: hidden; }
        .login-right::before { content: ''; position: absolute; top: -180px; right: -120px; width: 500px; height: 500px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.08) 0%, transparent 65%); pointer-events: none; }
        .login-right::after { content: ''; position: absolute; bottom: -100px; left: -100px; width: 300px; height: 300px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.05) 0%, transparent 65%); pointer-events: none; }

        /* Mobile brand */
        .mobile-brand { display: none; align-items: center; gap: 10px; margin-bottom: 32px; text-decoration: none; }
        @media(max-width:860px){ .mobile-brand { display: flex; } }
        .mobile-brand__icon { width: 36px; height: 36px; border-radius: 9px; background: var(--accent); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px var(--accent-glow); }
        .mobile-brand__name { font-family: var(--font-display); font-weight: 800; font-size: 1rem; color: var(--text); }
        .mobile-brand__name span { color: var(--accent-bright); }
        .mobile-kente { display: none; height: 4px; background: linear-gradient(90deg,#FFCC00 0% 33.33%,#E4002B 33.33% 66.66%,#1657D6 66.66% 100%); }
        @media(max-width:860px){ .mobile-kente { display: block; } }

        /* Form box */
        .form-box { width: 100%; max-width: 400px; position: relative; z-index: 1; }
        .form-box h1 { font-size: clamp(1.6rem,3vw,2rem); margin-bottom: 6px; }
        .form-box__sub { color: var(--text-dim); font-size: 0.9rem; line-height: 1.55; margin-bottom: 32px; }

        /* Fields */
        .fields { display: flex; flex-direction: column; gap: 18px; }
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field__label { font-size: 0.74rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.07em; display: flex; justify-content: space-between; align-items: center; }
        .field__wrap { position: relative; }
        .field input { width: 100%; padding: 14px 16px; border-radius: 12px; background: var(--surface-raised); border: 1.5px solid var(--border-lit); color: var(--text); font-family: var(--font-body); font-size: 0.95rem; outline: none; transition: border-color .15s, box-shadow .15s; }
        .field input:focus { border-color: var(--accent-hi); box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
        .field input::placeholder { color: var(--text-faint); }
        .field__eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-faint); cursor: pointer; display: flex; align-items: center; transition: color .15s; padding: 2px; }
        .field__eye:hover { color: var(--text-dim); }

        /* Submit */
        .btn-go { width: 100%; padding: 14px; border: none; border-radius: 12px; background: var(--accent); color: #fff; font-family: var(--font-display); font-weight: 800; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 24px var(--accent-glow); transition: background .15s, transform .15s, box-shadow .15s; }
        .btn-go:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 8px 32px var(--accent-glow); }
        .btn-go:disabled { opacity: .5; cursor: not-allowed; }
        .spin { width: 17px; height: 17px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff; animation: _spin .7s linear infinite; flex-shrink: 0; }
        @keyframes _spin { to { transform: rotate(360deg); } }

        /* Divider */
        .divider { display: flex; align-items: center; gap: 12px; color: var(--text-faint); font-size: 0.75rem; font-family: var(--font-mono); }
        .divider::before, .divider::after { content: ''; flex: 1; height: 1px; background: var(--border-lit); }

        /* Social button */
        .btn-social { width: 100%; padding: 13px; border-radius: 12px; background: var(--surface-raised); border: 1.5px solid var(--border-lit); color: var(--text-dim); font-family: var(--font-body); font-weight: 600; font-size: 0.9rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 10px; transition: border-color .15s, color .15s; }
        .btn-social:hover { border-color: var(--accent-border); color: var(--text); }

        /* Trust badges */
        .trust-row { display: flex; align-items: center; justify-content: center; gap: 18px; flex-wrap: wrap; margin-top: 28px; padding-top: 22px; border-top: 1px solid var(--border); }
        .trust-badge { display: flex; align-items: center; gap: 6px; font-size: 0.72rem; color: var(--text-faint); font-family: var(--font-mono); }

        .foot-link { text-align: center; margin-top: 22px; font-size: 0.86rem; color: var(--text-faint); }
        .foot-link a { color: var(--accent-bright); font-weight: 700; }

        /* Floating label effect on focus */
        .field input:focus + .field__focus-ring { opacity: 1; }
      `}</style>

      <div className="mobile-kente" />
      <div className="login-page">

        {/* LEFT — image + brand */}
        <div className="login-visual">
          <div className="login-kente" />
          <img className="login-visual__img" src="https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=900&q=80" alt="Person on phone" />
          <div className="login-visual__overlay" />
          <div className="login-visual__content">
            <Link to="/" className="login-visual__brand">
              <span className="login-visual__brand-icon"><Icon name="wifi" size={18} /></span>
              <span className="login-visual__brand-name">Data Bay <span>Ghana</span></span>
            </Link>

            <div>
              <div className="live-pills">
                {[
                  { label: 'MTN', color: '#FFCC00' },
                  { label: 'Telecel', color: '#FF4060' },
                  { label: 'AirtelTigo', color: '#5B8FFF' },
                ].map(n => (
                  <div key={n.label} className="live-pill">
                    <span className="live-dot" style={{ background: n.color }} />
                    <span className="live-pill__label" style={{ color: n.color }}>{n.label}</span>
                    <span className="live-pill__status">● LIVE</span>
                  </div>
                ))}
              </div>
              <div className="login-visual__bottom">
                <div className="login-visual__quote">
                  Buy data.<br />
                  <em>Be done in 30 seconds.</em>
                </div>
                <div className="login-visual__sub">One wallet for MTN, Telecel and AirtelTigo. Any number, any time.</div>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="login-right">
          <div className="form-box">
            <Link to="/" className="mobile-brand">
              <span className="mobile-brand__icon"><Icon name="wifi" size={16} /></span>
              <span className="mobile-brand__name">Data Bay <span>Ghana</span></span>
            </Link>

            <h1>Welcome back</h1>
            <p className="form-box__sub">Sign in to buy bundles, top up your wallet, or manage your reseller account.</p>

            <form onSubmit={submit}>
              <div className="fields">
                <div className="field">
                  <div className="field__label">Email address</div>
                  <div className="field__wrap">
                    <input type="email" required value={form.email} onChange={up('email')} placeholder="you@example.com" autoComplete="email" />
                  </div>
                </div>

                <div className="field">
                  <div className="field__label">
                    <span>Password</span>
                    <Link to="/reset-password" style={{ fontSize: '0.76rem', textTransform: 'none', letterSpacing: 0, fontWeight: 600 }}>Forgot?</Link>
                  </div>
                  <div className="field__wrap">
                    <input type={showPwd ? 'text' : 'password'} required value={form.password} onChange={up('password')} placeholder="••••••••" autoComplete="current-password" style={{ paddingRight: 44 }} />
                    <button type="button" className="field__eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                      <Icon name={showPwd ? 'visibility_off' : 'visibility'} size={18} />
                    </button>
                  </div>
                </div>

                <button className="btn-go" type="submit" disabled={busy}>
                  {busy ? <><span className="spin" />Signing in…</> : <><Icon name="login" size={18} />Sign in</>}
                </button>

                <div className="divider">or continue with</div>
              </div>
            </form>

            <div className="trust-row">
              <div className="trust-badge"><Icon name="lock" size={13} />Encrypted</div>
              <div className="trust-badge"><Icon name="verified_user" size={13} />Paystack</div>
              <div className="trust-badge"><Icon name="schedule" size={13} />24/7 live</div>
            </div>

            <div className="foot-link">
              Don't have an account? <Link to="/register">Create one free →</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}