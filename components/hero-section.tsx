"use client"

import type React from "react"

import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { motion, useScroll } from "framer-motion"
import {
    Briefcase,
    FileText,
    Trophy,
    Sparkles,
    ArrowRight,
    Users,
    Target,
    Zap,
    Shield,
    TrendingUp,
    CheckCircle2,
    MessageSquare,
    Star,
} from "lucide-react"
import Image from "next/image"
import { useRef, useMemo } from "react"

export default function LynkSkillLanding() {
    const containerRef = useRef<HTMLDivElement>(null)
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"],
    })

    return (
        <div ref={containerRef} className="min-h-screen bg-background text-foreground overflow-hidden">
            {/* Hero Section */}
            <HeroSection />

            {/* Features Overview */}
            <FeaturesOverview />

            {/* Services Section with Linky */}
            <section className="relative py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto space-y-32">
                    {/* Section Header */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                        className="text-center space-y-4 mb-20"
                    >
                        <h2 className="text-4xl sm:text-5xl md:text-6xl font-bold">
                            Meet{" "}
                            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Linky</span>
                        </h2>
                        <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-balance">
                            Your friendly guide to all the amazing features LynkSkill has to offer
                        </p>
                    </motion.div>

                    {/* Service 1: Internship Management - Linky Right */}
                    <ServiceCard
                        icon={<Briefcase className="w-12 h-12" />}
                        title="Internship Management"
                        description="Streamline your internship journey from application to completion. Connect with top companies, track your progress, and manage all your opportunities in one centralized hub."
                        features={[
                            "Browse curated internship opportunities",
                            "One-click application process",
                            "Real-time status tracking",
                            "Direct communication with employers",
                        ]}
                        linkyPosition="right"
                        gradient="from-purple-600 to-blue-600"
                    />

                    {/* Service 2: Portfolio Builder - Linky Left */}
                    <ServiceCard
                        icon={<FileText className="w-12 h-12" />}
                        title="Dynamic Portfolio Builder"
                        description="Create stunning portfolios that showcase your skills, projects, and achievements. Our intelligent filtering system helps employers find exactly what they're looking for."
                        features={[
                            "Customizable portfolio templates",
                            "Smart skill categorization",
                            "Project showcase with media support",
                            "SEO-optimized for maximum visibility",
                        ]}
                        linkyPosition="left"
                        gradient="from-blue-600 to-cyan-600"
                    />

                    {/* Service 3: Experience Hub - Linky Right */}
                    <ServiceCard
                        icon={<Trophy className="w-12 h-12" />}
                        title="My Experience Hub"
                        description="Celebrate your wins and share your journey! Post achievements, milestones, and experiences to inspire others and build your professional narrative."
                        features={[
                            "Share achievements and milestones",
                            "Build your professional story",
                            "Connect with like-minded peers",
                            "Gain recognition from employers",
                        ]}
                        linkyPosition="right"
                        gradient="from-cyan-600 to-purple-600"
                    />
                </div>
            </section>

            {/* How It Works */}
            <HowItWorks />

            {/* Stats Section */}
            <StatsSection />

            {/* Testimonials */}
            <TestimonialsSection />

            {/* FAQ Section */}
            <FAQSection />

            {/* Footer CTA */}
            <section className="relative py-24 px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="max-w-4xl mx-auto text-center space-y-8"
                >
                    <h2 className="text-4xl sm:text-5xl font-bold">
                        Ready to{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Transform
            </span>{" "}
                        Your Career?
                    </h2>
                    <p className="text-xl text-muted-foreground">
                        Join thousands of students already building their future with LynkSkill
                    </p>
                    <SignedOut>
                        <SignUpButton forceRedirectUrl="/redirect-after-signin">
                            <Button
                                size="lg"
                                className="group relative overflow-hidden rounded-full px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-500 hover:via-blue-500 hover:to-purple-500 text-white border-0"
                            >
                <span className="relative flex items-center gap-2">
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
                </span>
                            </Button>
                        </SignUpButton>
                    </SignedOut>
                </motion.div>
            </section>
        </div>
    )
}

function HeroSection() {
    const dots = useMemo(() => {
        const dotArray = []
        const cols = 30
        const rows = 20
        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                dotArray.push({ id: `${i}-${j}`, x: j, y: i })
            }
        }
        return dotArray
    }, [])

    return (
        <section className="relative min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Animated Dot Grid Background */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute inset-0 grid grid-cols-[repeat(30,1fr)] grid-rows-[repeat(20,1fr)] gap-0 opacity-40">
                    {dots.map((dot, index) => (
                        <motion.div
                            key={dot.id}
                            className="w-1 h-1 rounded-full mx-auto my-auto"
                            style={{
                                background: `linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.6 0.118 184.704))`,
                            }}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{
                                opacity: [0.2, 0.8, 0.2],
                                scale: [0.5, 1.5, 0.5],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Number.POSITIVE_INFINITY,
                                delay: (dot.x + dot.y) * 0.05,
                                ease: "easeInOut",
                            }}
                        />
                    ))}
                </div>

                {/* Radial gradient overlay */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background: "radial-gradient(circle at 50% 50%, transparent 0%, var(--background) 70%)",
                    }}
                />
            </div>

            {/* Floating gradient orbs */}
            <motion.div
                className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
                style={{
                    background: "linear-gradient(135deg, oklch(0.488 0.243 264.376), oklch(0.6 0.118 184.704))",
                }}
                animate={{
                    x: [0, 100, 0],
                    y: [0, -50, 0],
                    scale: [1, 1.2, 1],
                }}
                transition={{
                    duration: 20,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
            />

            <motion.div
                className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 blur-3xl"
                style={{
                    background: "linear-gradient(135deg, oklch(0.6 0.118 184.704), oklch(0.488 0.243 264.376))",
                }}
                animate={{
                    x: [0, -100, 0],
                    y: [0, 50, 0],
                    scale: [1, 1.3, 1],
                }}
                transition={{
                    duration: 25,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "easeInOut",
                }}
            />

            <div className="relative z-10 max-w-6xl mx-auto text-center space-y-8">
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-purple-500/30 bg-purple-500/10 backdrop-blur-md shadow-lg"
                >
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-base font-semibold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            Connecting Students with Opportunities
          </span>
                </motion.div>

                {/* Main Heading */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="space-y-8"
                >
                    <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-bold tracking-tight leading-tight">
                        Welcome to{" "}
                        <span className="relative inline-block">
              <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-gradient">
                LynkSkill
              </span>
              <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-purple-600/20 to-blue-600/20 blur-2xl -z-10"
                  animate={{
                      opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                      duration: 3,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                  }}
              />
            </span>
                    </h1>

                    <p className="text-xl sm:text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto leading-relaxed text-balance font-medium">
                        The ultimate platform bridging the gap between talented students and innovative businesses.{" "}
                        <span className="text-foreground font-semibold">Manage internships</span>,{" "}
                        <span className="text-foreground font-semibold">showcase portfolios</span>, and{" "}
                        <span className="text-foreground font-semibold">celebrate achievements</span>—all in one place.
                    </p>
                </motion.div>

                {/* Auth Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.4 }}
                    className="flex flex-col sm:flex-row gap-6 justify-center items-center py-8"
                >
                    <SignedOut>
                        <SignUpButton forceRedirectUrl="/redirect-after-signin">
                            <Button
                                size="lg"
                                className="group relative overflow-hidden rounded-full px-10 py-7 text-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 min-w-[240px] bg-gradient-to-r from-purple-600 via-blue-600 to-purple-600 hover:from-purple-500 hover:via-blue-500 hover:to-purple-500 text-white border-0 shadow-2xl shadow-purple-500/50"
                            >
                            <span className="relative flex items-center gap-3">
                              Get Started Free
                              <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
                            </span>
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                            </Button>
                        </SignUpButton>

                        <SignInButton forceRedirectUrl="/redirect-after-signin">
                            <Button
                                size="lg"
                                variant="outline"
                                className="group relative overflow-hidden rounded-full px-10 py-7 text-xl font-bold transition-all duration-300 hover:scale-105 active:scale-95 min-w-[240px] border-2 border-purple-500/40 hover:border-purple-500/80 bg-background/80 backdrop-blur-md shadow-xl"
                            >
                            <span className="relative flex items-center gap-3 bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                              Sign In
                            </span>
                            </Button>
                        </SignInButton>
                    </SignedOut>

                    <SignedIn>
                        <div className="flex items-center gap-6 px-8 py-4 rounded-full bg-card/50 backdrop-blur-md border-2 border-purple-500/30 shadow-xl">
                            <UserButton
                                appearance={{
                                    elements: {
                                        userButtonAvatarBox:
                                            "w-14 h-14 ring-2 ring-purple-500/50 ring-offset-4 ring-offset-background transition-all duration-300 hover:ring-purple-400",
                                        userButtonPopoverCard: "bg-card backdrop-blur-sm border border-border shadow-2xl",
                                        userButtonPopoverActionButton: "hover:bg-accent transition-colors",
                                    },
                                }}
                            />
                            <span className="text-xl font-semibold">Welcome back!</span>
                        </div>
                    </SignedIn>
                </motion.div>

                {/* Stats */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.8, delay: 0.6 }}
                    className="flex flex-wrap items-center justify-center gap-12 pt-12 text-base text-muted-foreground"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50" />
                        <span className="font-medium">Live Platform</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-400" />
                        <span className="font-medium">10,000+ Students</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5 text-blue-400" />
                        <span className="font-medium">500+ Companies</span>
                    </div>
                </motion.div>
            </div>

            {/* Scroll indicator */}
            <motion.div
                className="absolute bottom-16 left-1/2 -translate-x-1/2 cursor-pointer"
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
            >
                <div className="flex flex-col items-center gap-2">
                    <span className="text-sm text-muted-foreground font-medium">Scroll to explore</span>
                    <div className="w-8 h-12 border-2 border-purple-500/40 rounded-full flex items-start justify-center p-2">
                        <motion.div
                            className="w-2 h-2 bg-gradient-to-b from-purple-500 to-blue-500 rounded-full"
                            animate={{ y: [0, 20, 0] }}
                            transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY }}
                        />
                    </div>
                </div>
            </motion.div>
        </section>
    )
}

