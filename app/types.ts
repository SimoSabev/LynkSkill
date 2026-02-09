export interface Internship {
    company: { name: string } | null
    id: string
    companyId: string
    title: string
    description: string
    qualifications?: string | null
    location: string
    latitude?: number | null
    longitude?: number | null
    paid: boolean
    salary?: number | null
    createdAt: string
    duration?: string
    grade?: string | number
    skills?: string | string[]
    applicationStart?: string | null
    applicationEnd?: string | null
    requiresCoverLetter?: boolean
}

export interface Application {
    id: string
    createdAt: number
    status: "PENDING" | "APPROVED" | "REJECTED"

    studentId: string
    internshipId: string

    // Backend computed fields
    assignmentRequired?: boolean
    hasUploadedFiles?: boolean

    // Cover Letter fields
    coverLetter?: string | null
    coverLetterStatus?: "DRAFT" | "SUBMITTED" | "REVIEWED" | null
    coverLetterGeneratedByAI?: boolean
    coverLetterReviewNote?: string | null
    coverLetterReviewedAt?: string | null
    requiresCoverLetter?: boolean

    // Optional project data (from assignment page)
    project?: {
        id: string
        title: string
    } | null

    student?: {
        id: string
        email: string
        name?: string
        profile?: { name: string }
    }

    internship?: {
        id: string
        title: string
        requiresCoverLetter?: boolean
        company?: {
            id: string
            name: string
        }
    }
}

export interface Portfolio {
    id: string
    studentId: string
    fullName: string
    headline?: string
    age?: number
    bio?: string
    skills?: string[]
    interests?: string[]
    experience?: string
    education?: string
    projects?: string
    certifications?: string
    linkedin?: string
    github?: string
    portfolioUrl?: string
    approvalStatus: "PENDING" | "APPROVED" | "REJECTED"
    createdAt: string
    updatedAt: string
}
