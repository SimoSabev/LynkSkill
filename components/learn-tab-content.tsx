"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Award, BookOpen, Bookmark, Clock, Crown, Eye, Lightbulb, Play, Search, TrendingUp } from "lucide-react"

import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Progress } from "@/components/ui/progress"
import { tutorials } from "@/lib/dashboard-data"
import { TutorialCardSkeleton, TutorialListSkeleton } from "@/components/tutorial-skeleton"
import { HeroSkeleton } from "@/components/hero-skeleton"

export function LearnTabContent() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2400)

    return () => clearTimeout(timer)
  }, [])

  if (isLoading) {
    return (
      <div className="space-y-8">
        <HeroSkeleton />
        <div className="flex flex-wrap gap-3 mb-6">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-10 w-24 bg-muted rounded-2xl animate-pulse" />
          ))}
          <div className="flex-1" />
          <div className="h-10 w-48 bg-muted rounded-2xl animate-pulse" />
        </div>
        <section className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <TutorialCardSkeleton key={i} />
            ))}
          </div>
        </section>
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="h-8 w-48 bg-muted rounded animate-pulse" />
            <div className="h-8 w-20 bg-muted rounded-2xl animate-pulse" />
          </div>
          <div className="rounded-3xl border overflow-hidden">
            <div className="divide-y">
              {Array.from({ length: 2 }).map((_, i) => (
                <TutorialListSkeleton key={i} />
              ))}
            </div>
          </div>
        </section>
        <section className="space-y-4">
          <div className="h-8 w-48 bg-muted rounded animate-pulse" />
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="overflow-hidden rounded-3xl border">
                <div className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="h-6 w-20 bg-muted rounded-xl animate-pulse" />
                    <div className="h-5 w-5 bg-muted rounded animate-pulse" />
                  </div>
                  <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 bg-muted rounded animate-pulse" />
                      <div className="h-4 w-12 bg-muted rounded animate-pulse" />
                    </div>
                    <div className="h-2 w-full bg-muted rounded-xl animate-pulse" />
                    <div className="h-3 w-20 bg-muted rounded animate-pulse" />
                  </div>
                </div>
                <div className="border-t p-4">
                  <div className="h-10 w-full bg-muted rounded-2xl animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="overflow-hidden rounded-3xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 p-8 text-white"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold">Learn & Grow</h2>
              <p className="max-w-[600px] text-white/80">
                Expand your creative skills with tutorials, courses, and resources.
              </p>
            </div>
            <Button className="w-fit rounded-2xl bg-white text-emerald-700 hover:bg-white/90">
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Pro
            </Button>
          </div>
        </motion.div>
      </section>

      <div className="flex flex-wrap gap-3 mb-6">
        <Button variant="outline" className="rounded-2xl bg-transparent">
          <Play className="mr-2 h-4 w-4" />
          All Tutorials
        </Button>
        <Button variant="outline" className="rounded-2xl bg-transparent">
          <BookOpen className="mr-2 h-4 w-4" />
          Courses
        </Button>
        <Button variant="outline" className="rounded-2xl bg-transparent">
          <Lightbulb className="mr-2 h-4 w-4" />
          Tips & Tricks
        </Button>
        <Button variant="outline" className="rounded-2xl bg-transparent">
          <TrendingUp className="mr-2 h-4 w-4" />
          Trending
        </Button>
        <Button variant="outline" className="rounded-2xl bg-transparent">
          <Bookmark className="mr-2 h-4 w-4" />
          Saved
        </Button>
        <div className="flex-1"></div>
        <div className="relative w-full md:w-auto mt-3 md:mt-0">
          <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
          <Input type="search" placeholder="Search tutorials..." className="w-full rounded-2xl pl-9 md:w-[200px]" />
        </div>
      </div>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Featured Tutorials</h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tutorials.slice(0, 3).map((tutorial) => (
            <motion.div key={tutorial.title} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
              <Card className="overflow-hidden rounded-3xl">
                <div className="aspect-video overflow-hidden bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 relative">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button size="icon" variant="secondary" className="h-14 w-14 rounded-full">
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4 text-white">
                    <Badge className="bg-white/20 text-white hover:bg-white/30 rounded-xl">{tutorial.category}</Badge>
                    <h3 className="mt-2 text-lg font-medium">{tutorial.title}</h3>
                  </div>
                </div>
                <CardContent className="p-4">
                  <p className="text-sm text-foreground">{tutorial.description}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback>{tutorial.instructor.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm">{tutorial.instructor}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Clock className="h-4 w-4" />
                      {tutorial.duration}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex items-center justify-between border-t p-4">
                  <Badge variant="outline" className="rounded-xl">
                    {tutorial.level}
                  </Badge>
                  <div className="flex items-center gap-1 text-sm text-foreground">
                    <Eye className="h-4 w-4" />
                    {tutorial.views} views
                  </div>
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Popular Courses</h2>
          <Button variant="ghost" className="rounded-2xl">
            View All
          </Button>
        </div>
        <div className="rounded-3xl border overflow-hidden">
          <div className="divide-y">
            {tutorials.slice(3, 5).map((tutorial) => (
              <motion.div
                key={tutorial.title}
                whileHover={{ scale: 1.02, y: -5 }}
                whileTap={{ scale: 0.98 }}
                className="p-4 flex flex-col md:flex-row gap-3"
              >
                <div className="flex-shrink-0">
                  <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-600">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Play className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="font-medium">{tutorial.title}</h3>
                  <p className="text-sm text-foreground">{tutorial.description}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    <Badge variant="outline" className="rounded-xl">
                      {tutorial.level}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <Clock className="h-3 w-3" />
                      {tutorial.duration}
                    </div>
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <Eye className="h-3 w-3" />
                      {tutorial.views} views
                    </div>
                  </div>
                </div>
                <div className="flex items-center">
                  <Button variant="ghost" size="sm" className="rounded-xl">
                    Watch Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-2xl font-semibold">Learning Paths</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Card className="overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="rounded-xl bg-blue-500">Beginner</Badge>
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <CardTitle className="mt-2">UI/UX Design Fundamentals</CardTitle>
              <CardDescription>Master the basics of user interface and experience design</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>8 courses • 24 hours</span>
                  <span>4.8 ★</span>
                </div>
                <Progress value={30} className="h-2 rounded-xl" />
                <p className="text-xs text-foreground">30% completed</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full rounded-2xl">
                Continue Learning
              </Button>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="rounded-xl bg-amber-500">Intermediate</Badge>
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <CardTitle className="mt-2">Digital Illustration Mastery</CardTitle>
              <CardDescription>Create stunning digital artwork and illustrations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>12 courses • 36 hours</span>
                  <span>4.9 ★</span>
                </div>
                <Progress value={0} className="h-2 rounded-xl" />
                <p className="text-xs text-foreground">Not started</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full rounded-2xl">
                Start Learning
              </Button>
            </CardFooter>
          </Card>

          <Card className="overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className="rounded-xl bg-red-500">Advanced</Badge>
                <Award className="h-5 w-5 text-amber-500" />
              </div>
              <CardTitle className="mt-2">Motion Graphics & Animation</CardTitle>
              <CardDescription>Create professional motion graphics and animations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>10 courses • 30 hours</span>
                  <span>4.7 ★</span>
                </div>
                <Progress value={0} className="h-2 rounded-xl" />
                <p className="text-xs text-foreground">Not started</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="secondary" className="w-full rounded-2xl">
                Start Learning
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>
    </div>
  )
}
