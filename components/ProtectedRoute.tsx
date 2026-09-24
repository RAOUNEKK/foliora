'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const protectedPaths = [
  '/reading-tracker',
  '/reading-goals',
  '/groups',
  '/profile',
];

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  useEffect(() => {
    if (!loading && !user && isProtected) {
      router.push('/auth');
    }
  }, [user, loading, isProtected, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0602' }}>
        <div className="text-cream-400/50 text-sm" style={{ fontFamily: 'Cinzel, serif' }}>
          Loading...
        </div>
      </div>
    );
  }

  if (!user && isProtected) {
    return null;
  }

  return <>{children}</>;
}
