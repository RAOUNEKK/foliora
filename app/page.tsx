'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { ChevronDown, Sparkles, BookOpen, Heart, Compass, Star, ArrowRight } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingParticles from '@/components/FloatingParticles';
import FolioraLogo from '@/components/FolioraLogo';
import BookCard from '@/components/BookCard';
import { BookGridSkeleton } from '@/components/LoadingSkeleton';
import { fetchTrendingBooks, fetchGenreBooks, BookVolume, GENRES } from '@/lib/books';

export default function HomePage() {
  const [trending, setTrending] = useState<BookVolume[]>([]);
  const [featured, setFeatured] = useState<BookVolume[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 600], ['0%', '25%']);
  const overlayOpacity = useTransform(scrollY, [0, 400], [0.45, 0.85]);
  const heroTextY = useTransform(scrollY, [0, 400], [0, 80]);
  const heroTextOpacity = useTransform(scrollY, [0, 300], [1, 0]);

  useEffect(() => {
    async function loadBooks() {
      try {
        const [trendRes, featRes] = await Promise.all([
          fetchTrendingBooks(),
          fetchGenreBooks('fantasy', 12),
        ]);
        setTrending((trendRes.items || []).slice(0, 12));
        setFeatured((featRes.items || []).slice(0, 6));
      } finally {
        setLoadingTrending(false);
      }
    }
    loadBooks();
  }, []);

  const genreColors: Record<string, string> = {
    fantasy: '#8b5cf6',
    romance: '#ec4899',
    mystery: '#6366f1',
    'science-fiction': '#0ea5e9',
    'historical-fiction': '#f59e0b',
    horror: '#ef4444',
    'self-development': '#10b981',
    biography: '#f97316',
    adventure: '#84cc16',
    thriller: '#e11d48',
  };

  return (
    <div className="min-h-screen" style={{ background: '#0d1208' }}>
      <Navbar />

      {/* HERO SECTION */}
      <section ref={heroRef} className="relative h-screen min-h-[700px] flex items-center justify-center overflow-hidden">
        {/* Background image with parallax */}
        <motion.div
          className="absolute inset-0"
          style={{ y: bgY }}
        >
          <img
            src="/images/ghibli_magic_library_older_girl.png"
            alt="Enchanted Library"
            className="w-full h-full object-cover object-center scale-110"
          />
        </motion.div>

        {/* Overlay */}
        <motion.div
          className="absolute inset-0"
          style={{
            opacity: overlayOpacity,
            background: 'linear-gradient(to bottom, rgba(10,6,2,0.3) 0%, rgba(10,6,2,0.55) 50%, rgba(10,6,2,0.95) 100%)',
          }}
        />

        {/* Floating particles */}
        <FloatingParticles />

        {/* Hero content */}
        <motion.div
          className="relative z-20 text-center px-4 flex flex-col items-center"
          style={{ y: heroTextY, opacity: heroTextOpacity }}
        >
          {/* Logo */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1, ease: [0.34, 1.56, 0.64, 1] }}
            className="mb-6"
          >
            <FolioraLogo size="hero" animated />
          </motion.div>

          {/* Tagline */}
          <motion.p
            className="text-cream-200/80 text-base md:text-lg lg:text-xl max-w-2xl mx-auto mb-2 leading-relaxed"
            style={{ fontFamily: 'EB Garamond, Georgia, serif', fontStyle: 'italic' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
          >
            Where every page turns into magic
          </motion.p>

          <motion.p
            className="text-cream-300/60 text-sm md:text-base max-w-xl mx-auto mb-10"
            style={{ fontFamily: 'EB Garamond, Georgia, serif' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.4, duration: 0.8 }}
          >
            Discover thousands of enchanting stories. Build your perfect reading sanctuary.
          </motion.p>

          {/* CTA */}
          <motion.div
            className="flex flex-col sm:flex-row items-center gap-4"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8 }}
          >
            <Link href="/discover">
              <motion.button
                className="btn-enchanted px-8 py-4 rounded-xl text-wood-900 font-bold text-sm tracking-widest shadow-gold-lg relative overflow-hidden"
                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.2em' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Compass size={16} />
                  DISCOVER MORE
                </span>
              </motion.button>
            </Link>

            <Link href="/reading-list">
              <motion.button
                className="px-6 py-4 rounded-xl text-cream-200 text-sm font-medium tracking-wide transition-all"
                style={{
                  fontFamily: 'Cinzel, serif',
                  letterSpacing: '0.1em',
                  border: '1px solid rgba(218,165,32,0.3)',
                  background: 'rgba(255,255,255,0.04)',
                }}
                whileHover={{ scale: 1.03, borderColor: 'rgba(218,165,32,0.6)', backgroundColor: 'rgba(255,255,255,0.08)' }}
                whileTap={{ scale: 0.97 }}
              >
                <span className="flex items-center gap-2">
                  <BookOpen size={15} />
                  My Shelf
                </span>
              </motion.button>
            </Link>
          </motion.div>
          </motion.div>


        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 z-20"
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
        >
          <span className="text-cream-400/40 text-xs tracking-widest" style={{ fontFamily: 'Cinzel, serif' }}>SCROLL</span>
          <ChevronDown size={16} className="text-gold-DEFAULT opacity-60" />
        </motion.div>
      </section>
      <div style={{ background: 'linear-gradient(180deg, rgba(20,12,4,1) 0%, rgba(30,45,20,0.95) 25%, rgba(25,38,15,0.98) 50%, rgba(30,45,20,0.95) 75%, rgba(20,12,4,1) 100%)' }}></div>
      {/* FEATURES STRIP */}
      <section className="py-12 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-3 gap-6"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ staggerChildren: 0.1 }}
          >
            {[
              {
                icon: Compass,
                title: 'Discover',
                desc: 'Explore millions of books across every genre with smart search and filters.',
                color: '#daa520',
              },
              {
                icon: Heart,
                title: 'Curate',
                desc: 'Save your favorites and build a personalized collection that grows with you.',
                color: '#ec4899',
              },
              {
                icon: BookOpen,
                title: 'Track',
                desc: 'Organize your reading journey from "to read" to "completed" on a magical shelf.',
                color: '#10b981',
              },
            ].map(({ icon: Icon, title, desc, color }, i) => (
              <motion.div
                key={title}
                className="flex flex-col items-center text-center p-6 rounded-2xl feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ scale: 1.02 }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: `${color}20`, border: `1px solid ${color}40` }}
                >
                  <Icon size={22} style={{ color }} />
                </div>
                <h3 className="text-cream-100 font-semibold mb-2" style={{ fontFamily: 'Cinzel, serif' }}>{title}</h3>
                <p className="text-cream-400/60 text-sm leading-relaxed" style={{ fontFamily: 'EB Garamond, serif' }}>{desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* TRENDING BOOKS */}
      <section className="py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            title="Trending Now"
            subtitle="Popular reads across the enchanted library"
            icon={<Star size={18} className="text-gold-DEFAULT" />}
          />

          {loadingTrending ? (
            <BookGridSkeleton count={12} />
          ) : (
            <motion.div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
            >
              {trending.map((book, i) => (
                <BookCard key={book.id} book={book} index={i} />
              ))}
            </motion.div>
          )}

          <motion.div
            className="text-center mt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link href="/discover">
              <button
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-gold-DEFAULT text-sm font-medium hover:text-gold-light transition-all"
                style={{ fontFamily: 'Cinzel, serif', border: '1px solid rgba(218,165,32,0.2)', background: 'rgba(218,165,32,0.05)' }}
              >
                Explore All Books
                <ArrowRight size={15} />
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* GENRE SHOWCASE */}
      <section className="py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            title="Browse by Genre"
            subtitle="Step into any world you desire"
            icon={<Sparkles size={18} className="text-gold-DEFAULT" />}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {GENRES.map(({ id, label }, i) => (
              <Link key={id} href={`/discover?genre=${id}`}>
                <motion.div
                  className="relative rounded-2xl p-4 text-center cursor-pointer overflow-hidden group"
                  style={{
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                  }}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  whileHover={{ scale: 1.04, borderColor: `${genreColors[id] || '#daa520'}40` }}
                >
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `radial-gradient(ellipse at center, ${genreColors[id] || '#daa520'}15 0%, transparent 70%)` }}
                  />
                  <div className="text-2xl mb-2">{getGenreEmoji(id)}</div>
                  <span className="text-cream-300/80 text-xs font-medium tracking-wide group-hover:text-cream-100 transition-colors" style={{ fontFamily: 'Cinzel, serif' }}>
                    {label}
                  </span>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED FANTASY */}
      <section className="py-16 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            title="Fantasy Realm"
            subtitle="Enchanting worlds and epic adventures await"
            icon={<span className="text-lg">✨</span>}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {featured.map((book, i) => (
              <BookCard key={book.id} book={book} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 relative overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, rgba(20,12,4,1) 0%, rgba(30,45,20,0.9) 50%, rgba(20,12,4,1) 100%)',
          }}
        />
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(218,165,32,0.3) 0%, transparent 50%), radial-gradient(circle at 70% 50%, rgba(61,140,61,0.3) 0%, transparent 50%)',
        }} />

        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="ornate-divider mb-6">
              <Sparkles size={20} className="text-gold-DEFAULT" />
            </div>
            <h2
              className="text-3xl md:text-5xl text-cream-100 mb-4"
              style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}
            >
              Begin Your Reading Journey
            </h2>
            <p
              className="text-cream-300/60 text-base md:text-lg mb-8 leading-relaxed"
              style={{ fontFamily: 'EB Garamond, Georgia, serif', fontStyle: 'italic' }}
            >
              &ldquo;A reader lives a thousand lives before he dies. The man who never reads lives only one.&rdquo;
            </p>
            <Link href="/discover">
              <motion.button
                className="btn-enchanted px-10 py-4 rounded-xl text-wood-900 font-bold tracking-widest shadow-gold-lg"
                style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.2em' }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                ENTER THE LIBRARY
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function SectionHeader({ title, subtitle, icon }: { title: string; subtitle: string; icon?: React.ReactNode }) {
  return (
    <motion.div
      className="mb-8"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <h2
          className="text-xl md:text-2xl text-cream-100"
          style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}
        >
          {title}
        </h2>
      </div>
      <p className="text-cream-400/50 text-sm" style={{ fontFamily: 'EB Garamond, Georgia, serif', fontStyle: 'italic' }}>
        {subtitle}
      </p>
      <div className="mt-3 h-px w-24" style={{ background: 'linear-gradient(90deg, rgba(218,165,32,0.6), transparent)' }} />
    </motion.div>
  );
}

function getGenreEmoji(id: string): string {
  const map: Record<string, string> = {
    fantasy: '🏰',
    romance: '🌹',
    mystery: '🔍',
    'science-fiction': '🚀',
    'historical-fiction': '📜',
    horror: '🕯️',
    'self-development': '🌱',
    biography: '👤',
    adventure: '⚔️',
    thriller: '🗡️',
  };
  return map[id] || '📚';
}
