"use client"

import type React from "react"

import {motion} from "framer-motion"
import {Briefcase, FileText, Trophy, Sparkles, ArrowRight, Users, Handshake} from "lucide-react"
import Image from "next/image"

interface ServiceData {
    id: string
    icon: React.ReactNode
    title: string
    subtitle: string
    description: string
    features: string[]
    gradient: string
    color: string
    businessBenefit: string
    studentBenefit: string
    mascotImage: string
}

const servicesData: ServiceData[] = [
    {
        id: "internship",
        icon: <Briefcase className="w-8 h-8 md:w-10 md:h-10"/>,
        title: "Smart Internship Matching",
        subtitle: "AI-Powered Student-Business Connection",
        description:
            "Revolutionary matching system that connects ambitious students with businesses seeking fresh talent. Our advanced AI analyzes skills, interests, and company culture to create perfect matches that benefit both parties.",
        features: [
            "AI-powered compatibility matching",
            "Real-time opportunity notifications",
            "One-click application system",
            "Direct employer communication",
            "Progress tracking & analytics",
        ],
        gradient: "from-purple-600 via-blue-600 to-purple-600",
        color: "purple",
        businessBenefit: "Access to pre-screened, motivated young talent",
        studentBenefit: "Find internships that match your career goals",
        mascotImage: "/linky-mascot-boss.png",
    },
    {
        id: "portfolio",
        icon: <FileText className="w-8 h-8 md:w-10 md:h-10"/>,
        title: "Dynamic Portfolio Showcase",
        subtitle: "Showcase Your Potential to the World",
        description:
            "Create stunning, interactive portfolios that tell your story. Our platform helps businesses discover your unique talents through intelligent filtering and presentation that goes beyond traditional resumes.",
        features: [
            "Interactive project galleries",
            "Skill-based categorization",
            "Media-rich presentations",
            "SEO-optimized visibility",
            "Real-time portfolio analytics",
        ],
        gradient: "from-blue-600 via-cyan-600 to-blue-600",
        color: "blue",
        businessBenefit: "Discover talent through comprehensive portfolios",
        studentBenefit: "Stand out with professional presentation",
        mascotImage: "/linky-mascot.png",
    },
    {
        id: "experience",
        icon: <Trophy className="w-8 h-8 md:w-10 md:h-10"/>,
        title: "Experience & Growth Hub",
        subtitle: "Build Your Professional Journey Together",
        description:
            "A collaborative space where students share achievements and businesses recognize potential. This creates a community-driven ecosystem that celebrates growth and builds lasting professional relationships.",
        features: [
            "Achievement sharing & recognition",
            "Professional milestone tracking",
            "Peer networking opportunities",
            "Employer feedback system",
            "Career progression insights",
        ],
        gradient: "from-cyan-600 via-purple-600 to-cyan-600",
        color: "cyan",
        businessBenefit: "Identify high-potential candidates early",
        studentBenefit: "Build a professional reputation and network",
        mascotImage: "/linky-mascot.png",
    },
]

