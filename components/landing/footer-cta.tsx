"use client"

import { SignedOut, SignUpButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { ArrowRight } from "lucide-react"

export function FooterCTA() {
    return (
        <section className="relative py-16 md:py-24 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
                className="max-w-4xl mx-auto text-center space-y-6 md:space-y-8"
            >
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold">
                    Ready to{" "}
                    <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Transform</span>{" "}
                    Your Career?
                </h2>
                <p className="text-base md:text-xl text-muted-foreground">
                    Join thousands of students already building their future with LynkSkill
                </p>
                <SignedOut>
                    <SignUpButton forceRedirectUrl="/redirect-after-signin">
                        <Button
                            size="lg"
                            className="group relative overflow-hidden rounded-full px-6 py-5 md:px-8 md:py-6 text-base md:text-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white border-0"
                        >
              <span className="relative flex items-center gap-2">
                Start Your Journey
                <ArrowRight className="w-4 h-4 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </span>
                        </Button>
                    </SignUpButton>
                </SignedOut>
            </motion.div>
        </section>
    )
}