function FeaturesOverview() {
    const features = [
        {
            icon: <Target className="w-8 h-8" />,
            title: "Smart Matching",
            description:
                "AI-powered algorithm connects you with the perfect internship opportunities based on your skills and interests.",
            gradient: "from-purple-600 to-blue-600",
        },
        {
            icon: <Zap className="w-8 h-8" />,
            title: "Instant Applications",
            description: "Apply to multiple positions with one click. Your portfolio and credentials are always ready to go.",
            gradient: "from-blue-600 to-cyan-600",
        },
        {
            icon: <Shield className="w-8 h-8" />,
            title: "Verified Companies",
            description:
                "All partner companies are thoroughly vetted to ensure legitimate opportunities and safe experiences.",
            gradient: "from-cyan-600 to-purple-600",
        },
        {
            icon: <TrendingUp className="w-8 h-8" />,
            title: "Career Growth",
            description:
                "Track your progress, gain insights, and watch your professional journey unfold with detailed analytics.",
            gradient: "from-purple-600 to-pink-600",
        },
    ]

    return (
        <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-6 mb-20"
                >
                    <h2 className="text-5xl sm:text-6xl font-bold">
                        Why Choose{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              LynkSkill
            </span>
                        ?
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
                        We&apos;ve built the most comprehensive platform for student-business connections, packed with features designed
                        to accelerate your career.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="group relative p-8 rounded-3xl bg-card border-2 border-border hover:border-purple-500/50 transition-all duration-300 shadow-lg hover:shadow-2xl hover:shadow-purple-500/20"
                        >
                            {/* Gradient background on hover */}
                            <div
                                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}
                            />

                            <div className="relative space-y-4">
                                <div
                                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${feature.gradient} text-white shadow-lg`}
                                >
                                    {feature.icon}
                                </div>
                                <h3 className="text-2xl font-bold">{feature.title}</h3>
                                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function HowItWorks() {
    const steps = [
        {
            number: "01",
            title: "Create Your Profile",
            description:
                "Sign up in seconds and build your professional profile. Add your skills, education, projects, and what you're looking for.",
            icon: <Users className="w-10 h-10" />,
        },
        {
            number: "02",
            title: "Discover Opportunities",
            description:
                "Browse through curated internships from verified companies. Our smart matching system shows you the best fits first.",
            icon: <Target className="w-10 h-10" />,
        },
        {
            number: "03",
            title: "Apply & Connect",
            description:
                "Apply with one click using your LynkSkill portfolio. Chat directly with employers and schedule interviews seamlessly.",
            icon: <MessageSquare className="w-10 h-10" />,
        },
        {
            number: "04",
            title: "Grow Your Career",
            description:
                "Land your dream internship, share your experiences, and build a portfolio that opens doors to future opportunities.",
            icon: <Trophy className="w-10 h-10" />,
        },
    ]

    return (
        <section className="relative py-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-6 mb-20"
                >
                    <h2 className="text-5xl sm:text-6xl font-bold">
                        How It{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Works</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
                        Getting started with LynkSkill is simple. Follow these four steps to launch your career journey.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {steps.map((step, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.15 }}
                            className="relative h-full" // Added h-full here
                        >
                            {/* Connecting line */}
                            {index < steps.length - 1 && (
                                <div className="hidden lg:block absolute top-20 left-full w-full h-0.5 bg-gradient-to-r from-purple-500/50 to-blue-500/50 -translate-x-4" />
                            )}

                            <div className="relative p-8 rounded-3xl bg-card border-2 border-border hover:border-purple-500/50 transition-all duration-300 space-y-6 group hover:shadow-2xl hover:shadow-purple-500/10 h-full flex flex-col"> {/* Added h-full and flex flex-col */}
                                {/* Step number */}
                                <div className="flex items-center justify-between">
                                <span className="text-6xl font-bold bg-gradient-to-br from-purple-400 to-blue-400 bg-clip-text text-transparent opacity-50">
                                    {step.number}
                                </span>
                                    <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                        {step.icon}
                                    </div>
                                </div>

                                <div className="space-y-3 flex-grow"> {/* Added flex-grow */}
                                    <h3 className="text-2xl font-bold">{step.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function StatsSection() {
    const stats = [
        { value: "10,000+", label: "Active Students", icon: <Users className="w-8 h-8" /> },
        { value: "500+", label: "Partner Companies", icon: <Briefcase className="w-8 h-8" /> },
        { value: "15,000+", label: "Internships Posted", icon: <FileText className="w-8 h-8" /> },
        { value: "95%", label: "Success Rate", icon: <Trophy className="w-8 h-8" /> },
    ]

    return (
        <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-6 mb-20"
                >
                    <h2 className="text-5xl sm:text-6xl font-bold">
                        Trusted by{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Thousands
            </span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
                        Join a thriving community of students and businesses building the future together.
                    </p>
                </motion.div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {stats.map((stat, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            className="relative p-8 rounded-3xl bg-card border-2 border-border hover:border-purple-500/50 transition-all duration-300 text-center space-y-4 group hover:shadow-2xl hover:shadow-purple-500/10"
                        >
                            <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-blue-600 text-white shadow-lg group-hover:scale-110 transition-transform duration-300">
                                {stat.icon}
                            </div>
                            <div className="space-y-2">
                                <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                                    {stat.value}
                                </div>
                                <div className="text-lg text-muted-foreground font-medium">{stat.label}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function TestimonialsSection() {
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

    return (
        <section className="relative py-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-6 mb-20"
                >
                    <h2 className="text-5xl sm:text-6xl font-bold">
                        What Students{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Say</span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
                        Don&apos;t just take our word for it. Here&apos;s what our community has to say about their experience.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {testimonials.map((testimonial, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 30 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="relative p-8 rounded-3xl bg-card border-2 border-border hover:border-purple-500/50 transition-all duration-300 space-y-6 shadow-lg hover:shadow-2xl hover:shadow-purple-500/10"
                        >
                            {/* Rating stars */}
                            <div className="flex gap-1">
                                {[...Array(testimonial.rating)].map((_, i) => (
                                    <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                                ))}
                            </div>

                            {/* Content */}
                            <p className="text-lg text-foreground leading-relaxed italic">&quot;{testimonial.content}&quot;</p>

                            {/* Author */}
                            <div className="flex items-center gap-4 pt-4 border-t border-border">
                                <Image
                                    src={testimonial.avatar || "/placeholder.svg"}
                                    alt={testimonial.name}
                                    width={60}
                                    height={60}
                                    className="rounded-full ring-2 ring-purple-500/30"
                                />
                                <div>
                                    <div className="font-bold text-lg">{testimonial.name}</div>
                                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                                    <div className="text-sm text-purple-400">{testimonial.company}</div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

function FAQSection() {
    const faqs = [
        {
            question: "Is LynkSkill free for students?",
            answer:
                "Yes! LynkSkill is completely free for students. We believe in making career opportunities accessible to everyone.",
        },
        {
            question: "How do I create a portfolio?",
            answer:
                "Once you sign up, you'll have access to our portfolio builder. Simply add your projects, skills, and experiences using our intuitive interface.",
        },
        {
            question: "Are all companies verified?",
            answer:
                "Absolutely. We thoroughly vet every company on our platform to ensure they're legitimate and provide quality internship experiences.",
        },
        {
            question: "Can I apply to multiple internships?",
            answer:
                "Yes! You can apply to as many internships as you'd like. Our one-click application system makes it quick and easy.",
        },
        {
            question: "How does the matching algorithm work?",
            answer:
                "Our AI analyzes your skills, interests, and career goals to recommend internships that are the best fit for you.",
        },
        {
            question: "Can I share my achievements?",
            answer:
                "Yes! The Experience Hub lets you post your achievements, milestones, and experiences to inspire others and build your professional story.",
        },
    ]

    return (
        <section className="relative py-32 px-4 sm:px-6 lg:px-8 bg-muted/30">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-6 mb-20"
                >
                    <h2 className="text-5xl sm:text-6xl font-bold">
                        Frequently Asked{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Questions
            </span>
                    </h2>
                    <p className="text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
                        Got questions? We&apos;ve got answers. Here are some of the most common questions we receive.
                    </p>
                </motion.div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className="p-8 rounded-2xl bg-card border-2 border-border hover:border-purple-500/50 transition-all duration-300 space-y-3 shadow-lg hover:shadow-xl"
                        >
                            <div className="flex items-start gap-4">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                                    <CheckCircle2 className="w-5 h-5" />
                                </div>
                                <div className="space-y-2 flex-1">
                                    <h3 className="text-xl font-bold">{faq.question}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}

interface ServiceCardProps {
    icon: React.ReactNode
    title: string
    description: string
    features: string[]
    linkyPosition: "left" | "right"
    gradient: string
}

function ServiceCard({ icon, title, description, features, linkyPosition, gradient }: ServiceCardProps) {
    const cardRef = useRef<HTMLDivElement>(null)

    return (
        <motion.div
            ref={cardRef}
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
            className={`grid grid-cols-1 lg:grid-cols-2 gap-12 items-center ${
                linkyPosition === "left" ? "lg:flex-row-reverse" : ""
            }`}
        >
            {/* Linky Image */}
            <motion.div
                className={`relative ${linkyPosition === "left" ? "lg:order-1" : "lg:order-2"}`}
                initial={{ opacity: 0, x: linkyPosition === "right" ? 100 : -100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.2 }}
            >
                <div className="relative w-full max-w-md mx-auto aspect-square">
                    {/* Glow effect */}
                    <motion.div
                        className={`absolute inset-0 bg-gradient-to-r ${gradient} opacity-20 blur-3xl rounded-full`}
                        animate={{
                            scale: [1, 1.1, 1],
                            opacity: [0.2, 0.3, 0.2],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />

                    {/* Linky mascot */}
                    <motion.div
                        className="relative z-10"
                        animate={{
                            y: [0, -20, 0],
                            rotate: [0, 5, 0, -5, 0],
                        }}
                        transition={{
                            duration: 6,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    >
                        <Image
                            src="/linky-mascot.png"
                            alt="Linky mascot"
                            width={400}
                            height={400}
                            className="w-full h-auto drop-shadow-2xl"
                        />
                    </motion.div>

                    {/* Floating particles */}
                    <motion.div
                        className="absolute top-1/4 left-1/4 w-3 h-3 bg-purple-400 rounded-full"
                        animate={{
                            y: [0, -30, 0],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                        }}
                    />
                    <motion.div
                        className="absolute bottom-1/3 right-1/4 w-2 h-2 bg-blue-400 rounded-full"
                        animate={{
                            y: [0, 30, 0],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 4,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "easeInOut",
                            delay: 1,
                        }}
                    />
                </div>
            </motion.div>

            {/* Content */}
            <motion.div
                className={`space-y-6 ${linkyPosition === "left" ? "lg:order-2" : "lg:order-1"}`}
                initial={{ opacity: 0, x: linkyPosition === "right" ? -100 : 100 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, delay: 0.3 }}
            >
                {/* Icon */}
                <motion.div
                    className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${gradient}`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: "spring", stiffness: 300 }}
                >
                    <div className="text-white">{icon}</div>
                </motion.div>

                {/* Title */}
                <h3 className="text-3xl sm:text-4xl font-bold text-balance">{title}</h3>

                {/* Description */}
                <p className="text-lg text-muted-foreground leading-relaxed text-pretty">{description}</p>

                {/* Features */}
                <ul className="space-y-3">
                    {features.map((feature, index) => (
                        <motion.li
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: 0.4 + index * 0.1 }}
                            className="flex items-start gap-3"
                        >
                            <div className={`mt-1 w-1.5 h-1.5 rounded-full bg-gradient-to-r ${gradient} flex-shrink-0`} />
                            <span className="text-foreground">{feature}</span>
                        </motion.li>
                    ))}
                </ul>

                {/* CTA */}
                <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                        variant="outline"
                        className={`group mt-4 border-2 hover:border-transparent bg-gradient-to-r ${gradient} bg-clip-text text-transparent hover:text-white hover:bg-gradient-to-r hover:${gradient} transition-all duration-300`}
                    >
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </motion.div>
            </motion.div>
        </motion.div>
    )
}
