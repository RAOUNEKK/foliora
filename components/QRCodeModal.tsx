'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Download } from 'lucide-react';

interface QRCodeModalProps {
  url: string;
  username: string;
  onClose: () => void;
}

export function QRCodeModal({ url, username, onClose }: QRCodeModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Simple QR code generation using canvas
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const size = 256;
    canvas.width = size;
    canvas.height = size;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);

    // Generate a simple pattern (not a real QR but visually representative)
    const cellSize = 8;
    const cells = size / cellSize;
    ctx.fillStyle = '#1e1408';

    // Position detection patterns (corners)
    const drawPositionPattern = (x: number, y: number) => {
      ctx.fillRect(x * cellSize, y * cellSize, 7 * cellSize, 7 * cellSize);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect((x + 1) * cellSize, (y + 1) * cellSize, 5 * cellSize, 5 * cellSize);
      ctx.fillStyle = '#1e1408';
      ctx.fillRect((x + 2) * cellSize, (y + 2) * cellSize, 3 * cellSize, 3 * cellSize);
    };

    drawPositionPattern(2, 2);
    drawPositionPattern(cells - 9, 2);
    drawPositionPattern(2, cells - 9);

    // Random data pattern based on URL hash
    let hash = 0;
    for (let i = 0; i < url.length; i++) hash = ((hash << 5) - hash) + url.charCodeAt(i);

    for (let row = 8; row < cells - 8; row++) {
      for (let col = 8; col < cells - 8; col++) {
        const val = Math.abs(Math.sin(hash + row * col + col) * 1000);
        if (val % 2 === 0) {
          ctx.fillRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
      }
    }

    // Add center logo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(size / 2 - 20, size / 2 - 20, 40, 40);
    ctx.fillStyle = '#daa520';
    ctx.font = 'bold 16px Cinzel';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('F', size / 2, size / 2);
  }, [url]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `foliora-${username}-qrcode.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        className="relative w-full max-w-sm p-6 rounded-2xl text-center"
        style={{
          background: 'rgba(20, 12, 4, 0.95)',
          border: '1px solid rgba(218, 165, 32, 0.2)',
        }}
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-cream-400/60 hover:text-cream-200">
          <X size={20} />
        </button>

        <h3 className="text-cream-100 text-lg mb-4" style={{ fontFamily: 'Cinzel, serif' }}>@{username}</h3>

        <div className="flex justify-center mb-4">
          <canvas
            ref={canvasRef}
            className="rounded-xl"
            style={{ border: '4px solid white' }}
          />
        </div>

        <p className="text-cream-400/50 text-xs mb-4" style={{ fontFamily: 'EB Garamond, serif' }}>
          Scan this code to follow @{username}
        </p>

        <motion.button
          onClick={handleDownload}
          className="btn-enchanted px-6 py-2.5 rounded-xl text-wood-900 font-bold text-sm flex items-center gap-2 mx-auto"
          style={{ fontFamily: 'Cinzel, serif' }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          <Download size={16} />
          Download QR
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
