import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/api';
import { useAuth } from '../context/AuthContext';
import { useNotify } from '../context/NotificationContext';
import Spinner from '../components/Spinner';
import Icon from '../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

const getInitials = (name, email) => {
  if (name && name.trim()) {
    const parts = name.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] || '')).toUpperCase();
  }
  return (email || '?').slice(0, 1).toUpperCase();
};

const roleBadgeClass = (role) => {
  if (role === 'ADMIN') return 'badge--warn';
  if (role === 'RESELLER') return 'badge--good';
  return 'badge--neutral';
};

export default function Profile() {
  const { refreshProfile } = useAuth();
  const notify = useNotify();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ fullName: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.auth
      .getProfile()
      .then((p) => {
        setProfile(p);
        setForm({ fullName: p.fullName || '', phone: p.phone || '' });
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load your profile.')))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const updated = await api.auth.updateProfile(form);
      setProfile(updated);
      await refreshProfile();
      notify.success('Profile updated.');
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not update your profile. The phone number may already be in use.'));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Spinner label="Loading profile…" />;

  return (
    <div className="stack-lg narrow">
      {/* Page-specific layout styles — shares tokens/animations from the global stylesheet */}
      <style>{`
        .profile-header__eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }

        .profile-hero {
          display: flex; align-items: center; gap: 18px;
          border-color: var(--accent-border);
        }
        .profile-hero__avatar {
          width: 64px; height: 64px; border-radius: 50%;
          background: var(--accent-soft); color: var(--accent-bright);
          display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 800; font-size: 1.3rem;
          border: 1.5px solid var(--accent-border); flex-shrink: 0;
        }
        .profile-hero__info { min-width: 0; flex: 1; }
        .profile-hero__name {
          font-family: var(--font-display); font-weight: 800; font-size: 1.15rem;
          overflow-wrap: break-word;
        }
        .profile-hero__email { color: var(--text-dim); font-size: 0.86rem; margin-top: 2px; overflow-wrap: break-word; }
        .profile-hero__meta { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 12px; }
        .profile-meta-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--surface-raised); border: 1px solid var(--border);
          color: var(--text-faint); padding: 4px 10px; border-radius: 999px;
          font-size: 0.72rem; font-weight: 600;
        }

        .profile-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 20px; align-items: start; }
        .profile-aside { display: flex; flex-direction: column; gap: 16px; }

        .profile-wallet-card { display: flex; flex-direction: column; gap: 6px; }
        .profile-wallet-card__top { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .profile-wallet-card__value { font-family: var(--font-mono); font-weight: 700; font-size: 1.4rem; }
        .profile-wallet-card__link {
          display: inline-flex; align-items: center; gap: 6px;
          color: var(--accent-bright); font-size: 0.82rem; font-weight: 700; margin-top: 8px;
        }
        .profile-wallet-card__link:hover { color: var(--accent); }

        @media (max-width: 760px) {
          .profile-grid { grid-template-columns: 1fr; }
        }

        @media (max-width: 480px) {
          .profile-hero { flex-direction: column; text-align: center; }
          .profile-hero__meta { justify-content: center; }
        }
      `}</style>

      <header className="fade-in-up">
        <span className="profile-header__eyebrow">
          <Icon name="person" size={13} />
          Account
        </span>
        <h1>Your profile</h1>
      </header>

      <div className="card profile-hero hover-lift fade-in-up delay-1">
        <div className="profile-hero__avatar">{getInitials(profile?.fullName, profile?.email)}</div>
        <div className="profile-hero__info">
          <div className="profile-hero__name">{profile?.fullName?.trim() || 'Add your name'}</div>
          <div className="profile-hero__email">{profile?.email}</div>
          <div className="profile-hero__meta">
            <span className={`badge ${roleBadgeClass(profile?.role)}`}>{profile?.role}</span>
            <span className="profile-meta-chip">
              <Icon name="calendar_month" size={13} />
              Member since {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : '—'}
            </span>
          </div>
        </div>
      </div>

      <div className="profile-grid">
        <div className="card fade-in-up delay-2">
          <h2>Update details</h2>
          <form onSubmit={handleSubmit} className="form">
            <label className="form__field">
              <span>Full name</span>
              <input value={form.fullName} onChange={update('fullName')} placeholder="e.g. Akua Mensah" />
            </label>
            <label className="form__field">
              <span>Phone number</span>
              <input value={form.phone} onChange={update('phone')} placeholder="0241234567" />
            </label>
            <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
              {busy ? 'Saving…' : 'Save changes'}
            </button>
          </form>
        </div>

        <div className="profile-aside fade-in-up delay-3">
          <div className="card profile-wallet-card">
            <div className="profile-wallet-card__top">
              <span className="stat-card__label">Wallet balance</span>
              <div className="stat-card__icon" style={{ marginBottom: 0 }}>
                <Icon name="account_balance_wallet" size={18} />
              </div>
            </div>
            <span className="profile-wallet-card__value">{fmtGhc(profile?.walletBalance)}</span>
            <Link to="/wallet" className="profile-wallet-card__link">
              Go to wallet
              <Icon name="arrow_forward" size={15} />
            </Link>
          </div>

          <div className="card">
            <h2>Security</h2>
            <p className="muted">Change your password regularly to keep your wallet safe.</p>
            <Link to="/change-password" className="btn btn--ghost btn--block" style={{ marginTop: 14 }}>
              <Icon name="lock" size={16} />
              Change password
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}