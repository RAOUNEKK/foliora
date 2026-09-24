'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Save, Trash2, Loader2 } from 'lucide-react';
import { useBookReviews } from '@/hooks/useBookReviews';

interface ReviewEditorProps {
  bookId: string;
  initialText: string;
  onSaved: () => void;
  onCancel: () => void;
}

export function ReviewEditor({ bookId, initialText, onSaved, onCancel }: ReviewEditorProps) {
  const [text, setText] = useState(initialText);
  const { saving, saveReview, deleteReview } = useBookReviews(bookId);

  const handleSave = async () => {
    await saveReview(text);
    onSaved();
  };

  const handleDelete = async () => {
    await deleteReview();
    onSaved();
  };

  return (
    <div
      className="rounded-xl p-4"
      style={{ background: 'rgba(20,10,4,0.8)', border: '1px solid rgba(218,165,32,0.12)' }}
    >
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Share your thoughts about this book..."
        className="w-full bg-transparent text-cream-200 placeholder-cream-400/30 text-sm outline-none resize-none leading-relaxed"
        style={{ fontFamily: 'EB Garamond, serif', minHeight: '100px' }}
        maxLength={2000}
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-cream-400/30 text-xs" style={{ fontFamily: 'EB Garamond, serif' }}>
          {text.length}/2000
        </span>
        <div className="flex items-center gap-2">
          {initialText && (
            <motion.button
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-red-400/80 hover:text-red-400 hover:bg-red-500/10 transition-all"
              style={{ fontFamily: 'Cinzel, serif' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDelete}
              disabled={saving}
            >
              <Trash2 size={12} />
              Delete
            </motion.button>
          )}
          <motion.button
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-wood-900 btn-enchanted"
            style={{ fontFamily: 'Cinzel, serif' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSave}
            disabled={saving || !text.trim()}
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            Save
          </motion.button>
        </div>
      </div>
    </div>
  );
}
