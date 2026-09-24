'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, UserMinus } from 'lucide-react';
import Link from 'next/link';
import type { Profile } from '@/context/AuthContext';
import { useAuth } from '@/context/AuthContext';
import { useFollowActions } from '@/hooks/useFollowers';

interface FollowListModalProps {
  title: string;
  users: Profile[];
  loading: boolean;
  onClose: () => void;
}

export function FollowListModal({ title, users, loading, onClose }: FollowListModalProps) {
  const { user } = useAuth();
  const { removeFollower } = useFollowActions();

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Modal */}
        <motion.div
          className="relative w-full max-w-md max-h-[70vh] overflow-hidden rounded-2xl"
          style={{
            background: 'rgba(20, 12, 4, 0.95)',
            border: '1px solid rgba(218, 165, 32, 0.2)',
          }}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(218,165,32,0.15)' }}>
            <h3 className="text-cream-100 text-lg" style={{ fontFamily: 'Cinzel, serif' }}>{title}</h3>
            <button onClick={onClose} className="p-1 text-cream-400/60 hover:text-cream-200 transition-colors">
              <X size={20} />
            </button>
          </div>

          {/* List */}
          <div className="overflow-y-auto p-4 space-y-3" style={{ maxHeight: 'calc(70vh - 60px)' }}>
            {loading ? (
              <div className="text-center text-cream-400/40 py-8" style={{ fontFamily: 'EB Garamond, serif' }}>Loading...</div>
            ) : users.length === 0 ? (
              <div className="text-center text-cream-400/40 py-8" style={{ fontFamily: 'EB Garamond, serif', fontStyle: 'italic' }}>
                No {title.toLowerCase()} yet
              </div>
            ) : (
              users.map((u) => (
                <div
                  key={u.id}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-white/5 transition-colors"
                  style={{ border: '1px solid rgba(255,255,255,0.04)' }}
                >
                  <Link href={`/profile/${u.username}`} className="flex items-center gap-3 flex-1">
                    <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0" style={{ border: '1px solid rgba(218,165,32,0.2)' }}>
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.display_name || u.username} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1e3a5f, #1a3a1a)' }}>
                          <span className="text-sm text-cream-200/60" style={{ fontFamily: 'Cinzel, serif' }}>
                            {(u.display_name || u.username).charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                    </div>
                    <div>
                      <div className="text-cream-200 text-sm font-medium" style={{ fontFamily: 'Cinzel, serif' }}>
                        {u.display_name || u.username}
                      </div>
                      <div className="text-cream-400/40 text-xs">@{u.username}</div>
                    </div>
                  </Link>
                  {title === 'Followers' && user?.id !== u.id && (
                    <button
                      onClick={async () => { await removeFollower(u.id); }}
                      className="p-1.5 text-cream-400/40 hover:text-red-400 transition-colors"
                      title="Remove follower"
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
