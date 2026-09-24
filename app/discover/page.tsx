'use client';

import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, X, ChevronDown, Sparkles, Loader2, BookOpen
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BookCard from '@/components/BookCard';
import { BookGridSkeleton } from '@/components/LoadingSkeleton';
import { searchBooks, BookVolume, GENRES } from '@/lib/books';

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant' },
  { value: 'newest', label: 'Newest First' },
];

function DiscoverContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialGenre = searchParams.get('genre') || '';
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [inputValue, setInputValue] = useState(initialQuery);
  const [selectedGenre, setSelectedGenre] = useState(initialGenre);
  const [orderBy, setOrderBy] = useState<'relevance' | 'newest'>('relevance');
  const [books, setBooks] = useState<BookVolume[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [startIndex, setStartIndex] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totalItems, setTotalItems] = useState(0);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);

  const POPULAR = ['Harry Potter', 'Lord of the Rings', 'Dune', 'The Hobbit', '1984', 'Pride and Prejudice', 'The Great Gatsby', 'Sherlock Holmes'];

  const buildSearchQuery = useCallback(() => {
    let q = query || 'bestseller';
    if (selectedGenre) {
      const genre = GENRES.find((g) => g.id === selectedGenre);
      if (genre) q = `${q} ${genre.query.replace('subject:', 'subject:')}`.trim();
    }
    return q;
  }, [query, selectedGenre]);

  const fetchBooks = useCallback(async (reset = false) => {
    const idx = reset ? 0 : startIndex;
    if (!reset && !hasMore) return;

    if (reset) setLoading(true);
    else setLoadingMore(true);

    try {
      let res;
      if (!query && selectedGenre) {
        const genre = GENRES.find((g) => g.id === selectedGenre);
        res = await searchBooks(genre?.query || 'books', idx, 20, orderBy);
      } else {
        res = await searchBooks(buildSearchQuery(), idx, 20, orderBy);
      }

      let items = res.items || [];
if (orderBy === 'newest') {
  items = items.sort((a, b) => {
    const dateA = a.volumeInfo.publishedDate || '0';
    const dateB = b.volumeInfo.publishedDate || '0';
    return dateB.localeCompare(dateA);
  });
}
      setTotalItems(res.totalItems || 0);
      setBooks((prev) => reset ? items : [...prev, ...items]);
      setStartIndex(idx + items.length);
      setHasMore(items.length === 20 && (idx + items.length) < (res.totalItems || 0));
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, selectedGenre, orderBy, startIndex, hasMore, buildSearchQuery]);

  useEffect(() => {
    setStartIndex(0);
    setHasMore(true);
    fetchBooks(true);
  }, [query, selectedGenre, orderBy]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchBooks(false);
        }
      },
      { threshold: 0.1 }
    );
    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, loading, fetchBooks]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(inputValue);
    setShowSuggestions(false);
  };

  const handleInputChange = (val: string) => {
    setInputValue(val);
    if (val.length > 1) {
      const filtered = POPULAR.filter((s) => s.toLowerCase().includes(val.toLowerCase())).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectGenre = (id: string) => {
    setSelectedGenre(id === selectedGenre ? '' : id);
  };

  const clearFilters = () => {
    setSelectedGenre('');
    setOrderBy('relevance');
    setQuery('');
    setInputValue('');
  };

  const hasActiveFilters = selectedGenre || orderBy !== 'relevance';

  return (
    <div className="min-h-screen" style={{ background: '#0a0602' }}>
      <Navbar />

      {/* Page Header */}
      <section className="pt-28 pb-8 px-4 relative overflow-visible">
        <div className="absolute inset-0" style={{
          background: 'linear-gradient(180deg, rgba(20,12,4,1) 0%, rgba(10,6,2,1) 100%)',
        }} />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(218,165,32,0.4) 0%, transparent 40%), radial-gradient(circle at 80% 50%, rgba(61,140,61,0.3) 0%, transparent 40%)',
        }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-3"
          >
            <Sparkles size={20} className="text-gold-DEFAULT" />
            <h1 className="text-3xl md:text-5xl text-cream-100" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
              Discover Books
            </h1>
            <Sparkles size={20} className="text-gold-DEFAULT" />
          </motion.div>
          <motion.p
            className="text-cream-400/50 mb-8"
            style={{ fontFamily: 'EB Garamond, Georgia, serif', fontStyle: 'italic' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Search across thousands of books from around the world
          </motion.p>

          {/* Search Bar */}
          <motion.div
            className="relative overflow-visible"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
          >
            <form onSubmit={handleSearch} className="relative overflow-visible">
              <div
                className="flex items-center rounded-2xl overflow-visible shadow-gold"
                style={{
                  background: 'rgba(35,20,8,0.9)',
                  border: '1px solid rgba(218,165,32,0.25)',
                }}
              >
                <Search size={18} className="ml-5 text-gold-DEFAULT flex-shrink-0" />
                <input
                  ref={inputRef}
                  type="text"
                  value={inputValue}
                  onChange={(e) => handleInputChange(e.target.value)}
                  onFocus={() => inputValue.length > 1 && setShowSuggestions(suggestions.length > 0)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="Search by title, author, genre..."
                  className="flex-1 bg-transparent px-4 py-4 text-cream-100 placeholder-cream-400/30 outline-none text-base"
                  style={{ fontFamily: 'EB Garamond, Georgia, serif', fontSize: '1.1rem' }}
                />
                {inputValue && (
                  <button
                    type="button"
                    onClick={() => { setInputValue(''); setQuery(''); }}
                    className="p-2 mr-1 text-cream-400/40 hover:text-cream-200 transition-colors"
                  >
                    <X size={16} />
                  </button>
                )}
                <button
                  type="submit"
                  className="btn-enchanted m-1.5 px-6 py-2.5 rounded-xl text-wood-900 font-semibold text-sm flex-shrink-0"
                  style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.1em' }}
                >
                  Search
                </button>
              </div>
            </form>

            {/* Suggestions */}
            <AnimatePresence>
              {showSuggestions && (
                <motion.div
                  className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-50 shadow-enchanted"
                  style={{ background: 'rgba(30,18,6,0.97)', border: '1px solid rgba(218,165,32,0.2)' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      className="w-full flex items-center gap-3 px-5 py-3 text-left hover:bg-gold-dark/10 transition-colors"
                      onClick={() => { setInputValue(s); setQuery(s); setShowSuggestions(false); }}
                    >
                      <Search size={13} className="text-gold-dark" />
                      <span className="text-cream-200 text-sm">{s}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </section>

      {/* Genre Pills */}
      <section className="px-4 pb-6" style={{ background: '#0a0602' }}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            <button
              className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                !selectedGenre ? 'text-wood-900 bg-gold-DEFAULT' : 'text-cream-300/60 hover:text-cream-100'
              }`}
              style={{
                fontFamily: 'Cinzel, serif',
                border: !selectedGenre ? 'none' : '1px solid rgba(218,165,32,0.2)',
              }}
              onClick={() => setSelectedGenre('')}
            >
              All Genres
            </button>
            {GENRES.map(({ id, label }) => (
              <button
                key={id}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-xs font-medium transition-all ${
                  selectedGenre === id ? 'text-wood-900 bg-gold-DEFAULT' : 'text-cream-300/60 hover:text-cream-100'
                }`}
                style={{
                  fontFamily: 'Cinzel, serif',
                  border: selectedGenre === id ? 'none' : '1px solid rgba(218,165,32,0.15)',
                }}
                onClick={() => selectGenre(id)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Filters Bar */}
      <section className="px-4 pb-6" style={{ background: '#0a0602' }}>
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-cream-400/50 text-sm">
              {loading ? 'Searching...' : `${totalItems.toLocaleString()} books found`}
            </span>
            {hasActiveFilters && (
              <button
                className="flex items-center gap-1.5 text-xs text-gold-DEFAULT hover:text-gold-light transition-colors"
                onClick={clearFilters}
              >
                <X size={12} />
                Clear filters
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative">
              <select
                value={orderBy}
                onChange={(e) => setOrderBy(e.target.value as 'relevance' | 'newest')}
                className="appearance-none pl-3 pr-8 py-2 rounded-lg text-xs text-cream-300 cursor-pointer"
                style={{ background: 'rgba(35,20,8,0.9)', border: '1px solid rgba(218,165,32,0.2)', outline: 'none' }}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} style={{ background: '#1e1408' }}>{o.label}</option>
                ))}
              </select>
              <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-cream-400/50 pointer-events-none" />
            </div>
          </div>
        </div>
      </section>

      {/* Book Grid */}
      <section className="px-4 pb-16" style={{ background: '#0a0602' }}>
        <div className="max-w-7xl mx-auto">
          {loading ? (
            <BookGridSkeleton count={20} />
          ) : books.length === 0 ? (
            <EmptyState onReset={clearFilters} />
          ) : (
            <>
              <motion.div
                className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                {books.map((book, i) => (
                  <BookCard key={`${book.id}-${i}`} book={book} index={i % 12} />
                ))}
              </motion.div>

              <div ref={loaderRef} className="flex justify-center py-8 mt-4">
                {loadingMore && (
                  <motion.div
                    className="flex items-center gap-3 text-gold-DEFAULT"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Loader2 size={20} className="animate-spin" />
                    <span className="text-sm" style={{ fontFamily: 'Cinzel, serif' }}>Loading more enchanted books...</span>
                  </motion.div>
                )}
                {!hasMore && books.length > 0 && (
                  <p className="text-cream-400/30 text-sm" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
                    You have reached the end of the enchanted catalog
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <BookOpen size={48} className="text-gold-DEFAULT/30 mb-4" />
      <h3 className="text-cream-100 text-xl mb-2" style={{ fontFamily: 'Cinzel, serif' }}>No books found</h3>
      <p className="text-cream-400/50 mb-6 text-sm" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
        The enchanted catalog couldn&apos;t find what you&apos;re looking for
      </p>
      <button
        className="px-6 py-2.5 rounded-xl text-gold-DEFAULT text-sm font-medium transition-colors"
        style={{ border: '1px solid rgba(218,165,32,0.3)', fontFamily: 'Cinzel, serif' }}
        onClick={onReset}
      >
        Clear & Browse All
      </button>
    </div>
  );
}

export default function DiscoverPage() {
  return (
    <Suspense fallback={<div className="min-h-screen" style={{ background: '#0a0602' }}><Navbar /></div>}>
      <DiscoverContent />
    </Suspense>
  );
}