'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Mail, Lock, User, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const { signUp, signIn, resetPassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        router.push('/');
      } else if (mode === 'signup') {
        if (!username.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }
        const { error } = await signUp(email, password, username);
        if (error) throw error;
        setSuccess('Account created! You can now sign in.');
        setMode('login');
      } else if (mode === 'forgot') {
        const { error } = await resetPassword(email);
        if (error) throw error;
        setSuccess('Password reset link sent to your email.');
      }
    } catch (err: any) {
      const message = err.message || 'An error occurred';
      if (message === 'Failed to fetch') {
        setError(
          'Cannot reach the authentication server. Your Supabase project may be paused — restore it at supabase.com/dashboard, then try again.'
        );
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0602' }}>
      {/* Background */}
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(218,165,32,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(61,140,61,0.2) 0%, transparent 50%)',
      }} />

      <div className="relative z-10 w-full max-w-md px-4">
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="inline-flex items-center gap-2 mb-4">
            <BookOpen size={32} className="text-gold-DEFAULT" />
            <span className="foliora-logo-text text-3xl">FOLIORA</span>
          </div>
          <p className="text-cream-400/50 text-sm" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
            Enter the enchanted library
          </p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(20, 12, 4, 0.8)',
            border: '1px solid rgba(218, 165, 32, 0.2)',
            backdropFilter: 'blur(16px)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Mode tabs */}
          <div className="flex gap-1 mb-6 p-1 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
            {(['login', 'signup'] as const).map((m) => (
              <button
                key={m}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                  mode === m ? 'text-wood-900' : 'text-cream-400/60 hover:text-cream-200'
                }`}
                style={{
                  background: mode === m ? 'linear-gradient(135deg, #b8860b, #daa520)' : 'transparent',
                  fontFamily: 'Cinzel, serif',
                }}
                onClick={() => { setMode(m); setError(''); setSuccess(''); }}
              >
                {m === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {mode === 'forgot' && (
                <button
                  type="button"
                  className="flex items-center gap-2 text-cream-400/60 text-sm mb-4 hover:text-gold-light transition-colors"
                  onClick={() => setMode('login')}
                >
                  <ArrowLeft size={14} />
                  Back to sign in
                </button>
              )}

              {/* Username field (signup only) */}
              {mode === 'signup' && (
                <div className="mb-4">
                  <label className="block text-cream-400/60 text-xs mb-1.5" style={{ fontFamily: 'Cinzel, serif' }}>Username</label>
                  <div className="relative">
                    <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dark" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="your_username"
                      className="w-full bg-transparent border rounded-xl pl-10 pr-4 py-3 text-cream-100 text-sm outline-none transition-all input-gold"
                      style={{ borderColor: 'rgba(218,165,32,0.2)', fontFamily: 'EB Garamond, serif' }}
                      required
                    />
                  </div>
                </div>
              )}

              {/* Email field */}
              <div className="mb-4">
                <label className="block text-cream-400/60 text-xs mb-1.5" style={{ fontFamily: 'Cinzel, serif' }}>Email</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dark" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-transparent border rounded-xl pl-10 pr-4 py-3 text-cream-100 text-sm outline-none transition-all input-gold"
                    style={{ borderColor: 'rgba(218,165,32,0.2)', fontFamily: 'EB Garamond, serif' }}
                    required
                  />
                </div>
              </div>

              {/* Password field */}
              {mode !== 'forgot' && (
                <div className="mb-6">
                  <label className="block text-cream-400/60 text-xs mb-1.5" style={{ fontFamily: 'Cinzel, serif' }}>Password</label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dark" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-transparent border rounded-xl pl-10 pr-10 py-3 text-cream-100 text-sm outline-none transition-all input-gold"
                      style={{ borderColor: 'rgba(218,165,32,0.2)', fontFamily: 'EB Garamond, serif' }}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-cream-400/40 hover:text-cream-200"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              {/* Error / Success */}
              {error && (
                <motion.div
                  className="mb-4 p-3 rounded-lg text-red-300 text-sm"
                  style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {error}
                </motion.div>
              )}
              {success && (
                <motion.div
                  className="mb-4 p-3 rounded-lg text-forest-300 text-sm"
                  style={{ background: 'rgba(61,140,61,0.1)', border: '1px solid rgba(61,140,61,0.2)' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  {success}
                </motion.div>
              )}

              {/* Submit */}
              <motion.button
                type="submit"
                className="w-full btn-enchanted py-3.5 rounded-xl text-wood-900 font-bold text-sm tracking-widest shadow-gold-lg"
                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.15em' }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Sparkles size={16} className="animate-spin" />
                    {mode === 'forgot' ? 'Sending...' : 'Please wait...'}
                  </span>
                ) : (
                  mode === 'login' ? 'SIGN IN' : mode === 'signup' ? 'CREATE ACCOUNT' : 'SEND RESET LINK'
                )}
              </motion.button>

              {/* Forgot password link */}
              {mode === 'login' && (
                <div className="text-center mt-4">
                  <button
                    type="button"
                    className="text-gold-DEFAULT text-xs hover:text-gold-light transition-colors"
                    style={{ fontFamily: 'Cinzel, serif' }}
                    onClick={() => { setMode('forgot'); setError(''); setSuccess(''); }}
                  >
                    Forgot your password?
                  </button>
                </div>
              )}
            </motion.form>
          </AnimatePresence>
        </motion.div>

        {/* Back to home */}
        <div className="text-center mt-6">
          <Link href="/" className="text-cream-400/40 text-xs hover:text-gold-light transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>
            Return to the Library
          </Link>
        </div>
      </div>
    </div>
  );
}
