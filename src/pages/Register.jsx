import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth, apiErrorMessage } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';

const Icon = ({ name, size = 18 }) => (
  <span className="material-symbols-rounded" style={{ fontSize: size, lineHeight: 1, display: 'inline-flex', verticalAlign: 'middle' }}>{name}</span>
);

const PHONE_PATTERN = /^0[2359]\d{8}$/;

function pwdStrength(p) {
  if (!p) return 0;
  let s = 0;
  if (p.length >= 8) s++;
  if (p.length >= 12) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const STR_LABEL = ['', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
const STR_COLOR = ['', '#EF4444', '#F59E0B', '#3B82F6', '#10B981', '#10B981'];

export default function Register() {
  const { register } = useAuth();
  const notify = useNotify();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [showCfm, setShowCfm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [agreed, setAgreed] = useState(false);

  const up = (k) => (e) => { setForm(f => ({ ...f, [k]: e.target.value })); if (errors[k]) setErrors(v => ({ ...v, [k]: undefined })); };

  const validateStep1 = () => {
    const errs = {};
    if (form.fullName.trim().length < 2)     errs.fullName = 'Enter your full name.';
    if (!/^\S+@\S+\.\S+$/.test(form.email)) errs.email    = 'Enter a valid email address.';
    if (!PHONE_PATTERN.test(form.phone))     errs.phone    = 'Use a Ghana number e.g. 024xxxxxxx.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs = {};
    if (form.password.length < 8)              errs.password        = 'At least 8 characters required.';
    if (form.password !== form.confirmPassword) errs.confirmPassword = 'Passwords do not match.';
    if (!agreed)                               errs.agreed          = 'Please accept the terms to continue.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const nextStep = () => { if (validateStep1()) setStep(2); };

  const submit = async (e) => {
    e.preventDefault();
    if (!validateStep2()) return;
    setBusy(true);
    try {
      await register(form);
      notify.success('Account created — welcome to Data Bay Ghana!');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not create your account.'));
    } finally { setBusy(false); }
  };

  const strength = pwdStrength(form.password);

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
          --green: #10B981; --green-soft: rgba(16,185,129,0.12); --red: #EF4444;
          --font-display: 'Archivo', sans-serif; --font-body: 'Work Sans', sans-serif; --font-mono: 'Space Mono', monospace;
        }
        body { background: var(--bg); color: var(--text); font-family: var(--font-body); font-size: 15px; line-height: 1.6; -webkit-font-smoothing: antialiased; min-height: 100svh; }
        h1,h2 { font-family: var(--font-display); font-weight: 800; line-height: 1.1; letter-spacing: -0.02em; }
        a { color: var(--accent-bright); text-decoration: none; }
        a:hover { text-decoration: underline; }
        .material-symbols-rounded { font-family: 'Material Symbols Rounded'; line-height: 1; user-select: none; }

        /* PAGE SPLIT */
        .reg-page { min-height: 100svh; display: grid; grid-template-columns: 1fr 1.1fr; }
        @media(max-width:920px){ .reg-page { grid-template-columns: 1fr; } }

        /* KENTE */
        .kente { height: 4px; background: linear-gradient(90deg,#FFCC00 0% 33.33%,#E4002B 33.33% 66.66%,#1657D6 66.66% 100%); }

        /* LEFT — photo panel */
        .reg-visual { position: relative; overflow: hidden; background: #030810; }
        @media(max-width:920px){ .reg-visual { display: none; } }
        .reg-visual__img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center top; filter: brightness(0.38) saturate(0.65); }
        .reg-visual__overlay { position: absolute; inset: 0; background: linear-gradient(160deg, rgba(4,12,30,0.7) 0%, rgba(4,12,30,0.2) 60%, rgba(4,12,30,0.85) 100%); }
        .reg-visual__content { position: relative; z-index: 2; height: 100%; display: flex; flex-direction: column; padding: 0; }
        .reg-visual__top { padding: 36px 40px; }
        .reg-visual__brand { display: flex; align-items: center; gap: 10px; text-decoration: none; }
        .reg-visual__brand-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--accent); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px var(--accent-glow); }
        .reg-visual__brand-name { font-family: var(--font-display); font-weight: 800; font-size: 1rem; color: #fff; }
        .reg-visual__brand-name span { color: var(--accent-bright); }
        .reg-visual__mid { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; padding: 40px; }
        .reg-visual__headline { font-family: var(--font-display); font-weight: 900; font-size: clamp(1.7rem, 2.2vw, 2.5rem); color: #fff; line-height: 1.08; letter-spacing: -0.03em; margin-bottom: 12px; }
        .reg-visual__headline em { color: var(--accent-bright); font-style: normal; display: block; }
        .reg-visual__sub { color: rgba(255,255,255,0.5); font-size: 0.88rem; line-height: 1.65; max-width: 280px; margin-bottom: 32px; }

        /* Network stack */
        .net-stack { display: flex; flex-direction: column; gap: 8px; margin-bottom: 36px; }
        .net-row { display: flex; align-items: center; gap: 12px; padding: 12px 16px; border-radius: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.08); backdrop-filter: blur(8px); position: relative; overflow: hidden; transition: background 0.2s; }
        .net-row:hover { background: rgba(255,255,255,0.09); }
        .net-row__bar { position: absolute; left: 0; top: 0; bottom: 0; width: 3px; border-radius: 3px 0 0 3px; }
        .net-row__logo { width: 36px; height: 36px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: var(--font-display); font-weight: 900; font-size: 0.68rem; flex-shrink: 0; }
        .net-row__info { flex: 1; }
        .net-row__name { font-family: var(--font-display); font-weight: 800; font-size: 0.88rem; line-height: 1; margin-bottom: 2px; }
        .net-row__desc { font-size: 0.72rem; color: rgba(255,255,255,0.4); }
        .net-row__pill { display: inline-flex; align-items: center; gap: 5px; padding: 3px 10px; border-radius: 999px; font-size: 0.62rem; font-weight: 700; font-family: var(--font-mono); white-space: nowrap; }
        .pulse-dot { width: 5px; height: 5px; border-radius: 50%; animation: blink 2.2s infinite; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.3} }

        /* Stat row */
        .reg-stats { display: flex; border: 1px solid rgba(255,255,255,0.1); border-radius: 14px; overflow: hidden; }
        .reg-stat { flex: 1; padding: 14px 12px; text-align: center; position: relative; }
        .reg-stat + .reg-stat::before { content: ''; position: absolute; left: 0; top: 20%; bottom: 20%; width: 1px; background: rgba(255,255,255,0.1); }
        .reg-stat__val { font-family: var(--font-display); font-weight: 900; font-size: 1.3rem; color: var(--accent-bright); line-height: 1; }
        .reg-stat__lbl { font-size: 0.64rem; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.06em; font-weight: 700; margin-top: 4px; }

        /* RIGHT — form */
        .reg-right { display: flex; flex-direction: column; background: var(--bg); position: relative; overflow: hidden; }
        .reg-right::before { content: ''; position: absolute; top: -200px; right: -150px; width: 600px; height: 600px; border-radius: 50%; background: radial-gradient(circle, rgba(37,99,235,0.07) 0%, transparent 65%); pointer-events: none; }
        .reg-right__inner { position: relative; z-index: 1; flex: 1; display: flex; flex-direction: column; padding: clamp(32px,5vw,56px) clamp(20px,5vw,56px); max-width: 520px; margin: 0 auto; width: 100%; }

        /* Mobile brand */
        .mobile-brand { display: none; align-items: center; gap: 10px; margin-bottom: 24px; text-decoration: none; }
        @media(max-width:920px){ .mobile-brand { display: flex; } }
        .mobile-brand__icon { width: 34px; height: 34px; border-radius: 9px; background: var(--accent); display: flex; align-items: center; justify-content: center; box-shadow: 0 0 16px var(--accent-glow); }
        .mobile-brand__name { font-family: var(--font-display); font-weight: 800; font-size: 1rem; color: var(--text); }
        .mobile-brand__name span { color: var(--accent-bright); }
        .mobile-kente { display: none; height: 4px; background: linear-gradient(90deg,#FFCC00 0% 33.33%,#E4002B 33.33% 66.66%,#1657D6 66.66% 100%); }
        @media(max-width:920px){ .mobile-kente { display: block; } }

        /* Step tracker */
        .step-track { display: flex; align-items: center; margin-bottom: 32px; }
        .step-node { display: flex; align-items: center; gap: 10px; }
        .step-circle { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: var(--font-mono); font-size: 0.74rem; font-weight: 700; transition: all .25s; flex-shrink: 0; }
        .step-circle.done { background: var(--green-soft); border: 1.5px solid rgba(16,185,129,0.4); color: var(--green); }
        .step-circle.active { background: var(--accent); border: 1.5px solid var(--accent); color: #fff; box-shadow: 0 0 14px var(--accent-glow); }
        .step-circle.idle { background: var(--surface-raised); border: 1.5px solid var(--border-lit); color: var(--text-faint); }
        .step-label { font-size: 0.74rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .step-label.active { color: var(--text); }
        .step-label.idle   { color: var(--text-faint); }
        .step-label.done   { color: var(--green); }
        .step-line { flex: 1; height: 1.5px; background: var(--border-lit); margin: 0 12px; }
        .step-line.done { background: var(--green); }

        /* Heading */
        .reg-heading { margin-bottom: 6px; font-size: clamp(1.4rem, 3vw, 1.8rem); }
        .reg-sub { color: var(--text-dim); font-size: 0.9rem; line-height: 1.55; margin-bottom: 28px; }

        /* Fields */
        .fields { display: flex; flex-direction: column; gap: 16px; }
        .fields-row { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
        @media(max-width:480px){ .fields-row { grid-template-columns: 1fr; } }
        .field { display: flex; flex-direction: column; gap: 7px; }
        .field__label { font-size: 0.74rem; font-weight: 700; color: var(--text-dim); text-transform: uppercase; letter-spacing: 0.07em; display: flex; justify-content: space-between; align-items: center; }
        .field__wrap { position: relative; }
        .field input { width: 100%; padding: 13px 16px; border-radius: 12px; background: var(--surface-raised); border: 1.5px solid var(--border-lit); color: var(--text); font-family: var(--font-body); font-size: 0.95rem; outline: none; transition: border-color .15s, box-shadow .15s; }
        .field input:focus { border-color: var(--accent-hi); box-shadow: 0 0 0 3px rgba(59,130,246,.15); }
        .field input.err { border-color: var(--red); }
        .field input.err:focus { box-shadow: 0 0 0 3px rgba(239,68,68,.15); }
        .field input::placeholder { color: var(--text-faint); }
        .field__eye { position: absolute; right: 14px; top: 50%; transform: translateY(-50%); background: none; border: none; color: var(--text-faint); cursor: pointer; display: flex; align-items: center; transition: color .15s; padding: 2px; }
        .field__eye:hover { color: var(--text-dim); }
        .field__err { font-size: 0.78rem; color: var(--red); font-weight: 600; display: flex; align-items: center; gap: 4px; }
        .field__hint { font-size: 0.76rem; color: var(--text-faint); }
        .field__ok { font-size: 0.76rem; color: var(--green); font-weight: 700; display: flex; align-items: center; gap: 4px; }

        /* Password strength */
        .str-bars { display: flex; gap: 4px; margin-top: 8px; }
        .str-bar { flex: 1; height: 3px; border-radius: 2px; background: var(--border-lit); transition: background .25s; }
        .str-label { font-size: 0.74rem; font-weight: 700; margin-top: 4px; }

        /* Terms */
        .terms-row { display: flex; align-items: flex-start; gap: 12px; padding: 14px 16px; border-radius: 12px; background: var(--surface-raised); border: 1.5px solid var(--border-lit); cursor: pointer; transition: border-color .15s; }
        .terms-row:hover { border-color: var(--accent-border); }
        .terms-row input[type=checkbox] { margin-top: 1px; accent-color: var(--accent); cursor: pointer; width: 16px; height: 16px; flex-shrink: 0; }
        .terms-row span { font-size: 0.86rem; color: var(--text-dim); line-height: 1.55; }

        /* Buttons */
        .btn-go { width: 100%; padding: 14px; border: none; border-radius: 12px; background: var(--accent); color: #fff; font-family: var(--font-display); font-weight: 800; font-size: 1rem; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 4px 24px var(--accent-glow); transition: background .15s, transform .15s, box-shadow .15s; }
        .btn-go:hover:not(:disabled) { background: #1d4ed8; transform: translateY(-2px); box-shadow: 0 8px 32px var(--accent-glow); }
        .btn-go:disabled { opacity: .5; cursor: not-allowed; }
        .btn-back { display: inline-flex; align-items: center; gap: 6px; background: none; border: 1.5px solid var(--border-lit); border-radius: 12px; color: var(--text-dim); font-family: var(--font-body); font-weight: 700; font-size: 0.88rem; padding: 10px 18px; cursor: pointer; transition: border-color .15s, color .15s; }
        .btn-back:hover { border-color: var(--accent-border); color: var(--accent-bright); }
        .spin { width: 17px; height: 17px; border-radius: 50%; border: 2.5px solid rgba(255,255,255,.3); border-top-color: #fff; animation: _spin .7s linear infinite; flex-shrink: 0; }
        @keyframes _spin { to { transform: rotate(360deg); } }

        /* Footer link */
        .reg-foot { display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); font-size: 0.86rem; color: var(--text-faint); }
        .reg-foot a { color: var(--accent-bright); font-weight: 700; }
      `}</style>

      <div className="mobile-kente" />
      <div className="reg-page">

        {/* LEFT — visual */}
        <div className="reg-visual">
          <div className="kente" />
          <img className="reg-visual__img" src="https://images.unsplash.com/photo-1556742031-c6961e8560b0?w=900&q=80" alt="Mobile payment" />
          <div className="reg-visual__overlay" />
          <div className="reg-visual__content">
            <div className="reg-visual__top">
              <Link to="/" className="reg-visual__brand">
                <span className="reg-visual__brand-icon"><Icon name="wifi" size={18} /></span>
                <span className="reg-visual__brand-name">Data Bay <span>Ghana</span></span>
              </Link>
            </div>
            <div className="reg-visual__mid">
              <h2 className="reg-visual__headline">
                One account.<br />
                <em>All the data.</em>
              </h2>
              <p className="reg-visual__sub">Instant bundles for every major Ghanaian network — from a single wallet, any time of day.</p>

              <div className="net-stack">
                {[
                  { label: 'MTN', desc: 'Nationwide 4G', color: '#FFCC00', bg: 'rgba(255,204,0,0.12)', border: 'rgba(255,204,0,0.3)', abbr: 'MTN' },
                  { label: 'Telecel', desc: 'Fast urban coverage', color: '#FF4060', bg: 'rgba(228,0,43,0.12)', border: 'rgba(228,0,43,0.3)', abbr: 'TEL' },
                  { label: 'AirtelTigo', desc: 'Great value bundles', color: '#5B8FFF', bg: 'rgba(22,87,214,0.12)', border: 'rgba(22,87,214,0.3)', abbr: 'AT' },
                ].map(n => (
                  <div key={n.label} className="net-row">
                    <div className="net-row__bar" style={{ background: n.color }} />
                    <div className="net-row__logo" style={{ background: n.bg, border: `1.5px solid ${n.border}`, color: n.color }}>{n.abbr}</div>
                    <div className="net-row__info">
                      <div className="net-row__name" style={{ color: n.color }}>{n.label}</div>
                      <div className="net-row__desc">{n.desc}</div>
                    </div>
                    <div className="net-row__pill" style={{ background: `${n.color}14`, border: `1px solid ${n.color}40`, color: n.color }}>
                      <span className="pulse-dot" style={{ background: n.color }} />Live
                    </div>
                  </div>
                ))}
              </div>

              <div className="reg-stats">
                {[{ v: '3', l: 'Networks' }, { v: '<30s', l: 'Delivery' }, { v: '24/7', l: 'Top-ups' }].map(s => (
                  <div key={s.l} className="reg-stat">
                    <div className="reg-stat__val">{s.v}</div>
                    <div className="reg-stat__lbl">{s.l}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — form */}
        <div className="reg-right">
          <div className="reg-right__inner">
            <Link to="/" className="mobile-brand">
              <span className="mobile-brand__icon"><Icon name="wifi" size={16} /></span>
              <span className="mobile-brand__name">Data Bay <span>Ghana</span></span>
            </Link>

            {/* Step tracker */}
            <div className="step-track">
              <div className="step-node">
                <div className={`step-circle ${step > 1 ? 'done' : 'active'}`}>
                  {step > 1 ? <Icon name="check" size={15} /> : '01'}
                </div>
                <span className={`step-label ${step > 1 ? 'done' : 'active'}`}>{step > 1 ? 'Personal' : 'Your details'}</span>
              </div>
              <div className={`step-line ${step > 1 ? 'done' : ''}`} />
              <div className="step-node">
                <div className={`step-circle ${step === 2 ? 'active' : 'idle'}`}>02</div>
                <span className={`step-label ${step === 2 ? 'active' : 'idle'}`}>Set password</span>
              </div>
            </div>

            {/* STEP 1 */}
            {step === 1 && (
              <>
                <h1 className="reg-heading">Create your account</h1>
                <p className="reg-sub">Start with your name and contact details. Takes less than a minute.</p>
                <div className="fields">
                  <div className="fields-row">
                    <div className="field">
                      <div className="field__label">Full name</div>
                      <div className="field__wrap">
                        <input value={form.fullName} onChange={up('fullName')} placeholder="Ama Owusu" autoComplete="name" className={errors.fullName ? 'err' : ''} />
                      </div>
                      {errors.fullName && <span className="field__err"><Icon name="error" size={13} />{errors.fullName}</span>}
                    </div>
                    <div className="field">
                      <div className="field__label">Phone number</div>
                      <div className="field__wrap">
                        <input type="tel" value={form.phone} onChange={up('phone')} placeholder="024 123 4567" autoComplete="tel" className={errors.phone ? 'err' : ''} />
                      </div>
                      {errors.phone ? <span className="field__err"><Icon name="error" size={13} />{errors.phone}</span> : <span className="field__hint">MTN 024/054 · Telecel 020 · AirtelTigo 027</span>}
                    </div>
                  </div>
                  <div className="field">
                    <div className="field__label">Email address</div>
                    <div className="field__wrap">
                      <input type="email" value={form.email} onChange={up('email')} placeholder="you@example.com" autoComplete="email" className={errors.email ? 'err' : ''} />
                    </div>
                    {errors.email && <span className="field__err"><Icon name="error" size={13} />{errors.email}</span>}
                  </div>
                  <button type="button" className="btn-go" onClick={nextStep}>
                    Continue <Icon name="arrow_forward" size={18} />
                  </button>
                </div>
              </>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form onSubmit={submit} noValidate>
                <h1 className="reg-heading">Set your password</h1>
                <p className="reg-sub">Choose something strong — you're securing your wallet and orders.</p>
                <div className="fields">
                  <div className="field">
                    <div className="field__label">Password</div>
                    <div className="field__wrap">
                      <input type={showPwd ? 'text' : 'password'} value={form.password} onChange={up('password')} placeholder="At least 8 characters" autoComplete="new-password" className={errors.password ? 'err' : ''} style={{ paddingRight: 44 }} />
                      <button type="button" className="field__eye" onClick={() => setShowPwd(v => !v)} tabIndex={-1}>
                        <Icon name={showPwd ? 'visibility_off' : 'visibility'} size={18} />
                      </button>
                    </div>
                    {errors.password
                      ? <span className="field__err"><Icon name="error" size={13} />{errors.password}</span>
                      : form.password && (
                        <>
                          <div className="str-bars">{[1,2,3,4,5].map(i => <div key={i} className="str-bar" style={{ background: i <= strength ? STR_COLOR[strength] : undefined }} />)}</div>
                          <div className="str-label" style={{ color: STR_COLOR[strength] }}>{STR_LABEL[strength]}</div>
                        </>
                      )
                    }
                  </div>
                  <div className="field">
                    <div className="field__label">Confirm password</div>
                    <div className="field__wrap">
                      <input type={showCfm ? 'text' : 'password'} value={form.confirmPassword} onChange={up('confirmPassword')} placeholder="Repeat your password" autoComplete="new-password" className={errors.confirmPassword ? 'err' : ''} style={{ paddingRight: 44 }} />
                      <button type="button" className="field__eye" onClick={() => setShowCfm(v => !v)} tabIndex={-1}>
                        <Icon name={showCfm ? 'visibility_off' : 'visibility'} size={18} />
                      </button>
                    </div>
                    {errors.confirmPassword
                      ? <span className="field__err"><Icon name="error" size={13} />{errors.confirmPassword}</span>
                      : (form.confirmPassword && form.confirmPassword === form.password)
                        ? <span className="field__ok"><Icon name="check_circle" size={13} />Passwords match</span>
                        : null
                    }
                  </div>
                  <label className="terms-row">
                    <input type="checkbox" checked={agreed} onChange={e => { setAgreed(e.target.checked); if (errors.agreed) setErrors(v => ({ ...v, agreed: undefined })); }} />
                    <span>I agree to the <Link to="/terms" style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>Terms of Service</Link> and <Link to="/privacy" style={{ color: 'var(--accent-bright)', fontWeight: 600 }}>Privacy Policy</Link></span>
                  </label>
                  {errors.agreed && <span className="field__err" style={{ marginTop: -6 }}><Icon name="error" size={13} />{errors.agreed}</span>}
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="button" className="btn-back" onClick={() => setStep(1)}>
                      <Icon name="arrow_back" size={16} /> Back
                    </button>
                    <button className="btn-go" type="submit" disabled={busy} style={{ flex: 1 }}>
                      {busy ? <><span className="spin" />Creating account…</> : <><Icon name="person_add" size={18} />Create account</>}
                    </button>
                  </div>
                </div>
              </form>
            )}

            <div className="reg-foot">
              Already have an account? <Link to="/login">Sign in →</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}