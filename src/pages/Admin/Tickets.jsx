import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../contexts/index.jsx';
import {
  RefreshCw, Trash2, ChevronLeft, ChevronRight, X, Mail, Phone, Receipt, Eye, MessageSquare,
} from 'lucide-react';

const STATUS_STYLES = {
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  'in-progress': 'bg-amber-50 text-amber-700 ring-amber-200',
  closed: 'bg-gray-100 text-gray-600 ring-gray-200',
  open: 'bg-rose-50 text-[#d80a4e] ring-rose-200',
};

const Tickets = () => {
  const { getTickets, updateTicket, deleteTicket, replyToTicket, getTicketById } = useApi();
  const navigate = useNavigate();
  const [tickets, setTickets] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const openTicket = async (ticket) => {
    setSelectedMessage(ticket);
    setReply('');
    setShowModal(true);
    const res = await getTicketById(ticket._id);
    if (res?.ticket) setSelectedMessage(res.ticket);
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await replyToTicket(selectedMessage._id, reply.trim());
      setSelectedMessage(res.ticket);
      setReply('');
      setTickets((prev) => prev.map((t) => (t._id === res.ticket._id
        ? { ...t, status: res.ticket.status, lastReplyBy: res.ticket.lastReplyBy, messages: res.ticket.messages }
        : t)));
    } catch (e) {
      alert(e.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const orderRef = (orderId) => (typeof orderId === 'object' ? orderId?._id : orderId);

  useEffect(() => {
    fetchTickets();
  }, [currentPage]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const response = await getTickets(currentPage, itemsPerPage);
      setTickets(response.tickets || []);
      setTotalPages(response.pagination?.pages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId, status) => {
    try {
      await updateTicket(ticketId, { status });
      setTickets((prev) => prev.map((t) => (t._id === ticketId ? { ...t, status } : t)));
      setSelectedMessage((prev) => (prev && prev._id === ticketId ? { ...prev, status } : prev));
    } catch (error) {
      console.error('Error updating ticket:', error);
    }
  };

  const handleDelete = async (ticketId) => {
    if (window.confirm('Are you sure you want to delete this ticket?')) {
      try {
        await deleteTicket(ticketId);
        fetchTickets();
      } catch (error) {
        console.error('Error deleting ticket:', error);
      }
    }
  };

  const StatusBadge = ({ status }) => (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ring-1 ${STATUS_STYLES[status] || STATUS_STYLES.open}`}>
      {(status || 'open').replace('-', ' ')}
    </span>
  );

  const statusSelect = (value, onChange) => (
    <select
      value={value || 'open'}
      onChange={onChange}
      className="rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs text-gray-700 focus:border-[#d80a4e] focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/20"
    >
      <option value="open">Open</option>
      <option value="in-progress">In Progress</option>
      <option value="resolved">Resolved</option>
      <option value="closed">Closed</option>
    </select>
  );

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-100 border-t-[#d80a4e]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Messages</h2>
          <p className="text-sm text-gray-500">{totalItems} contact {totalItems === 1 ? 'message' : 'messages'} from customers.</p>
        </div>
        <button
          onClick={fetchTickets}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:border-rose-200 hover:text-[#d80a4e]"
        >
          <RefreshCw className="h-4 w-4" /> Refresh
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white py-16 text-center">
          <MessageSquare className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No messages found.</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {tickets.map((ticket) => (
              <div key={ticket._id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-gray-900">{ticket.fullName}</h3>
                    <p className="truncate text-xs text-gray-500">{ticket.email}</p>
                  </div>
                  <StatusBadge status={ticket.status} />
                </div>
                <p className="mt-2 line-clamp-1 text-sm text-gray-700">{ticket.subject || 'No subject'}</p>
                <p className="mt-0.5 text-xs text-gray-400">{new Date(ticket.createdAt).toLocaleDateString()}</p>
                <div className="mt-3 flex items-center gap-2">
                  <button onClick={() => openTicket(ticket)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#d80a4e] px-3 py-2 text-sm font-medium text-white hover:bg-[#b8083e]">
                    <Eye className="h-4 w-4" /> View
                  </button>
                  {statusSelect(ticket.status, (e) => handleStatusUpdate(ticket._id, e.target.value))}
                  <button onClick={() => handleDelete(ticket._id)} className="inline-flex items-center justify-center rounded-lg bg-red-50 p-2 text-red-600 hover:bg-red-100">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3.5">Customer</th>
                    <th className="px-4 py-3.5">Subject</th>
                    <th className="px-4 py-3.5">Date</th>
                    <th className="px-4 py-3.5">Status</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {tickets.map((ticket) => (
                    <tr key={ticket._id} className="transition-colors hover:bg-rose-50/40">
                      <td className="px-4 py-3.5">
                        <div className="font-medium text-gray-900">{ticket.fullName}</div>
                        <div className="text-xs text-gray-500">{ticket.email}</div>
                        <div className="text-xs text-gray-400">{ticket.phone || 'No phone'}</div>
                      </td>
                      <td className="px-4 py-3.5 text-sm text-gray-700">{ticket.subject || 'N/A'}</td>
                      <td className="px-4 py-3.5 text-sm text-gray-500">{new Date(ticket.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3.5"><StatusBadge status={ticket.status} /></td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => openTicket(ticket)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-rose-200 hover:bg-rose-50 hover:text-[#d80a4e]">
                            <Eye className="h-3.5 w-3.5" /> View
                          </button>
                          {statusSelect(ticket.status, (e) => handleStatusUpdate(ticket._id, e.target.value))}
                          <button onClick={() => handleDelete(ticket._id)} className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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

      {/* Message Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4" onClick={() => setShowModal(false)}>
          <div
            className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-5 py-4">
              <div className="min-w-0">
                <h3 className="font-display truncate text-base font-bold text-gray-900 sm:text-lg">{selectedMessage.subject}</h3>
                <p className="text-xs capitalize text-gray-500">{selectedMessage.type?.replace('-', ' ')} · {selectedMessage.fullName}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-2 border-b border-gray-100 px-5 py-3 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
                <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-gray-400" />{selectedMessage.email}</span>
                {selectedMessage.phone && <span className="inline-flex items-center gap-1.5"><Phone className="h-3.5 w-3.5 text-gray-400" />{selectedMessage.phone}</span>}
              </div>
              <div className="flex items-center justify-between gap-2">
                {selectedMessage.orderId ? (
                  <button onClick={() => navigate(`/admin/order/${orderRef(selectedMessage.orderId)}`)} className="inline-flex items-center gap-1.5 text-xs font-medium text-[#d80a4e] hover:underline">
                    <Receipt className="h-3.5 w-3.5" /> Verify order #{orderRef(selectedMessage.orderId)?.slice(-6)}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">No linked order</span>
                )}
                {statusSelect(selectedMessage.status, (e) => handleStatusUpdate(selectedMessage._id, e.target.value))}
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto bg-gray-50/60 px-5 py-4">
              {(selectedMessage.messages?.length
                ? selectedMessage.messages
                : [{ sender: 'user', senderName: selectedMessage.fullName, message: selectedMessage.message, createdAt: selectedMessage.createdAt }]
              ).map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.sender === 'admin' ? 'bg-[#d80a4e] text-white' : 'border border-gray-200 bg-white text-gray-800'}`}>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <p className={`mt-1 text-[10px] ${m.sender === 'admin' ? 'text-pink-100' : 'text-gray-400'}`}>
                      {m.senderName} · {new Date(m.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {selectedMessage.status === 'closed' ? (
              <div className="border-t border-gray-100 px-5 py-3 text-center text-sm text-gray-400">Ticket closed</div>
            ) : (
              <div className="flex gap-2 border-t border-gray-100 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                  placeholder="Reply to customer…"
                  className="flex-1 rounded-xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/30"
                />
                <button onClick={handleReply} disabled={sending || !reply.trim()} className="rounded-xl bg-[#d80a4e] px-4 py-2 text-sm font-medium text-white hover:bg-[#b8083e] disabled:opacity-50">
                  {sending ? '…' : 'Send'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
