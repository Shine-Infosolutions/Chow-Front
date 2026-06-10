import React, { useState, useEffect } from 'react';
import { useApi } from '../../contexts/index.jsx';
import { useNotification } from '../../contexts/index.jsx';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowLeft, BadgePercent } from 'lucide-react';

const SweetDeal = () => {
  const { baseUrl } = useApi();
  const { showNotification } = useNotification();

  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [formData, setFormData] = useState({
    title: '', description: '', originalPrice: '', salePrice: '', endDate: '', videoFile: null, isActive: true,
  });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchDeals();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/sweet-deals`);
      const data = await response.json();
      setDeals(data);
    } catch (error) {
      showNotification('Error fetching deals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description || !formData.originalPrice || !formData.salePrice || !formData.endDate) {
      setError('Please fill in all required fields');
      return;
    }
    try {
      setUpdating(true);
      setError('');
      const url = editingDeal ? `${baseUrl}/api/sweet-deals/${editingDeal._id}` : `${baseUrl}/api/sweet-deals`;
      const method = editingDeal ? 'PUT' : 'POST';

      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('originalPrice', formData.originalPrice);
      formDataToSend.append('salePrice', formData.salePrice);
      formDataToSend.append('endDate', formData.endDate);
      formDataToSend.append('isActive', formData.isActive);
      if (formData.videoFile) formDataToSend.append('video', formData.videoFile);

      const response = await fetch(url, { method, body: formDataToSend });
      if (response.ok) {
        showNotification(`Deal ${editingDeal ? 'updated' : 'created'} successfully`, 'success');
        resetForm();
        fetchDeals();
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to save deal');
      }
    } catch (error) {
      setError(error.message || 'Error saving deal');
    } finally {
      setUpdating(false);
    }
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setFormData({ ...deal, videoFile: null, endDate: new Date(deal.endDate).toISOString().split('T')[0] });
    setShowModal(true);
  };

  const handleToggleActive = async (dealId, newStatus) => {
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/sweet-deals/${dealId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: newStatus }),
      });
      if (response.ok) {
        showNotification(`Deal ${newStatus ? 'activated' : 'deactivated'} successfully`, 'success');
        fetchDeals();
      } else {
        throw new Error('Failed to update deal status');
      }
    } catch (error) {
      showNotification('Error updating deal status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this deal?')) return;
    try {
      setLoading(true);
      const response = await fetch(`${baseUrl}/api/sweet-deals/${id}`, { method: 'DELETE' });
      if (response.ok) {
        showNotification('Deal deleted successfully', 'success');
        fetchDeals();
      } else {
        throw new Error('Failed to delete deal');
      }
    } catch (error) {
      showNotification('Error deleting deal', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({ title: '', description: '', originalPrice: '', salePrice: '', endDate: '', videoFile: null, isActive: true });
    setEditingDeal(null);
    setShowModal(false);
    setError('');
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : type === 'file' ? files[0] : value,
    }));
  };

  const getTotalPages = () => Math.max(1, Math.ceil(deals.length / itemsPerPage));
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return deals.slice(startIndex, startIndex + itemsPerPage);
  };
  const getPageInfo = () => {
    if (deals.length === 0) return '0 of 0';
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, deals.length);
    return `${startIndex}–${endIndex} of ${deals.length}`;
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition focus:border-[#d80a4e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/20';

  const StatusToggle = ({ deal }) => (
    <button
      onClick={() => {
        if (!deal.isActive || window.confirm('This will deactivate other active deals. Continue?')) {
          handleToggleActive(deal._id, !deal.isActive);
        }
      }}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        deal.isActive ? 'bg-emerald-500' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${deal.isActive ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );

  // ===================== Form View =====================
  if (showModal) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
            {editingDeal ? 'Edit Sweet Deal' : 'Create Sweet Deal'}
          </h1>
          <button
            onClick={resetForm}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-6">
          {error && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Title <span className="text-[#d80a4e]">*</span></label>
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} className={inputClass} required />
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description <span className="text-[#d80a4e]">*</span></label>
              <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" className={inputClass} required />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Original Price <span className="text-[#d80a4e]">*</span></label>
              <input type="number" name="originalPrice" value={formData.originalPrice} onChange={handleInputChange} className={inputClass} required />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Sale Price <span className="text-[#d80a4e]">*</span></label>
              <input type="number" name="salePrice" value={formData.salePrice} onChange={handleInputChange} className={inputClass} required />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">End Date <span className="text-[#d80a4e]">*</span></label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleInputChange} className={inputClass} required />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Video File</label>
              <input type="file" name="videoFile" accept="video/*" onChange={handleInputChange}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#d80a4e] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white" />
            </div>

            <label className="sm:col-span-2 flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
              <input type="checkbox" name="isActive" checked={formData.isActive} onChange={handleInputChange}
                className="h-4 w-4 rounded border-gray-300 text-[#d80a4e] focus:ring-[#d80a4e]/40" />
              <span className="text-sm font-medium text-gray-700">Active Deal</span>
              {formData.isActive && <span className="text-xs text-orange-600">(deactivates other deals)</span>}
            </label>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={resetForm} className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={updating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d80a4e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8083e] disabled:opacity-50">
              {updating && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {updating ? 'Saving…' : editingDeal ? 'Update Deal' : 'Create Deal'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ===================== List View =====================
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Sweet Deals</h2>
          <p className="text-sm text-gray-500">Limited-time promotions shown on the homepage.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d80a4e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b8083e]"
        >
          <Plus className="h-4 w-4" /> Create Deal
        </button>
      </div>

      {deals.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white py-16 text-center">
          <BadgePercent className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No deals yet. Create your first sweet deal!</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {getCurrentPageItems().map((deal) => (
              <div key={deal._id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 truncate font-semibold text-gray-900">{deal.title}</h3>
                  <StatusToggle deal={deal} />
                </div>
                <div className="mt-2 flex items-center gap-2 text-sm">
                  <span className="text-gray-400 line-through">₹{deal.originalPrice}</span>
                  <span className="font-bold text-emerald-600">₹{deal.salePrice}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">Ends {new Date(deal.endDate).toLocaleDateString()}</p>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleEdit(deal)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-[#d80a4e] hover:bg-rose-100">
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button onClick={() => handleDelete(deal._id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm md:block">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-6 py-3.5">Title</th>
                  <th className="px-6 py-3.5">Price</th>
                  <th className="px-6 py-3.5">End Date</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getCurrentPageItems().map((deal) => (
                  <tr key={deal._id} className="transition-colors hover:bg-rose-50/40">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{deal.title}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="text-gray-400 line-through">₹{deal.originalPrice}</span>
                      <span className="ml-2 font-semibold text-emerald-600">₹{deal.salePrice}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{new Date(deal.endDate).toLocaleDateString()}</td>
                    <td className="px-6 py-4"><StatusToggle deal={deal} /></td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleEdit(deal)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-rose-200 hover:bg-rose-50 hover:text-[#d80a4e]">
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button onClick={() => handleDelete(deal._id)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between gap-3">
            <span className="text-xs text-gray-500 sm:text-sm">{getPageInfo()}</span>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))} disabled={currentPage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-700">{currentPage} / {getTotalPages()}</span>
              <button onClick={() => setCurrentPage((p) => Math.min(p + 1, getTotalPages()))} disabled={currentPage === getTotalPages()}
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

export default SweetDeal;
