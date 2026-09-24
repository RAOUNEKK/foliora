'use client';

import Link from 'next/link';
import { BookOpen, Heart, Compass, List } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="relative border-t" style={{ borderColor: 'rgba(218,165,32,0.15)', background: 'linear-gradient(180deg, transparent 0%, rgba(15,8,2,0.8) 100%)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="ornate-divider mb-4">
              <span className="foliora-logo-text text-2xl" style={{ fontFamily: 'Cinzel Decorative, Cinzel, serif' }}>
                FOLIORA
              </span>
            </div>
            <p className="text-cream-300/60 text-sm leading-relaxed" style={{ fontFamily: 'EB Garamond, Georgia, serif' }}>
              An enchanted sanctuary where literature and nature merge into a magical discovery experience.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="text-gold-DEFAULT text-sm font-semibold mb-4" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.1em' }}>
              EXPLORE
            </h3>
            <ul className="space-y-2">
              {[
                { href: '/discover', label: 'Discover Books', icon: Compass },
                { href: '/favorites', label: 'My Favorites', icon: Heart },
                { href: '/reading-list', label: 'Reading List', icon: BookOpen },
              ].map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link href={href} className="flex items-center gap-2 text-cream-300/60 hover:text-gold-light text-sm transition-colors">
                    <Icon size={13} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Genres */}
          <div>
            <h3 className="text-gold-DEFAULT text-sm font-semibold mb-4" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.1em' }}>
              GENRES
            </h3>
            <div className="flex flex-wrap gap-2">
              {['Fantasy', 'Romance', 'Mystery', 'Sci-Fi', 'Thriller', 'Biography'].map((g) => (
                <Link
                  key={g}
                  href={`/discover?genre=${g.toLowerCase()}`}
                  className="px-2.5 py-1 rounded-full text-xs text-cream-300/60 hover:text-gold-light transition-colors"
                  style={{ border: '1px solid rgba(218,165,32,0.15)' }}
                >
                  {g}
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="mt-8 pt-6" style={{ borderTop: '1px solid rgba(218,165,32,0.1)' }}>
          <div className="flex flex-col md:flex-row items-center justify-between gap-2">
            <p className="text-cream-400/40 text-xs" style={{ fontFamily: 'EB Garamond, serif' }}>
              &copy; {new Date().getFullYear()} FOLIORA. A Book Discovery Platform Made by Raounek.hrz
            </p>
            <p className="text-cream-400/40 text-xs">
              Powered by Google Books API
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
