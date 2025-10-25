export interface Internship {
    id: string
    companyId: string
    title: string
    description: string
    qualifications?: string | null
    location: string
    paid: boolean
    salary?: number | null
    createdAt: string
    duration?: string
    grade?: string | number
    skills?: string
    applicationStart?: string | null
    applicationEnd?: string | null
}

export interface Application {
    createdAt: number;
    id: string
    status: "PENDING" | "APPROVED" | "REJECTED"
    studentId: string
    internshipId: string
    hasUploadedFiles?: boolean
    student?: {
        name: string | undefined;
        id: string
        email: string
        profile?: { name: string }
    }
    internship?: {
        id: string
        title: string
        company?: { id: string; name: string }
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
