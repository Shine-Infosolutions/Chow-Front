import React, { useState, useEffect, useCallback } from 'react';
import { useApi } from '../../contexts/index.jsx';
import { Search, X, ChevronLeft, ChevronRight, Users, Mail, Phone, ShieldCheck } from 'lucide-react';

const Customers = () => {
  const { getUsers } = useApi();
  const [users, setUsers] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const itemsPerPage = 12;

  // Debounce the search box
  useEffect(() => {
    const t = setTimeout(() => setDebounced(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debounced]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers(currentPage, itemsPerPage, debounced);
      setUsers(res.users || []);
      setTotalPages(res.pagination?.pages || 1);
      setTotalItems(res.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }, [getUsers, currentPage, debounced]);

  useEffect(() => {
    load();
  }, [load]);

  const initials = (name = '') =>
    name.split(' ').map((n) => n[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || 'U';

  const joined = (d) =>
    d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';

  const RoleBadge = ({ role }) =>
    role === 'admin' ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-[#d80a4e] ring-1 ring-rose-200">
        <ShieldCheck className="h-3 w-3" /> Admin
      </span>
    ) : (
      <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600">Customer</span>
    );

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Customers</h2>
          <p className="text-sm text-gray-500">{totalItems} registered {totalItems === 1 ? 'user' : 'users'}</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4 w-full sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm focus:border-[#d80a4e] focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/20"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:text-[#d80a4e]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-100 border-t-[#d80a4e]" />
        </div>
      ) : users.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white py-16 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">{debounced ? `No customers match "${debounced}"` : 'No customers yet.'}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {users.map((u) => (
              <div key={u._id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d80a4e] to-[#8b1a3a] text-sm font-bold text-white">
                    {initials(u.name)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="truncate font-semibold text-gray-900">{u.name}</h3>
                      <RoleBadge role={u.role} />
                    </div>
                    <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-gray-500"><Mail className="h-3.5 w-3.5" />{u.email}</p>
                    <p className="flex items-center gap-1.5 text-xs text-gray-500"><Phone className="h-3.5 w-3.5" />{u.phone || '—'}</p>
                    <p className="mt-1 text-xs text-gray-400">Joined {joined(u.createdAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm lg:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3.5">Customer</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="transition-colors hover:bg-rose-50/40">
                    <td className="px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#d80a4e] to-[#8b1a3a] text-xs font-bold text-white">
                          {initials(u.name)}
                        </span>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900">{u.name}</div>
                          <div className="truncate text-xs text-gray-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-3.5 text-sm text-gray-600">{u.phone || '—'}</td>
                    <td className="px-6 py-3.5"><RoleBadge role={u.role} /></td>
                    <td className="px-6 py-3.5 text-sm text-gray-500">{joined(u.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 sm:text-sm">
              {totalItems === 0 ? '0 of 0' : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-700">{currentPage} / {totalPages}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))} disabled={currentPage >= totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Customers;
