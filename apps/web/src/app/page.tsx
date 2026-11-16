'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Sparkles,
  ShieldCheck,
  MessageCircle,
  TrendingUp,
  ArrowRight,
  Camera,
  Laptop,
  Smartphone,
  Sofa,
  Car,
  Wrench,
  Dumbbell,
  Package,
} from 'lucide-react';
import ListingCard from '@/components/ListingCard';
import { api } from '@/lib/api';

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Electronics': <Smartphone className="w-5 h-5 text-primary" />,
  'Laptops & Computers': <Laptop className="w-5 h-5 text-primary-light" />,
  'Cameras & Photography': <Camera className="w-5 h-5 text-primary" />,
  'Furniture': <Sofa className="w-5 h-5 text-functional-warning" />,
  'Vehicles & Mobility': <Car className="w-5 h-5 text-primary" />,
  'Tools & Equipment': <Wrench className="w-5 h-5 text-text-secondary" />,
  'Sports & Fitness': <Dumbbell className="w-5 h-5 text-functional-warning" />,
  'Other': <Package className="w-5 h-5 text-text-muted" />,
};

export default function HomePage() {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredListings, setFeaturedListings] = useState<any[]>([]);
  const [recentListings, setRecentListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [catRes, featRes, listRes] = await Promise.all([
          api.getCategories(),
          api.getFeaturedListings(),
          api.getListings({ limit: 8, sort: 'recent' }),
        ]);

        if (catRes?.categories) setCategories(catRes.categories);
        if (featRes?.listings) setFeaturedListings(featRes.listings);
        if (listRes?.listings) setRecentListings(listRes.listings);
      } catch (err) {
        console.error('Failed to load marketplace data:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/browse?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/browse');
    }
  };

  return (
    <div className="space-y-16 pb-20">
      {/* 1. HERO SECTION (Liquid Glassmorphism & Soft Ambient Blue Lighting) */}
      <section className="relative overflow-hidden pt-12 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Subtle Glass Tag Pill */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass-2 text-primary text-xs font-bold tracking-wide uppercase mb-6 shadow-glass-sm">
            <Sparkles className="w-3.5 h-3.5 text-primary-light" />
            <span>0% Commission P2P Rental Network</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight sm:leading-none text-primary-navy">
            Skip Buying. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-primary via-primary-light to-blue-600 bg-clip-text text-transparent">
              Rent Smarter.
            </span>
          </h1>

          <p className="mt-5 text-sm sm:text-base text-text-secondary max-w-2xl mx-auto font-normal leading-relaxed">
            Rent cameras, lenses, laptops, electronics, and power tools from trusted verified owners in your area. Zero platform commission fees.
          </p>

          {/* Large Frosted Glass Search Bar */}
          <div className="mt-8 max-w-2xl mx-auto glass-3 p-2 sm:p-2.5 rounded-2xl sm:rounded-full border border-white/80 shadow-glass-lg transition-all focus-within:shadow-glass-glow">
            <form onSubmit={handleHeroSearch} className="flex flex-col sm:flex-row items-center gap-2">
              <div className="flex-1 flex items-center gap-3 px-4 w-full text-text-primary">
                <Search className="w-5 h-5 text-primary flex-shrink-0" />
                <input
                  type="text"
                  placeholder="What would you like to rent? (e.g. Sony A7 IV, MacBook Pro, Tent)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent text-xs sm:text-sm text-text-primary placeholder-text-muted outline-none py-2"
                />
              </div>
              <button
                type="submit"
                className="w-full sm:w-auto px-7 py-3 liquid-blue-gradient text-white font-extrabold text-xs sm:text-sm rounded-xl sm:rounded-full shadow-md shadow-primary/20 hover:scale-105 transition-transform"
              >
                Find Rentals
              </button>
            </form>
          </div>

          {/* Quick Glass Category Chips */}
          <div className="mt-6 flex flex-wrap items-center justify-center gap-2 text-xs font-semibold text-text-secondary">
            <span className="text-text-muted">Popular:</span>
            <Link href="/browse?category=Cameras" className="px-3 py-1 rounded-full glass-1 hover:glass-2 transition">Cameras</Link>
            <Link href="/browse?category=Laptops" className="px-3 py-1 rounded-full glass-1 hover:glass-2 transition">MacBooks</Link>
            <Link href="/browse?category=Electronics" className="px-3 py-1 rounded-full glass-1 hover:glass-2 transition">Drones & Audio</Link>
            <Link href="/browse?category=Tools" className="px-3 py-1 rounded-full glass-1 hover:glass-2 transition">Drills & Equipment</Link>
          </div>
        </div>
      </section>

      {/* 2. CATEGORIES GRID */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-primary-navy tracking-tight">Browse Categories</h2>
            <p className="text-xs sm:text-sm text-text-secondary">Rent equipment for daily projects or long-term adventures</p>
          </div>
          <Link href="/browse" className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1 group">
            <span>View All</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.map((cat) => {
            const icon = CATEGORY_ICONS[cat.name] || <Package className="w-5 h-5 text-primary" />;
            return (
              <Link
                key={cat.id || cat.slug}
                href={`/browse?category=${encodeURIComponent(cat.name)}`}
                className="group glass-2 hover:glass-3 p-4 rounded-2xl transition-all duration-300 text-center flex flex-col items-center justify-center gap-2 hover:-translate-y-1 shadow-glass-sm"
              >
                <div className="w-11 h-11 rounded-xl bg-primary-subtle/50 group-hover:bg-primary-subtle flex items-center justify-center transition-colors">
                  {icon}
                </div>
                <span className="text-xs font-bold text-text-primary group-hover:text-primary transition line-clamp-1">
                  {cat.name}
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* 3. FEATURED LISTINGS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              <h2 className="text-xl sm:text-2xl font-black text-primary-navy tracking-tight">Featured Gear</h2>
            </div>
            <p className="text-xs sm:text-sm text-text-secondary">Top-rated equipment with high local demand</p>
          </div>
          <Link href="/browse?sort=views" className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1">
            <span>See More</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-80 glass-1 animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {featuredListings.map((listing) => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </section>

      {/* 4. VALUE PROPOSITION: LIQUID GLASS 0% COMMISSION BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="glass-navy rounded-3xl p-8 sm:p-12 text-white shadow-glass-lg relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <span className="glass-1 text-primary-light text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full border border-white/10">
              SkipIt Marketplace Promise
            </span>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight mt-3">
              0% Commission. Direct Peer Rentals.
            </h3>
            <p className="mt-3 text-sm text-slate-200 leading-relaxed font-normal">
              SkipIt eliminates middleman transaction fees. Renters and owners negotiate pricing, dates, and deposits directly through real-time chat, keeping 100% of agreed earnings.
            </p>

            <div className="mt-6 flex flex-wrap gap-4">
              <Link
                href="/listings/create"
                className="px-6 py-3 liquid-blue-gradient text-white font-bold text-xs sm:text-sm rounded-full shadow-md shadow-primary/25 hover:scale-105 transition-transform"
              >
                List Your Gear for Free
              </Link>
              <Link
                href="/browse"
                className="px-6 py-3 glass-1 hover:glass-2 text-white font-bold text-xs sm:text-sm rounded-full transition"
              >
                Browse Available Items
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. RECENTLY ADDED */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-primary-navy tracking-tight">Recently Added Near You</h2>
            <p className="text-xs sm:text-sm text-text-secondary">Fresh listings published by community members</p>
          </div>
          <Link href="/browse?sort=recent" className="text-xs sm:text-sm font-bold text-primary hover:text-primary-hover flex items-center gap-1">
            <span>Explore All</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {recentListings.map((listing) => (
            <ListingCard key={listing.id} listing={listing} />
          ))}
        </div>
      </section>
    </div>
  );
}
