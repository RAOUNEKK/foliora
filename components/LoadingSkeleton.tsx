'use client';

export function BookCardSkeleton() {
  return (
    <div
      className="rounded-2xl overflow-hidden"
      style={{ background: 'rgba(35,20,8,0.9)', border: '1px solid rgba(218,165,32,0.08)' }}
    >
      {/* Cover */}
      <div className="aspect-[2/3] skeleton-shimmer" style={{ background: 'rgba(255,255,255,0.04)' }} />
      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="h-3 rounded-full skeleton-shimmer" style={{ background: 'rgba(255,255,255,0.04)', width: '85%' }} />
        <div className="h-2.5 rounded-full skeleton-shimmer" style={{ background: 'rgba(255,255,255,0.04)', width: '60%' }} />
        <div className="h-2 rounded-full skeleton-shimmer" style={{ background: 'rgba(255,255,255,0.04)', width: '40%' }} />
      </div>
    </div>
  );
}

export function BookGridSkeleton({ count = 20 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <BookCardSkeleton key={i} />
      ))}
    </div>
  );
}

export function BookDetailSkeleton() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-12 animate-pulse">
      <div className="flex flex-col md:flex-row gap-10">
        <div className="flex-shrink-0 w-48 h-72 rounded-2xl" style={{ background: 'rgba(255,255,255,0.05)' }} />
        <div className="flex-1 space-y-4">
          <div className="h-8 rounded-lg w-3/4" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-4 rounded w-1/2" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="h-4 rounded w-1/3" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-3 rounded" style={{ background: 'rgba(255,255,255,0.05)', width: `${85 - i * 5}%` }} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
