"use client"

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { motion, useScroll, useTransform } from "framer-motion"
import { 
    Sparkles, 
    ArrowRight, 
    Users, 
    Briefcase, 
    Star, 
    Zap, 
    Target,
    TrendingUp,
    CheckCircle,
    Play
} from "lucide-react"
import { useState, useEffect } from "react"

export function HeroSection() {
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
    const { scrollY } = useScroll()
    const y = useTransform(scrollY, [0, 500], [0, 150])

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePosition({ x: e.clientX, y: e.clientY })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    return (
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden py-16 md:py-24">
            {/* Enhanced Background */}
            <div className="absolute inset-0 overflow-hidden">
                {/* Animated Grid */}
                <div className="absolute inset-0">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20" />
                    <motion.div 
                        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:25px_25px] opacity-40"
                        animate={{
                            backgroundPosition: ['0px 0px', '50px 50px'],
                        }}
                        transition={{ 
                            duration: 20, 
                            repeat: Number.POSITIVE_INFINITY, 
                            ease: "linear" 
                        }}
                    />
                </div>

                {/* Dynamic Gradient Overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: `
                            radial-gradient(circle at 20% 20%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 80%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
                        `,
                    }}
                />

                {/* Mouse-following gradient */}
                <motion.div
                    className="absolute w-96 h-96 rounded-full opacity-20 blur-3xl pointer-events-none"
                    style={{
                        background: "radial-gradient(circle, rgba(120, 119, 198, 0.4) 0%, transparent 70%)",
                        left: mousePosition.x - 192,
                        top: mousePosition.y - 192,
                    }}
                    animate={{
                        scale: [1, 1.2, 1],
                    }}
                    transition={{
                        duration: 4,
                        repeat: Number.POSITIVE_INFINITY,
                        ease: "easeInOut"
                    }}
                />
            </div>

            {/* Floating Elements */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1.5 h-1.5 bg-gradient-to-r from-purple-400/80 to-blue-400/80 rounded-full"
                        style={{
                            left: `${15 + i * 12}%`,
                            top: `${20 + i * 10}%`,
                        }}
                        animate={{
                            y: [0, -15, 0],
                            opacity: [0.4, 0.8, 0.4],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 4 + i * 0.5,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: i * 0.6,
                            ease: "easeInOut"
                        }}
                    />
                ))}
            </div>

            <motion.div 
                className="relative z-10 max-w-7xl mx-auto text-center space-y-6 md:space-y-8 w-full"
                style={{ y }}
            >
                {/* Enhanced Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -30, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 rounded-full border border-white/20 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl shadow-2xl shadow-purple-500/20"
                >
                    <motion.div
                        animate={{ rotate: [0, 360] }}
                        transition={{ duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    >
                        <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-400" />
                    </motion.div>
                    <span className="text-sm md:text-base font-semibold bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
                        🚀 Connecting Students with Opportunities
                    </span>
                    <motion.div
                        className="w-2 h-2 bg-green-400 rounded-full"
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    />
                </motion.div>

                {/* Enhanced Main Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, delay: 0.2 }}
                    className="space-y-6 md:space-y-8"
                >
                    <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tight leading-[0.9]">
                        <span className="block">Welcome to</span>
                        <span className="relative inline-block">
                            <motion.span 
                                className="bg-gradient-to-r from-purple-400 via-blue-400 via-purple-500 to-blue-500 bg-clip-text text-transparent"
                                animate={{
                                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                }}
                                transition={{
                                    duration: 5,
                                    repeat: Number.POSITIVE_INFINITY,
                                    ease: "easeInOut"
                                }}
                                style={{
                                    backgroundSize: '200% 200%'
                                }}
                            >
                                LynkSkill
                            </motion.span>
                            <motion.div
                                className="absolute -inset-4 bg-gradient-to-r from-purple-600/30 via-blue-600/30 to-purple-600/30 blur-3xl -z-10"
                                animate={{ 
                                    opacity: [0.3, 0.6, 0.3],
                                    scale: [1, 1.05, 1]
                                }}
                                transition={{ duration: 4, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut" }}
                            />
                        </span>
                    </h1>

                    <motion.p 
                        className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium px-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, delay: 0.6 }}
                    >
                        The ultimate platform bridging the gap between{" "}
                        <span className="relative inline-block">
                            <span className="text-foreground font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                talented students
                            </span>
                            <motion.div
                                className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 1, delay: 1.2 }}
                            />
                        </span>{" "}
                        and{" "}
                        <span className="relative inline-block">
                            <span className="font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                                innovative businesses
                            </span>
                            <motion.div
                                className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ duration: 1, delay: 1.4 }}
                            />
                        </span>
                    </motion.p>
                </motion.div>

                {/* Enhanced Feature Pills */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.8 }}
                    className="flex flex-wrap justify-center gap-2 md:gap-3 pt-2"
                >
                    {[
                        { icon: Target, text: "Manage Internships", color: "from-purple-500 to-pink-500" },
                        { icon: Star, text: "Showcase Portfolios", color: "from-blue-500 to-cyan-500" },
                        { icon: TrendingUp, text: "Track Progress", color: "from-green-500 to-emerald-500" },
                        { icon: Zap, text: "Real-time Updates", color: "from-orange-500 to-red-500" }
                    ].map((feature, index) => (
                        <motion.div
                            key={feature.text}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, delay: 1 + index * 0.1 }}
                            className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 transition-all duration-300"
                        >
                            <feature.icon className={`w-4 h-4 font-bold text-purple-400  bg-clip-text`} />
                            <span className="text-sm font-medium text-muted-foreground">{feature.text}</span>
                        </motion.div>
                    ))}
                </motion.div>

                {/* Enhanced Auth Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1.2 }}
                    className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center items-center pt-6 md:pt-8 px-4"
                >
                    <SignedOut>
                        <SignUpButton forceRedirectUrl="/redirect-after-signin">
                            <Button
                                size="lg"
                                className="group relative overflow-hidden rounded-2xl px-8 py-6 md:px-12 md:py-8 text-lg md:text-xl font-bold transition-all duration-500 hover:scale-105 active:scale-95 w-full sm:w-auto min-w-[280px] bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 text-white border-0 shadow-2xl shadow-purple-500/50 hover:shadow-purple-500/70"
                            >
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 opacity-0 group-hover:opacity-20 transition-opacity duration-500"
                                    animate={{
                                        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                                    }}
                                    transition={{
                                        duration: 3,
                                        repeat: Number.POSITIVE_INFINITY,
                                        ease: "easeInOut"
                                    }}
                                    style={{
                                        backgroundSize: '200% 200%'
                                    }}
                                />
                                <span className="relative flex items-center justify-center gap-3">
                                    Get Started Free
                                    <motion.div
                                        animate={{ x: [0, 4, 0] }}
                                        transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                                    >
                                        <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                                    </motion.div>
                                </span>
                            </Button>
                        </SignUpButton>

                        <SignInButton forceRedirectUrl="/redirect-after-signin">
                            <Button
                                size="lg"
                                variant="outline"
                                className="group relative overflow-hidden rounded-2xl px-8 py-6 md:px-12 md:py-8 text-lg md:text-xl font-bold transition-all duration-500 hover:scale-105 active:scale-95 w-full sm:w-auto min-w-[280px] border-2 border-white/30 hover:border-white/60 bg-white/5 backdrop-blur-xl hover:bg-white/10 shadow-xl"
                            >
                                <span className="relative flex items-center justify-center gap-3 bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                                    Sign In
                                    <Play className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
                                </span>
                            </Button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <motion.div 
                            className="flex items-center gap-6 px-8 py-6 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/20 shadow-2xl"
                            whileHover={{ scale: 1.02 }}
                            transition={{ duration: 0.2 }}
                        >
                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox:
                                            "w-12 h-12 md:w-16 md:h-16 ring-2 ring-purple-500/50 ring-offset-2 md:ring-offset-4 ring-offset-background transition-all duration-300 hover:ring-purple-400",
                                        userButtonPopoverCard: "bg-card backdrop-blur-sm border border-border shadow-2xl",
                                        userButtonPopoverActionButton: "hover:bg-accent transition-colors",
                                    },
                                }}
                            />
                            <div className="text-left">
                                <span className="text-lg md:text-xl font-bold bg-gradient-to-r from-purple-300 to-blue-300 bg-clip-text text-transparent">
                                    Welcome back!
                                </span>
                                <p className="text-sm text-muted-foreground">Ready to continue your journey?</p>
                            </div>
                        </motion.div>
                    </SignedIn>
                </motion.div>
            </motion.div>

            {/* Enhanced Scroll indicator */}
            <motion.div
                className="absolute bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 cursor-pointer hidden md:flex flex-col items-center gap-2"
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
                <span className="text-sm text-muted-foreground font-medium">Scroll to explore</span>
                <motion.div 
                    className="w-8 h-12 border-2 border-white/30 rounded-full flex items-start justify-center p-2 hover:border-white/50 transition-colors duration-300"
                    whileHover={{ scale: 1.1 }}
                >
                    <motion.div
                        className="w-2 h-2 bg-gradient-to-b from-purple-400 to-blue-400 rounded-full"
                        animate={{ y: [0, 20, 0] }}
                        transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                    />
                </motion.div>
            </motion.div>
        </section>
    )
}
