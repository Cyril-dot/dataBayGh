import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, apiErrorMessage } from '../../api/api';
import { useAuth } from '../../context/AuthContext';
import { useNotify } from '../../context/NotificationContext';

export default function ResellerApply() {
  const { isReseller, isAdmin } = useAuth();
  const notify = useNotify();
  const navigate = useNavigate();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const data = await api.reseller.apply({ applicationNote: note });
      setSubmitted(data);
      notify.success('Application submitted!');
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not submit your application.'));
    } finally {
      setBusy(false);
    }
  };

  if (isReseller || isAdmin) {
    return (
      <div className="stack-lg narrow">
        <h1>You're already a reseller</h1>
        <p className="muted">Head to your reseller dashboard to manage pricing, orders and payouts.</p>
        <button className="btn btn--primary" onClick={() => navigate('/reseller')}>
          Go to reseller dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="stack-lg narrow">
      <div>
        <h1>Become a reseller</h1>
        <p className="muted">
          Resellers buy bundles at wholesale prices and set their own markup. A one-time GH₵ 20 registration fee is
          deducted from your wallet when you apply.
        </p>
      </div>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="form card">
          <label className="form__field">
            <span>Tell us a bit about your plan</span>
            <textarea
              required
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. I sell data bundles to students at my campus shop."
            />
          </label>
          <button className="btn btn--primary btn--block" type="submit" disabled={busy}>
            {busy ? 'Submitting…' : 'Submit application (GH₵ 20 fee)'}
          </button>
        </form>
      ) : (
        <div className="card result-card">
          <p>Status: <strong>{submitted.status}</strong></p>
          <p className="muted">{submitted.message}</p>
          <p className="muted">Wallet balance after fee: GH₵ {Number(submitted.walletBalanceAfter).toFixed(2)}</p>
        </div>
      )}
    </div>
  );
}
