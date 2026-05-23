import { MapSkeleton } from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] md:h-screen bg-zinc-950">
      <div className="p-4 bg-zinc-900 border-b border-zinc-800 z-10 shrink-0 shadow-sm flex items-center justify-between">
        <div className="h-6 w-32 bg-zinc-800 rounded-md animate-pulse" />
        <div className="h-6 w-24 bg-zinc-800 rounded-full animate-pulse" />
      </div>
      <div className="flex-1 p-4">
        <MapSkeleton />
      </div>
    </div>
  );
}
