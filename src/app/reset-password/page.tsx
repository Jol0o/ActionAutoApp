'use client';

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/context/AuthContext"
import { Alert, AlertDescription } from "../../components/ui/alert"
import Link from "next/link"

function ResetPasswordFormComponent({
    className,
}: React.ComponentProps<"div">) {
    const { resetPassword, error, isLoading, message, clearError, clearMessage } = useAuth();
    const searchParams = useSearchParams();
    const [token, setToken] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [localError, setLocalError] = useState<string | null>(null);

    useEffect(() => {
        const tokenFromUrl = searchParams.get('token');
        if (tokenFromUrl) {
            setToken(tokenFromUrl);
        } else {
            setLocalError("No reset token found in URL. Please use the link from your email.");
        }
        // Clear global context errors/messages on mount
        clearError();
        clearMessage();

        return () => {
            clearError();
            clearMessage();
        }
    }, [searchParams, clearError, clearMessage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLocalError(null);
        clearError();
        clearMessage();

        if (password.length < 8) {
            setLocalError("Password must be at least 8 characters long.");
            return;
        }

        if (password !== confirmPassword) {
            setLocalError("Passwords do not match.");
            return;
        }
        if (!token) {
            setLocalError("Password reset token is missing. Please request a new reset link.");
            return;
        }

        try {
            await resetPassword({ token, password });
        } catch {
            // Error is handled by the AuthContext state
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)} >
            <Card>
                <CardHeader>
                    <CardTitle>Reset Your Password</CardTitle>
                    <CardDescription>
                        Enter and confirm your new password below.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {localError && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{localError}</AlertDescription>
                        </Alert>
                    )}
                    {message && !error && (
                        <Alert variant="default" className="mb-4 bg-green-100 border-green-200 text-green-800">
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <FieldGroup>
                            <Field>
                                <FieldLabel htmlFor="password">New Password</FieldLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="********"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </Field>
                            <Field>
                                <FieldLabel htmlFor="confirm-password">Confirm New Password</FieldLabel>
                                <Input
                                    id="confirm-password"
                                    type="password"
                                    placeholder="********"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                            </Field>
                            <Button type="submit" disabled={isLoading || !token} className="w-full">
                                {isLoading ? "Resetting Password..." : "Reset Password"}
                            </Button>
                        </FieldGroup>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        <Link href="/login" className="underline">
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default function Page() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <Suspense fallback={<div>Loading...</div>}>
                    <ResetPasswordFormComponent />
                </Suspense>
            </div>
        </div>
    )
}
