"use client"

import { motion } from "framer-motion"
import { 
    Building2, ArrowLeft, Users, Briefcase, FileText, 
    Search, Star, Send, MessageCircle, Calendar, Award,
    Sparkles, CheckCircle, BookOpen, Target, Lightbulb,
    TrendingUp, Settings, Bell, Shield, UserPlus, Eye,
    ClipboardCheck, BarChart3
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

const guideSteps = [
    {
        step: 1,
        title: "Create Your Company Profile",
        icon: Building2,
        description: "Set up your company profile with all the essential information that candidates will see.",
        tips: [
            "Add your company name and logo",
            "Provide a clear company description",
            "Enter your company EIK (Bulgarian companies)",
            "Add your company website and social links",
            "Set up your company location"
        ]
    },
    {
        step: 2,
        title: "Build Your Team",
        icon: Users,
        description: "Invite team members to help manage internships, applications, and candidates.",
        tips: [
            "Invite HR managers and recruiters",
            "Assign appropriate roles (Admin, HR Manager, HR Recruiter, Viewer)",
            "Set permissions based on responsibilities",
            "Team members receive email invitations to join",
            "Manage team from the Team section in your dashboard"
        ]
    },
    {
        step: 3,
        title: "Create Internship Listings",
        icon: Briefcase,
        description: "Post internship opportunities to attract talented students to your company.",
        tips: [
            "Write clear and descriptive titles",
            "Provide detailed job descriptions",
            "List required qualifications and skills",
            "Specify location (remote, hybrid, or on-site)",
            "Set application deadlines",
            "Indicate if the internship is paid",
            "Optionally add a test assignment"
        ]
    },
    {
        step: 4,
        title: "Add Test Assignments (Optional)",
        icon: ClipboardCheck,
        description: "Create assignments to evaluate candidates' skills before making hiring decisions.",
        tips: [
            "Design assignments relevant to the internship role",
            "Set clear instructions and requirements",
            "Specify submission deadlines",
            "Assignments help filter serious candidates",
            "Review submissions in the Applications section"
        ]
    },
    {
        step: 5,
        title: "Review Applications",
        icon: FileText,
        description: "Browse through student applications and review their portfolios.",
        tips: [
            "Access applications from your dashboard",
            "View candidate portfolios and qualifications",
            "Check completed test assignments if required",
            "Use filters to sort and organize applications",
            "Take notes on promising candidates"
        ]
    },
    {
        step: 6,
        title: "Discover Candidates",
        icon: Search,
        description: "Proactively search for talented students who match your requirements.",
        tips: [
            "Use the Candidates section to browse students",
            "Filter by skills, experience, and interests",
            "View student portfolios directly",
            "Use AI Mode to find perfect matches",
            "Contact promising candidates directly"
        ]
    },
    {
        step: 7,
        title: "Schedule Interviews",
        icon: Calendar,
        description: "Set up interviews with promising candidates to get to know them better.",
        tips: [
            "Schedule interviews through the platform",
            "Candidates receive notifications about interviews",
            "Track interview status and history",
            "Prepare interview questions in advance",
            "Provide feedback after interviews"
        ]
    },
    {
        step: 8,
        title: "Approve or Reject Applications",
        icon: CheckCircle,
        description: "Make decisions on applications and notify candidates of their status.",
        tips: [
            "Approve candidates who meet your requirements",
            "Candidates can accept your offer",
            "Rejected candidates receive notifications",
            "Provide constructive feedback when possible",
            "Manage all statuses from the Applications section"
        ]
    },
    {
        step: 9,
        title: "Communicate with Candidates",
        icon: MessageCircle,
        description: "Use the messaging system to communicate with candidates throughout the process.",
        tips: [
            "Send messages directly to candidates",
            "Discuss details about the internship",
            "Answer candidate questions",
            "Keep all communication organized",
            "Track conversation history"
        ]
    },
    {
        step: 10,
        title: "Manage Interns",
        icon: Award,
        description: "Once candidates accept offers, manage their internship experience.",
        tips: [
            "Track intern progress and projects",
            "Assign tasks and assignments",
            "Provide feedback and reviews",
            "Verify and grade submitted experiences",
            "Build long-term relationships with talented interns"
        ]
    }
]

const features = [
    {
        icon: Sparkles,
        title: "AI-Powered Candidate Matching",
        description: "Use our AI assistant to find candidates that best match your internship requirements."
    },
    {
        icon: Users,
        title: "Team Management",
        description: "Invite team members with different roles and permissions to collaborate on hiring."
    },
    {
        icon: ClipboardCheck,
        title: "Assignment System",
        description: "Create test assignments to evaluate candidates before making hiring decisions."
    },
    {
        icon: MessageCircle,
        title: "Direct Messaging",
        description: "Communicate directly with candidates through our built-in messaging system."
    },
    {
        icon: BarChart3,
        title: "Application Analytics",
        description: "Track application statistics and monitor your internship performance."
    },
    {
        icon: Bell,
        title: "Real-time Notifications",
        description: "Get notified when students apply, submit assignments, or accept offers."
    }
]

const roles = [
    {
        title: "Owner",
        description: "Full access to all company settings, can transfer ownership",
        color: "from-purple-500 to-indigo-500"
    },
    {
        title: "Admin",
        description: "Full access except company deletion and ownership transfer",
        color: "from-blue-500 to-cyan-500"
    },
    {
        title: "HR Manager",
        description: "Manage internships, applications, interviews, and team members",
        color: "from-green-500 to-emerald-500"
    },
    {
        title: "HR Recruiter",
        description: "View candidates, manage applications, and schedule interviews",
        color: "from-orange-500 to-amber-500"
    },
    {
        title: "Viewer",
        description: "Read-only access to view candidates, messages, and analytics",
        color: "from-gray-500 to-slate-500"
    }
]

export default function CompanyGuidePage() {
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
                            <Building2 className="h-10 w-10 text-violet-600 dark:text-violet-400" />
                        </div>
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold">Company Guide</h1>
                            <p className="text-muted-foreground text-lg">Your complete guide to finding and hiring interns</p>
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
                            Welcome to LynkSkill for Companies
                        </CardTitle>
                        <CardDescription>
                            Find and hire talented interns to grow your team
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="prose dark:prose-invert max-w-none">
                        <p className="text-muted-foreground leading-relaxed">
                            LynkSkill provides a powerful platform for companies to discover, evaluate, and hire talented students for internship positions. 
                            Our comprehensive tools help you manage the entire hiring process from posting internships to onboarding interns.
                        </p>
                        <p className="text-muted-foreground leading-relaxed">
                            Follow this guide to set up your company profile and start finding the perfect candidates for your team.
                        </p>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Team Roles */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                    <Shield className="h-6 w-6 text-violet-500" />
                    Team Roles & Permissions
                </h2>
                
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {roles.map((role, index) => (
                        <motion.div
                            key={role.title}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.05 * index }}
                        >
                            <Card className="h-full">
                                <CardHeader className="pb-2">
                                    <div className={`h-2 w-16 rounded-full bg-gradient-to-r ${role.color} mb-2`} />
                                    <CardTitle className="text-base">{role.title}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{role.description}</p>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ))}
                </div>
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
                            transition={{ delay: 0.05 * index }}
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

            {/* Best Practices */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
            >
                <Card className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-violet-500" />
                            Best Practices for Hiring Interns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-2">
                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Write Clear Job Descriptions</p>
                                        <p className="text-sm text-muted-foreground">Be specific about responsibilities, requirements, and expectations.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Respond Promptly</p>
                                        <p className="text-sm text-muted-foreground">Quick responses show candidates you value their interest in your company.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Provide Constructive Feedback</p>
                                        <p className="text-sm text-muted-foreground">Even rejected candidates appreciate knowing how they can improve.</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Use Test Assignments Wisely</p>
                                        <p className="text-sm text-muted-foreground">Create relevant assignments that reflect actual job responsibilities.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Leverage AI Matching</p>
                                        <p className="text-sm text-muted-foreground">Use AI Mode to find candidates that best match your requirements.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-2">
                                    <CheckCircle className="h-5 w-5 text-violet-500 mt-0.5" />
                                    <div>
                                        <p className="font-medium">Build Your Employer Brand</p>
                                        <p className="text-sm text-muted-foreground">Keep your company profile updated with a compelling description and logo.</p>
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
                    Our support team is ready to assist you with any questions.
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
