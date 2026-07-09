import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/api';
import { useNotify } from '../context/NotificationContext';
import GhanaFlag from '../components/GhanaFlag';

export default function ResetPassword() {
  const notify = useNotify();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', previousPassword: '', newPassword: '', confirmPassword: '' });
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      notify.error('New password and confirmation do not match.');
      return;
    }
    setBusy(true);
    try {
      await api.auth.resetPassword(form);
      notify.success('Password reset. You can log in now.');
      navigate('/login');
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not reset your password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-card__brand">
          <GhanaFlag size={22} />
          Data Bay <strong>Ghana</strong>
        </Link>
        <h1>Reset your password</h1>
        <p className="auth-card__subtitle">Confirm your email and current password to set a new one.</p>

        <form onSubmit={handleSubmit} className="form">
          <label className="form__field">
            <span>Email address</span>
            <input type="email" required value={form.email} onChange={update('email')} />
          </label>
          <label className="form__field">
            <span>Current password</span>
            <input type="password" required value={form.previousPassword} onChange={update('previousPassword')} />
          </label>
          <label className="form__field">
            <span>New password</span>
            <input type="password" required minLength={8} value={form.newPassword} onChange={update('newPassword')} />
          </label>
          <label className="form__field">
            <span>Confirm new password</span>
            <input type="password" required minLength={8} value={form.confirmPassword} onChange={update('confirmPassword')} />
          </label>

          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Resetting…' : 'Reset password'}
          </button>
        </form>

        <div className="auth-card__links">
          <span />
          <Link to="/login">Back to log in</Link>
        </div>
      </div>
    </div>
  );
}
