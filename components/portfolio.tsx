"use client"

import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { useUser } from "@clerk/nextjs"
import { FileUpload } from "@/components/file-upload"
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
  FileText,
  ImageIcon,
  Download,
} from "lucide-react"

interface FileAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
}

interface Education {
  school: string
  degree: string
  startYear: number
  endYear?: number
  attachments?: FileAttachment[]
}

interface Project {
  title: string
  description: string
  link?: string
  techStack?: string[]
  attachments?: FileAttachment[]
}

interface Certification {
  name: string
  authority: string
  issuedAt: string
  expiresAt?: string
  attachments?: FileAttachment[]
}

type PortfolioSections = {
  education: Education
  projects: Project
  certifications: Certification
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

const AttachmentDisplay = ({ attachments }: { attachments?: FileAttachment[] }) => {
  if (!attachments || attachments.length === 0) return null

  return (
      <div className="mt-4 space-y-2">
        <h5 className="text-sm font-semibold text-muted-foreground">Attachments:</h5>
        <div className="flex flex-wrap gap-2">
          {attachments.map((file) => (
              <motion.a
                  key={file.id}
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.05 }}
                  className="flex items-center gap-2 px-3 py-2 bg-accent/50 rounded-xl border border-border hover:bg-accent transition-colors"
              >
                {file.type.startsWith("image/") ? (
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                ) : (
                    <FileText className="h-4 w-4 text-green-500" />
                )}
                <span className="text-sm font-medium truncate max-w-32">{file.name}</span>
                <Download className="h-3 w-3 text-muted-foreground" />
              </motion.a>
          ))}
        </div>
      </div>
  )
}

