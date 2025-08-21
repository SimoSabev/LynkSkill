import { Skeleton } from "@/components/ui/skeleton"

export function HeroSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-muted p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4 flex-1">
          <Skeleton className="h-6 w-20 rounded-xl" />
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <div className="flex flex-wrap gap-3 mt-4">
            <Skeleton className="h-10 w-32 rounded-2xl" />
            <Skeleton className="h-10 w-28 rounded-2xl" />
          </div>
        </div>
        <div className="hidden lg:block">
          <Skeleton className="h-40 w-40 rounded-full" />
        </div>
      </div>
    </div>
  )
}
