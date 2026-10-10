'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Heart, Star, BookOpen, Eye } from 'lucide-react';
import { BookVolume, getBookCover, getBookAuthors, getBookRating } from '@/lib/books';
import { useBooks } from '@/context/BooksContext';

interface Props {
  book: BookVolume;
  index?: number;
  variant?: 'default' | 'compact' | 'shelf';
}

export default function BookCard({ book, index = 0, variant = 'default' }: Props) {
  const router = useRouter();
  const { isFavorite, toggleFavorite, isInReadingList, addToReadingList } = useBooks();
  const [imgError, setImgError] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const cover = getBookCover(book);
  const authors = getBookAuthors(book);
  const rating = getBookRating(book);
  const title = book.volumeInfo.title;
  const year = book.volumeInfo.publishedDate?.slice(0, 4) || '';

  const favorited = isFavorite(book.id);
  const inList = isInReadingList(book.id);

  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(book);
  };

  const handleAddToList = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!inList) addToReadingList(book);
  };

  const handleClick = () => {
    router.push(`/book/${book.id}`);
  };

  if (variant === 'compact') {
    return (
      <motion.div
        className="flex gap-3 p-3 rounded-xl cursor-pointer group"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(218,165,32,0.1)' }}
        whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.07)' }}
        onClick={handleClick}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <div className="flex-shrink-0 w-12 h-16 rounded-md overflow-hidden shadow-book">
          {!imgError && cover ? (
            <img src={cover} alt={title} className="w-full h-full object-cover" onError={() => setImgError(true)} />
          ) : (
            <PlaceholderCover title={title} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-cream-100 font-semibold text-sm truncate" style={{ fontFamily: 'Cinzel, serif' }}>{title}</p>
          <p className="text-cream-300/70 text-xs truncate">{authors}</p>
          {rating > 0 && <StarRating rating={rating} size="xs" />}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="book-card-hover relative flex flex-col rounded-2xl overflow-hidden cursor-pointer group"
      style={{
        background: 'linear-gradient(145deg, rgba(35,20,8,0.9), rgba(20,12,4,0.95))',
        border: '1px solid rgba(218,165,32,0.15)',
      }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.5 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={handleClick}
    >
      {/* Cover */}
      <div className="relative overflow-hidden aspect-[2/3]">
        {!imgError && cover ? (
          <img
            src={cover}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        ) : (
          <PlaceholderCover title={title} />
        )}

        {/* Overlay on hover */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center gap-2"
          style={{ background: 'rgba(10,6,2,0.75)' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: isHovered ? 1 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold text-wood-900"
            style={{ background: 'linear-gradient(135deg, #b8860b, #ffd700, #daa520)' }}
            whileHover={{ scale: 1.05 }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
            transition={{ delay: 0.05 }}
          >
            <Eye size={12} />
            View Details
          </motion.div>

          <motion.button
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              inList
                ? 'text-forest-300 border border-forest-400/50 bg-forest-900/50'
                : 'text-cream-200 border border-cream-300/30 bg-black/30 hover:border-gold-DEFAULT/50'
            }`}
            onClick={handleAddToList}
            whileHover={{ scale: 1.05 }}
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: isHovered ? 0 : 10, opacity: isHovered ? 1 : 0 }}
            transition={{ delay: 0.1 }}
          >
            <BookOpen size={11} />
            {inList ? 'In List' : 'Add to List'}
          </motion.button>
        </motion.div>

        {/* Favorite button */}
        <motion.button
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur-sm transition-all ${
            favorited ? 'bg-red-500/80 text-white' : 'bg-black/40 text-cream-300 hover:text-red-400'
          }`}
          onClick={handleFavorite}
          whileHover={{ scale: 1.2 }}
          whileTap={{ scale: 0.9 }}
        >
          <Heart size={13} fill={favorited ? 'currentColor' : 'none'} />
        </motion.button>

        {/* Rating badge */}
        {rating > 0 && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm">
            <Star size={10} className="text-gold-light" fill="#ffd700" />
            <span className="text-cream-100 text-xs font-semibold">{rating.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex-1 flex flex-col gap-1">
        <h3
          className="text-cream-100 font-semibold text-sm line-clamp-2 leading-tight"
          style={{ fontFamily: 'Cinzel, serif' }}
        >
          {title}
        </h3>
        <p className="text-cream-300/60 text-xs truncate">{authors}</p>
        {year && <p className="text-cream-400/40 text-xs">{year}</p>}
      </div>
    </motion.div>
  );
}

function PlaceholderCover({ title }: { title: string }) {
  const colors = [
    ['#1e3a5f', '#2d6e2d'],
    ['#5e3d1e', '#3d2810'],
    ['#2d1e3a', '#1e2d4a'],
    ['#3a1e2d', '#5e1e2d'],
  ];
  const pair = colors[title.charCodeAt(0) % colors.length];
  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center p-3"
      style={{ background: `linear-gradient(135deg, ${pair[0]}, ${pair[1]})` }}
    >
      <div
        className="w-8 h-8 mb-2 opacity-50"
        style={{
          background: 'linear-gradient(135deg, #ffd700, #daa520)',
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
        }}
      />
      <p className="text-cream-200/70 text-center text-xs leading-tight" style={{ fontFamily: 'Cinzel, serif' }}>
        {title.slice(0, 30)}{title.length > 30 ? '…' : ''}
      </p>
    </div>
  );
}

export function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'xs' | 'sm' | 'md' }) {
  const px = size === 'xs' ? 10 : size === 'sm' ? 12 : 16;
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={px}
          className={i < Math.floor(rating) ? 'star-filled' : 'star-empty'}
          fill={i < Math.floor(rating) ? '#ffd700' : 'none'}
        />
      ))}
      {rating > 0 && (
        <span className="text-cream-300/60 text-xs ml-1">{rating.toFixed(1)}</span>
      )}
    </div>
  );
}