export function ServicesSection() {
    return (
        <section className="relative py-20 md:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
            {/* Enhanced Background */}
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-900/5 via-blue-900/5 to-cyan-900/5"/>

                {/* Animated Grid Pattern */}
                <div className="absolute inset-0">
                    <div
                        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:50px_50px] opacity-20"/>
                    <motion.div
                        className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:25px_25px] opacity-40"
                        animate={{
                            backgroundPosition: ["0px 0px", "50px 50px"],
                        }}
                        transition={{
                            duration: 20,
                            repeat: Number.POSITIVE_INFINITY,
                            ease: "linear",
                        }}
                    />
                </div>

                {/* Floating Gradient Orbs */}
                <motion.div
                    className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl bg-gradient-to-r from-purple-600 to-blue-600"
                    animate={{
                        x: [0, 50, 0],
                        y: [0, -30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{duration: 20, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut"}}
                />
                <motion.div
                    className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-10 blur-3xl bg-gradient-to-r from-blue-600 to-cyan-600"
                    animate={{
                        x: [0, -50, 0],
                        y: [0, 30, 0],
                        scale: [1, 1.1, 1],
                    }}
                    transition={{duration: 25, repeat: Number.POSITIVE_INFINITY, ease: "easeInOut"}}
                />

                {/* Floating Particles */}
                {[...Array(8)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full opacity-60"
                        style={{
                            left: `${Math.random() * 100}%`,
                            top: `${Math.random() * 100}%`,
                        }}
                        animate={{
                            y: [0, -20, 0],
                            opacity: [0.6, 1, 0.6],
                            scale: [1, 1.2, 1],
                        }}
                        transition={{
                            duration: 3 + Math.random() * 2,
                            repeat: Number.POSITIVE_INFINITY,
                            delay: Math.random() * 2,
                            ease: "easeInOut",
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                {/* Enhanced Header */}
                <motion.div
                    initial={{opacity: 0, y: 30}}
                    whileInView={{opacity: 1, y: 0}}
                    viewport={{once: true}}
                    transition={{duration: 0.8, ease: "easeOut"}}
                    className="text-center space-y-6 mb-16 md:mb-24"
                >
                    <motion.div
                        initial={{scale: 0.8, opacity: 0}}
                        whileInView={{scale: 1, opacity: 1}}
                        viewport={{once: true}}
                        transition={{duration: 0.6, delay: 0.2, ease: "easeOut"}}
                        className="inline-flex items-center gap-3 px-6 py-3 md:px-8 md:py-4 rounded-full border border-white/20 bg-white/5 backdrop-blur-xl"
                    >
                        <motion.div
                            animate={{rotate: [0, 360]}}
                            transition={{duration: 3, repeat: Number.POSITIVE_INFINITY, ease: "linear"}}
                        >
                            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-purple-400"/>
                        </motion.div>
                        <span
                            className="text-sm md:text-base font-semibold bg-gradient-to-r from-purple-300 via-blue-300 to-purple-300 bg-clip-text text-transparent">
              Revolutionary Student-Business Connection
            </span>
                    </motion.div>

                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight">
                        Meet{" "}
                        <motion.span
                            className="relative inline-block bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent"
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
                            Linky
                        </motion.span>
                    </h2>

                    <motion.p
                        className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed"
                        initial={{opacity: 0}}
                        whileInView={{opacity: 1}}
                        viewport={{once: true}}
                        transition={{duration: 0.8, delay: 0.4, ease: "easeOut"}}
                    >
                        Your AI-powered guide to the future of student-business connections!
                        <span className="text-foreground font-semibold">
              {" "}
                            Discover how I revolutionize the way young talent meets opportunity! ✨
            </span>
                    </motion.p>
                </motion.div>

                {/* Services Grid with Linky */}
                <div className="space-y-24 md:space-y-32">
                    {servicesData.map((service, index) => (
                        <motion.div
                            key={service.id}
                            initial={{opacity: 0, y: 60}}
                            whileInView={{opacity: 1, y: 0}}
                            viewport={{once: true, margin: "-100px"}}
                            transition={{duration: 0.8, delay: index * 0.2, ease: "easeOut"}}
                            className={`flex flex-col ${index % 2 === 0 ? "lg:flex-row" : "lg:flex-row-reverse"} gap-8 lg:gap-12 items-center`}
                        >
                            {/* Linky Mascot */}
                            <motion.div
                                className="w-full lg:w-5/12 flex justify-center"
                                initial={{opacity: 0, scale: 0.8}}
                                whileInView={{opacity: 1, scale: 1}}
                                viewport={{once: true}}
                                transition={{duration: 0.6, delay: index * 0.2 + 0.3, ease: "easeOut"}}
                            >
                                <motion.div
                                    className="relative w-72 h-72 md:w-96 md:h-96"
                                    animate={{
                                        y: [0, -12, 0],
                                    }}
                                    transition={{
                                        duration: 4,
                                        repeat: Number.POSITIVE_INFINITY,
                                        ease: "easeInOut",
                                    }}
                                    whileHover={{
                                        scale: 1.05,
                                        transition: {duration: 0.3},
                                    }}
                                >
                                    <Image
                                        src={service.mascotImage || "/placeholder.svg"}
                                        alt={`Linky mascot for ${service.title}`}
                                        width={384}
                                        height={384}
                                        className="w-full h-full object-contain drop-shadow-2xl"
                                        priority={index === 0}
                                    />

                                    {/* Glow effect */}
                                    <motion.div
                                        className={`absolute inset-0 rounded-full bg-gradient-to-r ${service.gradient} opacity-20 blur-3xl -z-10`}
                                        animate={{
                                            scale: [1, 1.2, 1],
                                            opacity: [0.2, 0.3, 0.2],
                                        }}
                                        transition={{
                                            duration: 4,
                                            repeat: Number.POSITIVE_INFINITY,
                                            ease: "easeInOut",
                                        }}
                                    />
                                </motion.div>
                            </motion.div>

                            {/* Service Content */}
                            <div className="w-full lg:w-7/12">
                                <motion.div
                                    className="relative p-8 md:p-10 lg:p-12 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 hover:border-white/20 transition-all duration-500 group"
                                    whileHover={{
                                        scale: 1.02,
                                        y: -8,
                                        transition: {duration: 0.3, ease: "easeOut"},
                                    }}
                                >
                                    <div className="space-y-6">
                                        {/* Service Icon */}
                                        <motion.div
                                            className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${service.gradient} shadow-lg`}
                                            whileHover={{
                                                scale: 1.1,
                                                rotate: [0, -5, 5, 0],
                                                transition: {duration: 0.5},
                                            }}
                                        >
                                            <div className="text-white">{service.icon}</div>
                                        </motion.div>

                                        {/* Service Title */}
                                        <h3 className="text-3xl md:text-4xl font-bold text-foreground group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-blue-400 group-hover:bg-clip-text transition-all duration-300">
                                            {service.title}
                                        </h3>

                                        {/* Service Subtitle */}
                                        <p
                                            className={`text-lg md:text-xl font-semibold bg-gradient-to-r ${service.gradient} bg-clip-text text-transparent`}
                                        >
                                            {service.subtitle}
                                        </p>

                                        {/* Service Description */}
                                        <p className="text-muted-foreground leading-relaxed text-base md:text-lg">{service.description}</p>

                                        {/* Benefits */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <motion.div
                                                className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all duration-300"
                                                whileHover={{scale: 1.05, transition: {duration: 0.2}}}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Users className="w-4 h-4 text-green-400"/>
                                                    <span
                                                        className="text-sm font-semibold text-green-400">For Students</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{service.studentBenefit}</p>
                                            </motion.div>
                                            <motion.div
                                                className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all duration-300"
                                                whileHover={{scale: 1.05, transition: {duration: 0.2}}}
                                            >
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Handshake className="w-4 h-4 text-blue-400"/>
                                                    <span
                                                        className="text-sm font-semibold text-blue-400">For Businesses</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{service.businessBenefit}</p>
                                            </motion.div>
                                        </div>

                                        {/* Features List */}
                                        <ul className="space-y-3">
                                            {service.features.map((feature, featureIndex) => (
                                                <motion.li
                                                    key={featureIndex}
                                                    className="flex items-start gap-3 group/item"
                                                    initial={{opacity: 0, x: -20}}
                                                    whileInView={{opacity: 1, x: 0}}
                                                    viewport={{once: true}}
                                                    transition={{
                                                        duration: 0.4,
                                                        delay: featureIndex * 0.1,
                                                        ease: "easeOut"
                                                    }}
                                                >
                                                    <motion.div
                                                        className={`mt-1 w-2 h-2 rounded-full bg-gradient-to-r ${service.gradient} flex-shrink-0`}
                                                        whileHover={{scale: 2, transition: {duration: 0.2}}}
                                                    />
                                                    <span
                                                        className="text-sm md:text-base text-foreground group-hover/item:text-purple-400 transition-colors duration-300">
                            {feature}
                          </span>
                                                </motion.li>
                                            ))}
                                        </ul>

                                        {/* CTA Button */}
                                        <div className="pt-4">
                                            <motion.button
                                                className={`group/btn relative overflow-hidden rounded-2xl px-6 py-3 bg-gradient-to-r ${service.gradient} text-white font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25`}
                                                whileHover={{scale: 1.05, transition: {duration: 0.2}}}
                                                whileTap={{scale: 0.95}}
                                            >
                                                <motion.div
                                                    className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"/>
                                                <span className="relative cursor-pointer flex items-center gap-2">
                                                  Learn More
                                                  <motion.div
                                                      animate={{x: [0, 4, 0]}}
                                                      transition={{
                                                          duration: 1.5,
                                                          repeat: Number.POSITIVE_INFINITY,
                                                          ease: "easeInOut"
                                                      }}
                                                  >
                                                    <ArrowRight className="w-4 h-4"/>
                                                  </motion.div>
                                                </span>
                                            </motion.button>
                                        </div>
                                    </div>

                                    {/* Gradient Overlay on Hover */}
                                    <motion.div
                                        className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${service.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500 pointer-events-none`}
                                    />
                                </motion.div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
