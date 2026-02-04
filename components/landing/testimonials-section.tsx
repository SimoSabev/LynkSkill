"use client"

import { motion } from "framer-motion"
import { Star } from "lucide-react"
import Image from "next/image"

const testimonials = [
    {
        name: "Sarah Johnson",
        role: "Computer Science Student",
        company: "Interned at TechCorp",
        content:
            "LynkSkill made finding my dream internship so easy! The platform is intuitive, and I love how I can showcase my projects in my portfolio.",
        avatar: "/professional-woman-diverse.png",
        rating: 5,
    },
    {
        name: "Michael Chen",
        role: "Business Major",
        company: "Interned at StartupXYZ",
        content:
            "The one-click application feature saved me so much time. I applied to 20 internships in one day and got 5 interviews!",
        avatar: "/professional-man.jpg",
        rating: 5,
    },
    {
        name: "Emily Rodriguez",
        role: "Design Student",
        company: "Interned at CreativeHub",
        content:
            "Being able to share my achievements and connect with other students has been incredible. LynkSkill is more than just a job board.",
        avatar: "/professional-woman-designer.png",
        rating: 5,
    },
]

export function TestimonialsSection() {
    return (
        <section className="relative py-16 md:py-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-4 md:space-y-6 mb-12 md:mb-20"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
                        What Students{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Say</span>
                    </h2>
                    <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
                        Don&apos;t just take our word for it. Here&apos;s what our community has to say about their experience.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                    {testimonials.map((testimonial, index) => (
                        <div
                            key={index}
                            className="relative p-6 md:p-8 rounded-2xl bg-card border border-border hover:border-purple-500/30 transition-colors duration-150 space-y-4 md:space-y-6 shadow-sm"
                        >
                            <div className="flex gap-1">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>

                            <p className="text-sm md:text-lg text-foreground leading-relaxed italic">
                                &quot;{testimonial.content}&quot;
                            </p>

                            <div className="flex items-center gap-3 md:gap-4 pt-4 border-t border-border">
                                <Image
                                    src={testimonial.avatar || "/placeholder.svg"}
                                    alt={testimonial.name}
                                    width={60}
                                    height={60}
                                    className="rounded-full ring-2 ring-purple-500/30 w-12 h-12 md:w-14 md:h-14"
                                />
                                <div>
                                    <div className="font-bold text-base md:text-lg">{testimonial.name}</div>
                                    <div className="text-xs md:text-sm text-muted-foreground">{testimonial.role}</div>
                                    <div className="text-xs md:text-sm text-purple-400">{testimonial.company}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}
