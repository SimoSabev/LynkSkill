"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
    HelpCircle, Search, Book, MessageCircle, FileQuestion,
    ChevronRight, ExternalLink, Mail, Phone,
    Sparkles, Rocket, Shield, Briefcase, Star,
    GraduationCap, Building2, Send
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { 
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import Link from "next/link"

const faqCategories = [
    {
        id: "getting-started",
        label: "Getting Started",
        icon: Rocket,
        questions: [
            {
                q: "How do I create my profile?",
                a: "After signing up, you'll be guided through an onboarding process. Fill in your personal information, add your skills, and upload a profile photo. You can always edit your profile later from the Settings page."
            },
            {
                q: "How do I find internships?",
                a: "Navigate to the 'Internships' section from the sidebar. You can browse all available internships, use filters to narrow down your search, and save interesting opportunities for later."
            },
            {
                q: "What is the AI Mode?",
                a: "AI Mode is our intelligent assistant that helps you build your portfolio and find matching internships. It analyzes your skills and preferences to provide personalized recommendations."
            },
        ]
    },
    {
        id: "applications",
        label: "Applications",
        icon: Briefcase,
        questions: [
            {
                q: "How do I apply for an internship?",
                a: "Click on any internship card to view details, then click 'Apply Now'. You may need to complete your portfolio first. Some internships may have additional requirements like assignments."
            },
            {
                q: "Can I withdraw my application?",
                a: "Yes, you can withdraw your application from the 'Applied' section as long as it hasn't been processed yet. Go to your applied internships and click the withdraw button."
            },
            {
                q: "How do I track my application status?",
                a: "All your applications are visible in the 'Applied' section. You'll see status indicators showing whether your application is pending, approved, or rejected."
            },
        ]
    },
    {
        id: "portfolio",
        label: "Portfolio",
        icon: Star,
        questions: [
            {
                q: "How do I build my portfolio?",
                a: "Go to the Portfolio section and add your projects, skills, education, and work experience. Use AI Mode for an interactive way to build your portfolio through conversation."
            },
            {
                q: "What should I include in my portfolio?",
                a: "Include your best projects, relevant skills, education background, and any work experience. Add descriptions, links, and media to showcase your abilities."
            },
            {
                q: "Can companies see my portfolio?",
                a: "Yes, when you apply for internships, companies can view your portfolio. You can control visibility settings in Privacy settings."
            },
        ]
    },
    {
        id: "companies",
        label: "For Companies",
        icon: Building2,
        questions: [
            {
                q: "How do I post an internship?",
                a: "From your company dashboard, go to 'Internships' > 'Create New'. Fill in the details, requirements, and publish your listing."
            },
            {
                q: "How do I find candidates?",
                a: "Use the 'Candidates' section to search for students. You can filter by skills, experience level, and other criteria. AI Mode can help find perfect matches."
            },
            {
                q: "How do I manage applications?",
                a: "All applications are available in the 'Applications' section. Review portfolios, send messages, and update application statuses from there."
            },
        ]
    },
    {
        id: "account",
        label: "Account & Security",
        icon: Shield,
        questions: [
            {
                q: "How do I change my password?",
                a: "Go to Settings > Profile > Change Password. You'll need to enter your current password and then your new password twice to confirm."
            },
            {
                q: "How do I enable two-factor authentication?",
                a: "Navigate to Settings > Privacy > Two-Factor Authentication. Follow the setup wizard to add an extra layer of security to your account."
            },
            {
                q: "How do I delete my account?",
                a: "Contact our support team to request account deletion. We'll process your request within 30 days and remove all your personal data."
            },
        ]
    },
]

const quickLinks = [
    { label: "Student Guide", href: "#", icon: GraduationCap },
    { label: "Company Guide", href: "#", icon: Building2 },
    { label: "Privacy Policy", href: "/privacy", icon: Shield },
    { label: "Terms of Service", href: "/terms", icon: FileQuestion },
]

export default function HelpPage() {
    const { t } = useTranslation()
    const [searchQuery, setSearchQuery] = useState("")
    const [selectedCategory, setSelectedCategory] = useState("getting-started")
    const [contactForm, setContactForm] = useState({ name: "", email: "", message: "" })
    const [isSending, setIsSending] = useState(false)

    const filteredFAQs = faqCategories.map(category => ({
        ...category,
        questions: category.questions.filter(
            q => 
                q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
                q.a.toLowerCase().includes(searchQuery.toLowerCase())
        )
    })).filter(category => category.questions.length > 0)

    const handleContactSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSending(true)
        
        // Simulate sending
        await new Promise(resolve => setTimeout(resolve, 1500))
        
        toast.success("Message sent!", {
            description: "We'll get back to you within 24 hours.",
        })
        
        setContactForm({ name: "", email: "", message: "" })
        setIsSending(false)
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl bg-gradient-to-br from-emerald-500/10 via-teal-500/10 to-cyan-500/5 border border-emerald-500/20"
            >
                <div className="absolute -top-24 -right-24 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
                
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-cyan-500/20">
                            <HelpCircle className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h1 className="text-2xl md:text-3xl font-bold">{t('navigation.help')}</h1>
                            <p className="text-muted-foreground">Find answers and get support</p>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="relative max-w-xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search for help..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-12 rounded-xl bg-background/50 border-border/50 focus:border-emerald-500/50"
                        />
                    </div>
                </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                {quickLinks.map((link) => (
                    <Link key={link.label} href={link.href}>
                        <Card className="hover:border-emerald-500/30 transition-all duration-200 hover:shadow-lg group cursor-pointer">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 group-hover:from-emerald-500/20 group-hover:to-cyan-500/20 transition-colors">
                                    <link.icon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                                </div>
                                <span className="font-medium text-sm">{link.label}</span>
                                <ExternalLink className="h-4 w-4 ml-auto text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                {/* FAQ Categories */}
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="sticky top-20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Book className="h-4 w-4 text-emerald-500" />
                                Categories
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2">
                            <nav className="space-y-1">
                                {faqCategories.map((category) => (
                                    <button
                                        key={category.id}
                                        onClick={() => setSelectedCategory(category.id)}
                                        className={cn(
                                            "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200",
                                            selectedCategory === category.id
                                                ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/10 text-emerald-600 dark:text-emerald-400"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                        )}
                                    >
                                        <category.icon className="h-4 w-4" />
                                        {category.label}
                                        <ChevronRight className={cn(
                                            "h-4 w-4 ml-auto transition-transform",
                                            selectedCategory === category.id && "rotate-90"
                                        )} />
                                    </button>
                                ))}
                            </nav>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* FAQ Content */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-6"
                >
                    {/* FAQ Section */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileQuestion className="h-5 w-5 text-emerald-500" />
                                Frequently Asked Questions
                            </CardTitle>
                            <CardDescription>
                                Find quick answers to common questions
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <AnimatePresence mode="wait">
                                {searchQuery ? (
                                    <motion.div
                                        key="search-results"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        {filteredFAQs.length > 0 ? (
                                            <div className="space-y-6">
                                                {filteredFAQs.map((category) => (
                                                    <div key={category.id}>
                                                        <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                                                            <category.icon className="h-4 w-4" />
                                                            {category.label}
                                                        </h3>
                                                        <Accordion type="single" collapsible className="space-y-2">
                                                            {category.questions.map((item, i) => (
                                                                <AccordionItem 
                                                                    key={i} 
                                                                    value={`${category.id}-${i}`}
                                                                    className="border rounded-xl px-4"
                                                                >
                                                                    <AccordionTrigger className="hover:no-underline py-4">
                                                                        <span className="text-left font-medium">{item.q}</span>
                                                                    </AccordionTrigger>
                                                                    <AccordionContent className="text-muted-foreground pb-4">
                                                                        {item.a}
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            ))}
                                                        </Accordion>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="text-center py-12">
                                                <FileQuestion className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                                                <p className="text-muted-foreground">No results found for &ldquo;{searchQuery}&rdquo;</p>
                                                <p className="text-sm text-muted-foreground mt-1">Try different keywords or contact support</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div
                                        key={selectedCategory}
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        {faqCategories.find(c => c.id === selectedCategory) && (
                                            <Accordion type="single" collapsible className="space-y-2">
                                                {faqCategories
                                                    .find(c => c.id === selectedCategory)
                                                    ?.questions.map((item, i) => (
                                                        <AccordionItem 
                                                            key={i} 
                                                            value={`item-${i}`}
                                                            className="border rounded-xl px-4"
                                                        >
                                                            <AccordionTrigger className="hover:no-underline py-4">
                                                                <span className="text-left font-medium">{item.q}</span>
                                                            </AccordionTrigger>
                                                            <AccordionContent className="text-muted-foreground pb-4">
                                                                {item.a}
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    ))}
                                            </Accordion>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </CardContent>
                    </Card>

                    {/* Contact Support */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MessageCircle className="h-5 w-5 text-emerald-500" />
                                Contact Support
                            </CardTitle>
                            <CardDescription>
                                Can&apos;t find what you&apos;re looking for? Send us a message.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-6 md:grid-cols-2">
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Name</label>
                                        <Input
                                            placeholder="Your name"
                                            value={contactForm.name}
                                            onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email</label>
                                        <Input
                                            type="email"
                                            placeholder="your@email.com"
                                            value={contactForm.email}
                                            onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                                            required
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Message</label>
                                        <Textarea
                                            placeholder="How can we help you?"
                                            value={contactForm.message}
                                            onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                                            required
                                            className="rounded-xl min-h-[120px]"
                                        />
                                    </div>
                                    <Button 
                                        type="submit" 
                                        className="w-full rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600"
                                        disabled={isSending}
                                    >
                                        {isSending ? (
                                            <>Sending...</>
                                        ) : (
                                            <>
                                                <Send className="h-4 w-4 mr-2" />
                                                Send Message
                                            </>
                                        )}
                                    </Button>
                                </form>

                                <div className="space-y-4">
                                    <div className="p-4 rounded-xl bg-muted/50">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-emerald-500" />
                                            Email Us
                                        </h4>
                                        <p className="text-sm text-muted-foreground">support@lynkskill.com</p>
                                        <p className="text-xs text-muted-foreground mt-1">We respond within 24 hours</p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-muted/50">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-emerald-500" />
                                            Call Us
                                        </h4>
                                        <p className="text-sm text-muted-foreground">+359 888 123 456</p>
                                        <p className="text-xs text-muted-foreground mt-1">Mon-Fri, 9:00 AM - 6:00 PM EET</p>
                                    </div>

                                    <div className="p-4 rounded-xl bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20">
                                        <h4 className="font-medium mb-2 flex items-center gap-2">
                                            <Sparkles className="h-4 w-4 text-emerald-500" />
                                            Pro Tip
                                        </h4>
                                        <p className="text-sm text-muted-foreground">
                                            Use AI Mode to get instant answers to common questions about internships and applications!
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    )
}
