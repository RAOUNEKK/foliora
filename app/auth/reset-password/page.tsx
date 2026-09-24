'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, Sparkles, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { updatePassword } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const { error } = await updatePassword(password);
      if (error) throw error;
      setSuccess('Password updated successfully!');
      setTimeout(() => router.push('/auth'), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden" style={{ background: '#0a0602' }}>
      <div className="absolute inset-0 opacity-10" style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(218,165,32,0.3) 0%, transparent 50%)',
      }} />

      <div className="relative z-10 w-full max-w-md px-4">
        <motion.div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(20, 12, 4, 0.8)',
            border: '1px solid rgba(218, 165, 32, 0.2)',
            backdropFilter: 'blur(16px)',
          }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Link href="/auth" className="flex items-center gap-2 text-cream-400/60 text-sm mb-6 hover:text-gold-light transition-colors">
            <ArrowLeft size={14} />
            Back to sign in
          </Link>

          <h1 className="text-2xl text-cream-100 mb-2" style={{ fontFamily: 'Cinzel, serif' }}>Reset Password</h1>
          <p className="text-cream-400/50 text-sm mb-6" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
            Enter your new password below
          </p>

          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-cream-400/60 text-xs mb-1.5" style={{ fontFamily: 'Cinzel, serif' }}>New Password</label>
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

            <div className="mb-6">
              <label className="block text-cream-400/60 text-xs mb-1.5" style={{ fontFamily: 'Cinzel, serif' }}>Confirm Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gold-dark" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent border rounded-xl pl-10 pr-4 py-3 text-cream-100 text-sm outline-none transition-all input-gold"
                  style={{ borderColor: 'rgba(218,165,32,0.2)', fontFamily: 'EB Garamond, serif' }}
                  required
                />
              </div>
            </div>

            {error && (
              <motion.div
                className="mb-4 p-3 rounded-lg text-red-300 text-sm"
                style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.2)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {error}
              </motion.div>
            )}
            {success && (
              <motion.div
                className="mb-4 p-3 rounded-lg text-forest-300 text-sm"
                style={{ background: 'rgba(61,140,61,0.1)', border: '1px solid rgba(61,140,61,0.2)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {success}
              </motion.div>
            )}

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
                  Updating...
                </span>
              ) : (
                'UPDATE PASSWORD'
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
