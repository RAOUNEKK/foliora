import { supabase } from '@/lib/supabase';
import { BookVolume } from '@/lib/books';

export interface ReadingListEntry {
  book: BookVolume;
  status: 'to-read' | 'reading' | 'completed';
  addedAt: number;
}

export async function fetchUserBooks(userId: string): Promise<{
  favorites: BookVolume[];
  readingList: ReadingListEntry[];
}> {
  const [favRes, rlRes] = await Promise.all([
    supabase
      .from('user_favorites')
      .select('book_data, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false }),
    supabase
      .from('user_reading_list')
      .select('book_data, status, added_at')
      .eq('user_id', userId)
      .order('added_at', { ascending: false }),
  ]);

  if (favRes.error) throw favRes.error;
  if (rlRes.error) throw rlRes.error;

  return {
    favorites: (favRes.data || []).map((row) => row.book_data as BookVolume),
    readingList: (rlRes.data || []).map((row) => ({
      book: row.book_data as BookVolume,
      status: row.status as ReadingListEntry['status'],
      addedAt: new Date(row.added_at).getTime(),
    })),
  };
}

export async function addUserFavorite(userId: string, book: BookVolume) {
  const { error } = await supabase.from('user_favorites').upsert(
    { user_id: userId, book_id: book.id, book_data: book },
    { onConflict: 'user_id,book_id' }
  );
  if (error) throw error;
}

export async function removeUserFavorite(userId: string, bookId: string) {
  const { error } = await supabase
    .from('user_favorites')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId);
  if (error) throw error;
}

export async function addUserReadingListEntry(userId: string, book: BookVolume) {
  const { error } = await supabase.from('user_reading_list').upsert(
    {
      user_id: userId,
      book_id: book.id,
      book_data: book,
      status: 'to-read',
      added_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,book_id' }
  );
  if (error) throw error;
}

export async function removeUserReadingListEntry(userId: string, bookId: string) {
  const { error } = await supabase
    .from('user_reading_list')
    .delete()
    .eq('user_id', userId)
    .eq('book_id', bookId);
  if (error) throw error;
}

export async function updateUserReadingStatus(
  userId: string,
  bookId: string,
  status: ReadingListEntry['status']
) {
  const { error } = await supabase
    .from('user_reading_list')
    .update({ status })
    .eq('user_id', userId)
    .eq('book_id', bookId);
  if (error) throw error;
}
