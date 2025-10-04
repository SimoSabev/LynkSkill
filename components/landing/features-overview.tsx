"use client"

import { motion } from "framer-motion"
import { Target, Zap, Shield, TrendingUp } from "lucide-react"

const features = [
    {
        icon: <Target className="w-6 h-6 md:w-8 md:h-8" />,
        title: "Smart Matching",
        description:
            "AI-powered algorithm connects you with the perfect internship opportunities based on your skills and interests.",
        gradient: "from-purple-600 to-blue-600",
        iconBg: "from-purple-500 to-blue-500",
    },
    {
        icon: <Zap className="w-6 h-6 md:w-8 md:h-8" />,
        title: "Instant Applications",
        description: "Apply to multiple positions with one click. Your portfolio and credentials are always ready to go.",
        gradient: "from-blue-600 to-cyan-600",
        iconBg: "from-blue-500 to-cyan-500",
    },
    {
        icon: <Shield className="w-6 h-6 md:w-8 md:h-8" />,
        title: "Verified Companies",
        description: "All partner companies are thoroughly vetted to ensure legitimate opportunities and safe experiences.",
        gradient: "from-cyan-600 to-purple-600",
        iconBg: "from-cyan-500 to-purple-500",
    },
    {
        icon: <TrendingUp className="w-6 h-6 md:w-8 md:h-8" />,
        title: "Career Growth",
        description:
            "Track your progress, gain insights, and watch your professional journey unfold with detailed analytics.",
        gradient: "from-purple-600 to-pink-600",
        iconBg: "from-purple-500 to-pink-500",
    },
]

export function FeaturesOverview() {
    return (
        <section className="relative py-16 md:py-32 px-4 sm:px-6 lg:px-8 bg-muted/30 overflow-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-blue-900/5 to-cyan-900/5" />

                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:50px_50px] opacity-30" />

                {/* Floating Orbs */}
                <motion.div
                    className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl bg-gradient-to-r from-purple-600 to-blue-600"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, -20, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 15, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full opacity-10 blur-3xl bg-gradient-to-r from-cyan-600 to-purple-600"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, 20, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{ duration: 18, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                />
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="text-center space-y-4 md:space-y-6 mb-12 md:mb-20"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
                        Why Choose{" "}
                        <motion.span
                            className="bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
                            animate={{
                                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Number.POSITIVE_INFINITY,
                                ease: "easeInOut",
                            }}
                            style={{
                                backgroundSize: "200% 200%",
                            }}
                        >
                            LynkSkill
                        </motion.span>
                        ?
                    </h2>
                    <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance leading-relaxed">
                        We&apos;ve built the most comprehensive platform for student-business connections, packed with features
                        designed to accelerate your career.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 40 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true, margin: "-50px" }}
                            transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                            whileHover={{
                                y: -12,
                                transition: { duration: 0.3, ease: "easeOut" },
                            }}
                            className="group relative p-6 md:p-8 rounded-3xl bg-card/50 backdrop-blur-sm border-2 border-border hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20"
                        >
                            {/* Hover Gradient Background */}
                            <motion.div
                                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`}
                            />

                            <div className="relative space-y-4 md:space-y-5">
                                {/* Icon with Gradient Background */}
                                <motion.div
                                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.iconBg} text-white shadow-lg`}
                                    whileHover={{
                                        scale: 1.1,
                                        rotate: [0, -5, 5, 0],
                                        transition: { duration: 0.5 },
                                    }}
                                >
                                    {feature.icon}
                                </motion.div>

                                {/* Title */}
                                <h3 className="text-xl md:text-2xl font-bold text-foreground group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all duration-300">
                                    {feature.title}
                                </h3>

                                {/* Description */}
                                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{feature.description}</p>

                                {/* Decorative Line */}
                                <motion.div
                                    className={`h-1 rounded-full bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                                    initial={{ scaleX: 0 }}
                                    whileInView={{ scaleX: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ duration: 0.6, delay: index * 0.1 + 0.3 }}
                                />
                            </div>

                            {/* Floating Particle Effect on Hover */}
                            <motion.div
                                className={`absolute top-4 right-4 w-2 h-2 rounded-full bg-gradient-to-r ${feature.gradient} opacity-0 group-hover:opacity-100`}
                                animate={{
                                    y: [0, -10, 0],
                                    opacity: [0, 1, 0],
                                }}
                                transition={{
                                    duration: 2,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut",
                                }}
                            />
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
