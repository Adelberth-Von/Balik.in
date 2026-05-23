import { ListSkeleton } from '@/components/ui/SkeletonLoader';

export default function Loading() {
  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-8 w-32 bg-zinc-800 rounded-lg animate-pulse" />
          <div className="h-4 w-20 bg-zinc-800 rounded-md animate-pulse mt-2" />
        </div>
      </div>
      <div className="h-10 w-full bg-zinc-800 rounded-xl animate-pulse" />
      <ListSkeleton />
    </div>
  );
}
