import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../contexts/index.jsx';

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
      setTickets(prev => prev.map(t => (t._id === res.ticket._id
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
      setTickets(prevTickets =>
        prevTickets.map(ticket =>
          ticket._id === ticketId ? { ...ticket, status } : ticket
        )
      );
      setSelectedMessage(prev => (prev && prev._id === ticketId ? { ...prev, status } : prev));
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#d80a4e]"></div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <h2 className="font-display text-xl md:text-2xl font-bold text-gray-900">Contact Messages</h2>
        <button
          onClick={fetchTickets}
          className="bg-[#d80a4e] text-white px-5 py-2.5 rounded-xl hover:bg-[#b8083e] font-medium w-full sm:w-auto"
        >
          Refresh
        </button>
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No messages found</p>
        </div>
      ) : (
        <>
          <div className="mb-2 text-sm text-gray-600">
            Total Messages: {totalItems}
          </div>
          <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
          {/* Horizontal scroll wrapper */}
          <div className="overflow-x-auto">
            <table className="min-w-[800px] w-full">
              <thead className="bg-[#d80a4e] text-white">
                <tr>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold uppercase">Name</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold uppercase">Email</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold uppercase">Phone</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold uppercase">Subject</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold uppercase">Message</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold uppercase">Date</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold uppercase">Status</th>
                  <th className="px-3 md:px-4 py-3 md:py-4 text-left text-xs md:text-sm font-semibold uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {tickets.map((ticket, index) => (
                  <tr key={ticket._id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm font-medium text-gray-900 truncate">{ticket.fullName}</td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-700 truncate">{ticket.email}</td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-700">{ticket.phone || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-700 truncate">{ticket.subject || 'N/A'}</td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm">
                      <button
                        onClick={() => openTicket(ticket)}
                        className="bg-blue-500 text-white px-2 md:px-3 py-1 rounded-lg text-xs hover:bg-blue-600"
                      >
                        View
                      </button>
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm text-gray-700">
                      {new Date(ticket.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-3 md:px-4 py-3 md:py-4 text-xs md:text-sm">
                      <span className={`px-2 py-1 rounded-full text-white text-xs font-medium ${
                        ticket.status === 'resolved' ? 'bg-green-500' : 
                        ticket.status === 'in-progress' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}>
                        {ticket.status || 'Open'}
                      </span>
                    </td>
                    <td className="px-2 md:px-3 py-2 md:py-3 text-xs md:text-sm">
                      <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                        <select
                          value={ticket.status || 'open'}
                          onChange={(e) => handleStatusUpdate(ticket._id, e.target.value)}
                          className="text-xs border rounded px-1 sm:px-2 py-1 flex-1 min-w-0"
                        >
                          <option value="open">Open</option>
                          <option value="in-progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                        <button
                          onClick={() => handleDelete(ticket._id)}
                          className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600 whitespace-nowrap"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          </div>
        </>
      )}
      
      {/* Pagination */}
      <div className="bg-white rounded-2xl border border-amber-100 shadow-sm mt-4">
        <div className="bg-white px-3 md:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center text-xs md:text-sm text-gray-700 gap-2 sm:gap-0">
            <span>Items per page: {itemsPerPage}</span>
            <span className="sm:ml-8">{(currentPage - 1) * itemsPerPage + 1} – {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems}</span>
          </div>
          <div className="flex items-center justify-center sm:justify-end space-x-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 text-xs md:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ◀
            </button>
            <span className="text-xs md:text-sm text-gray-600">
              {currentPage} / {totalItems > 0 ? Math.ceil(totalItems / itemsPerPage) : 1}
            </span>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, Math.ceil(totalItems / itemsPerPage)))}
              disabled={currentPage >= Math.ceil(totalItems / itemsPerPage)}
              className="px-3 py-1 text-xs md:text-sm border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ▶
            </button>
          </div>
        </div>
      </div>
      
      {/* Message Modal */}
      {showModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-start gap-3 border-b border-gray-100 px-5 py-4">
              <div className="min-w-0">
                <h3 className="font-display text-base sm:text-lg font-bold text-gray-900 truncate">{selectedMessage.subject}</h3>
                <p className="text-xs text-gray-500 capitalize">{selectedMessage.type?.replace('-', ' ')} · {selectedMessage.fullName}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl p-1">✕</button>
            </div>

            {/* Meta: contact, linked order (verify), status */}
            <div className="border-b border-gray-100 px-5 py-3 space-y-2 text-sm">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-gray-600">
                <span><i className="fas fa-envelope mr-1 text-gray-400"></i>{selectedMessage.email}</span>
                {selectedMessage.phone && <span><i className="fas fa-phone mr-1 text-gray-400"></i>{selectedMessage.phone}</span>}
              </div>
              <div className="flex items-center justify-between gap-2">
                {selectedMessage.orderId ? (
                  <button
                    onClick={() => navigate(`/admin/order/${orderRef(selectedMessage.orderId)}`)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#d80a4e] hover:underline"
                  >
                    <i className="fas fa-receipt"></i> Verify linked order #{orderRef(selectedMessage.orderId)?.slice(-6)}
                  </button>
                ) : (
                  <span className="text-xs text-gray-400">No linked order</span>
                )}
                <select
                  value={selectedMessage.status || 'open'}
                  onChange={(e) => handleStatusUpdate(selectedMessage._id, e.target.value)}
                  className="text-xs border border-gray-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40"
                >
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            {/* Thread */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-gray-50/50">
              {(selectedMessage.messages?.length
                ? selectedMessage.messages
                : [{ sender: 'user', senderName: selectedMessage.fullName, message: selectedMessage.message, createdAt: selectedMessage.createdAt }]
              ).map((m, i) => (
                <div key={i} className={`flex ${m.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm ${m.sender === 'admin' ? 'bg-[#d80a4e] text-white' : 'bg-white border border-gray-200 text-gray-800'}`}>
                    <p className="whitespace-pre-wrap">{m.message}</p>
                    <p className={`mt-1 text-[10px] ${m.sender === 'admin' ? 'text-pink-100' : 'text-gray-400'}`}>
                      {m.senderName} · {new Date(m.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Reply */}
            {selectedMessage.status === 'closed' ? (
              <div className="border-t border-gray-100 px-5 py-3 text-center text-sm text-gray-400">Ticket closed</div>
            ) : (
              <div className="border-t border-gray-100 px-5 py-3 flex gap-2">
                <input
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleReply()}
                  placeholder="Reply to customer…"
                  className="flex-1 px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 text-sm"
                />
                <button onClick={handleReply} disabled={sending || !reply.trim()} className="bg-[#d80a4e] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#b8083e] disabled:opacity-50 text-sm">
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
