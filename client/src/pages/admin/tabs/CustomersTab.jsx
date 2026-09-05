import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import client from '../../../api/client';
import { describeApiError } from '../../../utils/apiError';
import { SectionCard, Pill, SkeletonTable, ErrorNote, EmptyState, btnGhost, btnDanger, inputClass } from '../ui';

export default function CustomersTab() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);
  const [roleFilter, setRoleFilter] = useState('all');

  const load = () => {
    setError('');
    return client
      .get('/users')
      .then(({ data }) => setUsers(data.users || []))
      .catch((err) => setError(describeApiError(err, 'Could not load customers.')));
  };

  useEffect(() => { load(); }, []);

  const patch = async (id, fields) => {
    setBusyId(id);
    try {
      const { data } = await client.patch(`/users/${id}`, fields);
      setUsers((prev) => prev.map((u) => (u.id === id ? data.user : u)));
    } catch (err) {
      setError(describeApiError(err, 'Could not update that account.'));
    } finally {
      setBusyId(null);
    }
  };

  if (error && !users) return <ErrorNote onRetry={load}>{error}</ErrorNote>;
  if (!users) return <SkeletonTable />;
  if (users.length === 0) return <EmptyState>No accounts yet.</EmptyState>;

  const visible = roleFilter === 'all' ? users : users.filter((u) => u.role === roleFilter);

  return (
    <SectionCard
      title={`Accounts (${users.length})`}
      action={
        <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className={`${inputClass} w-auto`}>
          <option value="all">Everyone</option>
          <option value="customer">Customers</option>
          <option value="admin">Admins</option>
        </select>
      }
    >
      {error && <div className="mb-4"><ErrorNote>{error}</ErrorNote></div>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-ink/10 text-muted-light">
              <th className="pb-2 pr-4 font-normal">Name</th>
              <th className="pb-2 pr-4 font-normal">Email</th>
              <th className="pb-2 pr-4 font-normal">Country</th>
              <th className="pb-2 pr-4 font-normal">Role</th>
              <th className="pb-2 pr-4 font-normal">Status</th>
              <th className="pb-2 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((u) => {
              const isSelf = u.id === me?.id;
              return (
                <tr key={u.id} className="border-b border-ink/5">
                  <td className="py-3 pr-4">{u.name}{isSelf && <span className="ml-1.5 text-xs text-muted-light">(you)</span>}</td>
                  <td className="py-3 pr-4 text-muted-light">{u.email}</td>
                  <td className="py-3 pr-4 text-muted-light">{u.country || '—'}</td>
                  <td className="py-3 pr-4">
                    <Pill tone={u.role === 'admin' ? 'signal' : 'neutral'}>{u.role}</Pill>
                  </td>
                  <td className="py-3 pr-4">
                    <Pill tone={u.isActive ? 'jade' : 'red'}>{u.isActive ? 'Active' : 'Disabled'}</Pill>
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        disabled={busyId === u.id || (isSelf && u.role === 'admin')}
                        onClick={() => patch(u.id, { role: u.role === 'admin' ? 'customer' : 'admin' })}
                        className={`${btnGhost} px-3 py-1.5 text-xs`}
                      >
                        Make {u.role === 'admin' ? 'customer' : 'admin'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === u.id || isSelf}
                        onClick={() => patch(u.id, { isActive: !u.isActive })}
                        className={`${u.isActive ? btnDanger : btnGhost} px-3 py-1.5 text-xs`}
                      >
                        {u.isActive ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
