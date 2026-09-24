'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

interface Props {
  size?: 'sm' | 'md' | 'lg' | 'hero';
  animated?: boolean;
  linkTo?: string;
}

export default function FolioraLogo({ size = 'md', animated = true, linkTo }: Props) {
  const sizeMap = {
    sm:   { width: 180, height: 90  },
    md:   { width: 300, height: 150 },
    lg:   { width: 440, height: 220 },
    hero: { width: 640, height: 320 },
  };
  const s = sizeMap[size];

  const content = (
    <motion.div
      className="relative inline-flex items-center justify-center"
      initial={animated ? { opacity: 0, scale: 0.85 } : {}}
      animate={animated ? {
        opacity: 1,
        scale: 1,
        y: [0, -18, 0],
      } : {}}
      transition={animated ? {
        opacity: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
        scale: { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] },
        y: {
          delay: 0.7,
          duration: 2.2,
          repeat: Infinity,
          repeatType: 'loop',
          ease: [0.45, 0, 0.55, 1],
        },
      } : { duration: 0.7, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <Image
        src="/LOGO.png"
        alt="Foliora"
        width={s.width}
        height={s.height}
        priority
        style={{ objectFit: 'contain' }}
      />
    </motion.div>
  );

  if (linkTo) {
    return <Link href={linkTo}>{content}</Link>;
  }

  return content;
}