'use client';

import { useEffect, useState } from 'react';

interface Particle {
  id: number;
  x: number;
  size: number;
  duration: number;
  delay: number;
  drift: number;
  type: 'dust' | 'leaf' | 'sparkle';
}

export default function FloatingParticles() {
  const [particles, setParticles] = useState<Particle[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const items: Particle[] = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      size: Math.random() * 6 + 2,
      duration: Math.random() * 12 + 8,
      delay: Math.random() * 10,
      drift: (Math.random() - 0.5) * 200,
      type: ['dust', 'leaf', 'sparkle'][Math.floor(Math.random() * 3)] as Particle['type'],
    }));
    setParticles(items);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
      {particles.map((p) => (
        <div
          key={p.id}
          className="absolute bottom-0"
          style={{
            left: `${p.x}%`,
            '--drift': `${p.drift}px`,
            '--duration': `${p.duration}s`,
            '--delay': `${p.delay}s`,
          } as React.CSSProperties}
        >
          <div
            style={{
              animation: `float-particle ${p.duration}s ease-in infinite`,
              animationDelay: `${p.delay}s`,
              width: p.size,
              height: p.size,
            }}
          >
            {p.type === 'dust' && (
              <div
                className="rounded-full"
                style={{
                  width: '100%',
                  height: '100%',
                  background: `radial-gradient(circle, rgba(255,215,0,0.9), rgba(255,180,0,0.3))`,
                  boxShadow: `0 0 ${p.size * 2}px rgba(255,215,0,0.6)`,
                }}
              />
            )}
            {p.type === 'leaf' && (
              <div
                style={{
                  width: p.size * 1.5,
                  height: p.size,
                  background: `linear-gradient(135deg, rgba(80,160,80,0.8), rgba(50,120,50,0.6))`,
                  borderRadius: '50% 50% 50% 0',
                  transform: 'rotate(45deg)',
                }}
              />
            )}
            {p.type === 'sparkle' && (
              <div
                style={{
                  width: p.size,
                  height: p.size,
                  position: 'relative',
                  opacity: 0.8,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(255,240,150,0.9)',
                    clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
