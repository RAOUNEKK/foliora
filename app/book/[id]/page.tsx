'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Heart, BookOpen, Star, BookMarked, Globe, Hash,
  Calendar, FileText, Building, Check, Loader2, ExternalLink
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { BookDetailSkeleton } from '@/components/LoadingSkeleton';
import { StarRating } from '@/components/BookCard';
import { fetchBookById, BookVolume, getBookCover, getBookAuthors, getBookRating, getBookISBN } from '@/lib/books';
import { useBooks } from '@/context/BooksContext';

export default function BookDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [book, setBook] = useState<BookVolume | null>(null);
  const [loading, setLoading] = useState(true);
  const [imgError, setImgError] = useState(false);
  const [addedToList, setAddedToList] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  const {
    isFavorite, toggleFavorite,
    isInReadingList, addToReadingList,
    removeFromReadingList, updateReadingStatus,
    getReadingStatus, addRecentlyViewed,
  } = useBooks();

  const favorite = book ? isFavorite(book.id) : false;
  const inList = book ? isInReadingList(book.id) : false;
  const status = book ? getReadingStatus(book.id) : null;

  useEffect(() => {
    const loadBook = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const data = await fetchBookById(id);
        if (data) {
          setBook(data);
          addRecentlyViewed(data);
        }
      } catch (e) {
        console.error('Failed to load book:', e);
      } finally {
        setLoading(false);
      }
    };
    loadBook();
  }, [id, addRecentlyViewed]);

  const handleToggleList = () => {
    if (!book) return;
    if (inList) {
      removeFromReadingList(book.id);
      setAddedToList(false);
    } else {
      addToReadingList(book);
      setAddedToList(true);
      setTimeout(() => setAddedToList(false), 3000);
    }
  };

  const cover = book && !imgError ? getBookCover(book) : null;
  const authors = book ? getBookAuthors(book) : [];
  const rating = book ? getBookRating(book) : 0;
  const isbn = book ? getBookISBN(book) : '';

  const statusColors: Record<string, string> = {
    'to-read': '#daa520',
    'reading': '#3d8c3d',
    'completed': '#10b981',
  };

  if (loading) {
    return (
      <div className="min-h-screen" style={{ background: '#0a0602' }}>
        <Navbar />
        <div className="pt-28 px-4 max-w-6xl mx-auto">
          <BookDetailSkeleton />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen flex flex-col" style={{ background: '#0a0602' }}>
        <Navbar />
        <div className="flex-1 flex items-center justify-center pt-20">
          <div className="text-center">
            <BookOpen size={48} className="text-gold-DEFAULT/30 mx-auto mb-4" />
            <h2 className="text-cream-100 text-xl mb-2" style={{ fontFamily: 'Cinzel, serif' }}>Book not found</h2>
            <p className="text-cream-400/50 text-sm mb-6" style={{ fontFamily: 'EB Garamond, serif' }}>
              This tome seems to have vanished from our shelves.
            </p>
            <button
              onClick={() => router.push('/discover')}
              className="btn-enchanted px-6 py-3 rounded-xl text-wood-900 font-bold text-sm"
              style={{ fontFamily: 'Cinzel, serif' }}
            >
              Browse Library
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { volumeInfo } = book;

  return (
    <div className="min-h-screen" style={{ background: '#0a0602' }}>
      <Navbar />

      {/* Ambient background */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(61,140,61,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(218,165,32,0.06) 0%, transparent 50%)',
        }}
      />

      <div className="relative z-10 pt-24 pb-16 px-4 max-w-6xl mx-auto">
        {/* Back button */}
        <motion.button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-cream-400/60 hover:text-gold-light transition-colors mb-6 text-sm"
          style={{ fontFamily: 'Cinzel, serif' }}
          whileHover={{ x: -4 }}
        >
          <ArrowLeft size={16} />
          Back
        </motion.button>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Left: Book Cover */}
          <motion.div
            className="lg:col-span-4 flex flex-col items-center lg:items-start"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div
              className="relative cursor-pointer group"
              onClick={() => setBookOpen(true)}
            >
              <div
                className="w-64 sm:w-72 lg:w-full max-w-[320px] rounded-lg overflow-hidden shadow-book relative"
                style={{ aspectRatio: '2/3' }}
              >
                {cover ? (
                  <img
                    src={cover}
                    alt={volumeInfo.title}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1a3a1a)' }}>
                    <BookOpen size={48} className="text-cream-200/30 mb-3" />
                    <span className="text-cream-200/50 text-xs" style={{ fontFamily: 'Cinzel, serif' }}>No Cover</span>
                  </div>
                )}

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <span className="text-cream-100 text-sm font-medium" style={{ fontFamily: 'Cinzel, serif' }}>View Details</span>
                </div>
              </div>

              {/* Decorative shelf shadow */}
              <div
                className="h-4 mt-2 rounded-full mx-auto"
                style={{
                  width: '90%',
                  background: 'radial-gradient(ellipse, rgba(0,0,0,0.4) 0%, transparent 70%)',
                }}
              />
            </div>

            {/* Quick actions */}
            <div className="flex gap-3 mt-6">
              <motion.button
                onClick={() => toggleFavorite(book)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  favorite
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'text-cream-200 border border-white/10 bg-white/5 hover:border-gold-dark/40'
                }`}
                style={{ fontFamily: 'Cinzel, serif' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <Heart size={16} className={favorite ? 'fill-current' : ''} />
                {favorite ? 'Favorited' : 'Favorite'}
              </motion.button>

              <motion.button
                onClick={handleToggleList}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  inList
                    ? 'text-forest-300 border border-forest-500/30 bg-forest-500/10'
                    : 'text-cream-200 border border-white/10 bg-white/5 hover:border-gold-dark/40'
                }`}
                style={{ fontFamily: 'Cinzel, serif' }}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {inList ? <Check size={16} /> : <BookMarked size={16} />}
                {inList ? 'In List' : 'Reading List'}
              </motion.button>
            </div>
          </motion.div>

          {/* Right: Book Info */}
          <motion.div
            className="lg:col-span-8"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            {/* Title & Authors */}
            <h1
              className="text-2xl sm:text-3xl lg:text-4xl text-cream-100 mb-3 leading-tight"
              style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.02em' }}
            >
              {volumeInfo.title}
            </h1>
            {volumeInfo.subtitle && (
              <p className="text-cream-400/60 text-lg mb-3" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
                {volumeInfo.subtitle}
              </p>
            )}
            <p className="text-gold-DEFAULT/80 text-sm mb-4" style={{ fontFamily: 'EB Garamond, serif' }}>
              {authors}
            </p>

            {/* Rating */}
            {rating > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <StarRating rating={rating} size="md" />
                <span className="text-cream-400/50 text-sm" style={{ fontFamily: 'EB Garamond, serif' }}>
                  {rating.toFixed(1)} / 5
                </span>
              </div>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap gap-4 mb-6 text-cream-400/50 text-xs" style={{ fontFamily: 'EB Garamond, serif' }}>
              {volumeInfo.publishedDate && (
                <span className="flex items-center gap-1.5">
                  <Calendar size={13} />
                  {volumeInfo.publishedDate}
                </span>
              )}
              {volumeInfo.pageCount && (
                <span className="flex items-center gap-1.5">
                  <FileText size={13} />
                  {volumeInfo.pageCount} pages
                </span>
              )}
              {volumeInfo.publisher && (
                <span className="flex items-center gap-1.5">
                  <Building size={13} />
                  {volumeInfo.publisher}
                </span>
              )}
              {isbn && (
                <span className="flex items-center gap-1.5">
                  <Hash size={13} />
                  ISBN: {isbn}
                </span>
              )}
              {volumeInfo.language && (
                <span className="flex items-center gap-1.5">
                  <Globe size={13} />
                  {volumeInfo.language.toUpperCase()}
                </span>
              )}
            </div>

            {/* Description */}
            {volumeInfo.description && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="text-gold-DEFAULT text-sm font-semibold mb-3 tracking-widest" style={{ fontFamily: 'Cinzel, serif' }}>
                  DESCRIPTION
                </h2>
                <div
                  className="text-cream-300/70 text-sm leading-relaxed"
                  style={{ fontFamily: 'EB Garamond, serif' }}
                  dangerouslySetInnerHTML={{ __html: volumeInfo.description }}
                />
              </motion.div>
            )}

            {/* Categories */}
            {volumeInfo.categories && volumeInfo.categories.length > 0 && (
              <motion.div
                className="mb-8"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <h2 className="text-gold-DEFAULT text-sm font-semibold mb-3 tracking-widest" style={{ fontFamily: 'Cinzel, serif' }}>
                  GENRES
                </h2>
                <div className="flex flex-wrap gap-2">
                  {volumeInfo.categories.map((cat, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-full text-xs text-cream-300/70"
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.08)',
                        fontFamily: 'EB Garamond, serif',
                      }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Actions */}
            <motion.div
              className="flex flex-wrap gap-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              {volumeInfo.previewLink && (
                <a
                  href={volumeInfo.previewLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-cream-200 border border-white/10 bg-white/5 hover:border-gold-dark/40 transition-all"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  <ExternalLink size={14} />
                  Preview
                </a>
              )}
              {volumeInfo.infoLink && (
                <a
                  href={volumeInfo.infoLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-cream-200 border border-white/10 bg-white/5 hover:border-gold-dark/40 transition-all"
                  style={{ fontFamily: 'Cinzel, serif' }}
                >
                  <BookOpen size={14} />
                  More Info
                </a>
              )}
            </motion.div>

            {/* Status picker (if already in list) */}
            {inList && status && (
              <div className="flex gap-2 mt-4">
                {(['to-read', 'reading', 'completed'] as const).map((s) => (
                  <button
                    key={s}
                    className={`px-3 py-2 rounded-lg text-xs font-medium transition-all capitalize ${
                      status === s ? 'text-wood-900' : 'text-cream-400/60 hover:text-cream-100'
                    }`}
                    style={{
                      background: status === s ? statusColors[s] : 'rgba(255,255,255,0.05)',
                      border: `1px solid ${status === s ? statusColors[s] : 'rgba(255,255,255,0.1)'}`,
                      fontFamily: 'Cinzel, serif',
                    }}
                    onClick={() => updateReadingStatus(book.id, s)}
                  >
                    {s.replace('-', ' ')}
                  </button>
                ))}
              </div>
            )}

            {/* Success message */}
            <AnimatePresence>
              {addedToList && (
                <motion.div
                  className="flex items-center gap-2 text-forest-300 text-sm mt-4 p-3 rounded-lg"
                  style={{ background: 'rgba(61,140,61,0.1)', border: '1px solid rgba(61,140,61,0.2)' }}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <Check size={16} />
                  Added to your reading list
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>

      {/* Book preview modal */}
      <AnimatePresence>
        {bookOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setBookOpen(false)}
          >
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
            <motion.div
              className="relative max-w-md w-full"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setBookOpen(false)}
                className="absolute -top-10 right-0 text-cream-200 hover:text-gold-light transition-colors"
              >
                <ArrowLeft size={20} />
              </button>
              <div className="rounded-2xl overflow-hidden shadow-enchanted" style={{ border: '1px solid rgba(218,165,32,0.2)' }}>
                {cover ? (
                  <img src={cover} alt={volumeInfo.title} className="w-full" />
                ) : (
                  <div className="aspect-[2/3] flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1a3a1a)' }}>
                    <BookOpen size={64} className="text-cream-200/30" />
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
    </div>
  );
}
