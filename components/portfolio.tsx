"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@clerk/nextjs";
import {
  User,
  Briefcase,
  GraduationCap,
  Code,
  Award,
  LinkIcon,
  Plus,
  X,
  Edit3,
  Save,
  Heart,
  Star,
  Zap,
  Target,
  Coffee,
  Music,
  Camera,
  Gamepad2,
  Book,
  Plane,
  Palette,
  Dumbbell,
  MapPin,
  Calendar,
  ExternalLink,
} from "lucide-react"

interface Education {
  school: string
  degree: string
  startYear: number
  endYear?: number
}

interface Project {
  title: string
  description: string
  link?: string
  techStack?: string[]
}

interface Certification {
  name: string
  authority: string
  issuedAt: string
  expiresAt?: string
}

interface PortfolioData {
  fullName?: string
  headline?: string
  age?: number
  bio?: string
  skills: string[]
  interests: string[]
  experience?: string
  education: Education[]
  projects: Project[]
  certifications: Certification[]
  linkedin?: string
  github?: string
  portfolioUrl?: string
  needsApproval: boolean
  approvedBy?: string
  approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
}

// Predefined skills and interests with icons
const PREDEFINED_SKILLS = [
  { name: "JavaScript", icon: "💻" },
  { name: "React", icon: "⚛️" },
  { name: "Node.js", icon: "🟢" },
  { name: "Python", icon: "🐍" },
  { name: "TypeScript", icon: "📘" },
  { name: "Next.js", icon: "▲" },
  { name: "Vue.js", icon: "💚" },
  { name: "Angular", icon: "🔴" },
  { name: "PHP", icon: "🐘" },
  { name: "Java", icon: "☕" },
  { name: "C++", icon: "⚡" },
  { name: "Go", icon: "🐹" },
  { name: "Rust", icon: "🦀" },
  { name: "Swift", icon: "🍎" },
  { name: "Kotlin", icon: "🤖" },
  { name: "SQL", icon: "🗄️" },
  { name: "MongoDB", icon: "🍃" },
  { name: "PostgreSQL", icon: "🐘" },
  { name: "Docker", icon: "🐳" },
  { name: "AWS", icon: "☁️" },
  { name: "Git", icon: "📝" },
  { name: "GraphQL", icon: "📊" },
  { name: "Machine Learning", icon: "🤖" },
  { name: "UI/UX Design", icon: "🎨" },
  { name: "DevOps", icon: "⚙️" },
]

const PREDEFINED_INTERESTS = [
  { name: "Photography", icon: <Camera className="h-4 w-4" /> },
  { name: "Music", icon: <Music className="h-4 w-4" /> },
  { name: "Gaming", icon: <Gamepad2 className="h-4 w-4" /> },
  { name: "Reading", icon: <Book className="h-4 w-4" /> },
  { name: "Travel", icon: <Plane className="h-4 w-4" /> },
  { name: "Art", icon: <Palette className="h-4 w-4" /> },
  { name: "Fitness", icon: <Dumbbell className="h-4 w-4" /> },
  { name: "Cooking", icon: <Coffee className="h-4 w-4" /> },
  { name: "Technology", icon: <Zap className="h-4 w-4" /> },
  { name: "Sports", icon: <Target className="h-4 w-4" /> },
]

