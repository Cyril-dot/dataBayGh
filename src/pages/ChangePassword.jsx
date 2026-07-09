import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../api/api';
import { useNotify } from '../context/NotificationContext';

export default function ChangePassword() {
  const notify = useNotify();
  const navigate = useNavigate();
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
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
      await api.auth.changePassword(form);
      notify.success('Password changed successfully.');
      navigate('/profile');
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not change your password.'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="stack-lg narrow">
      <h1>Change password</h1>
      <form onSubmit={handleSubmit} className="form card">
        <label className="form__field">
          <span>Current password</span>
          <input type="password" required value={form.currentPassword} onChange={update('currentPassword')} />
        </label>
        <label className="form__field">
          <span>New password</span>
          <input type="password" required minLength={8} value={form.newPassword} onChange={update('newPassword')} />
        </label>
        <label className="form__field">
          <span>Confirm new password</span>
          <input type="password" required minLength={8} value={form.confirmPassword} onChange={update('confirmPassword')} />
        </label>
        <button className="btn btn--primary" type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </form>
    </div>
  );
}
