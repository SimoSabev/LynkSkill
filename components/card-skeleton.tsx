import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"

export function CardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-12 w-12 rounded-2xl" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
      </CardHeader>
      <CardContent className="pb-3 space-y-3">
        <Skeleton className="h-6 w-4/5" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
      </CardContent>
      <CardFooter className="pt-2">
        <Skeleton className="h-11 w-full rounded-2xl" />
      </CardFooter>
    </Card>
  )
}

export function ProjectCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-3/5" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="space-y-2 pt-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
      <CardFooter className="flex gap-2 pt-2">
        <Skeleton className="h-11 flex-1 rounded-2xl" />
        <Skeleton className="h-11 w-11 rounded-2xl" />
      </CardFooter>
    </Card>
  )
}

export function CommunityCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-3xl border-border/50">
      <Skeleton className="aspect-square w-full" />
      <CardContent className="p-4 space-y-3">
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-4 w-3/5" />
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-10" />
            <Skeleton className="h-4 w-10" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      </CardContent>
    </Card>
  )
}

export function InternshipCardSkeleton() {
  return (
    <div className="h-full bg-card dark:bg-slate-900/50 rounded-2xl border border-border overflow-hidden">
      {/* Top accent bar */}
      <div className="h-1 bg-gradient-to-r from-purple-500/40 via-blue-500/40 to-purple-500/40" />
      
      <div className="p-6 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4 flex-1 min-w-0">
            <Skeleton className="h-14 w-14 rounded-xl shrink-0" />
            <div className="flex-1 space-y-2 min-w-0">
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
          <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg bg-muted/50">
            <Skeleton className="h-4 w-4 mx-auto mb-1 rounded" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-2/3 mx-auto mt-1" />
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50">
            <Skeleton className="h-4 w-4 mx-auto mb-1 rounded" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-2/3 mx-auto mt-1" />
          </div>
          <div className="p-2.5 rounded-lg bg-muted/50">
            <Skeleton className="h-4 w-4 mx-auto mb-1 rounded" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-2 w-2/3 mx-auto mt-1" />
          </div>
        </div>

        {/* Skills Tags */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <Skeleton className="h-6 w-16 rounded-md" />
          <Skeleton className="h-6 w-20 rounded-md" />
          <Skeleton className="h-6 w-14 rounded-md" />
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 pb-6 pt-3 flex gap-2 border-t border-border">
        <Skeleton className="h-11 flex-1 rounded-xl" />
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
    </div>
  )
}

export function ApplicationCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-xl p-4 border border-border/50 bg-card/50">
      <div className="space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-7 w-20 rounded-full shrink-0" />
        </div>
        <div className="flex items-center justify-between pt-1">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-9 w-24 rounded-xl" />
        </div>
      </div>
    </div>
  )
}

export function AssignmentCardSkeleton() {
  return (
    <Card className="overflow-hidden rounded-2xl border-border/50 border-l-4 border-l-muted">
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
          <div className="flex-1 space-y-3 min-w-0">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-3/5" />
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-2/5" />
            <div className="space-y-2 pt-1">
              <Skeleton className="h-2.5 w-full rounded-full" />
              <div className="flex gap-4">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-3 w-28" />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
