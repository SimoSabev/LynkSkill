import { Skeleton } from "@/components/ui/skeleton"

export function HeroSkeleton() {
  return (
    <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 p-8">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-4 flex-1">
          <Skeleton className="h-7 w-24 rounded-xl" />
          <Skeleton className="h-9 w-4/5" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
          <div className="flex flex-wrap gap-3 pt-2">
            <Skeleton className="h-11 w-36 rounded-2xl" />
            <Skeleton className="h-11 w-32 rounded-2xl" />
          </div>
        </div>
        <div className="hidden lg:flex items-center justify-center">
          <div className="relative h-40 w-40">
            <Skeleton className="absolute inset-0 rounded-full" />
            <Skeleton className="absolute inset-4 rounded-full" />
            <Skeleton className="absolute inset-8 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
