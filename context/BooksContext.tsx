'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { BookVolume } from '@/lib/books';
import { useAuth } from '@/context/AuthContext';
import {
  fetchUserBooks,
  addUserFavorite,
  removeUserFavorite,
  addUserReadingListEntry,
  removeUserReadingListEntry,
  updateUserReadingStatus,
  type ReadingListEntry,
} from '@/lib/userBooks';

interface BooksContextValue {
  favorites: BookVolume[];
  readingList: ReadingListEntry[];
  recentlyViewed: BookVolume[];
  addFavorite: (book: BookVolume) => void;
  removeFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (book: BookVolume) => void;
  addToReadingList: (book: BookVolume) => void;
  removeFromReadingList: (id: string) => void;
  updateReadingStatus: (id: string, status: ReadingListEntry['status']) => void;
  isInReadingList: (id: string) => boolean;
  getReadingStatus: (id: string) => ReadingListEntry['status'] | null;
  addRecentlyViewed: (book: BookVolume) => void;
  preferredGenres: string[];
}

const BooksContext = createContext<BooksContextValue | null>(null);

export function BooksProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [favorites, setFavorites] = useState<BookVolume[]>([]);
  const [readingList, setReadingList] = useState<ReadingListEntry[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<BookVolume[]>([]);
  const [preferredGenres, setPreferredGenres] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    try {
      const savedRV = localStorage.getItem('foliora-recently-viewed');
      if (savedRV) setRecentlyViewed(JSON.parse(savedRV));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (authLoading) return;

    let cancelled = false;

    async function loadBooks() {
      if (!user) {
        try {
          const savedFavs = localStorage.getItem('foliora-favorites');
          const savedRL = localStorage.getItem('foliora-reading-list');
          if (!cancelled) {
            setFavorites(savedFavs ? JSON.parse(savedFavs) : []);
            setReadingList(savedRL ? JSON.parse(savedRL) : []);
          }
        } catch {
          if (!cancelled) {
            setFavorites([]);
            setReadingList([]);
          }
        }
        userIdRef.current = null;
        return;
      }

      userIdRef.current = user.id;
      try {
        const data = await fetchUserBooks(user.id);
        if (!cancelled && userIdRef.current === user.id) {
          setFavorites(data.favorites);
          setReadingList(data.readingList);
        }
      } catch (e) {
        console.error('Failed to load saved books:', e);
      }
    }

    loadBooks();
    return () => { cancelled = true; };
  }, [user, authLoading]);

  useEffect(() => {
    if (!hydrated || user) return;
    localStorage.setItem('foliora-favorites', JSON.stringify(favorites));
  }, [favorites, hydrated, user]);

  useEffect(() => {
    if (!hydrated || user) return;
    localStorage.setItem('foliora-reading-list', JSON.stringify(readingList));
  }, [readingList, hydrated, user]);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem('foliora-recently-viewed', JSON.stringify(recentlyViewed));
  }, [recentlyViewed, hydrated]);

  useEffect(() => {
    const genres: string[] = [];
    [...favorites, ...readingList.map((e) => e.book)].forEach((book) => {
      const cats = book.volumeInfo.categories || [];
      cats.forEach((c) => {
        const g = c.toLowerCase().split('/')[0].trim();
        if (!genres.includes(g)) genres.push(g);
      });
    });
    setPreferredGenres(genres.slice(0, 5));
  }, [favorites, readingList]);

  const addFavorite = useCallback((book: BookVolume) => {
    setFavorites((prev) => {
      if (prev.find((b) => b.id === book.id)) return prev;
      return [book, ...prev];
    });
    if (user) {
      addUserFavorite(user.id, book).catch((e) => console.error('Failed to save favorite:', e));
    }
  }, [user]);

  const removeFavorite = useCallback((id: string) => {
    setFavorites((prev) => prev.filter((b) => b.id !== id));
    if (user) {
      removeUserFavorite(user.id, id).catch((e) => console.error('Failed to remove favorite:', e));
    }
  }, [user]);

  const isFavorite = useCallback(
    (id: string) => favorites.some((b) => b.id === id),
    [favorites]
  );

  const toggleFavorite = useCallback(
    (book: BookVolume) => {
      if (isFavorite(book.id)) removeFavorite(book.id);
      else addFavorite(book);
    },
    [isFavorite, addFavorite, removeFavorite]
  );

  const addToReadingList = useCallback((book: BookVolume) => {
    setReadingList((prev) => {
      if (prev.find((e) => e.book.id === book.id)) return prev;
      return [{ book, status: 'to-read', addedAt: Date.now() }, ...prev];
    });
    if (user) {
      addUserReadingListEntry(user.id, book).catch((e) =>
        console.error('Failed to save reading list entry:', e)
      );
    }
  }, [user]);

  const removeFromReadingList = useCallback((id: string) => {
    setReadingList((prev) => prev.filter((e) => e.book.id !== id));
    if (user) {
      removeUserReadingListEntry(user.id, id).catch((e) =>
        console.error('Failed to remove reading list entry:', e)
      );
    }
  }, [user]);

  const updateReadingStatus = useCallback((id: string, status: ReadingListEntry['status']) => {
    setReadingList((prev) =>
      prev.map((e) => (e.book.id === id ? { ...e, status } : e))
    );
    if (user) {
      updateUserReadingStatus(user.id, id, status).catch((e) =>
        console.error('Failed to update reading status:', e)
      );
    }
  }, [user]);

  const isInReadingList = useCallback(
    (id: string) => readingList.some((e) => e.book.id === id),
    [readingList]
  );

  const getReadingStatus = useCallback(
    (id: string) => readingList.find((e) => e.book.id === id)?.status || null,
    [readingList]
  );

  const addRecentlyViewed = useCallback((book: BookVolume) => {
    setRecentlyViewed((prev) => {
      const filtered = prev.filter((b) => b.id !== book.id);
      return [book, ...filtered].slice(0, 12);
    });
  }, []);

  return (
    <BooksContext.Provider
      value={{
        favorites,
        readingList,
        recentlyViewed,
        addFavorite,
        removeFavorite,
        isFavorite,
        toggleFavorite,
        addToReadingList,
        removeFromReadingList,
        updateReadingStatus,
        isInReadingList,
        getReadingStatus,
        addRecentlyViewed,
        preferredGenres,
      }}
    >
      {children}
    </BooksContext.Provider>
  );
}

export function useBooks() {
  const ctx = useContext(BooksContext);
  if (!ctx) throw new Error('useBooks must be used within BooksProvider');
  return ctx;
}
