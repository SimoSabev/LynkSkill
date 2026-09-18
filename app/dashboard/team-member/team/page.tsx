"use client"

import * as React from "react"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  Users,
  UserPlus,
  Shield,
  Crown,
  AlertCircle,
  RefreshCw,
  Eye,
  Key,
  Copy,
  EyeOff,
  TrendingUp,
} from "lucide-react"
import { InviteMemberModal } from "@/components/team/invite-member-modal"
import { MemberList } from "@/components/team/member-list"
import { RolesList } from "@/components/team/roles-list"
import { PendingInvitations } from "@/components/team/pending-invitations"
import { OwnershipTransferSection } from "@/components/team/ownership-transfer-section"
import { TeamCodeSettings } from "@/components/team/team-code-settings"
import { useTranslation } from "@/lib/i18n"
import { toast } from "sonner"

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
  companyCode?: string | null
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
  const { t } = useTranslation()
  const [members, setMembers] = React.useState<Member[]>([])
  const [companyId, setCompanyId] = React.useState<string | null>(null)
  const [companyCode, setCompanyCode] = React.useState<string | null>(null)
  const [showCode, setShowCode] = React.useState(false)
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
      setCompanyCode(data.companyCode ?? null)
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

  const copyCode = async () => {
    if (!companyCode) return
    try {
      await navigator.clipboard.writeText(companyCode)
      toast.success(t('teamPage.invitationCodeCopied'), {
        description: t('teamPage.shareCodeWithMembers'),
      })
    } catch {
      toast.error(t('teamPage.failedToCopyCode'))
    }
  }

  const maskedCode = companyCode
    ? `****-****-****-${companyCode.split("-")[3] || "****"}`
    : "****-****-****-****"

  // Check permissions for UI visibility
  const canInviteMembers = userPermissions?.permissions?.includes("INVITE_MEMBERS") ?? false
  const canManageRoles = userPermissions?.permissions?.includes("CHANGE_ROLES") ?? false
  const canManageMembers = userPermissions?.permissions?.includes("MANAGE_MEMBERS") ?? false
  const isOwner = userPermissions?.isOwner ?? false

  if (loading) {
    return <TeamPageSkeleton />
  }

  if (error) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4 py-8 text-center">
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <p className="font-medium text-destructive">{error}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('teamPage.errorOccurred')}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={fetchMembers}
                className="border-destructive/30 hover:bg-destructive/10"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('teamPage.tryAgain')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const activeMembers = members.filter(m => m.status === "ACTIVE")
  const pendingMembers = members.filter(m => m.status === "PENDING")
  const ownerMember = members.find(m => m.defaultRole === "OWNER")
  const admins = members.filter(m => m.defaultRole === "ADMIN" && m.status === "ACTIVE")

  // Get current user's role for display
  const currentUserRole = userPermissions?.membership?.defaultRole || 
    userPermissions?.membership?.customRole?.name || "Member"

  return (
    <div className="container mx-auto py-6 px-4 space-y-8">
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 p-8 text-white">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iYSIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMCAyMGgyME0yMCAwdjIwIiBmaWxsPSJub25lIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNhKSIvPjwvc3ZnPg==')] opacity-50" />
        <div className="relative flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Users className="h-5 w-5" />
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {t('teamPage.teamManagement')}
              </h1>
            </div>
            <p className="text-white/80 text-sm md:text-base max-w-lg">
              {canInviteMembers
                ? t('teamPage.manageTeamDesc')
                : t('teamPage.viewTeamDesc')}
            </p>
          </div>
          <div className="flex items-center gap-3 self-start md:self-center">
            <Badge variant="outline" className="border-white/30 text-white bg-white/10 backdrop-blur-sm hidden sm:flex items-center gap-1.5 py-1.5 px-3">
              <Eye className="h-3 w-3" />
              {t('teamPage.yourRole')} {currentUserRole}
            </Badge>
            {canInviteMembers && (
              <Button
                onClick={() => setInviteModalOpen(true)}
                className="bg-white text-indigo-700 hover:bg-white/90 shadow-lg shadow-indigo-900/20 font-semibold rounded-xl"
                size="lg"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {t('teamPage.inviteMember')}
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="border-border/50 bg-gradient-to-br from-violet-50 to-violet-100/50 dark:from-violet-950/30 dark:to-violet-900/10 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-violet-600 dark:text-violet-400 font-medium">
              <div className="h-7 w-7 rounded-lg bg-violet-500/10 dark:bg-violet-500/20 flex items-center justify-center">
                <Users className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
              </div>
              {t('teamPage.totalMembers')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-violet-700 dark:text-violet-300">{activeMembers.length}</span>
              <span className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> {t('teamPage.active')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/30 dark:to-amber-900/10 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-medium">
              <div className="h-7 w-7 rounded-lg bg-amber-500/10 dark:bg-amber-500/20 flex items-center justify-center">
                <Crown className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              {t('teamPage.owner')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm font-semibold truncate text-amber-700 dark:text-amber-300">
              {ownerMember?.name || "-"}
            </div>
            <p className="text-xs text-muted-foreground truncate mt-0.5">
              {ownerMember?.email}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/30 dark:to-blue-900/10 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-medium">
              <div className="h-7 w-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                <Shield className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
              </div>
              {t('teamPage.admins')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-blue-700 dark:text-blue-300">{admins.length}</span>
              <span className="text-xs text-muted-foreground mb-1">{admins.length !== 1 ? t('teamPage.administrators') : t('teamPage.administrator')}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/30 dark:to-orange-900/10 hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-2 text-orange-600 dark:text-orange-400 font-medium">
              <div className="h-7 w-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                <UserPlus className="h-3.5 w-3.5 text-orange-600 dark:text-orange-400" />
              </div>
              {t('teamPage.pending')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <span className="text-3xl font-bold text-orange-700 dark:text-orange-300">{pendingMembers.length}</span>
              {pendingMembers.length > 0 && (
                <Badge variant="secondary" className="mb-1 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 text-[10px] px-1.5">
                  {t('teamPage.awaiting')}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Company Invitation Code Quick View */}
      {companyCode && canManageMembers && (
        <Card className="border-indigo-200/50 dark:border-indigo-800/30 bg-gradient-to-r from-indigo-50/80 via-violet-50/50 to-blue-50/80 dark:from-indigo-950/30 dark:via-violet-950/20 dark:to-blue-950/30">
          <CardContent className="py-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-md shadow-indigo-500/20">
                  <Key className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-sm text-foreground">
                    {t('teamPage.companyInvitationCode')}
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    {t('teamPage.shareToJoinInstantly')}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="font-mono text-lg md:text-xl font-bold tracking-[0.15em] bg-white/80 dark:bg-black/20 px-4 py-2.5 rounded-xl border border-indigo-200/50 dark:border-indigo-700/30 select-all text-indigo-700 dark:text-indigo-300">
                  {showCode ? companyCode : maskedCode}
                </div>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowCode(!showCode)}
                        className="hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      >
                        {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{showCode ? t('teamPage.hideCode') : t('teamPage.showCode')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={copyCode}
                        className="hover:bg-indigo-100 dark:hover:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('teamPage.copyCode')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="members" className="space-y-6">
        <div className="bg-muted/30 rounded-xl p-1 border border-border/50">
          <TabsList className="grid w-full grid-cols-5 bg-transparent h-auto gap-1">
            <TabsTrigger
              value="members"
              className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5"
            >
              <Users className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only">{t('teamPage.members')}</span>
              <Badge variant="secondary" className="ml-1 data-[state=active]:bg-white/20 data-[state=active]:text-white hidden sm:inline-flex">
                {activeMembers.length}
              </Badge>
            </TabsTrigger>
            {canManageRoles && (
              <TabsTrigger
                value="roles"
                className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5"
              >
                <Shield className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">{t('teamPage.roles')}</span>
              </TabsTrigger>
            )}
            {canInviteMembers && (
              <TabsTrigger
                value="invitations"
                className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5 relative"
              >
                <UserPlus className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">{t('teamPage.invitations')}</span>
                {pendingMembers.length > 0 && (
                  <Badge className="absolute -top-1.5 -right-1.5 h-5 min-w-5 rounded-full bg-orange-500 text-white text-[10px] p-0 flex items-center justify-center">
                    {pendingMembers.length}
                  </Badge>
                )}
              </TabsTrigger>
            )}
            {canManageMembers && (
              <TabsTrigger
                value="code"
                className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5"
              >
                <Key className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">{t('teamPage.code')}</span>
              </TabsTrigger>
            )}
            {isOwner && (
              <TabsTrigger
                value="ownership"
                className="gap-2 rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-500 data-[state=active]:to-indigo-500 data-[state=active]:text-white data-[state=active]:shadow-md py-2.5"
              >
                <Crown className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only">{t('teamPage.ownership')}</span>
              </TabsTrigger>
            )}
          </TabsList>
        </div>

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

        {canManageMembers && (
          <TabsContent value="code">
            <TeamCodeSettings companyId={companyId || ""} />
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
    <div className="container mx-auto py-6 px-4 space-y-8">
      {/* Hero skeleton */}
      <div className="rounded-2xl bg-gradient-to-r from-violet-600/20 via-indigo-600/20 to-blue-600/20 p-8">
        <Skeleton className="h-8 w-56 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      {/* Stats skeleton */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="rounded-xl border border-border/50 p-5">
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-8 w-14" />
          </div>
        ))}
      </div>
      {/* Code card skeleton */}
      <div className="rounded-xl border border-border/50 p-6">
        <Skeleton className="h-6 w-40 mb-4" />
        <Skeleton className="h-14 w-full rounded-lg" />
      </div>
      {/* Tabs skeleton */}
      <Skeleton className="h-12 w-full rounded-xl" />
      {/* Table skeleton */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
