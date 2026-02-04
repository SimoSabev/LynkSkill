"use client"

import { motion } from "framer-motion"
import { 
    GraduationCap, ArrowLeft, User, Briefcase, FileText, 
    Search, Star, Send, MessageCircle, Calendar, Award,
    Sparkles, CheckCircle, BookOpen, Target, Lightbulb,
    TrendingUp, Clock, Bell, Heart
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const guideSteps = [
    {
        step: 1,
        title: "Create Your Account",
        icon: User,
        description: "Sign up for LynkSkill using your email or social accounts. Complete the onboarding process to set up your student profile.",
        tips: [
            "Use a professional email address",
            "Add a clear profile photo",
            "Fill in your basic information accurately",
            "Choose your preferred language"
        ]
    },
    {
        step: 2,
        title: "Build Your Portfolio",
        icon: FileText,
        description: "Create a compelling portfolio that showcases your skills, projects, and experience to potential employers.",
        tips: [
            "Add a catchy headline that describes you",
            "Write a compelling bio (2-3 paragraphs)",
            "List your technical and soft skills",
            "Add your education details with dates",
            "Include links to your LinkedIn, GitHub, and portfolio website",
            "Use AI Mode for personalized portfolio building assistance"
        ]
    },
    {
        step: 3,
        title: "Discover Internships",
        icon: Search,
        description: "Browse through available internship opportunities and find the perfect match for your skills and interests.",
        tips: [
            "Use filters to narrow down by location, industry, or skills",
            "Read internship descriptions carefully",
            "Check the requirements and qualifications",
            "Note the application deadlines",
            "Save interesting internships for later review"
        ]
    },
    {
        step: 4,
        title: "Apply to Internships",
        icon: Send,
        description: "Submit applications to internships that match your profile. Your portfolio will be shared with the company.",
        tips: [
            "Make sure your portfolio is complete before applying",
            "Apply to multiple internships to increase chances",
            "Some internships may require completing an assignment",
            "Track your applications in the 'Applied' section"
        ]
    },
    {
        step: 5,
        title: "Complete Assignments",
        icon: Target,
        description: "Some companies require test assignments to evaluate your skills. Complete them on time to stand out.",
        tips: [
            "Read assignment requirements carefully",
            "Submit before the deadline",
            "Follow the submission guidelines",
            "Upload all required files",
            "Double-check your work before submitting"
        ]
    },
    {
        step: 6,
        title: "Prepare for Interviews",
        icon: Calendar,
        description: "If your application is approved, you may be invited for an interview. Prepare well and be professional.",
        tips: [
            "Check your messages regularly for interview invitations",
            "Research the company beforehand",
            "Prepare answers to common interview questions",
            "Be punctual for scheduled interviews",
            "Follow up with a thank you message"
        ]
    },
    {
        step: 7,
        title: "Accept Offers",
        icon: Award,
        description: "When your application is approved, you can accept the internship offer and begin your journey.",
        tips: [
            "Review the internship details before accepting",
            "Accept offers promptly",
            "Communicate any questions to the company",
            "Prepare for your first day"
        ]
    },
    {
        step: 8,
        title: "Track Your Progress",
        icon: TrendingUp,
        description: "Monitor your internship experience, complete projects, and build your professional profile.",
        tips: [
            "Document your experiences in the Experience section",
            "Complete assigned projects on time",
            "Collect feedback and reviews",
            "Update your portfolio with new skills learned"
        ]
    }
]

const features = [
    {
        icon: Sparkles,
        title: "AI-Powered Portfolio Audit",
        description: "Get intelligent feedback and suggestions to improve your portfolio using our AI assistant."
    },
    {
        icon: Heart,
        title: "Save Internships",
        description: "Bookmark interesting internships to review and apply later."
    },
    {
        icon: MessageCircle,
        title: "Direct Messaging",
        description: "Communicate directly with companies through our messaging system."
    },
    {
        icon: Bell,
        title: "Notifications",
        description: "Stay updated with application status changes and new opportunities."
    },
    {
        icon: Award,
        title: "Leaderboard",
        description: "See how you rank among other students and track your progress."
    },
    {
        icon: Clock,
        title: "Experience Tracking",
        description: "Document and showcase your internship experiences for future opportunities."
    }
]

export default function StudentGuidePage() {
    return (
        <div className="space-y-8 p-4 md:p-6 lg:p-8">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-8 md:p-12 backdrop-blur-sm shadow-xl bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-fuchsia-500/5 border border-violet-500/20"
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-fuchsia-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                    <Link href="/dashboard/company/help">
                        <Button variant="ghost" className="mb-6 -ml-2 text-muted-foreground hover:text-foreground">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Back to Help
                        </Button>
                    </Link>
                    
                    <div className="flex items-center gap-4 mb-4">
                        <div className="p-4 rounded-2xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20">
                            <GraduationCap className="h-10 w-10 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold">Student Guide</h1>
                            <p className="text-muted-foreground text-lg">Your complete guide to finding and landing internships</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Introduction */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
            >
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpen className="h-5 w-5 text-violet-500" />
                            Welcome to LynkSkill
                        </CardTitle>
                        <CardDescription>
                            LynkSkill is your gateway to finding the perfect internship opportunities
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                        <p className="text-muted-foreground leading-relaxed">
                            LynkSkill connects talented students with companies looking for interns. 
                            Whether you&apos;re just starting your career journey or looking for your next opportunity, 
                            our platform helps you showcase your skills, discover opportunities, and connect with employers.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Follow this guide to make the most of your LynkSkill experience and land your dream internship.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Step by Step Guide */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Lightbulb className="h-6 w-6 text-violet-500" />
                    Step-by-Step Guide
                </h2>
                
                <div className="space-y-6">
                    {guideSteps.map((step, index) => (
                        <motion.div
                            key={step.step}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * index }}
                        >
                            <Card className="relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-violet-500 to-fuchsia-500" />
                                <CardHeader className="pb-2">
                                    <div className="flex items-start gap-4">
                                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 flex items-center justify-center">
                                            <span className="text-xl font-bold text-violet-600 dark:text-violet-400">{step.step}</span>
                                        </div>
                                        <div className="flex-1">
                                            <CardTitle className="flex items-center gap-2 text-xl">
                                                <step.icon className="h-5 w-5 text-violet-500" />
                                                {step.title}
                                            </CardTitle>
                                            <CardDescription className="mt-1">
                                                {step.description}
                                            </CardDescription>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="pl-20">
                                    <ul className="space-y-2">
                                        {step.tips.map((tip, tipIndex) => (
                                            <li key={tipIndex} className="flex items-start gap-2 text-sm text-muted-foreground">
                                                <CheckCircle className="h-4 w-4 text-violet-500 mt-0.5 flex-shrink-0" />
                                                {tip}
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Features */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
            >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Star className="h-6 w-6 text-violet-500" />
                    Platform Features
                </h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * index }}
                        >
                            <Card className="h-full hover:border-violet-500/30 transition-colors">
                                <CardHeader className="pb-2">
                                    <div className="p-2 rounded-xl bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 w-fit mb-2">
                                        <feature.icon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                                    </div>
                                    <CardTitle className="text-base">{feature.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
            </motion.div>

            {/* Pro Tips */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-violet-500" />
                            Pro Tips for Success
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Keep Your Portfolio Updated</p>
                                        <p className="text-sm text-muted-foreground">Regularly update your skills, projects, and experience to stay competitive.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Use AI Mode</p>
                                        <p className="text-sm text-muted-foreground">Our AI assistant can help you build your portfolio and find matching internships.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Be Responsive</p>
                                        <p className="text-sm text-muted-foreground">Check your notifications and messages regularly to not miss important updates.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Apply Strategically</p>
                                        <p className="text-sm text-muted-foreground">Focus on internships that match your skills and career goals.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Complete Assignments Promptly</p>
                                        <p className="text-sm text-muted-foreground">Submit test assignments on time to show your commitment and reliability.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Build Your Network</p>
                                        <p className="text-sm text-muted-foreground">Connect with companies and other students to expand your opportunities.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Need More Help */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="text-center py-8"
            >
                <h3 className="text-xl font-semibold mb-2">Need More Help?</h3>
                <p className="text-muted-foreground mb-4">
                    Can&apos;t find what you&apos;re looking for? Our support team is here to help.
                </p>
                <Link href="/dashboard/company/help">
                    <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contact Support
                    </Button>
                </Link>
            </motion.div>
        </div>
    )
}
