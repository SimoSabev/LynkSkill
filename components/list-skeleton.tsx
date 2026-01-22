import { Skeleton } from "@/components/ui/skeleton"

export function ListItemSkeleton() {
  return (
    <div className="flex items-center justify-between p-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-11 w-11 rounded-2xl" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-6 w-14 rounded-full" />
        <Skeleton className="h-9 w-20 rounded-xl" />
      </div>
    </div>
  )
}

export function FileListSkeleton() {
  return (
    <div className="rounded-3xl border border-border/50 overflow-hidden">
      <div className="bg-muted/30 p-3 hidden md:grid md:grid-cols-12 gap-4">
        <Skeleton className="h-4 w-20 col-span-6" />
        <Skeleton className="h-4 w-14 col-span-2" />
        <Skeleton className="h-4 w-14 col-span-2" />
        <Skeleton className="h-4 w-16 col-span-2" />
      </div>
      <div className="divide-y divide-border/50">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="p-3 md:grid md:grid-cols-12 items-center gap-4">
            <div className="col-span-6 flex items-center gap-3">
              <Skeleton className="h-11 w-11 rounded-2xl shrink-0" />
              <div className="space-y-2 flex-1 min-w-0">
                <Skeleton className="h-4 w-4/5" />
                <Skeleton className="h-3 w-3/5" />
              </div>
            </div>
            <Skeleton className="h-4 w-16 col-span-2 hidden md:block" />
            <Skeleton className="h-4 w-14 col-span-2 hidden md:block" />
            <div className="col-span-2 flex items-center justify-between gap-2 hidden md:flex">
              <Skeleton className="h-4 w-16" />
              <div className="flex gap-1.5">
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

export function ConversationListSkeleton() {
  return (
    <div className="space-y-2">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-muted/20">
          <Skeleton className="h-12 w-12 rounded-full shrink-0" />
          <div className="flex-1 space-y-2 min-w-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-4/5" />
          </div>
        </div>
      ))}
    </div>
  )
}

export function MessageListSkeleton() {
  return (
    <div className="space-y-4 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
          <div className={`flex items-end gap-2 max-w-[70%] ${i % 2 === 0 ? '' : 'flex-row-reverse'}`}>
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="space-y-1">
              <Skeleton className={`h-12 ${i % 3 === 0 ? 'w-48' : i % 3 === 1 ? 'w-64' : 'w-36'} rounded-2xl`} />
              <Skeleton className="h-2.5 w-12" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
