'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Search, Filter, SlidersHorizontal, MapPin, X, RefreshCw } from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import { api } from '@/lib/api';

function BrowseContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [listings, setListings] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);

  // Filter states
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || 'All');
  const [selectedCondition, setSelectedCondition] = useState(searchParams.get('condition') || '');
  const [location, setLocation] = useState(searchParams.get('location') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('min_price') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('max_price') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'recent');

  useEffect(() => {
    api.getCategories().then((res) => {
      if (res?.categories) setCategories(res.categories);
    });
  }, []);

  const fetchFilteredListings = async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = { sort };
      if (query.trim()) params.q = query.trim();
      if (selectedCategory && selectedCategory !== 'All') params.category = selectedCategory;
      if (selectedCondition) params.condition = selectedCondition;
      if (location.trim()) params.location = location.trim();
      if (minPrice) params.min_price = minPrice;
      if (maxPrice) params.max_price = maxPrice;

      const res = await api.getListings(params);
      if (res?.listings) {
        setListings(res.listings);
        setTotal(res.total || res.listings.length);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilteredListings();
  }, [selectedCategory, selectedCondition, sort]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchFilteredListings();
  };

  const handleResetFilters = () => {
    setQuery('');
    setSelectedCategory('All');
    setSelectedCondition('');
    setLocation('');
    setMinPrice('');
    setMaxPrice('');
    setSort('recent');
    router.push('/browse');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-primary-navy tracking-tight">Search & Discover Rentals</h1>
        <p className="text-xs sm:text-sm text-text-secondary mt-1">
          Explore {total} items available for direct peer rental
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters Sidebar (Glass Level 2) */}
        <aside className="lg:col-span-1 space-y-6 glass-2 p-6 rounded-3xl h-fit border border-white/80 shadow-glass-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200/50">
            <div className="flex items-center gap-2 font-bold text-text-primary text-sm">
              <SlidersHorizontal className="w-4 h-4 text-primary" />
              <span>Filters</span>
            </div>
            <button
              onClick={handleResetFilters}
              className="text-xs text-text-muted hover:text-primary font-semibold transition"
            >
              Reset All
            </button>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-2">Keyword</label>
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="Product name, brand..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 glass-1 rounded-xl text-xs focus:glass-3 focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
            </form>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-2">City / Location</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
              <input
                type="text"
                placeholder="e.g. Indiranagar, Bengaluru"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={fetchFilteredListings}
                className="w-full pl-9 pr-3 py-2 glass-1 rounded-xl text-xs focus:glass-3 focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2.5 glass-1 rounded-xl text-xs font-semibold text-text-primary outline-none focus:glass-3 focus:ring-2 focus:ring-primary/20"
            >
              <option value="All">All Categories</option>
              {categories.map((c) => (
                <option key={c.id || c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Condition */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-2">Condition</label>
            <select
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
              className="w-full p-2.5 glass-1 rounded-xl text-xs font-semibold text-text-primary outline-none focus:glass-3 focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Any Condition</option>
              <option value="brand_new">Brand New</option>
              <option value="like_new">Like New</option>
              <option value="good">Good Condition</option>
              <option value="fair">Fair Condition</option>
            </select>
          </div>

          {/* Price Range */}
          <div>
            <label className="block text-xs font-bold text-text-primary mb-2">Daily Rate (₹)</label>
            <div className="flex items-center gap-2">
              <input
                type="number"
                placeholder="Min"
                value={minPrice}
                onChange={(e) => setMinPrice(e.target.value)}
                className="w-1/2 p-2 glass-1 rounded-xl text-xs outline-none focus:glass-3"
              />
              <span className="text-text-muted text-xs">-</span>
              <input
                type="number"
                placeholder="Max"
                value={maxPrice}
                onChange={(e) => setMaxPrice(e.target.value)}
                className="w-1/2 p-2 glass-1 rounded-xl text-xs outline-none focus:glass-3"
              />
            </div>
            <button
              onClick={fetchFilteredListings}
              className="w-full mt-2.5 py-2 glass-1 hover:glass-3 text-text-primary text-xs font-bold rounded-xl transition shadow-xs"
            >
              Apply Filter
            </button>
          </div>
        </aside>

        {/* Listings Result Grid */}
        <div className="lg:col-span-3 space-y-6">
          {/* Top Sort & Count Bar (Glass Level 2) */}
          <div className="flex flex-wrap items-center justify-between gap-4 glass-2 px-5 py-3.5 rounded-2xl border border-white/80 shadow-glass-sm">
            <span className="text-xs font-bold text-text-secondary">
              Showing <span className="text-primary-navy font-extrabold">{listings.length}</span> of {total} rentals
            </span>

            <div className="flex items-center gap-2">
              <span className="text-xs text-text-secondary font-medium">Sort by:</span>
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="glass-1 rounded-xl px-3 py-1.5 text-xs font-bold text-text-primary outline-none cursor-pointer focus:glass-3"
              >
                <option value="recent">Recently Listed</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="views">Most Popular</option>
              </select>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="h-80 glass-1 animate-pulse rounded-2xl"></div>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 glass-1 rounded-3xl border border-dashed border-slate-300">
              <p className="text-base font-bold text-text-primary">No listings found matching your search</p>
              <p className="text-xs text-text-secondary mt-1 max-w-sm mx-auto">
                Try widening your price range, searching for another keyword, or resetting filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-4 px-5 py-2 liquid-blue-gradient text-white text-xs font-bold rounded-full transition shadow-md"
              >
                Reset Search Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs font-semibold text-text-secondary">Loading catalog...</div>}>
      <BrowseContent />
    </Suspense>
  );
}
