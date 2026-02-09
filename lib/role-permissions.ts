import { DefaultCompanyRole, Permission } from "@prisma/client"

/**
 * Default permissions for each company role
 * These define what each role can do by default
 */
export const DEFAULT_ROLE_PERMISSIONS: Record<DefaultCompanyRole, Permission[]> = {
  OWNER: [
    // Company Management - Full access
    Permission.DELETE_COMPANY,
    Permission.EDIT_COMPANY,
    Permission.TRANSFER_OWNERSHIP,
    
    // Member Management - Full access
    Permission.MANAGE_MEMBERS,
    Permission.INVITE_MEMBERS,
    Permission.REMOVE_MEMBERS,
    Permission.CHANGE_ROLES,
    Permission.DELEGATE_PERMISSIONS,
    
    // Internship Management - Full access
    Permission.CREATE_INTERNSHIPS,
    Permission.EDIT_INTERNSHIPS,
    Permission.DELETE_INTERNSHIPS,
    
    // Application Management - Full access
    Permission.VIEW_APPLICATIONS,
    Permission.MANAGE_APPLICATIONS,
    Permission.REVIEW_COVER_LETTERS,
    
    // Candidate Management - Full access
    Permission.VIEW_CANDIDATES,
    Permission.SEARCH_CANDIDATES,
    
    // Interview Management - Full access
    Permission.SCHEDULE_INTERVIEWS,
    Permission.CONDUCT_INTERVIEWS,
    
    // Messaging - Full access
    Permission.SEND_MESSAGES,
    Permission.VIEW_MESSAGES,
    
    // Experience & Assignments - Full access
    Permission.CREATE_ASSIGNMENTS,
    Permission.GRADE_EXPERIENCES,
  ],

  ADMIN: [
    // Company Management - Limited (no delete/transfer)
    Permission.EDIT_COMPANY,
    
    // Member Management - Full access
    Permission.MANAGE_MEMBERS,
    Permission.INVITE_MEMBERS,
    Permission.REMOVE_MEMBERS,
    Permission.CHANGE_ROLES,
    Permission.DELEGATE_PERMISSIONS,
    
    // Internship Management - Full access
    Permission.CREATE_INTERNSHIPS,
    Permission.EDIT_INTERNSHIPS,
    Permission.DELETE_INTERNSHIPS,
    
    // Application Management - Full access
    Permission.VIEW_APPLICATIONS,
    Permission.MANAGE_APPLICATIONS,
    Permission.REVIEW_COVER_LETTERS,
    
    // Candidate Management - Full access
    Permission.VIEW_CANDIDATES,
    Permission.SEARCH_CANDIDATES,
    
    // Interview Management - Full access
    Permission.SCHEDULE_INTERVIEWS,
    Permission.CONDUCT_INTERVIEWS,
    
    // Messaging - Full access
    Permission.SEND_MESSAGES,
    Permission.VIEW_MESSAGES,
    
    // Experience & Assignments - Full access
    Permission.CREATE_ASSIGNMENTS,
    Permission.GRADE_EXPERIENCES,
  ],

  HR_MANAGER: [
    // Member Management - Limited
    Permission.INVITE_MEMBERS,
    
    // Internship Management - Full access
    Permission.CREATE_INTERNSHIPS,
    Permission.EDIT_INTERNSHIPS,
    Permission.DELETE_INTERNSHIPS,
    
    // Application Management - Full access
    Permission.VIEW_APPLICATIONS,
    Permission.MANAGE_APPLICATIONS,
    Permission.REVIEW_COVER_LETTERS,
    
    // Candidate Management - Full access
    Permission.VIEW_CANDIDATES,
    Permission.SEARCH_CANDIDATES,
    
    // Interview Management - Full access
    Permission.SCHEDULE_INTERVIEWS,
    Permission.CONDUCT_INTERVIEWS,
    
    // Messaging - Full access
    Permission.SEND_MESSAGES,
    Permission.VIEW_MESSAGES,
    
    // Experience & Assignments - Full access
    Permission.CREATE_ASSIGNMENTS,
    Permission.GRADE_EXPERIENCES,
  ],

  HR_RECRUITER: [
    // Application Management - Limited
    Permission.VIEW_APPLICATIONS,
    Permission.MANAGE_APPLICATIONS,
    Permission.REVIEW_COVER_LETTERS,
    
    // Candidate Management - Full access
    Permission.VIEW_CANDIDATES,
    Permission.SEARCH_CANDIDATES,
    
    // Interview Management - Full access
    Permission.SCHEDULE_INTERVIEWS,
    Permission.CONDUCT_INTERVIEWS,
    
    // Messaging - Full access
    Permission.SEND_MESSAGES,
    Permission.VIEW_MESSAGES,
  ],

  VIEWER: [
    // Candidate Management - View only
    Permission.VIEW_CANDIDATES,
    
    // Messaging - View only
    Permission.VIEW_MESSAGES,
  ],

  MEMBER: [
    // Basic view permissions for team members who joined via code
    Permission.VIEW_CANDIDATES,
    Permission.VIEW_APPLICATIONS,
    
    // Messaging - Can send and view
    Permission.SEND_MESSAGES,
    Permission.VIEW_MESSAGES,
  ],
}

/**
 * Role display information for UI
 */
