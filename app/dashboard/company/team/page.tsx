"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  AlertCircle,
  RefreshCw,
  Eye,
} from "lucide-react"
import { InviteMemberModal } from "@/components/team/invite-member-modal"
import { MemberList } from "@/components/team/member-list"
import { RolesList } from "@/components/team/roles-list"
import { PendingInvitations } from "@/components/team/pending-invitations"
import { OwnershipTransferSection } from "@/components/team/ownership-transfer-section"

interface Member {
  id: string
  userId: string
  name: string
  email: string
  defaultRole: string | null
  customRole: {
    id: string
    name: string
    color: string | null
  } | null
  extraPermissions: string[]
  status: string
  invitedAt: string
  joinedAt: string | null
  invitedBy: {
    name: string
  } | null
}

interface MembersData {
  members: Member[]
  companyId: string
}

interface UserPermissions {
  membership: {
    id: string
    companyId: string
    defaultRole: string | null
    customRole: {
      id: string
      name: string
      color: string | null
    } | null
  }
  permissions: string[]
  isOwner: boolean
  isAdmin: boolean
}

export default function TeamPage() {
  const [members, setMembers] = React.useState<Member[]>([])
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [inviteModalOpen, setInviteModalOpen] = React.useState(false)
  const [userPermissions, setUserPermissions] = React.useState<UserPermissions | null>(null)

  // Fetch current user's permissions
  const fetchPermissions = React.useCallback(async () => {
    try {
      const res = await fetch("/api/company/me/permissions")
      if (res.ok) {
        const data = await res.json()
        setUserPermissions(data)
      }
    } catch (err) {
      console.error("Failed to fetch permissions:", err)
    }
  }, [])

  const fetchMembers = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/company/members")
      if (!res.ok) {
        throw new Error("Failed to fetch team members")
      }
      const data: MembersData = await res.json()
      setMembers(data.members)
      setCompanyId(data.companyId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    fetchMembers()
    fetchPermissions()
  }, [fetchMembers, fetchPermissions])

  const handleInviteSuccess = () => {
    setInviteModalOpen(false)
    fetchMembers()
  }

  const handleMemberUpdate = () => {
    fetchMembers()
  }

  // Check permissions for UI visibility
  const canInviteMembers = userPermissions?.permissions?.includes("INVITE_MEMBERS") ?? false
  const canManageRoles = userPermissions?.permissions?.includes("CHANGE_ROLES") ?? false
  const isOwner = userPermissions?.isOwner ?? false

  if (loading) {
    return <TeamPageSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
            <Button
              variant="outline"
              className="mt-4"
              onClick={fetchMembers}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeMembers = members.filter(m => m.status === "ACTIVE")
  const pendingMembers = members.filter(m => m.status === "PENDING")
  const ownerMember = members.find(m => m.defaultRole === "OWNER")

  // Get current user's role for display
  const currentUserRole = userPermissions?.membership?.defaultRole || 
    userPermissions?.membership?.customRole?.name || "Member"

  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1">
            {canInviteMembers 
              ? "Manage your team members, roles, and permissions"
              : "View your team members and their roles"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Show current user's role badge */}
          <Badge variant="outline" className="hidden sm:flex items-center gap-1">
            <Eye className="h-3 w-3" />
            Your role: {currentUserRole}
          </Badge>
          {canInviteMembers && (
            <Button onClick={() => setInviteModalOpen(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeMembers.length}</div>
            <p className="text-xs text-muted-foreground">
              {pendingMembers.length} pending invitation{pendingMembers.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Owner</CardTitle>
            <Crown className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium truncate">
              {ownerMember?.name || "N/A"}
            </div>
            <p className="text-xs text-muted-foreground truncate">
              {ownerMember?.email}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Roles</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-1">
              <Badge variant="secondary">5 Default</Badge>
              <Badge variant="outline">+ Custom</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Members
            <Badge variant="secondary" className="ml-1">
              {activeMembers.length}
            </Badge>
          </TabsTrigger>
          {canManageRoles && (
            <TabsTrigger value="roles" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Roles
            </TabsTrigger>
          )}
          {canInviteMembers && (
            <TabsTrigger value="invitations" className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Invitations
              {pendingMembers.length > 0 && (
                <Badge variant="destructive" className="ml-1">
                  {pendingMembers.length}
                </Badge>
              )}
            </TabsTrigger>
          )}
          {isOwner && (
            <TabsTrigger value="ownership" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              Ownership
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="members">
          <MemberList
            members={activeMembers}
            companyId={companyId || ""}
            onUpdate={handleMemberUpdate}
            canManageMembers={canManageRoles}
          />
        </TabsContent>

        {canManageRoles && (
          <TabsContent value="roles">
            <RolesList companyId={companyId || ""} />
          </TabsContent>
        )}

        {canInviteMembers && (
          <TabsContent value="invitations">
            <PendingInvitations
              members={pendingMembers}
              companyId={companyId || ""}
              onUpdate={handleMemberUpdate}
            />
          </TabsContent>
        )}

        {isOwner && (
          <TabsContent value="ownership">
            <OwnershipTransferSection
              members={activeMembers}
              companyId={companyId || ""}
              onUpdate={handleMemberUpdate}
            />
          </TabsContent>
        )}
      </Tabs>

      {/* Invite Modal - only if user has permission */}
      {canInviteMembers && (
        <InviteMemberModal
          open={inviteModalOpen}
          onOpenChange={setInviteModalOpen}
          onSuccess={handleInviteSuccess}
        />
      )}
    </div>
  )
}

function TeamPageSkeleton() {
  return (
    <div className="container mx-auto py-6 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map(i => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Skeleton className="h-10 w-96" />

      <Card>
        <CardContent className="pt-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
