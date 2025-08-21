"use client"

import { motion } from "framer-motion"
import { useEffect, useState } from "react"
import { Heart, MessageSquare } from "lucide-react"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { communityPosts } from "@/lib/dashboard-data"
import { CommunityCardSkeleton } from "@/components/card-skeleton"

export function CommunityHighlightsSection() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2600)

    return () => clearTimeout(timer)
  }, [])

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Community Highlights</h2>
        <Button variant="ghost" className="rounded-2xl">
          Explore
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <CommunityCardSkeleton key={i} />)
          : communityPosts.map((post) => (
              <motion.div key={post.title} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
                <Card className="overflow-hidden rounded-3xl">
                  <div className="aspect-[4/3] overflow-hidden bg-muted relative">
                    <Image
                      src={post.image || "/placeholder.svg"}
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-300 hover:scale-105"
                    />
                  </div>
                  <CardContent className="p-4">
                    <h3 className="font-semibold">{post.title}</h3>
                    <p className="text-sm text-foreground">by {post.author}</p>
                    <div className="mt-2 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        {post.likes}
                        <MessageSquare className="ml-2 h-4 w-4 text-blue-500" />
                        {post.comments}
                      </div>
                      <span className="text-foreground">{post.time}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
      </div>
    </section>
  )
}
