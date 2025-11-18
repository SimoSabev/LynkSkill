"use client"

import { motion, AnimatePresence } from "framer-motion"
import Image from "next/image"
import { useState } from "react"
import { Button } from "@/components/ui/button"

interface MascotSceneProps {
    mascotUrl: string
    steps: string[]
    onFinish: () => void
    setActiveTab: (tab: string) => void
    userType: "Student" | "Company"
}

export function MascotScene({
                                mascotUrl,
                                steps,
                                onFinish,
                                setActiveTab,
                                userType,
                            }: MascotSceneProps) {
    const [visible, setVisible] = useState(true)
    const [step, setStep] = useState(-1) // -1 = intro, then 0..steps.length-1

    const handleNext = () => {
        if (step < steps.length - 1) setStep(step + 1)
        else {
            setVisible(false)
            onFinish()
        }
    }

    const handleBack = () => {
        if (step > 0) setStep(step - 1)
    }

    return (
        <AnimatePresence>
            {visible && (
                <motion.div
                    className="fixed inset-0 z-[999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* INTRO */}
                    {step === -1 ? (
                        <motion.div
                            key="intro"
                            className="flex flex-col items-center justify-center text-center space-y-6"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            <motion.div
                                initial={{ y: -40 }}
                                animate={{ y: 0 }}
                                transition={{ type: "spring", stiffness: 100 }}
                            >
                                <Image
                                    src={mascotUrl || "/placeholder.svg"}
                                    alt="Linky mascot"
                                    width={400}
                                    height={400}
                                    className="drop-shadow-2xl"
                                    priority
                                />
                            </motion.div>

                            <motion.div
                                className="bg-gradient-to-br from-purple-500 to-blue-500 text-white p-8 rounded-3xl shadow-2xl max-w-xl"
                                initial={{ y: 40, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                            >
                                <p className="text-2xl font-semibold mb-4">
                                    👋 Hi, I’m <strong>Linky</strong> — your guide through <em>LynkSkill</em>!
                                </p>
                                <p className="text-lg mb-6">
                                    Let’s explore how to get started together.
                                </p>
                                <Button
                                    onClick={handleNext}
                                    className="w-full bg-white text-purple-600 hover:bg-gray-100 rounded-2xl font-bold"
                                >
                                    Start
                                </Button>
                            </motion.div>
                        </motion.div>
                    ) : (
                        // MAIN SCENES
                        <motion.div
                            key={step}
                            className="flex flex-col md:flex-row items-center justify-center gap-8 w-full px-4 md:px-12"
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -30 }}
                            transition={{ duration: 0.5 }}
                        >
                            {/* Scene image (for now testscene.png everywhere) */}
                            <motion.div
                                className="relative w-full md:w-[60%] h-[300px] md:h-[500px]"
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.6 }}
                            >
                                <Image
                                    src={"/scenes/testscene.png"}
                                    alt={`Scene ${step + 1}`}
                                    fill
                                    className="object-contain rounded-3xl"
                                    priority
                                />
                            </motion.div>

                            {/* Linky + bubble */}
                            <motion.div
                                className="flex flex-col items-center gap-6 relative"
                                initial={{ x: 100 }}
                                animate={{ x: 0 }}
                                transition={{ type: "spring", stiffness: 80 }}
                            >
                                {/* Mascot */}
                                <motion.div className="relative w-[200px] h-[200px] md:w-[300px] md:h-[300px]">
                                    <Image
                                        src={mascotUrl || "/placeholder.svg"}
                                        alt="Linky mascot"
                                        fill
                                        className="object-contain"
                                        priority
                                    />
                                </motion.div>

                                {/* Speech bubble */}
                                <motion.div
                                    className="bg-gradient-to-br from-purple-500 to-blue-500 text-white rounded-3xl p-6 shadow-xl max-w-sm relative"
                                    initial={{ scale: 0.9, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{ duration: 0.5 }}
                                >
                                    <p
                                        className="text-lg leading-relaxed"
                                        dangerouslySetInnerHTML={{ __html: steps[step] }}
                                    />

                                    <div className="flex gap-3 mt-6">
    <Button
        onClick={handleBack}
        disabled={step === 0}
        variant="outline"
        className={`flex-1 rounded-2xl font-bold ${
            step === 0
                ? "opacity-50 cursor-not-allowed"
                : "bg-transparent border-white text-white hover:bg-white/20"
        }`}
    >
        Back
    </Button>

    <Button
        onClick={() => {
            setVisible(false)
            onFinish()
        }}
        className="flex-1 bg-transparent border border-white text-white hover:bg-white/20 rounded-2xl font-bold"
    >
        Skip
    </Button>

    <Button
        onClick={handleNext}
        className="flex-1 bg-white text-purple-600 hover:bg-gray-100 rounded-2xl font-bold"
    >
        {step === steps.length - 1 ? "Finish" : "Next"}
    </Button>
</div>


                                    <div className="hidden md:block absolute -left-3 top-1/2 -translate-y-1/2 w-0 h-0 border-t-[15px] border-t-transparent border-r-[15px] border-r-purple-500 border-b-[15px] border-b-transparent" />
                                </motion.div>
                            </motion.div>
                        </motion.div>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    )
}
