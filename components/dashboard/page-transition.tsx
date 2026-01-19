"use client"

import { motion } from "framer-motion"
import { usePathname } from "next/navigation"

interface PageTransitionProps {
    children: React.ReactNode
}

const pageVariants = {
    initial: {
        opacity: 0,
        y: 20,
        scale: 0.98,
    },
    animate: {
        opacity: 1,
        y: 0,
        scale: 1,
    },
    exit: {
        opacity: 0,
        y: -10,
        scale: 0.98,
    },
}

const pageTransition = {
    type: "spring" as const,
    stiffness: 380,
    damping: 30,
    mass: 0.8,
}

export function PageTransition({ children }: PageTransitionProps) {
    const pathname = usePathname()

    return (
        <motion.div
            key={pathname}
            initial="initial"
            animate="animate"
            exit="exit"
            variants={pageVariants}
            transition={pageTransition}
            className="w-full"
        >
            {children}
        </motion.div>
    )
}
