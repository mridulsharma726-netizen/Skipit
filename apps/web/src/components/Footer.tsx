import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Sparkles, MessageCircle, RefreshCw } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="mt-20 pt-16 pb-12 border-t border-slate-200/60 relative overflow-hidden bg-white/40 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Core Value Pillars in Frosted Glass Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-200/50">
          <div className="glass-1 p-5 rounded-2xl flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary-subtle text-primary">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-text-primary font-bold text-sm">0% Commission</h4>
              <p className="text-xs text-text-secondary mt-1">
                SkipIt never takes a cut of your earnings. Keep 100% of rental payments.
              </p>
            </div>
          </div>

          <div className="glass-1 p-5 rounded-2xl flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary-subtle text-primary">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-text-primary font-bold text-sm">Direct Negotiation</h4>
              <p className="text-xs text-text-secondary mt-1">
                Chat directly with owners to agree on rental duration, deposit, and handover.
              </p>
            </div>
          </div>

          <div className="glass-1 p-5 rounded-2xl flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary-subtle text-primary">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-text-primary font-bold text-sm">Community Trust</h4>
              <p className="text-xs text-text-secondary mt-1">
                Verified member profiles, phone checks, government ID reviews, and 2-way feedback.
              </p>
            </div>
          </div>

          <div className="glass-1 p-5 rounded-2xl flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-primary-subtle text-primary">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-text-primary font-bold text-sm">Circular Economy</h4>
              <p className="text-xs text-text-secondary mt-1">
                Reduce consumer waste by renting cameras, tools, and electronics as needed.
              </p>
            </div>
          </div>
        </div>

        {/* Links Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 py-10">
          <div>
            <h5 className="text-text-primary font-bold text-sm mb-4">Categories</h5>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li><Link href="/browse?category=Cameras" className="hover:text-primary transition">Cameras & Photography</Link></li>
              <li><Link href="/browse?category=Laptops" className="hover:text-primary transition">Laptops & Computers</Link></li>
              <li><Link href="/browse?category=Electronics" className="hover:text-primary transition">Electronics & Audio</Link></li>
              <li><Link href="/browse?category=Tools" className="hover:text-primary transition">Tools & Equipment</Link></li>
              <li><Link href="/browse?category=Vehicles" className="hover:text-primary transition">Vehicles & Mobility</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-text-primary font-bold text-sm mb-4">Rental Safety</h5>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li><span>Meet in public, daylight areas</span></li>
              <li><span>Test equipment upon handover</span></li>
              <li><span>Agree on return condition upfront</span></li>
              <li><span>Verify government photo ID</span></li>
              <li><span>Report suspicious listings</span></li>
            </ul>
          </div>

          <div>
            <h5 className="text-text-primary font-bold text-sm mb-4">Top Rental Hubs</h5>
            <ul className="space-y-2 text-xs text-text-secondary">
              <li><Link href="/browse?location=Bengaluru" className="hover:text-primary transition">Bengaluru (Indiranagar, Koramangala)</Link></li>
              <li><Link href="/browse?location=Mumbai" className="hover:text-primary transition">Mumbai (Bandra, Andheri)</Link></li>
              <li><Link href="/browse?location=Delhi" className="hover:text-primary transition">Delhi-NCR (Gurgaon, Noida)</Link></li>
              <li><Link href="/browse?location=Hyderabad" className="hover:text-primary transition">Hyderabad (Hitec City)</Link></li>
              <li><Link href="/browse?location=Pune" className="hover:text-primary transition">Pune (Kothrud, Viman Nagar)</Link></li>
            </ul>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg liquid-blue-gradient flex items-center justify-center text-white font-black text-sm">
                S
              </div>
              <span className="text-lg font-black text-primary-navy">SkipIt</span>
            </div>
            <p className="text-xs text-text-secondary leading-relaxed mb-4">
              Skip Buying. Rent Smarter. An open peer-to-peer rental discovery marketplace connecting local owners and renters.
            </p>
            <p className="text-[11px] text-text-muted">
              © {new Date().getFullYear()} SkipIt Technologies. 0% Commission.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
