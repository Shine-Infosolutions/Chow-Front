import React, { useState, useEffect } from 'react';
import { useApi, useNotification } from '../../contexts/index.jsx';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowLeft, FolderOpen } from 'lucide-react';

const Categories = () => {
  const { fetchCategories, addCategory, updateCategory, deleteCategory, categories, loading } = useApi();
  const { showNotification, confirm } = useNotification();
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({ name: '', description: '', displayRank: 0 });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchCategories();
  }, []);

  const resetForm = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({ name: '', description: '', displayRank: 0 });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const wasEditing = Boolean(editingCategory);
    try {
      setUpdating(true);
      setError('');
      if (editingCategory) {
        await updateCategory(editingCategory._id, formData);
      } else {
        await addCategory(formData);
      }
      resetForm();
      fetchCategories();
      showNotification(wasEditing ? 'Category updated' : 'Category added', 'success');
    } catch (error) {
      console.error('Error saving category:', error);
      setError(error.message || 'Failed to save category');
    } finally {
      setUpdating(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name || '',
      description: category.description || '',
      displayRank: category.displayRank || 0,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    const ok = await confirm({ title: 'Delete category?', message: 'This action cannot be undone.', confirmText: 'Delete' });
    if (!ok) return;
    try {
      await deleteCategory(id);
      fetchCategories();
      showNotification('Category deleted', 'success');
    } catch (error) {
      console.error('Error deleting category:', error);
      showNotification(error.message || 'Failed to delete category', 'error');
    }
  };

  const getTotalPages = () => Math.max(1, Math.ceil(categories.length / itemsPerPage));
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return categories.slice(startIndex, startIndex + itemsPerPage);
  };
  const getPageInfo = () => {
    if (categories.length === 0) return '0 of 0';
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, categories.length);
    return `${startIndex}–${endIndex} of ${categories.length}`;
  };

  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 transition focus:border-[#d80a4e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/20';

  // ===================== Form View =====================
  if (showModal) {
    return (
      <div className="mx-auto max-w-3xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
            {editingCategory ? 'Edit Category' : 'Add Category'}
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
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Name <span className="text-[#d80a4e]">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Traditional Sweets"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className={inputClass}
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Display Rank</label>
              <input
                type="number"
                placeholder="0"
                min="0"
                value={formData.displayRank}
                onChange={(e) => setFormData({ ...formData, displayRank: parseInt(e.target.value) || 0 })}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-gray-400">Lower numbers appear first on the homepage.</p>
            </div>

            <div className="sm:col-span-2">
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
              {updating ? 'Saving…' : editingCategory ? 'Update Category' : 'Add Category'}
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
          <h2 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Categories</h2>
          <p className="text-sm text-gray-500">Top-level groups shown on your storefront.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d80a4e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b8083e]"
        >
          <Plus className="h-4 w-4" /> Add Category
        </button>
      </div>

      {loading && categories.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-100 border-t-[#d80a4e]" />
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white py-16 text-center">
          <FolderOpen className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No categories yet. Add your first one!</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {getCurrentPageItems().map((category) => (
              <div key={category._id} className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-gray-900">{category.name}</h3>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-500">
                      {category.description || 'No description'}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                    #{category.displayRank || 0}
                  </span>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleEdit(category)}
                    className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-[#d80a4e] hover:bg-rose-100"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(category._id)}
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
                  <th className="px-6 py-3.5">Rank</th>
                  <th className="px-6 py-3.5">Description</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {getCurrentPageItems().map((category) => (
                  <tr key={category._id} className="transition-colors hover:bg-rose-50/40">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{category.name}</td>
                    <td className="px-6 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        {category.displayRank || 0}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {category.description || <span className="text-gray-400">No description</span>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleEdit(category)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-rose-200 hover:bg-rose-50 hover:text-[#d80a4e]"
                        >
                          <Pencil className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category._id)}
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
            <span className="text-xs text-gray-500 sm:text-sm">{getPageInfo()}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-sm font-medium text-gray-700">
                {currentPage} / {getTotalPages()}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, getTotalPages()))}
                disabled={currentPage === getTotalPages()}
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

export default Categories;
