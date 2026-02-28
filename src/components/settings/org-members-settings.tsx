"use client"

import { useState, useEffect } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useAuth, useUser } from "@clerk/nextjs" // Import useAuth
import { apiClient } from "@/lib/api-client"
import { useOrg } from "@/hooks/useOrg"
import { OrganizationMember } from "@/types/organization"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2, Mail, Trash2, UserPlus, Shield, User as UserIcon, Briefcase, Check, X } from "lucide-react"


export function OrganizationMembersSettings() {
    const { organization, isAdmin, organizationId } = useOrg()
    const { getToken } = useAuth()
    const { user } = useUser()
    const queryClient = useQueryClient()


    // Invite State
    const [isInviteOpen, setIsInviteOpen] = useState(false)
    const [inviteEmail, setInviteEmail] = useState("")
    const [inviteRole, setInviteRole] = useState("member")

    // Rank/JobTitle State
    const [jobTitle, setJobTitle] = useState("")
    const [isEditingRank, setIsEditingRank] = useState(false)
    const [tempJobTitle, setTempJobTitle] = useState("")

    // Fetch Members
    const { data: members = [], isLoading } = useQuery({
        queryKey: ['org-members', organizationId],
        queryFn: async () => {
            if (!organizationId) return []

            const token = await getToken()

            if (!token) {
                throw new Error("No token available");
            }

            const response = await apiClient.getMembers(organizationId, {
                headers: { Authorization: `Bearer ${token}` }
            })
            return response.data?.data || response.data
        },
        enabled: !!organizationId
    })

    // Fetch user's current jobTitle
    useEffect(() => {
        const fetchUserProfile = async () => {
            try {
                const token = await getToken()
                const response = await apiClient.get('/api/profile', { headers: { Authorization: `Bearer ${token}` } })
                const userJobTitle = response.data?.data?.personalInfo?.jobTitle || ''
                setJobTitle(userJobTitle)
                setTempJobTitle(userJobTitle)
            } catch (error) {
                console.error('Failed to fetch user profile:', error)
            }
        }
        if (user) {
            fetchUserProfile()
        }
    }, [user, getToken])

    // Invite Mutation
    const inviteMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken()
            return apiClient.sendInvite({ email: inviteEmail, role: inviteRole }, {
                headers: { Authorization: `Bearer ${token}` }
            })
        },
        onSuccess: () => {
            setIsInviteOpen(false)
            setInviteEmail("")
            setInviteRole("member")
            alert(`Invitation sent to ${inviteEmail}`)
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || "Failed to send invitation")
        }
    })

    // Remove Mutation
    const removeMutation = useMutation({
        mutationFn: async (userId: string) => {
            if (!organizationId) return
            const token = await getToken()
            return apiClient.removeMember(organizationId, userId, {
                headers: { Authorization: `Bearer ${token}` }
            })
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['org-members', organizationId] })
            alert("Member removed")
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || "Failed to remove member")
        }
    })

    // Update JobTitle Mutation
    const updateJobTitleMutation = useMutation({
        mutationFn: async () => {
            const token = await getToken()
            return apiClient.patch('/api/profile/personal-info', 
                { jobTitle: tempJobTitle }, 
                { headers: { Authorization: `Bearer ${token}` } }
            )
        },
        onSuccess: () => {
            setJobTitle(tempJobTitle)
            setIsEditingRank(false)
            alert("Rank updated successfully")
        },
        onError: (error: any) => {
            alert(error.response?.data?.message || "Failed to update rank")
        }
    })

    const handleSaveRank = () => {
        updateJobTitleMutation.mutate()
    }

    const handleCancelRank = () => {
        setTempJobTitle(jobTitle)
        setIsEditingRank(false)
    }

    const handleInvite = (e: React.FormEvent) => {
        e.preventDefault()
        inviteMutation.mutate()
    }

    if (!organization) return null

    return (
        <div className="space-y-6">
            {/* Your Rank Card */}
            <Card className="border-l-4 border-l-blue-500">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Briefcase className="w-5 h-5" />
                        Your Rank / Title
                    </CardTitle>
                    <CardDescription>Set your professional title or rank within the organization</CardDescription>
                </CardHeader>
                <CardContent>
                    {!isEditingRank ? (
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground mb-2">Current Rank</p>
                                <p className="text-lg font-semibold">
                                    {jobTitle || "Not Set"}
                                </p>
                            </div>
                            <Button variant="outline" onClick={() => setIsEditingRank(true)}>
                                <Briefcase className="w-4 h-4 mr-2" />
                                Edit Rank
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium block mb-2">New Rank / Title</label>
                                <Input
                                    value={tempJobTitle}
                                    onChange={(e) => setTempJobTitle(e.target.value)}
                                    placeholder="e.g., Sales Manager, Operations Lead, Senior Developer"
                                    className="flex-1"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <Button 
                                    variant="outline" 
                                    onClick={handleCancelRank}
                                    disabled={updateJobTitleMutation.isPending}
                                >
                                    <X className="w-4 h-4 mr-2" />
                                    Cancel
                                </Button>
                                <Button 
                                    onClick={handleSaveRank}
                                    disabled={updateJobTitleMutation.isPending}
                                >
                                    {updateJobTitleMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                                    <Check className="w-4 h-4 mr-2" />
                                    Save Rank
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center justify-between ">
                <div>
                    <h3 className="text-lg font-medium">Members</h3>
                    <p className="text-sm text-muted-foreground">
                        Manage who has access to this organization.
                    </p>
                </div>
                {isAdmin && (
                    <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Invite Member
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Invite New Member</DialogTitle>
                                <DialogDescription>
                                    Send an email invitation to join {organization.name}.
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleInvite}>
                                <div className="space-y-4 py-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Email Address</label>
                                        <Input
                                            type="email"
                                            placeholder="colleague@example.com"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Role</label>
                                        <Select value={inviteRole} onValueChange={setInviteRole}>
                                            <SelectTrigger>
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="member">Member</SelectItem>
                                                <SelectItem value="admin">Admin</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="outline" onClick={() => setIsInviteOpen(false)}>
                                        Cancel
                                    </Button>
                                    <Button type="submit" disabled={inviteMutation.isPending}>
                                        {inviteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Send Invitation
                                    </Button>
                                </DialogFooter>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            <div className="border rounded-md">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Role</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center">
                                    <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
                                </TableCell>
                            </TableRow>
                        ) : members.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                    No members found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            members.map((member: OrganizationMember) => (
                                <TableRow key={member._id}>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9">
                                                <AvatarImage src={member.imageUrl} alt={member.fullName} />
                                                <AvatarFallback>{member.fullName?.substring(0, 1).toUpperCase()}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium text-sm">{member.fullName}</span>
                                                <span className="text-xs text-muted-foreground">{member.email}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={member.organizationRole === 'admin' ? 'default' : 'secondary'} className="capitalize">
                                            {member.organizationRole === 'admin' ? <Shield className="w-3 h-3 mr-1" /> : <UserIcon className="w-3 h-3 mr-1" />}
                                            {member.organizationRole}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {isAdmin && member.clerkId !== user?.id && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                onClick={() => {
                                                    if (confirm("Are you sure you want to remove this member?")) {
                                                        removeMutation.mutate(member._id)
                                                    }
                                                }}
                                                disabled={removeMutation.isPending}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    )
}
