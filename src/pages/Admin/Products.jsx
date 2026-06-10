import React, { useState, useEffect } from 'react';
import { useApi } from '../../contexts/index.jsx';
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, ArrowLeft, Search, Package, X } from 'lucide-react';

const EMPTY_FORM = {
  name: '', description: '', price: '', discountPrice: '', stockQty: '', shortDesc: '', longDesc: '',
  categories: [], subcategories: [], images: [], video: null,
  isBestRated: false, isBestSeller: false, isOnSale: false, isPopular: false,
  weight: 100, uom: 'gm', piecesPerUnit: 1, status: 'active',
};

const Products = () => {
  const { fetchItems, addItem, updateItem, deleteItem, fetchCategories, getAllSubcategories, searchItems, items, categories, loading } = useApi();
  const [subcategories, setSubcategories] = useState([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    fetchItems();
    fetchCategories();
    loadSubcategories();
  }, []);

  useEffect(() => {
    setFilteredItems(items);
  }, [items]);

  useEffect(() => {
    if (!searchQuery.trim()) setFilteredItems(items);
  }, [searchQuery, items]);

  const handleSearch = async () => {
    if (searchQuery.trim()) {
      try {
        const results = await searchItems(searchQuery);
        setFilteredItems(Array.isArray(results) ? results : results?.items || []);
      } catch (error) {
        const localResults = items.filter((item) =>
          item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.description?.toLowerCase().includes(searchQuery.toLowerCase()));
        setFilteredItems(localResults);
      }
    } else {
      setFilteredItems(items);
    }
  };

  const loadSubcategories = async () => {
    try {
      const subcats = await getAllSubcategories();
      setSubcategories(Array.isArray(subcats) ? subcats : subcats?.subcategories || []);
    } catch (error) {
      setSubcategories([]);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setEditingProduct(null);
    setFormData(EMPTY_FORM);
    setSelectedImages([]);
    setSelectedVideo(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUpdating(true);
      const submitData = new FormData();
      Object.keys(formData).forEach((key) => {
        if (key !== 'images' && key !== 'video' && key !== 'subcategories' && key !== 'categories' && formData[key]) {
          submitData.append(key, formData[key]);
        }
      });
      if (formData.categories?.length) formData.categories.forEach((catId) => submitData.append('categories', catId));
      if (formData.subcategories?.length) formData.subcategories.forEach((subcatId) => submitData.append('subcategories', subcatId));
      selectedImages.forEach((image) => submitData.append('images', image));
      if (selectedVideo) submitData.append('video', selectedVideo);

      if (editingProduct && editingProduct._id) {
        const updatedProduct = await updateItem(editingProduct._id, submitData);
        const completeUpdatedProduct = updatedProduct.item || updatedProduct;
        setFilteredItems((prev) => prev.map((item) => (item._id === editingProduct._id ? completeUpdatedProduct : item)));
      } else {
        const newProduct = await addItem(submitData);
        const completeNewProduct = newProduct.item || newProduct;
        setFilteredItems((prev) => [completeNewProduct, ...prev]);
      }
      resetForm();
      fetchItems();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setUpdating(false);
    }
  };

  const computeFilteredSubcats = (categoryIds) => {
    if (categoryIds.length > 0 && Array.isArray(subcategories)) {
      return subcategories.filter((subcat) => {
        const subcatCategories = Array.isArray(subcat.categories) ? subcat.categories : [subcat.category];
        return subcatCategories.some((catRef) => categoryIds.includes(typeof catRef === 'object' ? catRef._id : catRef));
      });
    }
    return [];
  };

  const handleEdit = (product) => {
    if (!product._id) {
      alert('Error: Product ID is missing. Cannot edit product.');
      return;
    }
    const categoryIds = Array.isArray(product.categories)
      ? product.categories.map((cat) => (typeof cat === 'object' ? cat._id : cat))
      : product.category ? [typeof product.category === 'object' ? product.category._id : product.category] : [];
    setEditingProduct(product);
    setFormData({
      name: product.name || '', description: product.description || '', price: product.price || '',
      discountPrice: product.discountPrice || '', stockQty: product.stockQty || '',
      shortDesc: product.shortDesc || '', longDesc: product.longDesc || '',
      categories: categoryIds,
      subcategories: Array.isArray(product.subcategories)
        ? product.subcategories.map((sub) => (typeof sub === 'object' ? sub._id : sub))
        : product.subcategory ? [typeof product.subcategory === 'object' ? product.subcategory._id : product.subcategory] : [],
      images: product.images || [], video: product.video || null,
      isBestRated: product.isBestRated || false, isBestSeller: product.isBestSeller || false,
      isOnSale: product.isOnSale || false, isPopular: product.isPopular || false,
      weight: product.weight || 100, uom: product.uom || 'gm', piecesPerUnit: product.piecesPerUnit || 1,
      status: product.status || 'active',
    });
    setFilteredSubcategories(computeFilteredSubcats(categoryIds));
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteItem(id);
        setFilteredItems((prev) => prev.filter((item) => item._id !== id));
        fetchItems();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const toggleCategory = (catId, checked) => {
    const newCategories = checked ? [...formData.categories, catId] : formData.categories.filter((id) => id !== catId);
    setFormData({ ...formData, categories: newCategories, subcategories: [] });
    setFilteredSubcategories(computeFilteredSubcats(newCategories));
  };

  const toggleSubcategory = (subId, checked) => {
    setFormData((prev) => ({
      ...prev,
      subcategories: checked ? [...prev.subcategories, subId] : prev.subcategories.filter((id) => id !== subId),
    }));
  };

  const getCategoryNames = (productCategories) => {
    if (!productCategories) return 'No categories';
    if (Array.isArray(productCategories)) {
      return productCategories.map((cat) => {
        if (typeof cat === 'object' && cat?.name) return cat.name;
        const category = categories.find((c) => c._id === cat);
        return category ? category.name : cat;
      }).join(', ');
    }
    if (typeof productCategories === 'object' && productCategories?.name) return productCategories.name;
    const category = categories.find((c) => c._id === productCategories);
    return category ? category.name : productCategories;
  };

  const getTotalPages = () => Math.max(1, Math.ceil(filteredItems.length / itemsPerPage));
  const getCurrentPageItems = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  };
  const getPageInfo = () => {
    if (filteredItems.length === 0) return '0 of 0';
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, filteredItems.length);
    return `${startIndex}–${endIndex} of ${filteredItems.length}`;
  };

  const discountInvalid = formData.discountPrice && formData.price && parseFloat(formData.discountPrice) >= parseFloat(formData.price);
  const inputClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 transition focus:border-[#d80a4e] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/20';
  const labelClass = 'mb-1.5 block text-sm font-medium text-gray-700';
  const fileClass =
    'w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-[#d80a4e] file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white';

  const ProductImg = ({ product, size = 'h-12 w-12' }) => {
    const img = product.images?.[0];
    if (img) return <img src={img} alt={product.name} loading="lazy" className={`${size} shrink-0 rounded-xl object-cover`} />;
    return (
      <div className={`${size} flex shrink-0 items-center justify-center rounded-xl bg-rose-50 text-[#d80a4e]`}>
        <Package className="h-5 w-5" />
      </div>
    );
  };

  // ===================== Form View =====================
  if (showModal) {
    return (
      <div className="mx-auto max-w-4xl p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">
            {editingProduct ? 'Edit Product' : 'Add Product'}
          </h1>
          <button onClick={resetForm} className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Back</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic info */}
          <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Basic Information</h3>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className={labelClass}>Name <span className="text-[#d80a4e]">*</span></label>
                <input type="text" placeholder="e.g. Premium Patisa" value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={inputClass} required />
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Categories <span className="text-[#d80a4e]">*</span></label>
                  {categories.length === 0 ? (
                    <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">No categories available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => {
                        const checked = formData.categories.includes(cat._id);
                        return (
                          <button type="button" key={cat._id} onClick={() => toggleCategory(cat._id, !checked)}
                            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${checked ? 'border-[#d80a4e] bg-[#d80a4e] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-rose-200 hover:text-[#d80a4e]'}`}>
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div>
                  <label className={labelClass}>Subcategories</label>
                  {formData.categories.length === 0 ? (
                    <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400">Select categories first</p>
                  ) : filteredSubcategories.length === 0 ? (
                    <p className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-400">No subcategories available</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {filteredSubcategories.map((subcat) => {
                        const checked = formData.subcategories.includes(subcat._id);
                        return (
                          <button type="button" key={subcat._id} onClick={() => toggleSubcategory(subcat._id, !checked)}
                            className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${checked ? 'border-amber-500 bg-amber-500 text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-amber-200 hover:text-amber-600'}`}>
                            {subcat.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* Pricing & stock */}
          <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Pricing & Stock</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Price <span className="text-[#d80a4e]">*</span></label>
                <input type="number" placeholder="Price" value={formData.price}
                  onChange={(e) => {
                    const price = parseFloat(e.target.value);
                    const discountPrice = parseFloat(formData.discountPrice);
                    setFormData({ ...formData, price: e.target.value });
                    if (discountPrice >= price && price > 0) {
                      setFormData((prev) => ({ ...prev, price: e.target.value, discountPrice: '' }));
                    }
                  }} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Discount Price</label>
                <input type="number" placeholder="Discount Price" value={formData.discountPrice}
                  onChange={(e) => {
                    const discountPrice = parseFloat(e.target.value);
                    const price = parseFloat(formData.price);
                    if (discountPrice >= price && price > 0) {
                      alert('Discount price must be less than the original price!');
                      return;
                    }
                    setFormData({ ...formData, discountPrice: e.target.value });
                  }}
                  max={formData.price ? parseFloat(formData.price) - 1 : undefined}
                  className={`${inputClass} ${discountInvalid ? 'border-red-400 focus:border-red-400 focus:ring-red-200' : ''}`} />
                {discountInvalid && <p className="mt-1 text-xs text-red-500">Must be less than ₹{formData.price}</p>}
              </div>
              <div>
                <label className={labelClass}>Stock Qty</label>
                <input type="number" placeholder="e.g. 100" value={formData.stockQty}
                  onChange={(e) => setFormData({ ...formData, stockQty: e.target.value })} className={inputClass} />
              </div>
            </div>
          </section>

          {/* Measurement */}
          <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Measurement</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
              <div>
                <label className={labelClass}>Weight / Quantity <span className="text-[#d80a4e]">*</span></label>
                <input type="number" placeholder="100" min="1" value={formData.weight}
                  onChange={(e) => setFormData({ ...formData, weight: e.target.value })} className={inputClass} required />
              </div>
              <div>
                <label className={labelClass}>Unit of Measure <span className="text-[#d80a4e]">*</span></label>
                <select value={formData.uom} onChange={(e) => setFormData({ ...formData, uom: e.target.value })} className={inputClass} required>
                  <option value="gm">Grams (gm)</option>
                  <option value="kg">Kilograms (kg)</option>
                  <option value="ml">Milliliters (ml)</option>
                  <option value="ltr">Liters (ltr)</option>
                  <option value="pcs">Pieces (pcs)</option>
                  <option value="box">Box</option>
                  <option value="pack">Pack</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Pieces Per Unit</label>
                <input type="number" placeholder="1" min="1" value={formData.piecesPerUnit}
                  onChange={(e) => setFormData({ ...formData, piecesPerUnit: e.target.value })} className={inputClass} required />
                <p className="mt-1 text-xs text-gray-400">E.g., 12 pieces per box</p>
              </div>
            </div>
          </section>

          {/* Descriptions */}
          <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Descriptions</h3>
            <div className="grid grid-cols-1 gap-5">
              <div>
                <label className={labelClass}>Short Description</label>
                <textarea placeholder="Short description" value={formData.shortDesc}
                  onChange={(e) => setFormData({ ...formData, shortDesc: e.target.value })} className={inputClass} rows="2" />
              </div>
              <div>
                <label className={labelClass}>Long Description</label>
                <textarea placeholder="Long description" value={formData.longDesc}
                  onChange={(e) => setFormData({ ...formData, longDesc: e.target.value })} className={inputClass} rows="4" />
              </div>
            </div>
          </section>

          {/* Media */}
          <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Media</h3>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Images <span className="text-gray-400">(max 3)</span></label>
                <input type="file" multiple accept="image/*"
                  onChange={(e) => setSelectedImages(Array.from(e.target.files).slice(0, 3))} className={fileClass} />
                {selectedImages.length > 0 && <p className="mt-1.5 text-xs text-gray-500">{selectedImages.length} image(s) selected</p>}
                {editingProduct && formData.images?.length > 0 && selectedImages.length === 0 && (
                  <div className="mt-2 flex gap-2">
                    {formData.images.slice(0, 3).map((img, i) => (
                      <img key={i} src={img} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ))}
                  </div>
                )}
              </div>
              <div>
                <label className={labelClass}>Video <span className="text-gray-400">(&lt; 10MB)</span></label>
                <input type="file" accept="video/*"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.size <= 10 * 1024 * 1024) setSelectedVideo(file);
                    else if (file) { alert('Video size must be less than 10MB'); e.target.value = ''; }
                  }} className={fileClass} />
                {selectedVideo && <p className="mt-1.5 text-xs text-gray-500">Selected: {selectedVideo.name}</p>}
              </div>
            </div>
          </section>

          {/* Features */}
          <section className="rounded-2xl border border-amber-100 bg-white p-4 shadow-sm sm:p-6">
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-gray-400">Tags</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                ['isBestRated', 'Best Rated'],
                ['isBestSeller', 'Best Seller'],
                ['isOnSale', 'On Sale'],
                ['isPopular', 'Popular'],
              ].map(([key, label]) => (
                <label key={key} className={`flex cursor-pointer items-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition ${formData[key] ? 'border-[#d80a4e] bg-rose-50 text-[#d80a4e]' : 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                  <input type="checkbox" checked={formData[key]} onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-[#d80a4e] focus:ring-[#d80a4e]/40" />
                  {label}
                </label>
              ))}
            </div>
          </section>

          <div className="flex flex-col-reverse gap-2 pb-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={resetForm} className="rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50">Cancel</button>
            <button type="submit" disabled={updating || discountInvalid}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d80a4e] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#b8083e] disabled:cursor-not-allowed disabled:opacity-50">
              {updating && <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />}
              {updating ? 'Saving…' : editingProduct ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // ===================== List View =====================
  return (
    <div className="mx-auto max-w-6xl p-4 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-gray-900 sm:text-2xl">Products</h2>
          <p className="text-sm text-gray-500">{items.length} items in your catalog.</p>
        </div>
        <button onClick={() => setShowModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d80a4e] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#b8083e]">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4 w-full sm:max-w-md">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => {
            const query = e.target.value;
            setSearchQuery(query);
            setCurrentPage(1);
            if (!query.trim()) {
              setFilteredItems(items);
            } else {
              const localResults = items.filter((item) => {
                const q = query.toLowerCase();
                return item.name?.toLowerCase().includes(q) ||
                  item.description?.toLowerCase().includes(q) ||
                  item.shortDesc?.toLowerCase().includes(q) ||
                  (typeof item.category === 'object' ? item.category?.name : item.category)?.toLowerCase().includes(q);
              });
              setFilteredItems(localResults);
            }
          }}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          placeholder="Search products…"
          className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-10 pr-9 text-sm focus:border-[#d80a4e] focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/20"
        />
        {searchQuery && (
          <button onClick={() => { setSearchQuery(''); setFilteredItems(items); }} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 hover:text-[#d80a4e]">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {loading && filteredItems.length === 0 ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-rose-100 border-t-[#d80a4e]" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-amber-200 bg-white py-16 text-center">
          <Package className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">{searchQuery ? `No products match "${searchQuery}"` : 'No products yet. Add your first one!'}</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 lg:hidden">
            {getCurrentPageItems().map((product) => (
              <div key={product._id} className="rounded-2xl border border-amber-100 bg-white p-3 shadow-sm">
                <div className="flex gap-3">
                  <ProductImg product={product} size="h-16 w-16" />
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-gray-900">{product.name}</h3>
                    <p className="truncate text-xs text-gray-500">{getCategoryNames(product.categories || product.category)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-bold text-[#d80a4e]">₹{product.discountPrice || product.price}</span>
                      {product.discountPrice && <span className="text-xs text-gray-400 line-through">₹{product.price}</span>}
                    </div>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {product.weight || 100}{product.uom || 'gm'} · Stock {product.stockQty || 0}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button onClick={() => handleEdit(product)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-[#d80a4e] hover:bg-rose-100">
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                  <button onClick={() => handleDelete(product._id)} className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-100">
                    <Trash2 className="h-4 w-4" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden overflow-hidden rounded-2xl border border-amber-100 bg-white shadow-sm lg:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px]">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    <th className="px-4 py-3.5">Product</th>
                    <th className="px-4 py-3.5">Categories</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5 text-center">Stock</th>
                    <th className="px-4 py-3.5 text-center">Weight</th>
                    <th className="px-4 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {getCurrentPageItems().map((product) => (
                    <tr key={product._id} className="transition-colors hover:bg-rose-50/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImg product={product} />
                          <span className="font-medium text-gray-900">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{getCategoryNames(product.categories || product.category)}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="font-semibold text-[#d80a4e]">₹{product.discountPrice || product.price}</span>
                        {product.discountPrice && <span className="ml-1.5 text-xs text-gray-400 line-through">₹{product.price}</span>}
                      </td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{product.stockQty || 0}</td>
                      <td className="px-4 py-3 text-center text-sm text-gray-600">{product.weight || 100}{product.uom || 'gm'}</td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => handleEdit(product)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-rose-200 hover:bg-rose-50 hover:text-[#d80a4e]">
                            <Pencil className="h-3.5 w-3.5" /> Edit
                          </button>
                          <button onClick={() => handleDelete(product._id)} className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:border-red-200 hover:bg-red-50 hover:text-red-600">
                            <Trash2 className="h-3.5 w-3.5" /> Delete
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

export default Products;
