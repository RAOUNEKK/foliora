'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { BookOpen, Check, Bookmark, Trash2, Sparkles, BookMarked, Eye } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { StarRating } from '@/components/BookCard';
import { useBooks } from '@/context/BooksContext';
import { getBookCover, getBookAuthors, getBookRating } from '@/lib/books';

type StatusFilter = 'all' | 'to-read' | 'reading' | 'completed';

export default function ReadingListPage() {
  const router = useRouter();
  const { readingList, removeFromReadingList, updateReadingStatus } = useBooks();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  const filtered = readingList
    .filter((e) => statusFilter === 'all' || e.status === statusFilter)
    .sort((a, b) => b.addedAt - a.addedAt);

  const counts = {
    all: readingList.length,
    'to-read': readingList.filter((e) => e.status === 'to-read').length,
    reading: readingList.filter((e) => e.status === 'reading').length,
    completed: readingList.filter((e) => e.status === 'completed').length,
  };

  const statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof BookOpen }> = {
    'to-read': { label: 'To Read', color: '#daa520', bg: 'rgba(218,165,32,0.15)', icon: Bookmark },
    reading: { label: 'Reading', color: '#3d8c3d', bg: 'rgba(61,140,61,0.15)', icon: BookOpen },
    completed: { label: 'Completed', color: '#10b981', bg: 'rgba(16,185,129,0.15)', icon: Check },
  };

  return (
    <div className="min-h-screen" style={{ background: '#0a0602' }}>
      <Navbar />

      {/* Header */}
      <section className="pt-28 pb-8 px-4 relative overflow-hidden">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(10,18,8,1) 0%, rgba(10,6,2,1) 100%)' }} />
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(61,140,61,0.5) 0%, transparent 50%)',
        }} />

        <div className="relative max-w-4xl mx-auto text-center">
          <motion.div
            className="flex items-center justify-center gap-3 mb-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookMarked size={24} className="text-gold-DEFAULT" />
            <h1 className="text-3xl md:text-5xl text-cream-100" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.05em' }}>
              My Reading List
            </h1>
          </motion.div>
          <motion.p
            className="text-cream-400/50"
            style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            Your personal enchanted bookshelf
          </motion.p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 pb-16">
        {/* Stats */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {Object.entries(counts).map(([key, count]) => {
            const cfg = key === 'all'
              ? { label: 'Total Books', color: '#daa520', bg: 'rgba(218,165,32,0.1)', icon: BookOpen }
              : statusConfig[key];
            const Icon = cfg.icon;
            return (
              <div
                key={key}
                className="flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all"
                style={{
                  background: statusFilter === key ? cfg.bg : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${statusFilter === key ? cfg.color + '40' : 'rgba(255,255,255,0.06)'}`,
                }}
                onClick={() => setStatusFilter(key as StatusFilter)}
              >
                <Icon size={18} style={{ color: cfg.color }} />
                <div>
                  <div className="text-xl font-bold" style={{ color: cfg.color, fontFamily: 'Cinzel, serif' }}>{count}</div>
                  <div className="text-cream-400/50 text-xs" style={{ fontFamily: 'Cinzel, serif' }}>{cfg.label}</div>
                </div>
              </div>
            );
          })}
        </motion.div>

        {readingList.length === 0 ? (
          <EmptyReadingList />
        ) : (
          <>
            {/* Filter tabs */}
            <motion.div
              className="flex items-center gap-2 mb-6"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              {(['all', 'to-read', 'reading', 'completed'] as StatusFilter[]).map((s) => {
                const cfg = s === 'all'
                  ? { label: 'All', color: '#daa520' }
                  : { label: statusConfig[s].label, color: statusConfig[s].color };
                return (
                  <button
                    key={s}
                    className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                      statusFilter === s ? 'text-wood-900' : 'text-cream-400/60 hover:text-cream-100'
                    }`}
                    style={{
                      background: statusFilter === s ? cfg.color : 'rgba(255,255,255,0.04)',
                      border: statusFilter === s ? 'none' : '1px solid rgba(255,255,255,0.08)',
                      fontFamily: 'Cinzel, serif',
                    }}
                    onClick={() => setStatusFilter(s)}
                  >
                    {cfg.label} ({counts[s]})
                  </button>
                );
              })}
            </motion.div>

            {/* Bookshelf */}
            <AnimatePresence mode="popLayout">
              {filtered.length === 0 ? (
                <motion.div
                  className="text-center py-16"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <p className="text-cream-400/40 text-sm" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
                    No books in this section yet
                  </p>
                </motion.div>
              ) : (
                <ShelfView
                  entries={filtered}
                  imgErrors={imgErrors}
                  setImgErrors={setImgErrors}
                  onRemove={removeFromReadingList}
                  onStatusUpdate={updateReadingStatus}
                  onView={(id) => router.push(`/book/${id}`)}
                  statusConfig={statusConfig}
                />
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
}

type Entry = ReturnType<typeof useBooks>['readingList'][0];

function ShelfView({
  entries,
  imgErrors,
  setImgErrors,
  onRemove,
  onStatusUpdate,
  onView,
  statusConfig,
}: {
  entries: Entry[];
  imgErrors: Record<string, boolean>;
  setImgErrors: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
  onRemove: (id: string) => void;
  onStatusUpdate: (id: string, status: Entry['status']) => void;
  onView: (id: string) => void;
  statusConfig: Record<string, { label: string; color: string; bg: string; icon: typeof BookOpen }>;
}) {
  // Group into rows of 6 for shelf appearance
  const BOOKS_PER_SHELF = 6;
  const shelves: Entry[][] = [];
  for (let i = 0; i < entries.length; i += BOOKS_PER_SHELF) {
    shelves.push(entries.slice(i, i + BOOKS_PER_SHELF));
  }

  return (
    <div className="space-y-8">
      {shelves.map((shelf, si) => (
        <motion.div
          key={si}
          className="relative"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
        >
          {/* Books on shelf */}
          <div className="flex items-end gap-3 pb-4 px-4 min-h-[200px]">
            {shelf.map((entry, bi) => {
              const cover = getBookCover(entry.book);
              const imgErr = imgErrors[entry.book.id];
              const cfg = statusConfig[entry.status];
              const Icon = cfg.icon;

              return (
                <motion.div
                  key={entry.book.id}
                  layout
                  className="flex-1 max-w-[130px] group relative"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ delay: bi * 0.06 }}
                  whileHover={{ y: -12, transition: { duration: 0.2 } }}
                >
                  {/* Status indicator */}
                  <div
                    className="absolute -top-2 -right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center shadow-lg"
                    style={{ background: cfg.color }}
                  >
                    <Icon size={10} className="text-white" />
                  </div>

                  {/* Book cover */}
                  <div
                    className="w-full rounded-t-md overflow-hidden shadow-book cursor-pointer relative"
                    style={{ aspectRatio: '2/3' }}
                    onClick={() => onView(entry.book.id)}
                  >
                    {!imgErr && cover ? (
                      <img
                        src={cover}
                        alt={entry.book.volumeInfo.title}
                        className="w-full h-full object-cover"
                        onError={() => setImgErrors((p) => ({ ...p, [entry.book.id]: true }))}
                      />
                    ) : (
                      <div
                        className="w-full h-full flex items-center justify-center p-2"
                        style={{ background: 'linear-gradient(135deg, #1e3a5f, #1a3a1a)' }}
                      >
                        <p className="text-cream-200/50 text-center text-xs leading-tight" style={{ fontFamily: 'Cinzel, serif' }}>
                          {entry.book.volumeInfo.title.slice(0, 20)}
                        </p>
                      </div>
                    )}

                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                      <button
                        className="w-full py-1 rounded text-xs text-cream-100 font-medium flex items-center justify-center gap-1"
                        style={{ background: 'rgba(218,165,32,0.8)', fontFamily: 'Cinzel, serif' }}
                        onClick={(e) => { e.stopPropagation(); onView(entry.book.id); }}
                      >
                        <Eye size={10} />
                        View
                      </button>
                      <button
                        className="w-full py-1 rounded text-xs text-red-300 flex items-center justify-center gap-1"
                        style={{ background: 'rgba(220,38,38,0.2)', border: '1px solid rgba(220,38,38,0.3)' }}
                        onClick={(e) => { e.stopPropagation(); onRemove(entry.book.id); }}
                      >
                        <Trash2 size={10} />
                        Remove
                      </button>
                    </div>
                  </div>

                  {/* Title below */}
                  <p
                    className="text-cream-300/70 text-xs text-center mt-2 leading-tight line-clamp-2 px-1"
                    style={{ fontFamily: 'Cinzel, serif' }}
                  >
                    {entry.book.volumeInfo.title}
                  </p>

                  {/* Status changer */}
                  <div className="flex justify-center mt-1.5">
                    <select
                      value={entry.status}
                      onChange={(e) => onStatusUpdate(entry.book.id, e.target.value as Entry['status'])}
                      className="text-xs rounded px-1 py-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{
                        background: 'rgba(30,18,6,0.95)',
                        border: `1px solid ${cfg.color}50`,
                        color: cfg.color,
                        outline: 'none',
                        fontFamily: 'Cinzel, serif',
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="to-read" style={{ background: '#1e1408' }}>To Read</option>
                      <option value="reading" style={{ background: '#1e1408' }}>Reading</option>
                      <option value="completed" style={{ background: '#1e1408' }}>Completed</option>
                    </select>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Wooden shelf plank */}
          <div className="shelf-plank h-5 rounded-sm mx-2" />
          <div
            className="h-2 mx-4 rounded-b"
            style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.4), transparent)' }}
          />
        </motion.div>
      ))}
    </div>
  );
}

function EmptyReadingList() {
  const router = useRouter();
  return (
    <motion.div
      className="flex flex-col items-center justify-center py-24 text-center"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div
        className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
        style={{ background: 'rgba(61,140,61,0.1)', border: '2px solid rgba(61,140,61,0.2)' }}
      >
        <BookOpen size={36} className="text-forest-400/60" />
      </div>
      <h2 className="text-cream-100 text-2xl mb-3" style={{ fontFamily: 'Cinzel, serif' }}>
        Your Shelf is Empty
      </h2>
      <p className="text-cream-400/50 mb-8 max-w-md" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
        Begin your reading adventure. Add books to track your journey through enchanted worlds.
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
          DISCOVER BOOKS
        </span>
      </motion.button>
    </motion.div>
  );
}
