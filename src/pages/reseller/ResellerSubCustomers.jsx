import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Icon from '../../components/Icon';

export default function ResellerSubCustomers() {
  const notify = useNotify();
  const [customers,   setCustomers]   = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(0);
  const [totalPages,  setTotalPages]  = useState(0);
  const [totalItems,  setTotalItems]  = useState(0);

  const load = (p = 0) => {
    setLoading(true);
    api.reseller
      .getSubCustomers(p, 20)
      .then((data) => {
        setCustomers(data.content);
        setTotalPages(data.totalPages);
        setTotalItems(data.totalElements);
        setPage(data.number);
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load sub-customers.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="stack-lg">
      <style>{`
        .sc-eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: .72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: .12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }
        .sc-stat-row { display: flex; gap: 20px; flex-wrap: wrap; margin-top: 10px; }
        .sc-stat { display: flex; flex-direction: column; gap: 2px; }
        .sc-stat__label {
          font-size: .68rem; text-transform: uppercase; letter-spacing: .06em;
          color: var(--text-faint); font-weight: 700;
        }
        .sc-stat__value { font-family: var(--font-mono); font-weight: 700; font-size: 1.3rem; }

        .sc-privacy-note {
          display: flex; align-items: flex-start; gap: 8px; padding: 12px 14px;
          background: var(--surface-raised); border: 1px solid var(--border);
          border-radius: 10px; font-size: .8rem; color: var(--text-dim); line-height: 1.55;
        }

        .sc-avatar {
          width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
          background: var(--accent-soft); border: 1.5px solid var(--accent-border);
          color: var(--accent-bright); display: flex; align-items: center; justify-content: center;
          font-family: var(--font-display); font-weight: 800; font-size: .8rem;
        }
        .sc-name-cell { display: flex; align-items: center; gap: 10px; }

        .sc-pagination { display: flex; align-items: center; justify-content: center; gap: 8px; margin-top: 18px; }
        .sc-page-btn {
          display: flex; align-items: center; gap: 4px; padding: 7px 14px; border-radius: 8px;
          font-size: .82rem; font-weight: 700; border: 1px solid var(--border);
          background: var(--surface-raised); color: var(--text-dim); cursor: pointer;
          transition: border-color .15s, color .15s;
        }
        .sc-page-btn:hover:not(:disabled) { border-color: var(--accent-border); color: var(--accent-bright); }
        .sc-page-btn:disabled { opacity: .4; cursor: not-allowed; }
        .sc-page-info { font-size: .82rem; color: var(--text-faint); padding: 0 6px; }
      `}</style>

      {/* Header */}
      <header className="fade-in-up">
        <span className="sc-eyebrow">
          <Icon name="group" size={13} />
          Reseller
        </span>
        <h1>Sub-customers</h1>
        <p className="muted">
          Users who registered through your referral link at{' '}
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '.85rem', color: 'var(--accent-bright)' }}>
            /ref/your-slug
          </span>.
        </p>
        {!loading && totalItems > 0 && (
          <div className="sc-stat-row" style={{ marginTop: 12 }}>
            <div className="sc-stat">
              <span className="sc-stat__label">Total sub-customers</span>
              <span className="sc-stat__value">{totalItems}</span>
            </div>
          </div>
        )}
      </header>

      {/* Privacy note */}
      <div className="sc-privacy-note fade-in-up delay-1">
        <Icon name="shield" size={15} style={{ color: 'var(--accent-bright)', flexShrink: 0, marginTop: 1 }} />
        Names are masked (first name + last initial only) to protect customer privacy.
        Contact details are not shown.
      </div>

      {/* Table */}
      <div className="card fade-in-up delay-2">
        <h2 style={{ marginBottom: 16 }}>Customers referred by you</h2>

        {loading && <Spinner label="Loading sub-customers…" />}

        {!loading && (!customers || customers.length === 0) && (
          <EmptyState
            title="No sub-customers yet"
            hint="Share your referral link — anyone who signs up through it will appear here."
          />
        )}

        {!loading && customers && customers.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Orders placed</th>
                    <th>Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {customers.map((c, i) => {
                    const initials = c.maskedName
                      ?.split(' ')
                      .map((p) => p[0])
                      .join('')
                      .toUpperCase()
                      .slice(0, 2) ?? '?';

                    return (
                      <tr key={i}>
                        <td>
                          <div className="sc-name-cell">
                            <span className="sc-avatar">{initials}</span>
                            <span style={{ fontWeight: 600 }}>{c.maskedName}</span>
                          </div>
                        </td>
                        <td>
                          <span className="badge badge--info">{c.orderCount} order{c.orderCount !== 1 ? 's' : ''}</span>
                        </td>
                        <td className="muted">
                          {c.joinedAt ? new Date(c.joinedAt).toLocaleDateString() : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div className="sc-pagination">
                <button
                  className="sc-page-btn"
                  disabled={page === 0}
                  onClick={() => load(page - 1)}
                >
                  <Icon name="chevron_left" size={16} />
                  Prev
                </button>
                <span className="sc-page-info">Page {page + 1} of {totalPages}</span>
                <button
                  className="sc-page-btn"
                  disabled={page >= totalPages - 1}
                  onClick={() => load(page + 1)}
                >
                  Next
                  <Icon name="chevron_right" size={16} />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}