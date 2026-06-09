import React, { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MessageCircle, Send, ArrowLeft, Plus } from 'lucide-react';
import { useApi, useNotification } from '../../contexts/index.jsx';
import { useSeo } from '../../hooks/useSeo.js';
import Breadcrumb from '../../components/Breadcrumb.jsx';

const TYPES = [
  { value: 'query', label: 'General query' },
  { value: 'complaint', label: 'Complaint' },
  { value: 'return-refund', label: 'Return / Refund' },
  { value: 'order-issue', label: 'Order / delivery issue' },
];

const STATUS_CLS = {
  open: 'bg-amber-100 text-amber-700',
  'in-progress': 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-gray-200 text-gray-600',
};

const orderShort = (orderId) => (typeof orderId === 'object' ? orderId?._id : orderId)?.slice(-6);

const Support = () => {
  useSeo({ title: 'Support', path: '/support', noindex: true });
  const { getMyTickets, getTicketById, replyToTicket, createTicket, getMyOrders } = useApi();
  const { showNotification } = useNotification();
  const [params] = useSearchParams();

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userId = user._id || user.id;

  const [tickets, setTickets] = useState([]);
  const [orders, setOrders] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ orderId: '', type: 'query', subject: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    const [t, o] = await Promise.all([getMyTickets(userId), getMyOrders(userId)]);
    setTickets(Array.isArray(t) ? t : []);
    setOrders(Array.isArray(o) ? o : []);
    setLoading(false);
  }, [userId, getMyTickets, getMyOrders]);

  useEffect(() => { load(); }, [load]);

  // Pre-open the create form when arriving from an order ("Get help with this order")
  useEffect(() => {
    const orderParam = params.get('order');
    if (orderParam) {
      setCreating(true);
      setForm((f) => ({ ...f, orderId: orderParam, type: 'order-issue' }));
    }
  }, [params]);

  const openTicket = async (id) => {
    const res = await getTicketById(id);
    if (res?.ticket) { setSelected(res.ticket); setCreating(false); }
  };

  const submitNew = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      showNotification('Please add a subject and message', 'error');
      return;
    }
    setSubmitting(true);
    try {
      const res = await createTicket({
        userId,
        fullName: user.name,
        email: user.email,
        phone: user.phone,
        orderId: form.orderId || undefined,
        type: form.type,
        subject: form.subject,
        message: form.message,
      });
      showNotification('Support request submitted!');
      setCreating(false);
      setForm({ orderId: '', type: 'query', subject: '', message: '' });
      await load();
      if (res?.ticket?._id) openTicket(res.ticket._id);
    } catch (err) {
      showNotification(err.message || 'Could not submit request', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!reply.trim()) return;
    setSending(true);
    try {
      const res = await replyToTicket(selected._id, reply.trim());
      setSelected(res.ticket);
      setReply('');
      load();
    } catch (err) {
      showNotification(err.message || 'Could not send reply', 'error');
    } finally {
      setSending(false);
    }
  };

  if (!userId) {
    return (
      <div className="mithai-bg min-h-screen flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-10 text-center max-w-md">
          <p className="text-gray-600 mb-4">Please log in to view your support requests.</p>
          <Link to="/account" className="inline-block bg-[#d80a4e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b8083e]">Login</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mithai-bg min-h-screen pb-12">
      <Breadcrumb currentPage="Support" />
      <div className="max-w-3xl mx-auto px-4 sm:px-6 pt-2">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">Support</h1>
          {!creating && !selected && (
            <button onClick={() => setCreating(true)} className="inline-flex items-center gap-2 bg-[#d80a4e] text-white px-5 py-2.5 rounded-xl font-medium hover:bg-[#b8083e]">
              <Plus className="h-4 w-4" /> New Request
            </button>
          )}
        </div>

        {creating ? (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5 sm:p-6 animate-fade-up">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-gray-900">New Support Request</h2>
              <button onClick={() => setCreating(false)} className="text-sm text-gray-500 hover:text-[#d80a4e]">Cancel</button>
            </div>
            <form onSubmit={submitNew} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40">
                    {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Related order (optional)</label>
                  <select value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40">
                    <option value="">— None —</option>
                    {orders.map((o) => (
                      <option key={o._id} value={o._id}>
                        #{o._id.slice(-6)} · ₹{(o.totalAmount || 0).toFixed(0)} · {new Date(o.createdAt).toLocaleDateString('en-IN')}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                <input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} placeholder="Brief summary" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <textarea value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} rows={4} placeholder="Describe your query or complaint…" className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40" required />
              </div>
              <button type="submit" disabled={submitting} className="bg-[#d80a4e] text-white px-6 py-3 rounded-xl font-semibold hover:bg-[#b8083e] disabled:opacity-50">
                {submitting ? 'Submitting…' : 'Submit Request'}
              </button>
            </form>
          </div>
        ) : selected ? (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm animate-fade-up overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-amber-100 bg-gradient-to-r from-rose-50 to-amber-50 px-5 py-4">
              <button onClick={() => setSelected(null)} className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-[#d80a4e]"><ArrowLeft className="h-4 w-4" /> Back</button>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${STATUS_CLS[selected.status] || 'bg-gray-100 text-gray-700'}`}>{selected.status}</span>
            </div>
            <div className="p-5">
              <h2 className="font-display text-lg font-bold text-gray-900">{selected.subject}</h2>
              <p className="text-xs text-gray-500 mt-0.5 capitalize">
                {selected.type?.replace('-', ' ')}
                {selected.orderId ? ` · Order #${orderShort(selected.orderId)}` : ''}
              </p>

              <div className="mt-4 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {(selected.messages || []).map((m, i) => (
                  <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-start' : 'justify-end'}`}>
                    <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm ${m.sender === 'admin' ? 'bg-gray-100 text-gray-800' : 'bg-[#d80a4e] text-white'}`}>
                      <p className="whitespace-pre-wrap">{m.message}</p>
                      <p className={`mt-1 text-[10px] ${m.sender === 'admin' ? 'text-gray-400' : 'text-pink-100'}`}>
                        {m.senderName} · {new Date(m.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selected.status === 'closed' ? (
                <p className="mt-4 text-center text-sm text-gray-400">This ticket is closed.</p>
              ) : (
                <div className="mt-4 flex gap-2">
                  <input
                    value={reply}
                    onChange={(e) => setReply(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && sendReply()}
                    placeholder="Type your reply…"
                    className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 text-sm"
                  />
                  <button onClick={sendReply} disabled={sending || !reply.trim()} className="inline-flex items-center gap-1 bg-[#d80a4e] text-white px-4 py-2.5 rounded-xl font-medium hover:bg-[#b8083e] disabled:opacity-50">
                    <Send className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin h-10 w-10 rounded-full border-b-2 border-[#d80a4e]" /></div>
        ) : tickets.length === 0 ? (
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-[#d80a4e]"><MessageCircle className="h-8 w-8" /></div>
            <p className="text-gray-600 mb-1">No support requests yet</p>
            <p className="text-gray-400 text-sm">Have a question or issue with an order? Raise a request.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {tickets.map((t) => (
              <button key={t._id} onClick={() => openTicket(t._id)} className="w-full text-left bg-white rounded-2xl border border-amber-100 shadow-sm p-4 hover:shadow-md transition-shadow animate-fade-up">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="font-medium text-gray-900 truncate">{t.subject}</h3>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_CLS[t.status] || 'bg-gray-100 text-gray-700'}`}>{t.status}</span>
                </div>
                <p className="text-xs text-gray-500 mt-1 capitalize">
                  {t.type?.replace('-', ' ')}
                  {t.orderId ? ` · Order #${orderShort(t.orderId)}` : ''} · {new Date(t.updatedAt).toLocaleDateString('en-IN')}
                  {t.lastReplyBy === 'admin' && <span className="ml-2 font-semibold text-[#d80a4e]">• New reply</span>}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Support;
