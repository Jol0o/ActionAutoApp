'use client';

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Field,
    FieldGroup,
    FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/context/AuthContext";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Link from "next/link";

export default function Page() {
    return (
        <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
            <div className="w-full max-w-sm">
                <ForgotPasswordForm />
            </div>
        </div>
    );
}

export function ForgotPasswordForm({
    className,
}: React.ComponentProps<"div">) {
    const { forgotPassword, error, isLoading, message, clearError, clearMessage } = useAuth();
    const [email, setEmail] = useState("");

    useEffect(() => {
        // Clear any existing messages/errors when the component mounts
        clearError();
        clearMessage();
    }, [clearError, clearMessage]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        clearError();
        clearMessage();
        try {
            await forgotPassword({ email });
        } catch {
            // Error is handled by context state and displayed in the UI
        }
    };

    return (
        <div className={cn("flex flex-col gap-6", className)}>
            <Card>
                <CardHeader>
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>
                        Enter your email below to receive a password reset link.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    {message && !error && (
                        <Alert variant="default" className="mb-4 bg-green-100 border-green-200 text-green-800">
                            <AlertDescription>{message}</AlertDescription>
                        </Alert>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <Field>
                            <FieldLabel htmlFor="email">Email</FieldLabel>
                            <Input
                                id="email"
                                type="email"
                                placeholder="m@example.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </Field>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? "Sending Link..." : "Send Reset Link"}
                        </Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        <Link href="/login" className="underline">
                            Back to Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}