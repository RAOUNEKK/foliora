const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_BOOKS_API_KEY;
export interface BookVolume {
  id: string;
  volumeInfo: {
    title: string;
    subtitle?: string;
    authors?: string[];
    description?: string;
    publishedDate?: string;
    pageCount?: number;
    categories?: string[];
    averageRating?: number;
    ratingsCount?: number;
    language?: string;
    publisher?: string;
    imageLinks?: {
      thumbnail?: string;
      smallThumbnail?: string;
      small?: string;
      medium?: string;
      large?: string;
      extraLarge?: string;
    };
    industryIdentifiers?: Array<{ type: string; identifier: string }>;
    previewLink?: string;
    infoLink?: string;
    maturityRating?: string;
  };
}

export interface BooksResponse {
  totalItems: number;
  items?: BookVolume[];
}

const API_BASE = 'https://www.googleapis.com/books/v1/volumes';

function getHighResCover(book: BookVolume): string {
  const links = book.volumeInfo.imageLinks;
  if (!links) return '';

  const url =
    links.extraLarge ||
    links.large ||
    links.medium ||
    links.small ||
    links.thumbnail ||
    links.smallThumbnail ||
    '';

  if (!url) return '';

  return url.replace('http://', 'https://');
}

export function getBookCover(book: BookVolume): string {
  const isbn = getBookISBN(book);

  if (isbn !== 'N/A') {
    return `https://covers.openlibrary.org/b/isbn/${isbn}-L.jpg`;
  }

  return getHighResCover(book);
}

export function getBookAuthors(book: BookVolume): string {
  return book.volumeInfo.authors?.join(', ') || 'Unknown Author';
}

export function getBookRating(book: BookVolume): number {
  return book.volumeInfo.averageRating || 0;
}

export function getBookGenre(book: BookVolume): string {
  return book.volumeInfo.categories?.[0] || 'General';
}

export function getBookISBN(book: BookVolume): string {
  const ids = book.volumeInfo.industryIdentifiers;
  const isbn13 = ids?.find((i) => i.type === 'ISBN_13');
  const isbn10 = ids?.find((i) => i.type === 'ISBN_10');
  return isbn13?.identifier || isbn10?.identifier || 'N/A';
}

export async function searchBooks(
  query: string,
  startIndex = 0,
  maxResults = 20,
  orderBy: 'relevance' | 'newest' = 'relevance',
  language = ''
): Promise<BooksResponse> {
  try {
    const params = new URLSearchParams({
      q: query,
      startIndex: startIndex.toString(),
      maxResults: maxResults.toString(),
      orderBy,
      printType: 'books',
    });

    if (language) {
      params.append('langRestrict', language);
    }

    const res = await fetch(`${API_BASE}?${params}&key=${API_KEY}`);
    if (!res.ok) throw new Error('Failed to fetch books');
    return res.json();
  } catch(error) {
    console.error("Google Books error:", error);
    return { totalItems: 0, items: [] };
  }
}

export async function fetchBookById(id: string): Promise<BookVolume | null> {
  try {
    const res = await fetch(`${API_BASE}/${id}?key=${API_KEY}`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchGenreBooks(genre: string, maxResults = 20): Promise<BooksResponse> {
  return searchBooks(`subject:${genre}`, 0, maxResults, 'relevance');
}

export async function fetchTrendingBooks(): Promise<BooksResponse> {
  const queries = ['bestseller fiction 2024', 'popular books 2024'];
  const q = queries[Math.floor(Math.random() * queries.length)];
  return searchBooks(q, 0, 20);
}

export async function fetchRecommendedBooks(genres: string[]): Promise<BookVolume[]> {
  if (genres.length === 0) {
    const res = await searchBooks('award winning literature', 0, 12);
    return res.items || [];
  }
  const genre = genres[Math.floor(Math.random() * genres.length)];
  const res = await fetchGenreBooks(genre, 12);
  return res.items || [];
}

export const GENRES = [
  { id: 'fantasy', label: 'Fantasy', query: 'subject:fantasy' },
  { id: 'romance', label: 'Romance', query: 'subject:romance' },
  { id: 'mystery', label: 'Mystery', query: 'subject:mystery' },
  { id: 'science-fiction', label: 'Science Fiction', query: 'subject:science+fiction' },
  { id: 'historical-fiction', label: 'Historical Fiction', query: 'subject:historical+fiction' },
  { id: 'horror', label: 'Horror', query: 'subject:horror' },
  { id: 'self-development', label: 'Self Development', query: 'subject:self+help' },
  { id: 'biography', label: 'Biography', query: 'subject:biography' },
  { id: 'adventure', label: 'Adventure', query: 'subject:adventure' },
  { id: 'thriller', label: 'Thriller', query: 'subject:thriller' },
];

export const GENRE_ICONS: Record<string, string> = {
  fantasy: '✨',
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