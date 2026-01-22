"use client"

import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface DashboardHeroProps {
  userType: "Student" | "Company"
}

export function DashboardHero({ userType: _userType }: DashboardHeroProps) {
  return (
    <section>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 text-white"
      >
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-4">
            <Badge className="bg-white/20 text-white hover:bg-white/30 rounded-xl">Link Early</Badge>
            <h2 className="text-3xl font-bold">Welcome to LynkSkill</h2>
            <p className="max-w-[600px] text-white/80">
              The best place to unleash your creativity, improve your skills and find your talents.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="rounded-2xl bg-white text-indigo-700 hover:bg-white/90">Explore Plans</Button>
              <Button
                variant="outline"
                className="rounded-2xl bg-transparent border-white text-white hover:bg-white/10"
              >
                Take a Tour
              </Button>
            </div>
          </div>
          <div className="hidden lg:block">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 50, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
              className="relative h-40 w-40"
            >
              <div className="absolute inset-0 rounded-full bg-white/10 backdrop-blur-md" />
              <div className="absolute inset-4 rounded-full bg-white/20" />
              <div className="absolute inset-8 rounded-full bg-white/30" />
              <div className="absolute inset-12 rounded-full bg-white/40" />
              <div className="absolute inset-16 rounded-full bg-white/50" />
            </motion.div>
          </div>
        </div>
      </motion.div>
    </section>
  )
}
