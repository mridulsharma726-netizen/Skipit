'use client';

import React, { useState } from 'react';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [authModalOpen, setAuthModalOpen] = useState(false);

  return (
    <html lang="en">
      <head>
        <title>SkipIt — Skip Buying. Rent Smarter.</title>
        <meta
          name="description"
          content="SkipIt is a peer-to-peer rental discovery marketplace connecting item owners with local renters. 0% platform commission."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body className="min-h-screen flex flex-col bg-slate-50 text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        <Navbar onOpenAuth={() => setAuthModalOpen(true)} />
        <main className="flex-1">
          {children}
        </main>
        <Footer />

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          onSuccess={(user) => {
            console.log('Logged in as:', user);
            window.location.reload();
          }}
        />
      </body>
    </html>
  );
}
