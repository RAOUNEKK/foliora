'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Heart, Search, SortAsc, Trash2, BookOpen, Sparkles, Star, PenLine, X, Save, MessageSquare } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { StarRating } from '@/components/BookCard';
import { useBooks } from '@/context/BooksContext';
import { getBookCover, getBookAuthors, getBookRating } from '@/lib/books';
import { useAllBookReviews } from '@/hooks/useBookReviews';
import { ReviewEditor } from '@/components/ReviewEditor';

type SortOption = 'default' | 'title' | 'author' | 'rating';

export default function FavoritesPage() {
  const router = useRouter();
  const { favorites, removeFavorite } = useBooks();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});
  const [expandedReviewId, setExpandedReviewId] = useState<string | null>(null);
  const [reviewKey, setReviewKey] = useState(0);

  const { reviews } = useAllBookReviews(favorites.map((b) => b.id), reviewKey);

  const filtered = favorites
    .filter((b) => {
      const q = searchQuery.toLowerCase();
      if (!q) return true;
      return (
        b.volumeInfo.title.toLowerCase().includes(q) ||
        getBookAuthors(b).toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title': return a.volumeInfo.title.localeCompare(b.volumeInfo.title);
        case 'author': return getBookAuthors(a).localeCompare(getBookAuthors(b));
        case 'rating': return getBookRating(b) - getBookRating(a);
        default: return 0;
      }
    });

  return (
    <div className="min-h-screen" style={{ background: '#0a0602' }}>
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(20,8,8,1) 0%, rgba(10,6,2,1) 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(236,72,153,0.4) 0%, transparent 50%)',
        }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            className="flex items-center justify-center gap-3 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Heart size={24} className="text-red-400" fill="currentColor" />
            <h1 className="text-3xl md:text-5xl text-cream-100" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
              My Favorites
            </h1>
          </motion.div>
          <motion.p
            className="text-cream-400/50"
            style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            {favorites.length} {favorites.length === 1 ? 'book' : 'books'} cherished
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {favorites.length === 0 ? (
          <EmptyFavorites />
        ) : (
          <>
            {/* Controls */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 mb-8"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div
                className="flex-1 flex items-center gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(35,20,8,0.8)', border: '1px solid rgba(218,165,32,0.15)' }}
              >
                <Search size={15} className="text-gold-DEFAULT flex-shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your favorites..."
                  className="flex-1 bg-transparent text-cream-200 placeholder-cream-400/30 text-sm outline-none"
                  style={{ fontFamily: 'EB Garamond, serif' }}
                />
              </div>

              <div className="flex items-center gap-2">
                <SortAsc size={14} className="text-gold-dark" />
                {(['default', 'title', 'author', 'rating'] as SortOption[]).map((opt) => (
                  <button
                    key={opt}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                      sortBy === opt ? 'text-wood-900 bg-gold-DEFAULT' : 'text-cream-400/60 hover:text-cream-100'
                    }`}
                    style={{
                      border: sortBy === opt ? 'none' : '1px solid rgba(218,165,32,0.15)',
                      fontFamily: 'Cinzel, serif',
                    }}
                    onClick={() => setSortBy(opt)}
                  >
                    {opt === 'default' ? 'Recent' : opt}
                  </button>
                ))}
              </div>
            </motion.div>

            <AnimatePresence mode="popLayout">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {filtered.map((book, i) => {
                  const cover = getBookCover(book);
                  const authors = getBookAuthors(book);
                  const rating = getBookRating(book);
                  const imgErr = imgErrors[book.id];
                  const bookReview = reviews[book.id];
                  const isExpanded = expandedReviewId === book.id;

                  return (
                    <motion.div
                      key={book.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9, y: -10 }}
                      transition={{ delay: i * 0.04 }}
                      className="flex flex-col rounded-2xl group"
                      style={{
                        background: 'rgba(35,20,8,0.7)',
                        border: '1px solid rgba(218,165,32,0.1)',
                        transition: 'all 0.3s ease',
                      }}
                      whileHover={{
                        borderColor: 'rgba(218,165,32,0.3)',
                        backgroundColor: 'rgba(45,25,10,0.9)',
                      }}
                    >
                      <div
                        className="flex gap-4 p-4 cursor-pointer"
                        onClick={() => router.push(`/book/${book.id}`)}
                      >
                        <div
                          className="flex-shrink-0 w-20 rounded-lg overflow-hidden shadow-book"
                          style={{ aspectRatio: '2/3' }}
                        >
                          {!imgErr && cover ? (
                            <img
                              src={cover}
                              alt={book.volumeInfo.title}
                              className="w-full h-full object-cover"
                              onError={() => setImgErrors((p) => ({ ...p, [book.id]: true }))}
                            />
                          ) : (
                            <div
                              className="w-full h-full flex items-center justify-center"
                              style={{ background: 'linear-gradient(135deg, #1e3a5f, #1a3a1a)' }}
                            >
                              <BookOpen size={20} className="text-cream-400/40" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                          <div>
                            <h3
                              className="text-cream-100 font-semibold text-sm mb-1 leading-tight line-clamp-2 group-hover:text-gold-light transition-colors"
                              style={{ fontFamily: 'Cinzel, serif' }}
                            >
                              {book.volumeInfo.title}
                            </h3>
                            <p className="text-cream-400/60 text-xs mb-2 truncate">{authors}</p>
                            {rating > 0 && <StarRating rating={rating} size="xs" />}
                            {book.volumeInfo.categories && (
                              <span
                                className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs"
                                style={{ background: 'rgba(218,165,32,0.1)', color: 'rgba(218,165,32,0.8)', fontFamily: 'Cinzel, serif' }}
                              >
                                {book.volumeInfo.categories[0].split('/')[0].trim()}
                              </span>
                            )}
                          </div>
                        </div>

                        <motion.button
                          className="flex-shrink-0 self-start p-2 rounded-lg text-cream-400/30 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                          onClick={(e) => { e.stopPropagation(); removeFavorite(book.id); }}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                        >
                          <Trash2 size={14} />
                        </motion.button>
                      </div>

                      <div className="px-4 pb-4">
                        {bookReview && !isExpanded && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mb-3"
                          >
                            <div
                              className="p-3 rounded-xl cursor-pointer"
                              style={{ background: 'rgba(218,165,32,0.06)', border: '1px solid rgba(218,165,32,0.12)' }}
                              onClick={(e) => { e.stopPropagation(); setExpandedReviewId(book.id); }}
                            >
                              <div className="flex items-center gap-2 mb-1.5">
                                <MessageSquare size={12} className="text-gold-DEFAULT" />
                                <span className="text-gold-DEFAULT/80 text-xs font-medium" style={{ fontFamily: 'Cinzel, serif' }}>
                                  Your Review
                                </span>
                              </div>
                              <p className="text-cream-300/70 text-sm line-clamp-3" style={{ fontFamily: 'EB Garamond, serif' }}>
                                {bookReview.review_text}
                              </p>
                            </div>
                          </motion.div>
                        )}

                        <motion.button
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all w-full justify-center"
                          style={{
                            background: isExpanded ? 'rgba(218,165,32,0.15)' : 'rgba(218,165,32,0.06)',
                            border: '1px solid rgba(218,165,32,0.15)',
                            color: 'rgba(218,165,32,0.9)',
                            fontFamily: 'Cinzel, serif',
                          }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setExpandedReviewId(isExpanded ? null : book.id);
                          }}
                        >
                          {isExpanded ? (
                            <><X size={13} />Close Review</>
                          ) : bookReview ? (
                            <><PenLine size={13} />Edit Review</>
                          ) : (
                            <><PenLine size={13} />Write a Review</>
                          )}
                        </motion.button>

                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.25 }}
                              className="overflow-hidden"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <div className="pt-3">
                                <ReviewEditor
                                  bookId={book.id}
                                  initialText={bookReview?.review_text || ''}
                                  onSaved={() => {
                                    setExpandedReviewId(null);
                                    setReviewKey(k => k + 1);
                                  }}
                                  onCancel={() => setExpandedReviewId(null)}
                                />
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </AnimatePresence>

            {filtered.length === 0 && searchQuery && (
              <div className="text-center py-16">
                <p className="text-cream-400/50" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
                  No favorites match your search
                </p>
              </div>
            )}
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

function EmptyFavorites() {
  const router = useRouter();
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-24 text-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(236,72,153,0.1)', border: '2px solid rgba(236,72,153,0.2)' }}
      >
        <Heart size={36} className="text-red-400/60" />
      </div>
      <h2 className="text-cream-100 text-2xl mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
        No Favorites Yet
      </h2>
      <p className="text-cream-400/50 mb-8 max-w-md" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
        Start exploring the enchanted library and save books that speak to your soul.
      </p>
      <motion.button
        className="btn-enchanted px-8 py-3.5 rounded-xl text-wood-900 font-semibold text-sm"
        style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.1em' }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.97 }}
        onClick={() => router.push('/discover')}
      >
        <span className="flex items-center gap-2">
          <Sparkles size={15} />
          EXPLORE BOOKS
        </span>
      </motion.button>
    </motion.div>
  );
}