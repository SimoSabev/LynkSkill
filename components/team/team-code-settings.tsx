"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
    Copy,
    Eye,
    EyeOff,
    RefreshCw,
    Users,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    History,
    Settings,
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "sonner"

interface TeamCodeSettingsProps {
    companyId: string
}

interface CodeData {
    code: string
    maskedCode: string
    enabled: boolean
    expiresAt: string | null
    isExpired: boolean
    timeUntilExpiry: string | null
    maxTeamMembers: number | null
    currentMembers: number
    usageCount: number
    lastRegenAt: string | null
}

interface JoinHistoryItem {
    id: string
    userId: string
    userName: string
    userEmail: string
    joinedAt: string
}

export function TeamCodeSettings({ companyId }: TeamCodeSettingsProps) {
    const [codeData, setCodeData] = React.useState<CodeData | null>(null)
    const [loading, setLoading] = React.useState(true)
    const [showCode, setShowCode] = React.useState(false)
    const [regenerating, setRegenerating] = React.useState(false)
    const [updatingSettings, setUpdatingSettings] = React.useState(false)
    const [showHistoryDialog, setShowHistoryDialog] = React.useState(false)
    const [history, setHistory] = React.useState<JoinHistoryItem[]>([])
    const [historyLoading, setHistoryLoading] = React.useState(false)
    const [showSettingsDialog, setShowSettingsDialog] = React.useState(false)
    const [maxMembers, setMaxMembers] = React.useState<string>("")

    // Fetch code data
    const fetchCodeData = React.useCallback(async () => {
        try {
            const res = await fetch(`/api/company/code?companyId=${companyId}`)
            if (!res.ok) throw new Error("Failed to fetch code")
            const data = await res.json()
            setCodeData(data)
            setMaxMembers(data.maxTeamMembers?.toString() || "")
        } catch (error) {
            console.error("Error fetching code:", error)
            toast.error("Failed to load invitation code")
        } finally {
            setLoading(false)
        }
    }, [companyId])

    React.useEffect(() => {
        fetchCodeData()
    }, [fetchCodeData])

    // Copy code to clipboard
    const copyCode = async () => {
        if (!codeData) return
        try {
            await navigator.clipboard.writeText(codeData.code)
            toast.success("Invitation code copied to clipboard!")
        } catch {
            toast.error("Failed to copy code")
        }
    }

    // Regenerate code
    const regenerateCode = async () => {
        setRegenerating(true)
        try {
            const res = await fetch("/api/company/code", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId }),
            })
            
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.error || "Failed to regenerate code")
            }
            
            const data = await res.json()
            setCodeData(prev => prev ? { ...prev, code: data.code, maskedCode: data.maskedCode } : null)
            toast.success("Invitation code regenerated successfully!")
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Failed to regenerate code")
        } finally {
            setRegenerating(false)
        }
    }

    // Toggle code enabled/disabled
    const toggleCodeEnabled = async () => {
        if (!codeData) return
        setUpdatingSettings(true)
        try {
            const res = await fetch("/api/company/code", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ companyId, enabled: !codeData.enabled }),
            })
            
            if (!res.ok) throw new Error("Failed to update settings")
            
            setCodeData(prev => prev ? { ...prev, enabled: !prev.enabled } : null)
            toast.success(codeData.enabled ? "Invitation code disabled" : "Invitation code enabled")
        } catch {
            toast.error("Failed to update settings")
        } finally {
            setUpdatingSettings(false)
        }
    }

    // Update max members
    const updateMaxMembers = async () => {
        setUpdatingSettings(true)
        try {
            const res = await fetch("/api/company/code", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ 
                    companyId, 
                    maxTeamMembers: maxMembers ? parseInt(maxMembers) : null 
                }),
            })
            
            if (!res.ok) throw new Error("Failed to update settings")
            
            await fetchCodeData()
            toast.success("Settings updated successfully")
            setShowSettingsDialog(false)
        } catch {
            toast.error("Failed to update settings")
        } finally {
            setUpdatingSettings(false)
        }
    }

    // Fetch join history
    const fetchHistory = async () => {
        setHistoryLoading(true)
        try {
            const res = await fetch(`/api/company/code/history?companyId=${companyId}`)
            if (!res.ok) throw new Error("Failed to fetch history")
            const data = await res.json()
            setHistory(data.history)
        } catch {
            toast.error("Failed to load join history")
        } finally {
            setHistoryLoading(false)
        }
    }

    if (loading) {
        return (
            <Card className="border border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        )
    }

    if (!codeData) {
        return (
            <Card className="border border-border/50">
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-muted-foreground">Failed to load invitation code</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className="border border-border/50">
            <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg">
                            <Users className="w-5 h-5 text-purple-500" />
                        </div>
                        <div>
                            <CardTitle className="text-lg">Team Invitation Code</CardTitle>
                            <CardDescription>
                                Share this code with team members to join your company
                            </CardDescription>
                        </div>
                    </div>
                    <Badge 
                        variant={codeData.enabled ? "default" : "secondary"}
                        className={codeData.enabled ? "bg-green-500/10 text-green-500 border-green-500/20" : ""}
                    >
                        {codeData.enabled ? "Active" : "Disabled"}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Code Display */}
                <div className="p-4 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between gap-4">
                        <div className="font-mono text-xl md:text-2xl font-bold tracking-wider select-all">
                            {showCode ? codeData.code : codeData.maskedCode}
                        </div>
                        <div className="flex items-center gap-2">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => setShowCode(!showCode)}
                                        >
                                            {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        {showCode ? "Hide code" : "Show code"}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                            
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={copyCode}
                                        >
                                            <Copy className="w-4 h-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Copy code</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground">Used</div>
                        <div className="text-lg font-semibold">{codeData.usageCount} times</div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground">Team Size</div>
                        <div className="text-lg font-semibold">
                            {codeData.currentMembers}
                            {codeData.maxTeamMembers && ` / ${codeData.maxTeamMembers}`}
                        </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground">Status</div>
                        <div className="text-lg font-semibold flex items-center gap-1.5">
                            {codeData.enabled ? (
                                <>
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-green-500">Active</span>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="w-4 h-4 text-yellow-500" />
                                    <span className="text-yellow-500">Disabled</span>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="p-3 bg-muted/30 rounded-lg">
                        <div className="text-sm text-muted-foreground">Expiration</div>
                        <div className="text-lg font-semibold">
                            {codeData.timeUntilExpiry || "Never"}
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex flex-wrap items-center gap-3">
                    <Button
                        variant="outline"
                        onClick={regenerateCode}
                        disabled={regenerating}
                    >
                        {regenerating ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <RefreshCw className="w-4 h-4 mr-2" />
                        )}
                        Regenerate Code
                    </Button>

                    <div className="flex items-center gap-2">
                        <Switch
                            checked={codeData.enabled}
                            onCheckedChange={toggleCodeEnabled}
                            disabled={updatingSettings}
                        />
                        <Label className="text-sm">
                            {codeData.enabled ? "Enabled" : "Disabled"}
                        </Label>
                    </div>

                    <Dialog open={showHistoryDialog} onOpenChange={setShowHistoryDialog}>
                        <DialogTrigger asChild>
                            <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => {
                                    setShowHistoryDialog(true)
                                    fetchHistory()
                                }}
                            >
                                <History className="w-4 h-4 mr-2" />
                                View History
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Join History</DialogTitle>
                                <DialogDescription>
                                    Team members who joined using the invitation code
                                </DialogDescription>
                            </DialogHeader>
                            <div className="max-h-64 overflow-y-auto">
                                {historyLoading ? (
                                    <div className="flex items-center justify-center py-8">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                ) : history.length === 0 ? (
                                    <p className="text-center text-muted-foreground py-8">
                                        No one has joined using this code yet
                                    </p>
                                ) : (
                                    <div className="space-y-3">
                                        {history.map((item) => (
                                            <div key={item.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                                                <div>
                                                    <p className="font-medium">{item.userName}</p>
                                                    <p className="text-sm text-muted-foreground">{item.userEmail}</p>
                                                </div>
                                                <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {new Date(item.joinedAt).toLocaleDateString()}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </DialogContent>
                    </Dialog>

                    <Dialog open={showSettingsDialog} onOpenChange={setShowSettingsDialog}>
                        <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <Settings className="w-4 h-4 mr-2" />
                                Settings
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Code Settings</DialogTitle>
                                <DialogDescription>
                                    Configure invitation code settings
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4 py-4">
                                <div className="space-y-2">
                                    <Label htmlFor="maxMembers">Maximum Team Members</Label>
                                    <Input
                                        id="maxMembers"
                                        type="number"
                                        placeholder="No limit"
                                        value={maxMembers}
                                        onChange={(e) => setMaxMembers(e.target.value)}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        Leave empty for unlimited team size
                                    </p>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setShowSettingsDialog(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={updateMaxMembers} disabled={updatingSettings}>
                                    {updatingSettings && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    Save Changes
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>

                {/* Warning if code is disabled */}
                {!codeData.enabled && (
                    <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                        <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm font-medium text-yellow-500">Code Disabled</p>
                            <p className="text-sm text-muted-foreground">
                                Team members cannot join using this code until it&apos;s enabled again.
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
