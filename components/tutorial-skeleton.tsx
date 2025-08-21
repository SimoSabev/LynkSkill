import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter } from "@/components/ui/card"

export function TutorialCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-3xl">
      <Skeleton className="aspect-video w-full" />
      <CardContent className="p-4">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-3/4 mb-4" />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Skeleton className="h-6 w-6 rounded-full" />
            <Skeleton className="h-4 w-20" />
          </div>
          <Skeleton className="h-4 w-16" />
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-4">
        <Skeleton className="h-6 w-20 rounded-xl" />
        <Skeleton className="h-4 w-16" />
      </CardFooter>
    </Card>
  )
}

export function TutorialListSkeleton() {
  return (
    <div className="p-4 flex flex-col md:flex-row gap-3">
      <Skeleton className="h-20 w-20 rounded-2xl flex-shrink-0" />
      <div className="flex-1">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <div className="flex flex-wrap items-center gap-3">
          <Skeleton className="h-6 w-20 rounded-xl" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-16" />
        </div>
      </div>
      <Skeleton className="h-8 w-24 rounded-xl" />
    </div>
  )
}
