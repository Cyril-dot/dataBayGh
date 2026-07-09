import { useEffect, useState } from 'react';
import { api, apiErrorMessage } from '../../api/api';
import { useNotify } from '../../context/NotificationContext';
import Spinner from '../../components/Spinner';
import EmptyState from '../../components/EmptyState';
import Pagination from '../../components/Pagination';
import ConfirmModal from '../../components/ConfirmModal';
import Icon from '../../components/Icon';

const fmtGhc = (n) => `GH₵ ${Number(n ?? 0).toFixed(2)}`;

const initials = (name) =>
  (name || '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

export default function AdminUsers() {
  const notify = useNotify();
  const [users, setUsers] = useState(null);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pendingToggle, setPendingToggle] = useState(null);
  const [toggling, setToggling] = useState(false);

  const load = (p = 0) => {
    setLoading(true);
    api.admin
      .getUsers({ page: p, size: 15, sortBy: 'createdAt', direction: 'DESC' })
      .then((data) => {
        setUsers(data.content);
        setTotalPages(data.totalPages);
        setTotalElements(data.totalElements ?? data.content.length);
        setPage(data.number);
      })
      .catch((err) => notify.error(apiErrorMessage(err, 'Could not load users.')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleToggle = async () => {
    if (!pendingToggle) return;
    setToggling(true);
    try {
      await api.admin.setUserActive(pendingToggle.id, !pendingToggle.active);
      notify.success(`User ${!pendingToggle.active ? 'activated' : 'deactivated'}.`);
      setPendingToggle(null);
      load(page);
    } catch (err) {
      notify.error(apiErrorMessage(err, 'Could not update this user.'));
    } finally {
      setToggling(false);
    }
  };

  const activeCount = users ? users.filter((u) => u.active).length : 0;
  const inactiveCount = users ? users.length - activeCount : 0;

  return (
    <div className="stack-lg">
      {/* Page-specific layout styles — shares tokens/animations from the global stylesheet */}
      <style>{`
        .admin-users-header__eyebrow {
          display: inline-flex; align-items: center; gap: 7px;
          color: var(--accent-bright); font-size: 0.72rem; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.12em;
          font-family: var(--font-mono); margin-bottom: 8px;
        }
        .admin-users-status-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-top: 10px; }
        .admin-users-status-chip {
          display: inline-flex; align-items: center; gap: 5px;
          background: var(--surface-raised); border: 1px solid var(--border);
          color: var(--text-faint); padding: 4px 10px; border-radius: 999px;
          font-size: 0.72rem; font-weight: 600;
        }

        .admin-users-card { padding: 0; overflow: hidden; }
        .admin-users-card__head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 16px 18px; border-bottom: 1px solid var(--border);
        }
        .admin-users-card__head h2 { margin: 0; font-size: 1rem; }

        .admin-users-identity { display: flex; align-items: center; gap: 10px; }
        .admin-users-avatar {
          width: 32px; height: 32px; border-radius: 50%; flex-shrink: 0;
          background: var(--accent-soft); color: var(--accent-bright);
          border: 1px solid var(--accent-border);
          display: flex; align-items: center; justify-content: center;
          font-size: 0.72rem; font-weight: 700; font-family: var(--font-mono);
        }
        .admin-users-name { font-weight: 600; }

        .table-wrap tbody tr { transition: background var(--dur-fast) ease; }
        .table-wrap tbody tr:hover { background: var(--accent-soft); }

        .admin-users-card .table-wrap { padding: 0 18px; }
        .admin-users-card .pagination-wrap { padding: 14px 18px 18px; }
      `}</style>

      <header className="fade-in-up">
        <span className="admin-users-header__eyebrow">
          <Icon name="group" size={13} />
          Admin
        </span>
        <h1>Users</h1>
        <div className="admin-users-status-row">
          <span className="admin-users-status-chip">
            <Icon name="groups" size={13} />
            {totalElements} total
          </span>
          {!loading && users && (
            <>
              <span className="admin-users-status-chip">
                <Icon name="check_circle" size={13} />
                {activeCount} active on this page
              </span>
              {inactiveCount > 0 && (
                <span className="admin-users-status-chip">
                  <Icon name="cancel" size={13} />
                  {inactiveCount} inactive on this page
                </span>
              )}
            </>
          )}
        </div>
      </header>

      <div className="card admin-users-card hover-lift fade-in-up delay-1">
        <div className="admin-users-card__head">
          <h2>All users</h2>
        </div>

        {loading && (
          <div style={{ padding: '32px 18px' }}>
            <Spinner label="Loading users…" />
          </div>
        )}
        {!loading && (!users || users.length === 0) && (
          <div style={{ padding: '32px 18px' }}>
            <EmptyState title="No users found" />
          </div>
        )}
        {!loading && users && users.length > 0 && (
          <>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Phone</th>
                    <th>Role</th>
                    <th>Wallet</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id}>
                      <td>
                        <span className="admin-users-identity">
                          <span className="admin-users-avatar">{initials(u.fullName)}</span>
                          <span className="admin-users-name">{u.fullName}</span>
                        </span>
                      </td>
                      <td className="muted">{u.email}</td>
                      <td className="mono">{u.phone}</td>
                      <td>
                        <span className="badge badge--neutral">{u.role}</span>
                      </td>
                      <td className="mono">{fmtGhc(u.walletBalance)}</td>
                      <td>
                        <span className={`badge ${u.active ? 'badge--good' : 'badge--bad'}`}>
                          {u.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                      <td>
                        <button
                          className={`link ${u.active ? 'link--danger' : ''}`}
                          onClick={() => setPendingToggle(u)}
                        >
                          {u.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="pagination-wrap">
              <Pagination page={page} totalPages={totalPages} onChange={load} />
            </div>
          </>
        )}
      </div>

      <ConfirmModal
        open={!!pendingToggle}
        title={pendingToggle?.active ? 'Deactivate this user?' : 'Activate this user?'}
        message={pendingToggle ? `${pendingToggle.fullName} (${pendingToggle.email})` : ''}
        confirmLabel={pendingToggle?.active ? 'Deactivate' : 'Activate'}
        tone={pendingToggle?.active ? 'danger' : 'default'}
        busy={toggling}
        onConfirm={handleToggle}
        onCancel={() => setPendingToggle(null)}
      />
    </div>
  );
}