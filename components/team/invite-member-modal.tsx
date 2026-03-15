"use client"

import * as React from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Loader2, UserPlus, Mail, Shield, Send, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { useTranslation } from "@/lib/i18n"

interface InviteMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

const DEFAULT_ROLES = [
  { value: "ADMIN", labelKey: "team.roleAdmin", descKey: "team.adminDesc", color: "text-red-500 bg-red-500/10" },
  { value: "HR_MANAGER", labelKey: "team.roleHRManager", descKey: "team.hrManagerDesc", color: "text-blue-500 bg-blue-500/10" },
  { value: "HR_RECRUITER", labelKey: "team.roleHRRecruiter", descKey: "team.hrRecruiterDesc", color: "text-emerald-500 bg-emerald-500/10" },
  { value: "MEMBER", labelKey: "team.roleMember", descKey: "team.memberDesc", color: "text-sky-500 bg-sky-500/10" },
  { value: "VIEWER", labelKey: "team.roleViewer", descKey: "team.viewerDesc", color: "text-gray-500 bg-gray-500/10" },
]

interface CustomRole {
  id: string
  name: string
  description: string | null
  color: string | null
}

export function InviteMemberModal({
  open,
  onOpenChange,
  onSuccess,
}: InviteMemberModalProps) {
  const { t } = useTranslation()
  const [email, setEmail] = React.useState("")
  const [role, setRole] = React.useState<string>("VIEWER")
  const [loading, setLoading] = React.useState(false)
  const [customRoles, setCustomRoles] = React.useState<CustomRole[]>([])

  React.useEffect(() => {
    if (open) {
      fetch("/api/company/roles")
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data?.customRoles) {
            setCustomRoles(data.customRoles)
          }
        })
        .catch(() => {})
    }
  }, [open])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email) {
      toast.error(t("team.pleaseEnterEmail"))
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error(t("team.pleaseEnterValidEmail"))
      return
    }

    setLoading(true)

    try {
      const isCustomRole = role.startsWith("custom:")
      const customRoleId = isCustomRole ? role.replace("custom:", "") : undefined
      const defaultRole = isCustomRole ? undefined : role

      const res = await fetch("/api/company/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, role: defaultRole, customRoleId }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || t("team.failedToSendInvitation"))
      }

      toast.success(t("team.invitationSent"), {
        description: `${t("team.invitationSentTo")} ${email}`,
      })

      // Reset form
      setEmail("")
      setRole("VIEWER")
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("team.failedToSendInvitation"))
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = DEFAULT_ROLES.find(r => r.value === role)
  const selectedCustomRole = role.startsWith("custom:") 
    ? customRoles.find(r => r.id === role.replace("custom:", "")) 
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-indigo-200/50 dark:border-indigo-800/30">
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 px-6 pt-6 pb-5 text-white">
          <div className="flex items-center gap-3 mb-2">
            <div className="h-10 w-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <UserPlus className="h-5 w-5" />
            </div>
            <div>
              <DialogHeader className="p-0 space-y-0">
                <DialogTitle className="text-white text-lg font-bold">
                  {t("team.inviteTeamMember")}
                </DialogTitle>
                <DialogDescription className="text-white/70 text-sm mt-0.5">
                  {t("team.inviteDescription")}
                </DialogDescription>
              </DialogHeader>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-6 pb-6 pt-5 space-y-5">
          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-indigo-500" />
              {t("team.emailAddress")}
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-9 h-11 border-border/60 focus-visible:ring-indigo-500/30 focus-visible:border-indigo-500 rounded-xl transition-colors"
                disabled={loading}
              />
            </div>
          </div>

          {/* Role Field */}
          <div className="space-y-2">
            <Label htmlFor="role" className="text-sm font-semibold flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-indigo-500" />
              {t("team.role")}
            </Label>
            <Select value={role} onValueChange={setRole} disabled={loading}>
              <SelectTrigger className="h-11 border-border/60 focus:ring-indigo-500/30 focus:border-indigo-500 rounded-xl">
                <SelectValue placeholder={t("team.selectARole")} />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {DEFAULT_ROLES.map((r) => (
                  <SelectItem key={r.value} value={r.value} className="rounded-lg py-2.5">
                    <div className="flex items-center gap-2.5">
                      <Badge variant="secondary" className={`${r.color} text-[10px] px-1.5 py-0 font-semibold border-0`}>
                        {t(r.labelKey)}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {t(r.descKey)}
                      </span>
                    </div>
                  </SelectItem>
                ))}
                {customRoles.length > 0 && (
                  <>
                    <div className="px-2 py-1.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {t("team.customRole")}
                    </div>
                    {customRoles.map((cr) => (
                      <SelectItem key={cr.id} value={`custom:${cr.id}`} className="rounded-lg py-2.5">
                        <div className="flex items-center gap-2.5">
                          <Badge variant="secondary" className="text-[10px] px-1.5 py-0 font-semibold border-0" style={cr.color ? { backgroundColor: `${cr.color}20`, color: cr.color } : undefined}>
                            {cr.name}
                          </Badge>
                          {cr.description && (
                            <span className="text-xs text-muted-foreground">
                              {cr.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {/* Selected role preview */}
            {selectedRole && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">{t(selectedRole.labelKey)}</span> — {t(selectedRole.descKey)}. {t("team.canChangeAnytime")}
                </p>
              </div>
            )}
            {selectedCustomRole && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">{selectedCustomRole.name}</span>{selectedCustomRole.description ? ` — ${selectedCustomRole.description}` : ""}. {t("team.canChangeAnytime")}
                </p>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="rounded-xl border-border/60"
            >
              {t("team.cancel")}
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-indigo-500/20 font-semibold gap-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              {t("team.sendInvitation")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
