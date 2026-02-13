"use client"

import { Suspense, useState, useEffect } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2, CheckCircle2, XCircle } from "lucide-react"
import { useAuth } from "@clerk/nextjs"

interface InvitationDetails {
    organizationName: string;
    inviterName: string;
    email: string;
    role: string;
}

function AcceptInviteContent() {
    const searchParams = useSearchParams()
    const token = searchParams.get("token")
    const router = useRouter()
    const { getToken, isLoaded, isSignedIn } = useAuth()

    const [isLoading, setIsLoading] = useState(true)
    const [isAccepting, setIsAccepting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [invitation, setInvitation] = useState<InvitationDetails | null>(null)

    useEffect(() => {
        const validateToken = async () => {
            if (!token) {
                setError("Missing invitation token")
                setIsLoading(false)
                return
            }

            try {
                // Determine if we need auth headers for validation (invitations might be public read-only for validation)
                // But usually validation just checks token validity. 
                // However, accepting usually requires being logged in.
                const response = await apiClient.validateInvite(token)
                setInvitation(response.data?.data || response.data)
            } catch (err: any) {
                setError(err.response?.data?.message || "Invalid or expired invitation")
            } finally {
                setIsLoading(false)
            }
        }

        if (isLoaded) {
            validateToken()
        }
    }, [token, isLoaded])

    const handleAccept = async () => {
        if (!isSignedIn) {
            // Redirect to sign in, preserving the return URL
            // Clerk handles this via middleware mostly, but explicit redirect is good
            router.push(`/sign-in?redirect_url=${encodeURIComponent(`/accept-invite?token=${token}`)}`)
            return
        }

        setIsAccepting(true)
        try {
            const authToken = await getToken()
            await apiClient.acceptInvite(token!, {
                headers: { Authorization: `Bearer ${authToken}` }
            })
            // Redirect to dashboard
            router.push("/")
        } catch (err: any) {
            setError(err.response?.data?.message || "Failed to accept invitation")
            setIsAccepting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {error ? <XCircle className="text-destructive" /> : <CheckCircle2 className="text-green-500" />}
                        {error ? "Invitation Error" : "You're Invited!"}
                    </CardTitle>
                    <CardDescription>
                        {error ? "We couldn't process your invitation." : `You've been invited to join an organization.`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {invitation && (
                        <div className="space-y-4">
                            <div className="p-4 bg-muted rounded-lg space-y-2">
                                <p className="text-sm font-medium">Organization</p>
                                <p className="text-lg font-bold">{invitation.organizationName}</p>
                                <div className="border-t border-border my-2" />
                                <p className="text-sm font-medium">Invited By</p>
                                <p>{invitation.inviterName}</p>
                                <p className="text-sm font-medium mt-2">Role</p>
                                <p className="capitalize">{invitation.role}</p>
                            </div>
                            {!isSignedIn && (
                                <p className="text-sm text-yellow-600 bg-yellow-50 p-2 rounded">
                                    You will need to sign in or create an account to accept this invitation.
                                </p>
                            )}
                        </div>
                    )}
                    {error && (
                        <div className="p-4 bg-destructive/10 text-destructive rounded-lg">
                            {error}
                        </div>
                    )}
                </CardContent>
                <CardFooter>
                    {invitation && !error && (
                        <Button
                            className="w-full"
                            onClick={handleAccept}
                            disabled={isAccepting}
                        >
                            {isAccepting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSignedIn ? "Accept Invitation" : "Sign In to Accept"}
                        </Button>
                    )}
                    {error && (
                        <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
                            Go to Home
                        </Button>
                    )}
                </CardFooter>
            </Card>
        </div>
    )
}

export default function AcceptInvitePage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <AcceptInviteContent />
        </Suspense>
    )
}
