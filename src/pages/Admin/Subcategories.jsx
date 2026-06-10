import React, { useState, useEffect } from 'react';
import { useApi, useNotification } from '../../contexts/index.jsx';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowLeft, Layers } from 'lucide-react';

const Subcategories = () => {
  const { getAllSubcategories, addSubcategory, updateSubcategory, deleteSubcategory, fetchCategories, categories, loading } = useApi();
  const { showNotification, confirm } = useNotification();
  const [subcategories, setSubcategories] = useState([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editingSubcategory, setEditingSubcategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', categories: [] });
  const [updating, setUpdating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadData();
  }, [currentPage]);

  const loadData = async () => {
    try {
      await fetchCategories();
      const response = await getAllSubcategories(currentPage, itemsPerPage);
      setSubcategories(response.subcategories || []);
      setTotalPages(response.pagination?.pages || 1);
      setTotalItems(response.pagination?.total || 0);
    } catch (error) {
      console.error('Error loading subcategories data:', error);
      setSubcategories([]);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingSubcategory(null);
    setFormData({ name: '', description: '', categories: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const wasEditing = Boolean(editingSubcategory);
    try {
      setUpdating(true);
      if (editingSubcategory) {
        await updateSubcategory(editingSubcategory._id, formData);
      } else {
        await addSubcategory(formData);
      }
      resetForm();
      loadData();
      showNotification(wasEditing ? 'Subcategory updated' : 'Subcategory added', 'success');
    } catch (error) {
      console.error('Error saving subcategory:', error);
      showNotification(error.message || 'Failed to save subcategory', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleEdit = (subcategory) => {
    setEditingSubcategory(subcategory);
    setFormData({
      name: subcategory.name || '',
      description: subcategory.description || '',
      categories: Array.isArray(subcategory.categories)
        ? subcategory.categories.map((cat) => (typeof cat === 'object' ? cat._id : cat))
        : subcategory.category
          ? [typeof subcategory.category === 'object' ? subcategory.category._id : subcategory.category]
          : [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Delete subcategory?', message: 'This action cannot be undone.', confirmText: 'Delete' });
    if (!ok) return;
    try {
      await deleteSubcategory(id);
      setSubcategories((prev) => prev.filter((sub) => sub._id !== id));
      loadData();
      showNotification('Subcategory deleted', 'success');
    } catch (error) {
      console.error('Error deleting subcategory:', error);
      showNotification(error.message || 'Failed to delete subcategory', 'error');
    }
  };

  const getCategoryNames = (categoriesRef) => {
    if (!categoriesRef) return 'No categories';
    if (Array.isArray(categoriesRef)) {
      return categoriesRef
        .map((catRef) => {
          if (typeof catRef === 'object' && catRef?.name) return catRef.name;
          const category = categories.find((cat) => cat._id === catRef);
          return category ? category.name : 'Unknown';
        })
        .join(', ');
    }
    if (typeof categoriesRef === 'object' && categoriesRef?.name) return categoriesRef.name;
    const category = categories.find((cat) => cat._id === categoriesRef);
    return category ? category.name : 'Unknown';
  };

  const toggleCategory = (id, checked) => {
    setFormData((prev) => ({
      ...prev,
      categories: checked ? [...prev.categories, id] : prev.categories.filter((c) => c !== id),
    }));
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition focus:border-[#d80a4e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/20';

  // ===================== Form View =====================
  if (showModal) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
            {editingSubcategory ? 'Edit Subcategory' : 'Add Subcategory'}
          </h1>
          <button
            onClick={resetForm}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50"
          >
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-6">
          <div className="grid grid-cols-1 gap-5">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Subcategory Name <span className="text-[#d80a4e]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Ladoo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Categories <span className="text-[#d80a4e]">*</span>
              </label>
              {categories.length === 0 ? (
                <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                  No categories available — add a category first.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => {
                    const checked = formData.categories.includes(cat._id);
                    return (
                      <button
                        type="button"
                        key={cat._id}
                        onClick={() => toggleCategory(cat._id, !checked)}
                        className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                          checked
                            ? 'border-[#d80a4e] bg-[#d80a4e] text-white'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:text-[#d80a4e]'
                        }`}
                      >
                        {cat.name}
                      </button>
                    );
                  })}
                </div>
              )}
              <p className="mt-1.5 text-xs text-gray-400">Tap to assign this subcategory to one or more categories.</p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
              <textarea
                placeholder="Optional description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className={inputClass}
                rows="4"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={updating}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d80a4e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8083e] disabled:opacity-50"
            >
              {updating && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {updating ? 'Saving…' : editingSubcategory ? 'Update Subcategory' : 'Add Subcategory'}
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
          <h2 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Subcategories</h2>
          <p className="text-sm text-gray-500">Group products inside your categories.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d80a4e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b8083e]"
        >
          <Plus className="h-4 w-4" /> Add Subcategory
        </button>
      </div>

      {subcategories.length === 0 && !loading ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white py-16 text-center">
          <Layers className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No subcategories yet. Add your first one!</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {subcategories.map((subcategory) => (
              <div key={subcategory._id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <h3 className="font-semibold text-gray-900">{subcategory.name}</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {getCategoryNames(subcategory.categories || subcategory.category)
                    .split(', ')
                    .map((n, i) => (
                      <span key={i} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                        {n}
                      </span>
                    ))}
                </div>
                <p className="mt-2 line-clamp-2 text-xs text-gray-500">
                  {subcategory.description || 'No description'}
                </p>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(subcategory)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-[#d80a4e] hover:bg-rose-100"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(subcategory._id)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100"
                  >
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
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Categories</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subcategories.map((subcategory) => (
                  <tr key={subcategory._id} className="transition-colors hover:bg-rose-50/40">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{subcategory.name}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1.5">
                        {getCategoryNames(subcategory.categories || subcategory.category)
                          .split(', ')
                          .map((n, i) => (
                            <span key={i} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                              {n}
                            </span>
                          ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {subcategory.description || <span className="text-gray-400">No description</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(subcategory)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-rose-200 hover:bg-rose-50 hover:text-[#d80a4e]"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(subcategory._id)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        >
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
            <span className="text-xs text-gray-500 sm:text-sm">
              {totalItems === 0 ? '0 of 0' : `${(currentPage - 1) * itemsPerPage + 1}–${Math.min(currentPage * itemsPerPage, totalItems)} of ${totalItems}`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {currentPage} / {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Subcategories;