export function Portfolio({ userType }: { userType: "Student" | "Company" }) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const { user } = useUser();

  useEffect(() => {
    async function fetchPortfolio() {
      const res = await fetch("/api/portfolio")
      if (res.ok) {
        const data = await res.json()
        setPortfolio({
          ...data,
          skills: data.skills ?? [],
          interests: data.interests ?? [],
          education: data.education ?? [],
          projects: data.projects ?? [],
          certifications: data.certifications ?? [],
        })
      } else {
        setPortfolio({
          fullName: "John Doe",
          headline: "Full Stack Developer",
          age: 25,
          bio: "Passionate developer with experience in modern web technologies. I love creating innovative solutions and learning new technologies.",
          skills: ["JavaScript", "React", "Node.js", "TypeScript"],
          interests: ["Technology", "Photography", "Travel"],
          education: [
            {
              school: "University of Technology",
              degree: "Bachelor of Computer Science",
              startYear: 2020,
              endYear: 2024,
            },
          ],
          projects: [
            {
              title: "E-commerce Platform",
              description: "A full-stack e-commerce solution built with React and Node.js",
              link: "https://github.com/johndoe/ecommerce",
            },
          ],
          certifications: [
            {
              name: "AWS Certified Developer",
              authority: "Amazon Web Services",
              issuedAt: "2024-01-15",
            },
          ],
          linkedin: "https://linkedin.com/in/johndoe",
          github: "https://github.com/johndoe",
          portfolioUrl: "https://johndoe.dev",
          needsApproval: false,
          approvalStatus: "APPROVED",
        })
      }
      setLoading(false)
    }
    fetchPortfolio()
  }, [])

  async function handleSave() {
    const res = await fetch("/api/portfolio", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(portfolio),
    })
    if (res.ok) {
      setIsEditing(false)
      setActiveSection(null)
    }
  }

  const toggleSkill = (skillName: string) => {
    setPortfolio((prev) => {
      if (!prev) return prev
      const skills = prev.skills.includes(skillName)
          ? prev.skills.filter((s) => s !== skillName)
          : [...prev.skills, skillName]
      return { ...prev, skills }
    })
  }

  const toggleInterest = (interestName: string) => {
    setPortfolio((prev) => {
      if (!prev) return prev
      const interests = prev.interests.includes(interestName)
          ? prev.interests.filter((i) => i !== interestName)
          : [...prev.interests, interestName]
      return { ...prev, interests }
    })
  }

  if (loading) {
    return (
        <div className="min-h-screen bg-background">
          <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="h-64 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 rounded-3xl animate-pulse" />
            {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-card/60 rounded-3xl animate-pulse shadow-sm" />
            ))}
          </div>
        </div>
    )
  }

  const displayName = user?.fullName || portfolio?.fullName || "Professional Portfolio";

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  }

  return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-8">
            <motion.section variants={itemVariants}>
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 text-white shadow-2xl">
                <div className="absolute inset-0 bg-black/10" />
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full -translate-y-48 translate-x-48" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-32 -translate-x-32" />

                <div className="relative z-10">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
                    <div className="flex items-start gap-6">
                      <div className="h-24 w-24 rounded-3xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                        <User className="h-12 w-12" />
                      </div>
                      <div className="space-y-3">
                        <div>
                          <h1 className="text-5xl font-bold mb-2">{displayName}</h1>
                          <p className="text-white/90 text-xl font-medium">
                            {portfolio?.headline || "Professional Portfolio"}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 text-white/80">
                          {portfolio?.age && (
                              <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                <span>{portfolio.age} years old</span>
                              </div>
                          )}
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>Available Worldwide</span>
                          </div>
                        </div>
                        {portfolio?.needsApproval && (
                            <Badge
                                variant={
                                  portfolio.approvalStatus === "APPROVED"
                                      ? "default"
                                      : portfolio.approvalStatus === "PENDING"
                                          ? "secondary"
                                          : "destructive"
                                }
                                className="rounded-xl text-sm px-4 py-2 bg-white/20 border-white/30"
                            >
                              {portfolio.approvalStatus}
                            </Badge>
                        )}
                      </div>
                    </div>
                    {userType === "Student" && (
                        <Button
                            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                            className="rounded-2xl bg-background text-foreground hover:bg-background/90 px-8 py-4 font-semibold text-lg shadow-lg"
                            size="lg"
                        >
                          {isEditing ? (
                              <>
                                <Save className="mr-2 h-5 w-5" />
                                Save Changes
                              </>
                          ) : (
                              <>
                                <Edit3 className="mr-2 h-5 w-5" />
                                Edit Portfolio
                              </>
                          )}
                        </Button>
                    )}
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section variants={itemVariants}>
              <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--portfolio-about-from)] to-[var(--portfolio-about-to)] p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <User className="h-5 w-5" />
                    </div>
                    About Me
                  </h2>
                </div>
                <div className="p-8">
                  {isEditing ? (
                      <Textarea
                          placeholder="Write a compelling bio that showcases your personality and goals..."
                          value={portfolio?.bio || ""}
                          onChange={(e) => setPortfolio((prev) => ({ ...prev!, bio: e.target.value }))}
                          className="min-h-32 rounded-2xl border-2 text-lg"
                      />
                  ) : (
                      <div className="prose prose-lg max-w-none">
                        <p className="text-muted-foreground leading-relaxed text-lg">
                          {portfolio?.bio || "No bio added yet. Share your story, goals, and what makes you unique!"}
                        </p>
                      </div>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.section variants={itemVariants}>
              <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--portfolio-skills-from)] to-[var(--portfolio-skills-to)] p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Code className="h-5 w-5" />
                    </div>
                    Technical Skills
                  </h2>
                </div>
                <div className="p-8">
                  {isEditing ? (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-4 text-lg">Choose from popular skills:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                            {PREDEFINED_SKILLS.map((skill) => (
                                <motion.button
                                    key={skill.name}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => toggleSkill(skill.name)}
                                    className={`p-3 rounded-2xl border-2 transition-all duration-200 text-left ${
                                        portfolio?.skills.includes(skill.name)
                                            ? "border-[var(--portfolio-skills-from)] bg-accent text-accent-foreground"
                                            : "border-border hover:border-[var(--portfolio-skills-from)] bg-card"
                                    }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className="text-lg">{skill.icon}</span>
                                    <span className="font-medium text-sm">{skill.name}</span>
                                  </div>
                                </motion.button>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-3">Or add custom skills:</h4>
                          <Input
                              placeholder="Enter custom skills separated by commas"
                              className="rounded-2xl border-2"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const value = e.currentTarget.value.trim()
                                  if (value && !portfolio?.skills.includes(value)) {
                                    setPortfolio((prev) => ({
                                      ...prev!,
                                      skills: [...(prev?.skills || []), value],
                                    }))
                                    e.currentTarget.value = ""
                                  }
                                }
                              }}
                          />
                        </div>
                      </div>
                  ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <AnimatePresence>
                          {portfolio?.skills?.length ? (
                              portfolio.skills.map((skill, i) => (
                                  <motion.div
                                      key={skill}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ delay: i * 0.05 }}
                                      className="bg-gradient-to-r from-[var(--portfolio-skills-from)] to-[var(--portfolio-skills-to)] text-white p-4 rounded-2xl shadow-lg"
                                  >
                                    <div className="flex items-center gap-2">
                              <span className="text-lg">
                                {PREDEFINED_SKILLS.find((s) => s.name === skill)?.icon || "💻"}
                              </span>
                                      <span className="font-semibold">{skill}</span>
                                    </div>
                                  </motion.div>
                              ))
                          ) : (
                              <div className="col-span-full text-center py-12">
                                <Code className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground text-lg">
                                  No skills added yet. Showcase your technical expertise!
                                </p>
                              </div>
                          )}
                        </AnimatePresence>
                      </div>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.section variants={itemVariants}>
              <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--portfolio-interests-from)] to-[var(--portfolio-interests-to)] p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Heart className="h-5 w-5" />
                    </div>
                    Interests & Hobbies
                  </h2>
                </div>
                <div className="p-8">
                  {isEditing ? (
                      <div className="space-y-6">
                        <div>
                          <h4 className="font-semibold mb-4 text-lg">Select your interests:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                            {PREDEFINED_INTERESTS.map((interest) => (
                                <motion.button
                                    key={interest.name}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => toggleInterest(interest.name)}
                                    className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                                        portfolio?.interests.includes(interest.name)
                                            ? "border-[var(--portfolio-interests-from)] bg-accent text-accent-foreground"
                                            : "border-border hover:border-[var(--portfolio-interests-from)] bg-card"
                                    }`}
                                >
                                  <div className="flex flex-col items-center gap-2">
                                    {interest.icon}
                                    <span className="font-medium text-sm">{interest.name}</span>
                                  </div>
                                </motion.button>
                            ))}
                          </div>
                        </div>
                      </div>
                  ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <AnimatePresence>
                          {portfolio?.interests?.length ? (
                              portfolio.interests.map((interest, i) => (
                                  <motion.div
                                      key={interest}
                                      initial={{ opacity: 0, scale: 0.8 }}
                                      animate={{ opacity: 1, scale: 1 }}
                                      exit={{ opacity: 0, scale: 0.8 }}
                                      transition={{ delay: i * 0.05 }}
                                      className="bg-gradient-to-r from-[var(--portfolio-interests-from)] to-[var(--portfolio-interests-to)] text-white p-6 rounded-2xl shadow-lg text-center"
                                  >
                                    <div className="flex flex-col items-center gap-3">
                                      {PREDEFINED_INTERESTS.find((int) => int.name === interest)?.icon || (
                                          <Heart className="h-6 w-6" />
                                      )}
                                      <span className="font-semibold">{interest}</span>
                                    </div>
                                  </motion.div>
                              ))
                          ) : (
                              <div className="col-span-full text-center py-12">
                                <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                                <p className="text-muted-foreground text-lg">
                                  No interests added yet. Show your personality!
                                </p>
                              </div>
                          )}
                        </AnimatePresence>
                      </div>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.section variants={itemVariants}>
              <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--portfolio-education-from)] to-[var(--portfolio-education-to)] p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <GraduationCap className="h-5 w-5" />
                    </div>
                    Education
                  </h2>
                </div>
                <div className="p-8">
                  {isEditing ? (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {(portfolio?.education || []).map((edu, i) => (
                              <motion.div
                                  key={i}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="p-6 border-2 rounded-2xl bg-accent border-border space-y-4"
                              >
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-accent-foreground">Education #{i + 1}</h4>
                                  <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                          setPortfolio((prev) => ({
                                            ...prev!,
                                            education: (prev?.education || []).filter((_, idx) => idx !== i),
                                          }))
                                      }
                                      className="rounded-xl"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Input
                                      placeholder="School/University"
                                      value={edu.school || ""}
                                      onChange={(e) =>
                                          setPortfolio((prev) => {
                                            const copy = [...(prev?.education || [])]
                                            copy[i].school = e.target.value
                                            return { ...prev!, education: copy }
                                          })
                                      }
                                      className="rounded-2xl border-2"
                                  />
                                  <Input
                                      placeholder="Degree/Program"
                                      value={edu.degree || ""}
                                      onChange={(e) =>
                                          setPortfolio((prev) => {
                                            const copy = [...(prev?.education || [])]
                                            copy[i].degree = e.target.value
                                            return { ...prev!, education: copy }
                                          })
                                      }
                                      className="rounded-2xl border-2"
                                  />
                                  <Input
                                      placeholder="Start Year"
                                      type="number"
                                      value={edu.startYear || ""}
                                      onChange={(e) =>
                                          setPortfolio((prev) => {
                                            const copy = [...(prev?.education || [])]
                                            copy[i].startYear = Number(e.target.value)
                                            return { ...prev!, education: copy }
                                          })
                                      }
                                      className="rounded-2xl border-2"
                                  />
                                  <Input
                                      placeholder="End Year (or leave empty if current)"
                                      type="number"
                                      value={edu.endYear || ""}
                                      onChange={(e) =>
                                          setPortfolio((prev) => {
                                            const copy = [...(prev?.education || [])]
                                            copy[i].endYear = Number(e.target.value)
                                            return { ...prev!, education: copy }
                                          })
                                      }
                                      className="rounded-2xl border-2"
                                  />
                                </div>
                              </motion.div>
                          ))}
                        </AnimatePresence>
                        <Button
                            onClick={() =>
                                setPortfolio((prev) => ({
                                  ...prev!,
                                  education: [
                                    ...(prev?.education || []),
                                    { school: "", degree: "", startYear: new Date().getFullYear(), endYear: 0 },
                                  ],
                                }))
                            }
                            className="w-full rounded-2xl border-2 border-dashed border-border bg-accent text-accent-foreground hover:bg-accent/80"
                            variant="outline"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Education
                        </Button>
                      </div>
                  ) : portfolio?.education?.length ? (
                      <div className="space-y-6">
                        {portfolio.education.map((edu, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="relative pl-8 border-l-4 border-[var(--portfolio-education-from)]"
                            >
                              <div className="absolute -left-3 top-0 w-6 h-6 bg-[var(--portfolio-education-from)] rounded-full border-4 border-card shadow-lg"></div>
                              <div className="bg-gradient-to-r from-accent to-accent/50 p-6 rounded-2xl shadow-lg border border-border">
                                <h4 className="font-bold text-xl text-accent-foreground mb-2">{edu.degree}</h4>
                                <p className="text-accent-foreground/80 font-semibold text-lg mb-1">{edu.school}</p>
                                <p className="text-accent-foreground/70 font-medium">
                                  {edu.startYear} - {edu.endYear || "Present"}
                                </p>
                              </div>
                            </motion.div>
                        ))}
                      </div>
                  ) : (
                      <div className="text-center py-12">
                        <GraduationCap className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">
                          No education added yet. Add your academic background!
                        </p>
                      </div>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.section variants={itemVariants}>
              <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--portfolio-projects-from)] to-[var(--portfolio-projects-to)] p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Briefcase className="h-5 w-5" />
                    </div>
                    Projects
                  </h2>
                </div>
                <div className="p-8">
                  {isEditing ? (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {(portfolio?.projects || []).map((proj, i) => (
                              <motion.div
                                  key={i}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="p-6 border-2 rounded-2xl bg-accent border-border space-y-4"
                              >
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-accent-foreground">Project #{i + 1}</h4>
                                  <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                          setPortfolio((prev) => ({
                                            ...prev!,
                                            projects: (prev?.projects || []).filter((_, idx) => idx !== i),
                                          }))
                                      }
                                      className="rounded-xl"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <Input
                                    placeholder="Project Title"
                                    value={proj.title || ""}
                                    onChange={(e) => {
                                      const copy = [...(portfolio?.projects || [])]
                                      copy[i].title = e.target.value
                                      setPortfolio((prev) => ({ ...prev!, projects: copy }))
                                    }}
                                    className="rounded-2xl border-2"
                                />
                                <Textarea
                                    placeholder="Project Description"
                                    value={proj.description || ""}
                                    onChange={(e) => {
                                      const copy = [...(portfolio?.projects || [])]
                                      copy[i].description = e.target.value
                                      setPortfolio((prev) => ({ ...prev!, projects: copy }))
                                    }}
                                    className="rounded-2xl border-2"
                                />
                                <Input
                                    placeholder="Project Link (optional)"
                                    value={proj.link || ""}
                                    onChange={(e) => {
                                      const copy = [...(portfolio?.projects || [])]
                                      copy[i].link = e.target.value
                                      setPortfolio((prev) => ({ ...prev!, projects: copy }))
                                    }}
                                    className="rounded-2xl border-2"
                                />
                              </motion.div>
                          ))}
                        </AnimatePresence>
                        <Button
                            onClick={() =>
                                setPortfolio((prev) => ({
                                  ...prev!,
                                  projects: [...(prev?.projects || []), { title: "", description: "", link: "" }],
                                }))
                            }
                            className="w-full rounded-2xl border-2 border-dashed border-border bg-accent text-accent-foreground hover:bg-accent/80"
                            variant="outline"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Project
                        </Button>
                      </div>
                  ) : portfolio?.projects?.length ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {portfolio.projects.map((proj, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                                whileHover={{ y: -5 }}
                                className="bg-gradient-to-br from-accent to-accent/50 p-8 rounded-3xl shadow-xl border border-border hover:shadow-2xl transition-all duration-300"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="h-12 w-12 bg-gradient-to-r from-[var(--portfolio-projects-from)] to-[var(--portfolio-projects-to)] rounded-2xl flex items-center justify-center">
                                  <Briefcase className="h-6 w-6 text-white" />
                                </div>
                                {proj.link && (
                                    <a
                                        href={proj.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 bg-card rounded-xl shadow-md hover:shadow-lg transition-all duration-200"
                                    >
                                      <ExternalLink className="h-5 w-5 text-[var(--portfolio-projects-from)]" />
                                    </a>
                                )}
                              </div>
                              <h4 className="font-bold text-2xl text-accent-foreground mb-3">{proj.title}</h4>
                              <p className="text-accent-foreground/80 leading-relaxed text-lg">{proj.description}</p>
                            </motion.div>
                        ))}
                      </div>
                  ) : (
                      <div className="text-center py-12">
                        <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">No projects added yet. Showcase your work!</p>
                      </div>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.section variants={itemVariants}>
              <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--portfolio-certs-from)] to-[var(--portfolio-certs-to)] p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <Award className="h-5 w-5" />
                    </div>
                    Certifications
                  </h2>
                </div>
                <div className="p-8">
                  {isEditing ? (
                      <div className="space-y-4">
                        <AnimatePresence>
                          {(portfolio?.certifications || []).map((cert, i) => (
                              <motion.div
                                  key={i}
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="p-6 border-2 rounded-2xl bg-accent border-border space-y-4"
                              >
                                <div className="flex justify-between items-center">
                                  <h4 className="font-semibold text-accent-foreground">Certification #{i + 1}</h4>
                                  <Button
                                      variant="destructive"
                                      size="sm"
                                      onClick={() =>
                                          setPortfolio((prev) => ({
                                            ...prev!,
                                            certifications: (prev?.certifications || []).filter((_, idx) => idx !== i),
                                          }))
                                      }
                                      className="rounded-xl"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <Input
                                      placeholder="Certification Name"
                                      value={cert.name || ""}
                                      onChange={(e) => {
                                        const copy = [...(portfolio?.certifications || [])]
                                        copy[i].name = e.target.value
                                        setPortfolio((prev) => ({ ...prev!, certifications: copy }))
                                      }}
                                      className="rounded-2xl border-2"
                                  />
                                  <Input
                                      placeholder="Issuing Authority"
                                      value={cert.authority || ""}
                                      onChange={(e) => {
                                        const copy = [...(portfolio?.certifications || [])]
                                        copy[i].authority = e.target.value
                                        setPortfolio((prev) => ({ ...prev!, certifications: copy }))
                                      }}
                                      className="rounded-2xl border-2"
                                  />
                                  <Input
                                      placeholder="Issue Date (YYYY-MM-DD)"
                                      value={cert.issuedAt || ""}
                                      onChange={(e) => {
                                        const copy = [...(portfolio?.certifications || [])]
                                        copy[i].issuedAt = e.target.value
                                        setPortfolio((prev) => ({ ...prev!, certifications: copy }))
                                      }}
                                      className="rounded-2xl border-2"
                                  />
                                  <Input
                                      placeholder="Expiry Date (optional)"
                                      value={cert.expiresAt || ""}
                                      onChange={(e) => {
                                        const copy = [...(portfolio?.certifications || [])]
                                        copy[i].expiresAt = e.target.value
                                        setPortfolio((prev) => ({ ...prev!, certifications: copy }))
                                      }}
                                      className="rounded-2xl border-2"
                                  />
                                </div>
                              </motion.div>
                          ))}
                        </AnimatePresence>
                        <Button
                            onClick={() =>
                                setPortfolio((prev) => ({
                                  ...prev!,
                                  certifications: [
                                    ...(prev?.certifications || []),
                                    { name: "", authority: "", issuedAt: "", expiresAt: "" },
                                  ],
                                }))
                            }
                            className="w-full rounded-2xl border-2 border-dashed border-border bg-accent text-accent-foreground hover:bg-accent/80"
                            variant="outline"
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Certification
                        </Button>
                      </div>
                  ) : portfolio?.certifications?.length ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {portfolio.certifications.map((cert, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-gradient-to-br from-accent to-accent/50 p-6 rounded-3xl shadow-xl border border-border"
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="h-12 w-12 bg-gradient-to-r from-[var(--portfolio-certs-from)] to-[var(--portfolio-certs-to)] rounded-2xl flex items-center justify-center">
                                  <Award className="h-6 w-6 text-white" />
                                </div>
                                <Star className="h-8 w-8 text-[var(--portfolio-certs-from)]" />
                              </div>
                              <h4 className="font-bold text-xl text-accent-foreground mb-2">{cert.name}</h4>
                              <p className="text-accent-foreground/80 font-semibold mb-2">{cert.authority}</p>
                              <p className="text-accent-foreground/70 text-sm">
                                Issued: {cert.issuedAt}
                                {cert.expiresAt && ` • Expires: ${cert.expiresAt}`}
                              </p>
                            </motion.div>
                        ))}
                      </div>
                  ) : (
                      <div className="text-center py-12">
                        <Award className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground text-lg">No certifications added yet. Add your achievements!</p>
                      </div>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.section variants={itemVariants}>
              <div className="bg-card/80 backdrop-blur-sm rounded-3xl shadow-xl border border-border overflow-hidden">
                <div className="bg-gradient-to-r from-[var(--portfolio-links-from)] to-[var(--portfolio-links-to)] p-6">
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center">
                      <LinkIcon className="h-5 w-5" />
                    </div>
                    Professional Links
                  </h2>
                </div>
                <div className="p-8">
                  {isEditing ? (
                      <div className="space-y-4">
                        <Input
                            placeholder="LinkedIn Profile URL"
                            value={portfolio?.linkedin || ""}
                            onChange={(e) => setPortfolio((prev) => ({ ...prev!, linkedin: e.target.value }))}
                            className="rounded-2xl border-2"
                        />
                        <Input
                            placeholder="GitHub Profile URL"
                            value={portfolio?.github || ""}
                            onChange={(e) => setPortfolio((prev) => ({ ...prev!, github: e.target.value }))}
                            className="rounded-2xl border-2"
                        />
                        <Input
                            placeholder="Personal Website URL"
                            value={portfolio?.portfolioUrl || ""}
                            onChange={(e) => setPortfolio((prev) => ({ ...prev!, portfolioUrl: e.target.value }))}
                            className="rounded-2xl border-2"
                        />
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {portfolio?.linkedin && (
                            <motion.a
                                href={portfolio.linkedin}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="bg-gradient-to-br from-[var(--portfolio-links-from)] to-[var(--portfolio-links-to)] text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300"
                            >
                              <div className="flex flex-col items-center text-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                  <LinkIcon className="h-8 w-8" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-xl mb-2">LinkedIn</h4>
                                  <p className="text-white/80">Professional Network</p>
                                </div>
                              </div>
                            </motion.a>
                        )}
                        {portfolio?.github && (
                            <motion.a
                                href={portfolio.github}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="bg-gradient-to-br from-secondary to-secondary/80 text-secondary-foreground p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300"
                            >
                              <div className="flex flex-col items-center text-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-background/20 flex items-center justify-center">
                                  <Code className="h-8 w-8" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-xl mb-2">GitHub</h4>
                                  <p className="text-secondary-foreground/80">Code Repository</p>
                                </div>
                              </div>
                            </motion.a>
                        )}
                        {portfolio?.portfolioUrl && (
                            <motion.a
                                href={portfolio.portfolioUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                whileHover={{ scale: 1.05, y: -5 }}
                                className="bg-gradient-to-br from-[var(--portfolio-education-from)] to-[var(--portfolio-education-to)] text-white p-8 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-300"
                            >
                              <div className="flex flex-col items-center text-center gap-4">
                                <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                  <User className="h-8 w-8" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-xl mb-2">Portfolio</h4>
                                  <p className="text-white/80">Personal Website</p>
                                </div>
                              </div>
                            </motion.a>
                        )}
                        {!portfolio?.linkedin && !portfolio?.github && !portfolio?.portfolioUrl && (
                            <div className="col-span-full text-center py-12">
                              <LinkIcon className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                              <p className="text-muted-foreground text-lg">
                                No links added yet. Connect your professional profiles!
                              </p>
                            </div>
                        )}
                      </div>
                  )}
                </div>
              </div>
            </motion.section>
          </motion.div>
        </div>
      </div>
  )
}






