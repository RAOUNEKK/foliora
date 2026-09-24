'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen } from 'lucide-react';
import Navbar from '@/components/Navbar';
import { useAuth } from '@/context/AuthContext';

export default function MyProfileRedirectPage() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.replace('/auth');
      return;
    }

    if (profile?.username) {
      router.replace(`/profile/${profile.username}`);
    }
  }, [loading, user, profile, router]);

  return (
    <div className="min-h-screen" style={{ background: '#0a0602' }}>
      <Navbar />
      <div className="pt-28 flex items-center justify-center">
        <div className="text-center">
          <BookOpen size={40} className="text-gold-DEFAULT/30 mx-auto mb-4 animate-pulse" />
          <p className="text-cream-400/50 text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
            {loading || (user && !profile) ? 'Loading your profile…' : 'Redirecting…'}
          </p>
        </div>
      </div>
    </div>
  );
}
