'use client';

import './globals.css';
import { Inter } from 'next/font/google';
import { BooksProvider } from '@/context/BooksContext';
import { AuthProvider } from '@/context/AuthContext';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Toaster } from '@/components/ui/sonner';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>FOLIORA – Enchanted Book Discovery</title>
        <meta name="description" content="Discover your next great read in an enchanted library where literature and nature merge." />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700;900&family=Cinzel+Decorative:wght@400;700&family=EB+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=Lato:wght@300;400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <BooksProvider>
            <ProtectedRoute>
              {children}
            </ProtectedRoute>
            <Toaster />
          </BooksProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
