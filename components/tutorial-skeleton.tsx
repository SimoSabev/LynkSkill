import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export function TutorialCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/50">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t border-border/50 p-4">
        <Skeleton className="h-6 w-24 rounded-full" />
        <Skeleton className="h-4 w-20" />
      </CardFooter>
    </Card>
  )
}

export function TutorialListSkeleton() {
  return (
    <div className="p-4 flex flex-col md:flex-row gap-4 border-b border-border/30">
      <Skeleton className="h-20 w-20 md:w-24 rounded-2xl shrink-0" />
      <div className="flex-1 space-y-2.5 min-w-0">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-full" />
        <div className="flex flex-wrap items-center gap-3 pt-0.5">
          <Skeleton className="h-6 w-24 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-20" />
        </div>
      </div>
      <Skeleton className="h-9 w-28 rounded-xl shrink-0" />
    </div>
  )
}
