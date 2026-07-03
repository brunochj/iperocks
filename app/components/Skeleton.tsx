export function Skeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
    return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} style={style} />;
  }
  
  export function SkeletonText({ lines = 1, className = "" }: { lines?: number; className?: string }) {
    return (
      <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton key={i} className="h-4 w-full" />
        ))}
      </div>
    );
  }
  
  export function SkeletonCard({ children }: { children?: React.ReactNode }) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 mb-6">
        <Skeleton className="h-6 w-1/3 mb-4" />
        {children}
      </div>
    );
  }
  
  export function SkeletonChart() {
    return (
      <div className="space-y-3">
        <div className="flex justify-between items-end h-32">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="w-6 h-full" style={{ height: `${20 + Math.random() * 60}%` }} />
          ))}
        </div>
        <div className="flex justify-between">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-6" />
          ))}
        </div>
      </div>
    );
  }
  
  export function SkeletonRanking({ items = 5 }: { items?: number }) {
    return (
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-6" />
              <Skeleton className="h-5 w-24" />
            </div>
            <Skeleton className="h-5 w-12" />
          </div>
        ))}
      </div>
    );
  }
  
  export function SkeletonAscents({ items = 5 }: { items?: number }) {
    return (
      <ul className="space-y-3">
        {Array.from({ length: items }).map((_, i) => (
          <li key={i} className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-8" />
            </div>
            <Skeleton className="h-3 w-16" />
          </li>
        ))}
      </ul>
    );
  }