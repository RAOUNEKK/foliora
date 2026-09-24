'use client';

import { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, UserMinus, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useFollowActions } from '@/hooks/useFollowers';
import Link from 'next/link';

interface SearchUser {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_following: boolean;
}

interface UserSearchProps {
  /** If provided, show results inline below the input instead of a dropdown */
  inline?: boolean;
  placeholder?: string;
  onUserSelect?: (user: SearchUser) => void;
  /** If true, clicking a user fires onUserSelect instead of navigating */
  selectMode?: boolean;
}

export function UserSearch({
  inline = false,
  placeholder = 'Search by username or name…',
  onUserSelect,
  selectMode = false,
}: UserSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(false);
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({});
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { follow, unfollow, loading: actionLoading } = useFollowActions();

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) { setResults([]); setSearchError(false); return; }
    setSearching(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSearching(false); return; }

    const { data, error } = await supabase
      .rpc('search_users_by_username', {
        query: q.trim(),
        current_user_id: user.id,
      });

    if (!error && data) {
      setResults(data as SearchUser[]);
      setSearchError(false);
      // Seed local follow state from DB result
      const states: Record<string, boolean> = {};
      (data as SearchUser[]).forEach((u) => { states[u.id] = u.is_following; });
      setFollowingStates(states);
    } else if (error) {
      // Surface the failure instead of silently showing "no results" —
      // e.g. this is exactly how a missing/broken search_users_by_username
      // RPC on the database would otherwise look identical to a genuine
      // empty result.
      console.error('User search failed:', error);
      setResults([]);
      setSearchError(true);
    }
    setSearching(false);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => doSearch(val), 350);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearchError(false);
  };

  const handleFollow = async (e: React.MouseEvent, userId: string) => {
    e.preventDefault();
    e.stopPropagation();
    const currently = followingStates[userId];
    setFollowingStates((prev) => ({ ...prev, [userId]: !currently }));
    const { error } = currently ? await unfollow(userId) : await follow(userId);
    if (error) setFollowingStates((prev) => ({ ...prev, [userId]: currently }));
  };

  const showResults = results.length > 0 || (query.length >= 2 && !searching);

  return (
    <div className="relative w-full">
      {/* Input */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(218,165,32,0.15)',
        }}
      >
        {searching ? (
          <Loader2 size={16} className="text-gold-DEFAULT/50 animate-spin shrink-0" />
        ) : (
          <Search size={16} className="text-gold-DEFAULT/50 shrink-0" />
        )}
        <input
          type="text"
          value={query}
          onChange={handleChange}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-cream-100 text-sm placeholder-cream-400/30 outline-none"
          style={{ fontFamily: 'EB Garamond, serif' }}
        />
        {query && (
          <button onClick={handleClear} className="text-cream-400/40 hover:text-cream-300 transition-colors">
            <X size={14} />
          </button>
        )}
      </div>

      {/* Results */}
      <AnimatePresence>
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className={inline ? 'mt-2' : 'absolute left-0 right-0 top-full mt-2 z-50'}
            style={inline ? undefined : {
              background: '#110d06',
              border: '1px solid rgba(218,165,32,0.15)',
              borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
              maxHeight: '360px',
              overflowY: 'auto',
            }}
          >
            {results.length === 0 ? (
              <div className="px-4 py-6 text-center text-cream-400/40 text-sm" style={{ fontFamily: 'EB Garamond, serif' }}>
                {searchError
                  ? 'Search is unavailable right now — please try again.'
                  : <>No users found for &ldquo;{query}&rdquo;</>}
              </div>
            ) : (
              results.map((u) => {
                const isF = followingStates[u.id] ?? u.is_following;
                const row = (
                  <div
                    key={u.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors cursor-pointer"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
                    onClick={selectMode && onUserSelect ? () => onUserSelect(u) : undefined}
                  >
                    {/* Avatar */}
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden shrink-0"
                      style={{ border: '1px solid rgba(218,165,32,0.2)' }}
                    >
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm text-cream-200/50"
                          style={{ background: 'linear-gradient(135deg,#1e3a5f,#1a3a1a)', fontFamily: 'Cinzel, serif' }}>
                          {(u.display_name || u.username).charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>

                    {/* Name */}
                    <div className="flex-1 min-w-0">
                      <p className="text-cream-100 text-sm truncate" style={{ fontFamily: 'Cinzel, serif' }}>
                        {u.display_name || u.username}
                      </p>
                      <p className="text-gold-DEFAULT/50 text-xs truncate" style={{ fontFamily: 'EB Garamond, serif' }}>
                        @{u.username}
                      </p>
                    </div>

                    {/* Follow button */}
                    {!selectMode && (
                      <button
                        onClick={(e) => handleFollow(e, u.id)}
                        disabled={actionLoading}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                          isF
                            ? 'text-cream-400 border border-white/10 bg-white/5 hover:border-red-500/30 hover:text-red-400'
                            : 'btn-enchanted text-wood-900'
                        }`}
                        style={{ fontFamily: 'Cinzel, serif' }}
                      >
                        {isF ? <><UserMinus size={12} /> Unfollow</> : <><UserPlus size={12} /> Follow</>}
                      </button>
                    )}
                  </div>
                );

                return selectMode ? (
                  <div key={u.id}>{row}</div>
                ) : (
                  <Link key={u.id} href={`/profile/${u.username}`} className="block">
                    {row}
                  </Link>
                );
              })
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}