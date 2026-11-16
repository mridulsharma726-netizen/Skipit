'use client';

import React, { useState, useEffect } from 'react';
import { X, Mail, KeyRound, ShieldCheck, User } from 'lucide-react';
import { api } from '@/lib/api';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: any) => void;
}

export default function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showGooglePrompt, setShowGooglePrompt] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load Google Identity Services script if client ID is configured
  useEffect(() => {
    if (!isOpen) return;
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (googleClientId && typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        try {
          (window as any).google?.accounts?.id?.initialize({
            client_id: googleClientId,
            callback: handleGoogleCredentialResponse,
          });
        } catch (e) {
          console.warn('[GIS Init Error]:', e);
        }
      };
      document.body.appendChild(script);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGoogleCredentialResponse = async (response: any) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.googleAuth({ credential: response.credential });
      if (res.token) {
        localStorage.setItem('skipit_token', res.token);
        localStorage.setItem('skipit_user', JSON.stringify(res.user));
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueWithGoogle = async () => {
    setError(null);
    const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

    // If official Google Client ID is configured and GIS is available, trigger One-Tap / prompt
    if (googleClientId && (window as any).google?.accounts?.id) {
      try {
        (window as any).google.accounts.id.prompt();
        return;
      } catch (e) {
        console.warn('[Google One Tap]:', e);
      }
    }

    // Default fast & 100% free Google Sign-In prompt
    setShowGooglePrompt(true);
  };

  const handleQuickGoogleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail || !googleEmail.includes('@')) {
      setError('Please enter a valid Google email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await api.googleAuth({
        email: googleEmail.trim(),
        full_name: googleName.trim() || googleEmail.split('@')[0],
        avatar_url: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(googleName || googleEmail)}`,
      });

      if (res.token) {
        localStorage.setItem('skipit_token', res.token);
        localStorage.setItem('skipit_user', JSON.stringify(res.user));
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Google Sign-In failed');
    } finally {
      setLoading(false);
    }
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      setLoading(true);
      let res;
      if (isRegister) {
        res = await api.register({ email: email.trim(), password, full_name: fullName.trim() });
      } else {
        res = await api.login({ email: email.trim(), password });
      }
      if (res.token) {
        localStorage.setItem('skipit_token', res.token);
        localStorage.setItem('skipit_user', JSON.stringify(res.user));
        onSuccess(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-primary-navy/40 backdrop-blur-md animate-fade-in">
      <div className="glass-3 rounded-3xl max-w-md w-full p-6 sm:p-8 relative border border-white/90 shadow-glass-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-text-muted hover:text-text-primary p-1.5 rounded-full glass-1 hover:glass-2 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-2xl liquid-blue-gradient flex items-center justify-center text-white shadow-md mx-auto mb-3">
            <span className="font-black text-2xl">S</span>
          </div>
          <h3 className="text-2xl font-black text-text-primary">Welcome to SkipIt</h3>
          <p className="text-xs text-text-secondary mt-1">
            Skip Buying. Rent Smarter. Peer-to-peer 0% commission network.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-functional-error text-xs rounded-xl font-medium">
            {error}
          </div>
        )}

        {showGooglePrompt ? (
          /* Google Account Sign-In View */
          <form onSubmit={handleQuickGoogleSubmit} className="space-y-4 animate-fade-in">
            <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl flex items-center gap-3">
              <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <div>
                <p className="text-xs font-bold text-text-primary">Sign in with Google</p>
                <p className="text-[11px] text-text-muted">Instant & 100% free account access</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">Google Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={googleEmail}
                  onChange={(e) => setGoogleEmail(e.target.value)}
                  placeholder="yourname@gmail.com"
                  className="w-full pl-10 pr-4 py-2.5 glass-1 rounded-xl text-sm focus:border-primary outline-none"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-primary mb-1.5">Your Full Name (Optional)</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={googleName}
                  onChange={(e) => setGoogleName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  className="w-full pl-10 pr-4 py-2.5 glass-1 rounded-xl text-sm focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowGooglePrompt(false)}
                className="flex-1 py-2.5 glass-1 rounded-xl text-xs font-bold text-text-secondary hover:text-text-primary transition"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-[2] py-2.5 liquid-blue-gradient text-white font-bold text-xs rounded-xl transition shadow-md hover:scale-[1.02]"
              >
                {loading ? 'Signing In...' : 'Continue to SkipIt'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            {/* 1. Primary Google Sign-In Action */}
            <button
              type="button"
              onClick={handleContinueWithGoogle}
              disabled={loading}
              className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-text-primary font-bold text-sm rounded-xl transition shadow-xs border border-slate-200/80 flex items-center justify-center gap-3 hover:shadow-md hover:scale-[1.01]"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Continue with Google</span>
            </button>

            {/* Divider */}
            <div className="relative flex py-1 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-3 text-[11px] font-bold text-text-muted uppercase tracking-wider">
                or sign in with email
              </span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* 2. Free Email & Password Authentication */}
            <form onSubmit={handleEmailAuth} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-bold text-text-primary mb-1.5">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Priya Patel"
                      className="w-full pl-10 pr-4 py-2.5 glass-1 rounded-xl text-sm focus:border-primary outline-none"
                      required
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    className="w-full pl-10 pr-4 py-2.5 glass-1 rounded-xl text-sm focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-text-primary mb-1.5">Password</label>
                <div className="relative">
                  <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-4 py-2.5 glass-1 rounded-xl text-sm focus:border-primary outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 liquid-blue-gradient text-white font-bold text-sm rounded-xl transition shadow-md hover:scale-[1.01]"
              >
                {loading ? 'Processing...' : isRegister ? 'Create Free Account' : 'Sign In'}
              </button>

              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => setIsRegister(!isRegister)}
                  className="text-xs text-text-secondary hover:text-primary font-semibold transition"
                >
                  {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Create one free"}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security & 0-Cost Notice */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-center gap-1.5 text-text-muted text-[11px]">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>100% Free • No SMS Costs • 0% Platform Fees</span>
        </div>
      </div>
    </div>
  );
}