// "use client"
//
// import { motion } from "framer-motion"
// import { useEffect, useState } from "react"
// import { Download, Search, Star } from "lucide-react"
//
// import { Badge } from "@/components/ui/badge"
// import { Button } from "@/components/ui/button"
// import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
// import { Input } from "@/components/ui/input"
// import { Progress } from "@/components/ui/progress"
// import { apps } from "@/lib/dashboard-data"
// import { CardSkeleton } from "@/components/card-skeleton"
// import { HeroSkeleton } from "@/components/hero-skeleton"
//
// interface AppsTabContentProps {
//   userType: "Student" | "Company"
// }
//
// export function Portfolio({ userType }: AppsTabContentProps) {
//   const [isLoading, setIsLoading] = useState(true)
//   const newSectionTitle = userType === "Company" ? "New Releases" : "New Internships"
//   const allSectionTitle = userType === "Company" ? "All Apps" : "All Internships"
//
//   useEffect(() => {
//     const timer = setTimeout(() => {
//       setIsLoading(false)
//     }, 1800)
//
//     return () => clearTimeout(timer)
//   }, [])
//
//   if (isLoading) {
//     return (
//       <div className="space-y-8">
//         <HeroSkeleton />
//         <div className="flex flex-wrap gap-3 mb-6">
//           {Array.from({ length: 5 }).map((_, i) => (
//             <div key={i} className="h-10 w-24 bg-muted rounded-2xl animate-pulse" />
//           ))}
//           <div className="flex-1" />
//           <div className="h-10 w-48 bg-muted rounded-2xl animate-pulse" />
//         </div>
//         <section className="space-y-4">
//           <div className="h-8 w-48 bg-muted rounded animate-pulse" />
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//             {Array.from({ length: 3 }).map((_, i) => (
//               <CardSkeleton key={i} />
//             ))}
//           </div>
//         </section>
//         <section className="space-y-4">
//           <div className="h-8 w-32 bg-muted rounded animate-pulse" />
//           <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//             {Array.from({ length: 8 }).map((_, i) => (
//               <CardSkeleton key={i} />
//             ))}
//           </div>
//         </section>
//       </div>
//     )
//   }
//
//   return (
//     <div className="space-y-8">
//       <section>
//         <motion.div
//           initial={{ opacity: 0, y: 20 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.5 }}
//           className="overflow-hidden rounded-3xl bg-gradient-to-r from-pink-600 via-red-600 to-orange-600 p-8 text-white"
//         >
//           <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
//             <div className="space-y-2">
//               <h2 className="text-3xl font-bold">Portfolio</h2>
//               <p className="max-w-[600px] text-white/80">
//                 Discover our full suite of professional design and creative applications.
//               </p>
//             </div>
//             <Button className="w-fit rounded-2xl bg-background text-red-700 hover:bg-background/90">
//               <Download className="mr-2 h-4 w-4" />
//               Install Desktop App
//             </Button>
//           </div>
//         </motion.div>
//       </section>
//
//       <div className="flex flex-wrap gap-3 mb-6">
//         <Button variant="outline" className="rounded-2xl bg-transparent">
//           All Categories
//         </Button>
//         <Button variant="outline" className="rounded-2xl bg-transparent">
//           Creative
//         </Button>
//         <Button variant="outline" className="rounded-2xl bg-transparent">
//           Video
//         </Button>
//         <Button variant="outline" className="rounded-2xl bg-transparent">
//           Web
//         </Button>
//         <Button variant="outline" className="rounded-2xl bg-transparent">
//           3D
//         </Button>
//         <div className="flex-1"></div>
//         <div className="relative w-full md:w-auto mt-3 md:mt-0">
//           <Search className="absolute left-3 top-3 h-4 w-4 text-foreground" />
//           <Input type="search" placeholder="Search apps..." className="w-full rounded-2xl pl-9 md:w-[200px]" />
//         </div>
//       </div>
//
//       <section className="space-y-4">
//         <h2 className="text-2xl font-semibold">{newSectionTitle}</h2>
//         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//           {apps
//             .filter((app) => app.new)
//             .map((app) => (
//               <motion.div key={app.name} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
//                 <Card className="overflow-hidden rounded-3xl border-2 hover:border-primary/50 transition-all duration-300">
//                   <CardHeader className="pb-2">
//                     <div className="flex items-center justify-between">
//                       <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">{app.icon}</div>
//                       <Badge className="rounded-xl bg-amber-500">New</Badge>
//                     </div>
//                   </CardHeader>
//                   <CardContent className="pb-2">
//                     <CardTitle className="text-lg">{app.name}</CardTitle>
//                     <CardDescription>{app.description}</CardDescription>
//                     <div className="mt-2">
//                       <div className="flex items-center justify-between text-sm">
//                         <span>Installation</span>
//                         <span>{app.progress}%</span>
//                       </div>
//                       <Progress value={app.progress} className="h-2 mt-1 rounded-xl" />
//                     </div>
//                   </CardContent>
//                   <CardFooter>
//                     <Button variant="secondary" className="w-full rounded-2xl">
//                       {app.progress < 100 ? "Continue Install" : "Open"}
//                     </Button>
//                   </CardFooter>
//                 </Card>
//               </motion.div>
//             ))}
//         </div>
//       </section>
//
//       <section className="space-y-4">
//         <h2 className="text-2xl font-semibold">{allSectionTitle}</h2>
//         <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
//           {apps.map((app) => (
//             <motion.div key={app.name} whileHover={{ scale: 1.02, y: -5 }} whileTap={{ scale: 0.98 }}>
//               <Card className="overflow-hidden rounded-3xl border hover:border-primary/50 transition-all duration-300">
//                 <CardHeader className="pb-2">
//                   <div className="flex items-center justify-between">
//                     <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted">{app.icon}</div>
//                     <Badge variant="outline" className="rounded-xl">
//                       {app.category}
//                     </Badge>
//                   </div>
//                 </CardHeader>
//                 <CardContent className="pb-2">
//                   <CardTitle className="text-lg">{app.name}</CardTitle>
//                   <CardDescription>{app.description}</CardDescription>
//                 </CardContent>
//                 <CardFooter className="flex gap-2">
//                   <Button variant="secondary" className="flex-1 rounded-2xl">
//                     {app.progress < 100 ? "Install" : "Open"}
//                   </Button>
//                   <Button variant="outline" size="icon" className="rounded-2xl bg-transparent">
//                     <Star className="h-4 w-4" />
//                   </Button>
//                 </CardFooter>
//               </Card>
//             </motion.div>
//           ))}
//         </div>
//       </section>
//     </div>
//   )
// }
