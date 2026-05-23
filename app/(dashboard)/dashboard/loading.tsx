import { ListSkeleton } from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-8">
      <div className="h-12 w-64 bg-zinc-800 rounded-lg animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-28 w-full bg-zinc-800 rounded-2xl animate-pulse" />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="h-8 w-40 bg-zinc-800 rounded-lg animate-pulse" />
          <ListSkeleton />
        </div>
        <div className="space-y-4">
          <div className="h-8 w-40 bg-zinc-800 rounded-lg animate-pulse" />
          <ListSkeleton />
        </div>
      </div>
    </div>
  );
}
