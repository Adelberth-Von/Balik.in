import { cn } from "@/lib/utils/cn";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-zinc-800/50", className)}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-4">
      <Skeleton className="w-14 h-14 rounded-xl shrink-0" />
      <div className="flex-1 w-full space-y-3 py-1">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      </div>
    </div>
  );
}

export function ListSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
          <Skeleton className="w-10 h-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-full max-w-[200px]" />
            <Skeleton className="h-3 w-3/4 max-w-[150px]" />
          </div>
          <Skeleton className="w-16 h-6 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export function MapSkeleton() {
  return (
    <div className="relative w-full h-[60vh] bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 z-0">
        <div className="w-full h-full bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(255,255,255,0.02)_10px,rgba(255,255,255,0.02)_20px)]" />
      </div>
      <div className="z-10 flex flex-col items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
  );
}
