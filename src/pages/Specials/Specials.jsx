import React, { useState, useEffect } from 'react';
import { useApi } from '../../contexts/index.jsx';
import Breadcrumb from '../../components/Breadcrumb.jsx';
import ProductCard from '../../components/ProductCard.jsx';
import { useSeo } from '../../hooks/useSeo.js';

const Specials = () => {
  useSeo({ title: 'Special Offers on Sweets & Gift Boxes', description: 'Today’s special offers and discounts on premium sweets, mithai and festive gift boxes at Chowdhry Sweet House, Gorakhpur.', path: '/specials' });
  const { fetchCategories, fetchItems, categories, loading } = useApi();
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [priceRange, setPriceRange] = useState([0, 10000]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      await fetchCategories();
      const allItems = await fetchItems();
      setAllProducts(allItems);
      setFilteredProducts(allItems);
    };
    loadData();
  }, []);

  useEffect(() => {
    let filtered = [...allProducts];

    // Category filter
    if (activeCategory !== 'all') {
      filtered = filtered.filter(item => {
        const itemCategories = Array.isArray(item.categories) ? item.categories : [item.category];
        return itemCategories.some(cat =>
          (typeof cat === 'object' ? cat._id : cat) === activeCategory
        );
      });
    }

    // Price range filter
    filtered = filtered.filter(item => {
      const price = item.discountPrice || item.price;
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.shortDesc?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Sort
    filtered.sort((a, b) => {
      const priceA = a.discountPrice || a.price;
      const priceB = b.discountPrice || b.price;

      switch (sortBy) {
        case 'price-low': return priceA - priceB;
        case 'price-high': return priceB - priceA;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });

    setFilteredProducts(filtered);
  }, [allProducts, activeCategory, sortBy, priceRange, searchQuery]);

  const clearFilters = () => {
    setActiveCategory('all');
    setSortBy('name');
    setPriceRange([0, 10000]);
    setSearchQuery('');
  };

  const categoryItemClass = (active) =>
    `flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer text-sm transition-all duration-200 ${
      active
        ? 'bg-gradient-to-r from-[#d80a4e] to-[#b8083e] text-white font-semibold shadow-sm'
        : 'text-gray-700 hover:bg-rose-50 hover:text-[#d80a4e]'
    }`;

  if (loading) {
    return (
      <div className="mithai-bg min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#d80a4e] mx-auto"></div>
          <p className="mt-4 font-display text-gray-600">Plating our specials…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mithai-bg min-h-screen pb-12">
      <Breadcrumb currentPage="Specials" />

      {/* Page heading */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-2 pb-4">
        <h1 className="font-display text-3xl sm:text-4xl font-bold text-gray-900">
          Our <span className="text-[#d80a4e]">Specials</span>
        </h1>
        <p className="mt-2 flex items-center gap-2 text-sm text-gray-500">
          <span className="inline-block h-px w-8 bg-[#d80a4e]/40" />
          Handcrafted mithai, made fresh in Gorakhpur
        </p>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row gap-5 lg:gap-7">

          {/* Mobile Filters Toggle */}
          <div className="lg:hidden">
            <button
              onClick={() => setShowFilters(v => !v)}
              className="w-full bg-[#d80a4e] text-white px-4 py-3 rounded-xl font-medium flex items-center justify-center gap-2 shadow-sm"
            >
              <i className="fas fa-filter"></i>
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </button>
          </div>

          {/* Filters Sidebar */}
          <div className={`${showFilters ? 'block' : 'hidden'} lg:block lg:w-72 flex-shrink-0`}>
            <div className="lg:sticky lg:top-24 space-y-5">

              {/* Categories */}
              <div className="bg-white rounded-2xl border border-amber-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-[#d80a4e] to-[#8b1a3a] text-white px-4 py-3">
                  <h3 className="font-display font-semibold">Categories</h3>
                </div>
                <div className="p-3 max-h-72 overflow-y-auto mithai-scroll">
                  <ul className="space-y-1">
                    <li onClick={() => setActiveCategory('all')} className={categoryItemClass(activeCategory === 'all')}>
                      <span>All Products</span>
                      {activeCategory === 'all' && <i className="fas fa-check text-xs"></i>}
                    </li>
                    {categories.map((category) => (
                      <li
                        key={category._id}
                        onClick={() => setActiveCategory(category._id)}
                        className={categoryItemClass(activeCategory === category._id)}
                      >
                        <span>{category.name}</span>
                        {activeCategory === category._id && <i className="fas fa-check text-xs"></i>}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Sort By & Price Range */}
              <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 space-y-5">
                <div>
                  <h3 className="font-display font-semibold text-gray-900 mb-2">Sort By</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 text-sm"
                  >
                    <option value="name">Name</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>

                <div>
                  <h3 className="font-display font-semibold text-gray-900 mb-2">Price Range</h3>
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <input
                        type="number"
                        placeholder="Min"
                        value={priceRange[0] === 0 ? '' : priceRange[0]}
                        onChange={(e) => setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 text-sm"
                      />
                      <input
                        type="number"
                        placeholder="Max"
                        value={priceRange[1] === 10000 ? '' : priceRange[1]}
                        onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value) || 10000])}
                        className="w-full px-3 py-2 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 text-sm"
                      />
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10000"
                      step="100"
                      value={priceRange[1]}
                      onChange={(e) => setPriceRange([priceRange[0], parseInt(e.target.value)])}
                      className="w-full accent-[#d80a4e]"
                    />
                    <div className="text-sm font-medium text-gray-600">
                      ₹{priceRange[0]} – ₹{priceRange[1]}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-4 mb-5">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div>
                  <h2 className="font-display text-xl font-bold text-gray-900">Products</h2>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {filteredProducts.length} {filteredProducts.length === 1 ? 'item' : 'items'}
                  </p>
                </div>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Search products..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full sm:w-56 lg:w-64 pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#d80a4e]/40 text-sm"
                    />
                  </div>
                  <button
                    onClick={clearFilters}
                    className="rounded-xl px-3 py-2 text-sm font-medium text-[#d80a4e] transition-colors hover:bg-rose-50 whitespace-nowrap"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-5">
              {filteredProducts.length > 0 ? filteredProducts.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} showSpecialTag />
              )) : (
                <div className="col-span-full">
                  <div className="bg-white rounded-2xl border border-amber-100 p-12 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-rose-50 text-[#d80a4e]">
                      <i className="fas fa-box-open text-2xl"></i>
                    </div>
                    <p className="text-gray-600">No products match your filters.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Specials;
