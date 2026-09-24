'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGroupChat } from '@/hooks/useGroupChat';

interface GroupChatProps {
  groupId: string;
  groupName: string;
  onClose: () => void;
}

export function GroupChat({ groupId, groupName, onClose }: GroupChatProps) {
  const { user, profile } = useAuth();
  const { messages, loading, sendMessage } = useGroupChat(groupId);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending) return;
    setSending(true);
    await sendMessage(input.trim());
    setInput('');
    setSending(false);
  };

  return (
    <motion.div
      className="fixed inset-x-0 bottom-0 md:inset-auto md:right-4 md:bottom-4 md:w-[400px] md:h-[500px] z-50 rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: 'rgba(20, 12, 4, 0.97)',
        border: '1px solid rgba(218, 165, 32, 0.25)',
        backdropFilter: 'blur(16px)',
        maxHeight: '80vh',
      }}
      initial={{ y: '100%', opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: '100%', opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'rgba(218,165,32,0.15)' }}>
        <div className="flex items-center gap-2">
          <MessageCircle size={18} className="text-gold-DEFAULT" />
          <h3 className="text-cream-100 text-sm font-medium" style={{ fontFamily: 'Cinzel' }}>{groupName}</h3>
        </div>
        <button onClick={onClose} className="text-cream-400/60 hover:text-cream-200 transition-colors">
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="text-center text-cream-400/40 text-sm py-8" style={{ fontFamily: 'EB Garamond' }}>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-cream-400/30 text-sm py-8" style={{ fontFamily: 'EB Garamond', fontStyle: 'italic' }}>
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg) => {
            const isOwn = msg.user_id === user?.id;
            return (
              <motion.div
                key={msg.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div
                  className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                    isOwn
                      ? 'text-wood-900'
                      : 'text-cream-100'
                  }`}
                  style={{
                    background: isOwn ? 'linear-gradient(135deg, #b8860b, #daa520)' : 'rgba(255,255,255,0.06)',
                    fontFamily: 'EB Garamond',
                  }}
                >
                  {!isOwn && (
                    <div className="text-gold-DEFAULT text-xs mb-0.5" style={{ fontFamily: 'Cinzel' }}>
                      {msg.profile?.display_name || msg.profile?.username || 'Unknown'}
                    </div>
                  )}
                  <div>{msg.content}</div>
                  <div className={`text-[10px] mt-1 ${isOwn ? 'text-wood-800/60' : 'text-cream-400/30'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t flex gap-2" style={{ borderColor: 'rgba(218,165,32,0.15)' }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 bg-transparent border rounded-xl px-3 py-2 text-cream-100 text-sm input-gold"
          style={{ borderColor: 'rgba(218,165,32,0.2)', outline: 'none', fontFamily: 'EB Garamond' }}
        />
        <motion.button
          type="submit"
          className="p-2.5 rounded-xl text-wood-900 btn-enchanted"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          disabled={sending || !input.trim()}
        >
          <Send size={16} />
        </motion.button>
      </form>
    </motion.div>
  );
}