export function Portfolio({ userType }: { userType: "Student" | "Company" }) {
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  const { user } = useUser()

  const handleFileUpload = async <
      T extends keyof PortfolioSections
  >(
      files: File[],
      section: T,
      index: number,
  ) => {
    const uploadedFiles: FileAttachment[] = []

    for (const file of files) {
      const formData = new FormData()
      formData.append("file", file)
      formData.append("section", section)

      try {
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          const result = await response.json()
          uploadedFiles.push({
            id: result.id,
            name: file.name,
            url: result.url,
            type: file.type,
            size: file.size,
          })
        }
      } catch (error) {
        console.error("File upload failed:", error)
      }
    }

    // ✅ No more any[]
    setPortfolio((prev) => {
      if (!prev) return prev

      const updated = { ...prev }
      const sectionData = updated[section] as PortfolioSections[T][]

      if (sectionData[index]) {
        sectionData[index] = {
          ...sectionData[index],
          attachments: [
            ...(sectionData[index].attachments || []),
            ...uploadedFiles,
          ],
        }
      }

      return updated
    })
  }


  const handleFileRemove = <
      T extends keyof PortfolioSections
  >(
      section: T,
      index: number,
      fileId: string,
  ) => {
    setPortfolio((prev) => {
      if (!prev) return prev

      const updated = { ...prev }
      const sectionData = updated[section] as PortfolioSections[T][]

      if (sectionData[index]?.attachments) {
        sectionData[index].attachments = sectionData[index].attachments.filter(
            (file: FileAttachment) => file.id !== fileId,
        )
      }

      return updated
    })
  }


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
              attachments: [],
            },
          ],
          projects: [
            {
              title: "E-commerce Platform",
              description: "A full-stack e-commerce solution built with React and Node.js",
              link: "https://github.com/johndoe/ecommerce",
              attachments: [],
            },
          ],
          certifications: [
            {
              name: "AWS Certified Developer",
              authority: "Amazon Web Services",
              issuedAt: "2024-01-15",
              attachments: [],
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

  const displayName = user?.fullName || portfolio?.fullName || "Professional Portfolio"

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
                          <h1 className="text-3xl font-bold mb-2">{displayName}</h1>
                          <p className="text-white/90 text-lg font-medium">
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
                <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-6">
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
                                <div className="space-y-3">
                                  <h5 className="font-medium text-accent-foreground">
                                    Attach Files (transcripts, certificates, etc.)
                                  </h5>
                                  <FileUpload
                                      section="education"
                                      attachments={edu.attachments ?? []}  // <-- fallback to []
                                      onAttachmentsChange={(newAttachments) => {
                                        const copy = [...(portfolio?.education || [])]
                                        copy[i].attachments = newAttachments
                                        setPortfolio((prev) => ({ ...prev!, education: copy }))
                                      }}
                                  />
                                  {edu.attachments && edu.attachments.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {edu.attachments.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-2 px-3 py-2 bg-background rounded-xl border"
                                            >
                                              {file.type.startsWith("image/") ? (
                                                  <ImageIcon className="h-4 w-4 text-blue-500" />
                                              ) : (
                                                  <FileText className="h-4 w-4 text-green-500" />
                                              )}
                                              <span className="text-sm truncate max-w-32">{file.name}</span>
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleFileRemove("education", i, file.id)}
                                                  className="h-6 w-6 p-0"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                        ))}
                                      </div>
                                  )}
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
                                    {
                                      school: "",
                                      degree: "",
                                      startYear: new Date().getFullYear(),
                                      endYear: 0,
                                      attachments: [],
                                    },
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
                                <AttachmentDisplay attachments={edu.attachments} />
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
                                <div className="space-y-3">
                                  <h5 className="font-medium text-accent-foreground">
                                    Attach Files (screenshots, demos, documentation)
                                  </h5>
                                  <FileUpload
                                      section="projects"
                                      attachments={proj.attachments ?? []}
                                      onAttachmentsChange={(newAttachments) => {
                                        const copy = [...(portfolio?.projects || [])]
                                        copy[i].attachments = newAttachments
                                        setPortfolio((prev) => ({ ...prev!, projects: copy }))
                                      }}
                                      maxFiles={10}
                                  />
                                  {proj.attachments && proj.attachments.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {proj.attachments.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-2 px-3 py-2 bg-background rounded-xl border"
                                            >
                                              {file.type.startsWith("image/") ? (
                                                  <ImageIcon className="h-4 w-4 text-blue-500" />
                                              ) : (
                                                  <FileText className="h-4 w-4 text-green-500" />
                                              )}
                                              <span className="text-sm truncate max-w-32">{file.name}</span>
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleFileRemove("projects", i, file.id)}
                                                  className="h-6 w-6 p-0"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                        ))}
                                      </div>
                                  )}
                                </div>
                              </motion.div>
                          ))}
                        </AnimatePresence>
                        <Button
                            onClick={() =>
                                setPortfolio((prev) => ({
                                  ...prev!,
                                  projects: [
                                    ...(prev?.projects || []),
                                    { title: "", description: "", link: "", attachments: [] },
                                  ],
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
                              <AttachmentDisplay attachments={proj.attachments} />
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
                                <div className="space-y-3">
                                  <h5 className="font-medium text-accent-foreground">
                                    Attach Files (certificates, badges, etc.)
                                  </h5>
                                  <FileUpload
                                      section="certifications"
                                      attachments={cert.attachments ?? []}
                                      onAttachmentsChange={(newAttachments) => {
                                        const copy = [...(portfolio?.certifications || [])]
                                        copy[i].attachments = newAttachments
                                        setPortfolio((prev) => ({ ...prev!, certifications: copy }))
                                      }}
                                      maxFiles={5}
                                  />
                                  {cert.attachments && cert.attachments.length > 0 && (
                                      <div className="flex flex-wrap gap-2">
                                        {cert.attachments.map((file) => (
                                            <div
                                                key={file.id}
                                                className="flex items-center gap-2 px-3 py-2 bg-background rounded-xl border"
                                            >
                                              {file.type.startsWith("image/") ? (
                                                  <ImageIcon className="h-4 w-4 text-blue-500" />
                                              ) : (
                                                  <FileText className="h-4 w-4 text-green-500" />
                                              )}
                                              <span className="text-sm truncate max-w-32">{file.name}</span>
                                              <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => handleFileRemove("certifications", i, file.id)}
                                                  className="h-6 w-6 p-0"
                                              >
                                                <X className="h-3 w-3" />
                                              </Button>
                                            </div>
                                        ))}
                                      </div>
                                  )}
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
                                    { name: "", authority: "", issuedAt: "", expiresAt: "", attachments: [] },
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
                              <AttachmentDisplay attachments={cert.attachments} />
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
