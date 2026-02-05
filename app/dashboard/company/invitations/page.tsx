"use client"

import * as React from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useUser } from "@clerk/nextjs"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  UserPlus,
  Loader2,
  AlertCircle,
  ArrowRight,
  MapPin,
} from "lucide-react"
import { toast } from "sonner"

interface InvitationData {
  email: string
  role: string
  company: {
    id: string
    name: string
    logo: string | null
    location: string | null
    description: string | null
  }
  invitedBy: {
    name: string
  }
  expiresAt: string
}

const roleDisplayNames: Record<string, string> = {
  OWNER: "Owner",
  ADMIN: "Administrator",
  HR_MANAGER: "HR Manager",
  HR_RECRUITER: "HR Recruiter",
  VIEWER: "Viewer",
}

function InvitationSkeleton() {
  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center pb-2">
          <Skeleton className="h-16 w-16 rounded-full mx-auto mb-4" />
          <Skeleton className="h-6 w-48 mx-auto mb-2" />
          <Skeleton className="h-4 w-64 mx-auto" />
        </CardHeader>
        <CardContent className="space-y-4">
          <Skeleton className="h-20 w-full rounded-lg" />
          <div className="flex gap-3">
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function InvitationsPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { user, isLoaded: userLoaded } = useUser()
  
  const token = searchParams?.get("token") ?? null
  
  const [invitation, setInvitation] = React.useState<InvitationData | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [accepting, setAccepting] = React.useState(false)
  const [declining, setDeclining] = React.useState(false)
  const [accepted, setAccepted] = React.useState(false)

  // Fetch invitation details
  React.useEffect(() => {
    async function fetchInvitation() {
      if (!token) {
        setError("No invitation token provided")
        setLoading(false)
        return
      }

      try {
        const res = await fetch(`/api/company/invitations/${token}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || "Failed to load invitation")
          setLoading(false)
          return
        }

        setInvitation(data.invitation)
      } catch (err) {
        console.error("Error fetching invitation:", err)
        setError("Failed to load invitation")
      } finally {
        setLoading(false)
      }
    }

    fetchInvitation()
  }, [token])

  const handleAccept = async () => {
    if (!token) return

    setAccepting(true)
    try {
      const res = await fetch("/api/company/members/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Failed to accept invitation")
      }

      setAccepted(true)
      toast.success("Welcome to the team!", {
        description: `You've successfully joined ${data.membership.companyName}`,
      })

      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push("/dashboard/company")
      }, 2000)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to accept invitation")
    } finally {
      setAccepting(false)
    }
  }

  const handleDecline = async () => {
    if (!token) return

    setDeclining(true)
    try {
      const res = await fetch(`/api/company/invitations/${token}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Failed to decline invitation")
      }

      toast.success("Invitation declined")
      router.push("/dashboard")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to decline invitation")
    } finally {
      setDeclining(false)
    }
  }

  // Show loading state
  if (loading || !userLoaded) {
    return <InvitationSkeleton />
  }

  // No token provided
  if (!token) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <AlertCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Invitation Link</h2>
              <p className="text-muted-foreground mb-6">
                This invitation link is invalid or incomplete. Please check the link and try again.
              </p>
              <Button onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <XCircle className="h-12 w-12 text-destructive mb-4" />
              <h2 className="text-xl font-semibold mb-2">
                {error === "Invitation has expired" ? "Invitation Expired" : 
                 error === "Invitation has already been accepted" ? "Already Accepted" :
                 "Invitation Not Found"}
              </h2>
              <p className="text-muted-foreground mb-6">
                {error === "Invitation has expired" 
                  ? "This invitation has expired. Please ask the sender to send a new invitation."
                  : error === "Invitation has already been accepted"
                  ? "This invitation has already been used."
                  : error}
              </p>
              <Button onClick={() => router.push("/dashboard")}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Accepted state
  if (accepted) {
    return (
      <div className="container max-w-lg mx-auto py-12 px-4">
        <Card className="border-green-500">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center py-8">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-4">
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Welcome to the Team!</h2>
              <p className="text-muted-foreground mb-6">
                You&apos;ve successfully joined {invitation?.company.name}. Redirecting to your dashboard...
              </p>
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Check if user email matches invitation
  const emailMismatch = user && invitation && 
    user.primaryEmailAddress?.emailAddress.toLowerCase() !== invitation.email.toLowerCase()

  return (
    <div className="container max-w-lg mx-auto py-12 px-4">
      <Card>
        <CardHeader className="text-center pb-4">
          {/* Company Logo/Avatar */}
          <div className="mx-auto mb-4">
            {invitation?.company.logo ? (
              <img
                src={invitation.company.logo}
                alt={invitation.company.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-border"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
            )}
          </div>
          
          <CardTitle className="text-2xl">Team Invitation</CardTitle>
          <CardDescription className="text-base">
            You&apos;ve been invited to join <strong className="text-foreground">{invitation?.company.name}</strong>
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Invitation Details */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Invited by</span>
              <span className="font-medium">{invitation?.invitedBy.name}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Your role</span>
              <Badge variant="secondary">
                {roleDisplayNames[invitation?.role || ""] || invitation?.role}
              </Badge>
            </div>
            {invitation?.company.location && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Location</span>
                <span className="flex items-center gap-1 text-sm">
                  <MapPin className="h-3 w-3" />
                  {invitation.company.location}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expires</span>
              <span className="flex items-center gap-1 text-sm">
                <Clock className="h-3 w-3" />
                {invitation?.expiresAt 
                  ? new Date(invitation.expiresAt).toLocaleDateString()
                  : "N/A"}
              </span>
            </div>
          </div>

          {/* Company Description */}
          {invitation?.company.description && (
            <div className="text-sm text-muted-foreground">
              <p className="line-clamp-3">{invitation.company.description}</p>
            </div>
          )}

          {/* Email Mismatch Warning */}
          {emailMismatch && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
              <div className="flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-amber-800 dark:text-amber-200">
                    Email Mismatch
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-1">
                    This invitation was sent to <strong>{invitation?.email}</strong>, but you&apos;re signed in as <strong>{user?.primaryEmailAddress?.emailAddress}</strong>.
                  </p>
                  <p className="text-amber-700 dark:text-amber-300 mt-2">
                    Please sign in with the correct email to accept this invitation.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
              disabled={accepting || declining}
            >
              {declining && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Decline
            </Button>
            <Button
              className="flex-1 gap-2"
              onClick={handleAccept}
              disabled={accepting || declining || !!emailMismatch}
            >
              {accepting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Accept Invitation
              {!accepting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>

          {/* Help Text */}
          <p className="text-xs text-center text-muted-foreground">
            By accepting, you&apos;ll join {invitation?.company.name}&apos;s team and be able to access their company dashboard.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