export const ROLE_DISPLAY_INFO: Record<DefaultCompanyRole, {
  label: string
  description: string
  color: string
  badgeColor: string
}> = {
  OWNER: {
    label: "Owner",
    description: "Full access to all company features. Can transfer ownership and delete company.",
    color: "#7c3aed", // purple
    badgeColor: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  },
  ADMIN: {
    label: "Admin",
    description: "Full access except ownership transfer and company deletion. Can manage all team members.",
    color: "#2563eb", // blue
    badgeColor: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  },
  HR_MANAGER: {
    label: "HR Manager",
    description: "Manage internships, applications, interviews, and candidates. Can invite new members.",
    color: "#059669", // green
    badgeColor: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  HR_RECRUITER: {
    label: "HR Recruiter",
    description: "View and manage applications, schedule interviews, and communicate with candidates.",
    color: "#d97706", // amber
    badgeColor: "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  },
  VIEWER: {
    label: "Viewer",
    description: "Read-only access to view candidates, messages, and analytics.",
    color: "#6b7280", // gray
    badgeColor: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  },
  MEMBER: {
    label: "Member",
    description: "Basic team member who joined via invitation code. Can view and communicate.",
    color: "#0ea5e9", // sky blue
    badgeColor: "bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-300",
  },
}

/**
 * Permission display information for UI
 */
export const PERMISSION_DISPLAY_INFO: Record<Permission, {
  label: string
  description: string
  category: string
}> = {
  // Company Management
  DELETE_COMPANY: {
    label: "Delete Company",
    description: "Permanently delete the company and all associated data",
    category: "Company Management",
  },
  EDIT_COMPANY: {
    label: "Edit Company",
    description: "Edit company profile, logo, and settings",
    category: "Company Management",
  },
  TRANSFER_OWNERSHIP: {
    label: "Transfer Ownership",
    description: "Transfer company ownership to another member",
    category: "Company Management",
  },

  // Member Management
  MANAGE_MEMBERS: {
    label: "Manage Members",
    description: "Full control over team members",
    category: "Member Management",
  },
  INVITE_MEMBERS: {
    label: "Invite Members",
    description: "Invite new members to the company",
    category: "Member Management",
  },
  REMOVE_MEMBERS: {
    label: "Remove Members",
    description: "Remove members from the company",
    category: "Member Management",
  },
  CHANGE_ROLES: {
    label: "Change Roles",
    description: "Change the roles of team members",
    category: "Member Management",
  },
  DELEGATE_PERMISSIONS: {
    label: "Delegate Permissions",
    description: "Grant additional permissions to team members",
    category: "Member Management",
  },

  // Internship Management
  CREATE_INTERNSHIPS: {
    label: "Create Internships",
    description: "Create new internship listings",
    category: "Internship Management",
  },
  EDIT_INTERNSHIPS: {
    label: "Edit Internships",
    description: "Edit existing internship listings",
    category: "Internship Management",
  },
  DELETE_INTERNSHIPS: {
    label: "Delete Internships",
    description: "Delete internship listings",
    category: "Internship Management",
  },

  // Application Management
  VIEW_APPLICATIONS: {
    label: "View Applications",
    description: "View internship applications",
    category: "Application Management",
  },
  MANAGE_APPLICATIONS: {
    label: "Manage Applications",
    description: "Manage application status and notes",
    category: "Application Management",
  },
  REVIEW_COVER_LETTERS: {
    label: "Review Cover Letters",
    description: "Review and provide feedback on student cover letters",
    category: "Application Management",
  },

  // Candidate Management
  VIEW_CANDIDATES: {
    label: "View Candidates",
    description: "View candidate profiles and information",
    category: "Candidate Management",
  },
  SEARCH_CANDIDATES: {
    label: "Search Candidates",
    description: "Search and filter candidates",
    category: "Candidate Management",
  },

  // Interview Management
  SCHEDULE_INTERVIEWS: {
    label: "Schedule Interviews",
    description: "Schedule interviews with candidates",
    category: "Interview Management",
  },
  CONDUCT_INTERVIEWS: {
    label: "Conduct Interviews",
    description: "Conduct and manage interviews",
    category: "Interview Management",
  },

  // Messaging
  SEND_MESSAGES: {
    label: "Send Messages",
    description: "Send messages to candidates",
    category: "Messaging",
  },
  VIEW_MESSAGES: {
    label: "View Messages",
    description: "View conversation history",
    category: "Messaging",
  },

  // Experience & Assignments
  CREATE_ASSIGNMENTS: {
    label: "Create Assignments",
    description: "Create assignments for interns",
    category: "Experience & Assignments",
  },
  GRADE_EXPERIENCES: {
    label: "Grade Experiences",
    description: "Grade and endorse intern experiences",
    category: "Experience & Assignments",
  },
}

/**
 * Get all permissions grouped by category
 */
export function getPermissionsByCategory(): Record<string, Permission[]> {
  const grouped: Record<string, Permission[]> = {}
  
  for (const [permission, info] of Object.entries(PERMISSION_DISPLAY_INFO)) {
    if (!grouped[info.category]) {
      grouped[info.category] = []
    }
    grouped[info.category].push(permission as Permission)
  }
  
  return grouped
}

/**
 * Check if a role has a specific permission by default
 */
export function roleHasPermission(role: DefaultCompanyRole, permission: Permission): boolean {
  return DEFAULT_ROLE_PERMISSIONS[role].includes(permission)
}

/**
 * Get the role hierarchy level (higher = more permissions)
 */
export function getRoleLevel(role: DefaultCompanyRole): number {
  const levels: Record<DefaultCompanyRole, number> = {
    OWNER: 6,
    ADMIN: 5,
    HR_MANAGER: 4,
    HR_RECRUITER: 3,
    MEMBER: 2,
    VIEWER: 1,
  }
  return levels[role]
}

/**
 * Check if roleA can manage roleB (has higher or equal authority)
 */
export function canManageRole(managerRole: DefaultCompanyRole, targetRole: DefaultCompanyRole): boolean {
  // Owner can manage everyone
  if (managerRole === "OWNER") return true
  
  // Admin can manage everyone except owner
  if (managerRole === "ADMIN" && targetRole !== "OWNER") return true
  
  // Others cannot manage roles
  return false
}
