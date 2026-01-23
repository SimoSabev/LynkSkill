import { LynkSkillSignUp } from '@/components/clerk-theme'

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background relative overflow-hidden">
      {/* Animated Gradient Background */}
      <div
        aria-hidden
        className="absolute inset-0 z-0 animate-gradient-x"
        style={{
          background:
            'linear-gradient(120deg, #a855f7 0%, #6366f1 50%, #a855f7 100%)',
          opacity: 0.15,
          filter: 'blur(80px)',
        }}
      />
      {/* Glassmorphism Card Container */}
      <div className="relative z-10 rounded-3xl p-1 bg-gradient-to-br from-[#a855f7] via-[#6366f1] to-[#a855f7] shadow-2xl">
        <div className="rounded-[1.25rem] bg-background/80 backdrop-blur-xl p-8 sm:p-12 min-w-[350px] max-w-[400px] mx-auto">
          <LynkSkillSignUp />
        </div>
      </div>
      <style jsx global>{`
        @keyframes gradient-x {
          0% {
            background-position: 0% 50%;
          }
          100% {
            background-position: 100% 50%;
          }
        }
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 8s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  )
}
