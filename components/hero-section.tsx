import PulsingBorderShader from "@/components/pulsing-border-shader"
import { ArrowRight, Sparkles } from "lucide-react"
import { SignedIn, SignedOut, SignInButton, SignUpButton, UserButton } from "@clerk/nextjs"
import { Button } from "./ui/button"

export default function Component() {
    return (
        <div className="min-h-screen bg-black text-white overflow-hidden relative">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20" />

            {/* Hero content */}
            <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-20">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center min-h-[calc(100vh-4rem)] sm:min-h-[calc(100vh-6rem)] lg:min-h-[80vh]">
                    {/* Left side - Text content */}
                    <div className="space-y-6 sm:space-y-8 lg:pr-8 text-center lg:text-left order-2 lg:order-1">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 text-xs sm:text-sm">
                            <Sparkles className="w-3 h-3 sm:w-4 sm:h-4" />
                            AI-Powered Personal Assistant
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold tracking-tight leading-tight">
                                Your personal{" "}
                                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                                  agent
                                </span>
                            </h1>

                            <p className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl text-gray-300 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                                Experience the future of productivity with an AI agent that understands you, learns from you, and works
                                tirelessly to make your life easier.
                            </p>
                        </div>

                        {/* Clerk Auth Buttons */}
                        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 justify-center lg:justify-start">
                            <SignedOut>
                                <SignUpButton>
                                    <Button className="group relative overflow-hidden rounded-full px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 min-h-[48px] sm:min-h-[56px]">
                                        {/* Gradient background */}
                                        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-blue-500 rounded-full" />

                                        {/* Animated border */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm" />

                                        {/* Button content */}
                                        <div className="relative flex items-center justify-center gap-2 text-white">
                                            Get Started
                                            <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform duration-300" />
                                        </div>

                                        {/* Shine effect */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    </Button>
                                </SignUpButton>

                                <SignInButton>
                                    <Button className="group relative overflow-hidden rounded-full px-6 py-3 sm:px-8 sm:py-4 w-full sm:w-auto text-sm sm:text-base lg:text-lg font-semibold transition-all duration-300 hover:scale-105 active:scale-95 min-h-[48px] sm:min-h-[56px]">
                                        {/* Glass morphism background */}
                                        <div className="absolute inset-0 bg-white/5 backdrop-blur-sm border border-white/10 rounded-full" />

                                        {/* Hover glow */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                        {/* Button content */}
                                        <div className="relative flex items-center justify-center text-white">Sign In</div>

                                        {/* Subtle shine effect */}
                                        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                                    </Button>
                                </SignInButton>
                            </SignedOut>

                            <SignedIn>
                                <div className="flex items-center justify-center lg:justify-start gap-3 sm:gap-4">
                                    <UserButton
                                        appearance={{
                                            elements: {
                                                userButtonAvatarBox:
                                                    "w-10 h-10 sm:w-12 sm:h-12 ring-2 ring-purple-500/50 ring-offset-2 ring-offset-black transition-all duration-300 hover:ring-purple-400",
                                                userButtonPopoverCard:
                                                    "bg-gray-900/95 backdrop-blur-sm border border-gray-700 text-white shadow-2xl",
                                                userButtonPopoverActionButton:
                                                    "text-gray-300 hover:text-white hover:bg-gray-800 transition-colors",
                                                userButtonPopoverActionButtonText: "text-gray-300",
                                                userButtonPopoverFooter: "hidden",
                                            },
                                        }}
                                    />
                                    <div className="text-gray-300 text-xs sm:text-sm">Welcome back!</div>
                                </div>
                            </SignedIn>
                        </div>

                        <div className="flex flex-col sm:flex-row flex-wrap items-center justify-center lg:justify-start gap-4 sm:gap-6 lg:gap-8 pt-6 sm:pt-8 text-xs sm:text-sm text-gray-400">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                Available 24/7
                            </div>
                            <div>No setup required</div>
                            <div>Enterprise ready</div>
                        </div>
                    </div>

                    {/* Right side - Animation */}
                    <div className="flex justify-center items-center order-1 lg:order-2 mb-8 lg:mb-0 w-full">
                        <div className="relative w-full max-w-md sm:max-w-lg md:max-w-xl flex justify-center items-center lg:max-w-2xl aspect-square">
                            {/* Glow effect behind the shader */}
                            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-2xl sm:blur-3xl scale-110" />

                            {/* Main shader component */}
                            <PulsingBorderShader
                                style={{
                                    width: "100%",
                                    height: "100%",
                                    borderRadius: "0px",
                                    backgroundImage:
                                        " radial-gradient(circle in oklab, oklab(0% 0 -.0001 / 0%) 25.22%, oklab(30.5% 0.029 -0.184) 43.89%, oklab(0% 0 -.0001 / 0%) 60.04%)",
                                }}
                            />

                            {/* Floating elements */}
                            <div
                                className="absolute -top-2 -right-2 w-2 h-2 sm:w-3 sm:h-3 bg-purple-400 rounded-full animate-bounce"
                                style={{ animationDelay: "0s" }}
                            />
                            <div
                                className="absolute top-1/3 left-4 w-2 h-2 bg-blue-400 rounded-full animate-bounce"
                                style={{ animationDelay: "1s" }}
                            />
                            <div
                                className="absolute bottom-1/4 -right-4 w-3 h-3 sm:w-4 sm:h-4 bg-pink-400 rounded-full animate-bounce"
                                style={{ animationDelay: "2s" }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom gradient fade */}
            <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 lg:h-32 bg-gradient-to-t from-black to-transparent" />
        </div>
    )
}
