'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Heart, MapPin, Star, ShieldCheck } from 'lucide-react';
import { api } from '@/lib/api';

interface ListingCardProps {
  listing: any;
  onWishlistToggle?: (id: string, saved: boolean) => void;
}

export default function ListingCard({ listing, onWishlistToggle }: ListingCardProps) {
  const [isSaved, setIsSaved] = useState<boolean>(listing.is_wishlisted || false);
  const [loading, setLoading] = useState(false);

  const images = Array.isArray(listing.images) ? listing.images : [listing.images];
  const primaryImage = images[0] || 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=600&q=80';

  const conditionLabels: Record<string, { label: string; color: string }> = {
    brand_new: { label: 'Brand New', color: 'bg-primary/90 text-white' },
    like_new: { label: 'Like New', color: 'bg-primary-light/90 text-primary-navy' },
    good: { label: 'Good', color: 'bg-primary-subtle text-primary' },
    fair: { label: 'Fair', color: 'bg-slate-200/90 text-text-primary' },
  };

  const condition = conditionLabels[listing.condition] || conditionLabels.good;

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const token = localStorage.getItem('skipit_token');
    if (!token) {
      alert('Please sign in to save items to your wishlist');
      return;
    }

    try {
      setLoading(true);
      if (isSaved) {
        await api.removeFromWishlist(listing.id);
        setIsSaved(false);
        onWishlistToggle?.(listing.id, false);
      } else {
        await api.addToWishlist(listing.id);
        setIsSaved(true);
        onWishlistToggle?.(listing.id, true);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group glass-2 hover:glass-3 rounded-2xl overflow-hidden transition-all duration-300 flex flex-col hover:-translate-y-1 hover:shadow-glass-md"
    >
      {/* Thumbnail Container */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 overflow-hidden">
        <img
          src={primaryImage}
          alt={listing.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Condition Chip (Glass Pill) */}
        <span className={`absolute top-3 left-3 text-[10px] font-extrabold px-2.5 py-1 rounded-full backdrop-blur-md shadow-xs ${condition.color}`}>
          {condition.label}
        </span>

        {/* Wishlist Glass Heart Button */}
        <button
          onClick={handleToggleWishlist}
          disabled={loading}
          className={`absolute top-3 right-3 p-2 rounded-full transition-transform active:scale-90 ${
            isSaved
              ? 'bg-functional-error text-white shadow-md'
              : 'glass-3 hover:bg-white text-text-primary'
          }`}
          title={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
        >
          <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
        </button>

        {/* Deposit Tag */}
        {listing.deposit_amount > 0 ? (
          <div className="absolute bottom-3 left-3 glass-navy text-white text-[10px] font-medium px-2 py-0.5 rounded-md">
            ₹{listing.deposit_amount} Deposit
          </div>
        ) : (
          <div className="absolute bottom-3 left-3 bg-functional-success/90 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
            Zero Deposit
          </div>
        )}
      </div>

      {/* Information Panel */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Category & Rating */}
          <div className="flex items-center justify-between text-xs text-text-secondary mb-1">
            <span className="font-bold text-primary uppercase tracking-wider text-[10px]">
              {listing.category}
            </span>
            <div className="flex items-center gap-1 text-text-primary font-semibold text-[11px]">
              <Star className="w-3 h-3 fill-functional-warning text-functional-warning" />
              <span>{listing.owner?.rating || '5.0'}</span>
            </div>
          </div>

          {/* Title */}
          <h3 className="font-bold text-text-primary text-sm sm:text-base line-clamp-1 group-hover:text-primary transition-colors">
            {listing.title}
          </h3>

          {/* Location */}
          <div className="flex items-center gap-1 text-text-secondary text-xs mt-1.5 line-clamp-1">
            <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span>{listing.location_name}</span>
          </div>
        </div>

        {/* Pricing & Host Indicator */}
        <div className="pt-3 mt-3 border-t border-slate-200/50 flex items-center justify-between">
          <div>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-black text-primary-navy">₹{listing.price_per_day}</span>
              <span className="text-xs font-semibold text-text-secondary">/ day</span>
            </div>
            <span className="text-[10px] text-text-muted">Direct peer rental</span>
          </div>

          {listing.owner?.is_verified && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-primary bg-primary-subtle/80 px-2 py-0.5 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Verified</span>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
