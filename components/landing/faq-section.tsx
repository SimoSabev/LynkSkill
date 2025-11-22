"use client"

import { motion } from "framer-motion"
import { CheckCircle2 } from "lucide-react"

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

export function FAQSection() {
    return (
        <section className="relative py-16 md:py-32 px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="text-center space-y-4 md:space-y-6 mb-12 md:mb-20"
                >
                    <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold">
                        Frequently Asked{" "}
                        <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Questions
            </span>
                    </h2>
                    <p className="text-base md:text-xl text-muted-foreground max-w-3xl mx-auto text-balance">
                        Got questions? We&apos;ve got answers. Here are some of the most common questions we receive.
                    </p>
                </motion.div>

                <div className="space-y-3 md:space-y-4">
                    {faqs.map((faq, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.5, delay: index * 0.05 }}
                            className="p-6 md:p-8 rounded-2xl bg-card border-2 border-border hover:border-purple-500/50 transition-all duration-300 space-y-2 md:space-y-3 shadow-lg hover:shadow-xl"
                        >
                            <div className="flex items-start gap-3 md:gap-4">
                                <div className="flex-shrink-0 w-6 h-6 md:w-8 md:h-8 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white font-bold">
                                    <CheckCircle2 className="w-4 h-4 md:w-5 md:h-5" />
                                </div>
                                <div className="space-y-1 md:space-y-2 flex-1">
                                    <h3 className="text-base md:text-xl font-bold">{faq.question}</h3>
                                    <p className="text-sm md:text-base text-muted-foreground leading-relaxed">{faq.answer}</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    )
}
