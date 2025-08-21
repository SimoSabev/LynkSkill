import { Skeleton } from "@/components/ui/skeleton"

export function ListItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-2xl" />
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-6 w-12 rounded-xl" />
        <Skeleton className="h-8 w-16 rounded-xl" />
      </div>
    </div>
  )
}

export function FileListSkeleton() {
  return (
    <div className="rounded-3xl border overflow-hidden">
      <div className="bg-muted/50 p-3 hidden md:grid md:grid-cols-12">
        <Skeleton className="h-4 w-16 col-span-6" />
        <Skeleton className="h-4 w-12 col-span-2" />
        <Skeleton className="h-4 w-12 col-span-2" />
        <Skeleton className="h-4 w-16 col-span-2" />
      </div>
      <div className="divide-y">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 md:grid md:grid-cols-12 items-center">
            <div className="col-span-6 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-2xl" />
              <div>
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-4 w-16 col-span-2" />
            <Skeleton className="h-4 w-12 col-span-2" />
            <div className="col-span-2 flex items-center justify-between">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-1">
                <Skeleton className="h-8 w-8 rounded-xl" />
                <Skeleton className="h-8 w-8 rounded-xl" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
