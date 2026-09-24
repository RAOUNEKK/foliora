'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

export interface BookReview {
  id: string;
  user_id: string;
  book_id: string;
  review_text: string;
  created_at: string;
  updated_at: string;
}

export function useBookReviews(bookId: string) {
  const [review, setReview] = useState<BookReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchReview = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data, error } = await supabase
      .from('book_reviews')
      .select('*')
      .eq('book_id', bookId)
      .eq('user_id', user.id)
      .maybeSingle();
    if (!error) setReview(data);
    setLoading(false);
  }, [bookId]);

  useEffect(() => {
    fetchReview();
  }, [fetchReview]);

  const saveReview = useCallback(async (text: string) => {
    if (!text.trim()) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    setSaving(true);
    if (review) {
      const { data, error } = await supabase
        .from('book_reviews')
        .update({ review_text: text.trim(), updated_at: new Date().toISOString() })
        .eq('id', review.id)
        .eq('user_id', user.id)
        .select()
        .single();
      if (!error && data) setReview(data);
    } else {
      const { data, error } = await supabase
        .from('book_reviews')
        .insert({ book_id: bookId, user_id: user.id, review_text: text.trim() })
        .select()
        .single();
      if (!error && data) setReview(data);
    }
    setSaving(false);
  }, [bookId, review]);

  const deleteReview = useCallback(async () => {
    if (!review) return;
    setSaving(true);
    await supabase.from('book_reviews').delete().eq('id', review.id);
    setReview(null);
    setSaving(false);
  }, [review]);

  return { review, loading, saving, saveReview, deleteReview };
}

export function useAllBookReviews(bookIds: string[], key = 0) {
  const [reviews, setReviews] = useState<Record<string, BookReview>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (bookIds.length === 0) {
      setReviews({});
      setLoading(false);
      return;
    }

    const fetch = async () => {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data, error } = await supabase
        .from('book_reviews')
        .select('*')
        .in('book_id', bookIds)
        .eq('user_id', user.id);

      if (!error && data) {
        const map: Record<string, BookReview> = {};
        data.forEach((r) => { map[r.book_id] = r; });
        setReviews(map);
      }
      setLoading(false);
    };

    fetch();
  }, [bookIds.join(','), key]);

  return { reviews, loading };
}