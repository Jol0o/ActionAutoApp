"use client";

import React, { useState } from "react";
import { useSignUp } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Mail, Lock, User, Building2, ArrowRight, AlertCircle, CheckCircle2, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function DealershipSignUpForm() {
    const { signUp, isLoaded } = useSignUp();
    const [step, setStep] = useState(1);

    // User Info
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    // Dealership Info
    const [dealershipName, setDealershipName] = useState("");
    const [dealershipSlug, setDealershipSlug] = useState("");

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const generateSlug = (name: string) => {
        return name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)/g, "");
    };

    const handleNext = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!isLoaded) return;

        setIsLoading(true);
        setError(null);

        try {
            const finalSlug = dealershipSlug || generateSlug(dealershipName);
            const result = await (signUp as any).createDealership({
                name,
                email,
                password,
                dealershipName,
                dealershipSlug: finalSlug
            });

            if (result.status === "complete") {
                window.location.href = "/admin/dashboard";
            }
        } catch (err: any) {
            setError(err.errors?.[0]?.longMessage || "Failed to create dealership account");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-lg mx-auto"
        >
            <Card className="border-border/50 bg-card/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

                <CardHeader className="space-y-1 pb-8 text-center">
                    <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4 text-primary">
                        <Building2 className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Register Dealership</CardTitle>
                    <CardDescription>
                        Create your organization and admin account
                    </CardDescription>

                    {/* Stepper */}
                    <div className="flex items-center justify-center gap-2 pt-4">
                        <div className={`h-1.5 w-12 rounded-full transition-colors ${step === 1 ? "bg-primary" : "bg-muted"}`} />
                        <div className={`h-1.5 w-12 rounded-full transition-colors ${step === 2 ? "bg-primary" : "bg-muted"}`} />
                    </div>
                </CardHeader>

                <CardContent>
                    <AnimatePresence mode="wait">
                        {step === 1 ? (
                            <motion.form
                                key="step1"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                onSubmit={handleNext}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            className="pl-10 bg-background/50"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Work Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="admin@dealership.com"
                                            className="pl-10 bg-background/50"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="••••••••"
                                            className="pl-10 bg-background/50"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary/90">
                                    Continue to Dealership Details <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </motion.form>
                        ) : (
                            <motion.form
                                key="step2"
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                onSubmit={handleSubmit}
                                className="space-y-4"
                            >
                                <div className="space-y-2">
                                    <Label htmlFor="dealershipName">Dealership Name</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="dealershipName"
                                            placeholder="Action Auto Utah"
                                            className="pl-10 bg-background/50"
                                            value={dealershipName}
                                            onChange={(e) => {
                                                setDealershipName(e.target.value);
                                                if (!dealershipSlug) {
                                                    setDealershipSlug(generateSlug(e.target.value));
                                                }
                                            }}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dealershipSlug">Dealership URL Slug</Label>
                                    <div className="relative">
                                        <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="dealershipSlug"
                                            placeholder="action-auto-utah"
                                            className="pl-10 bg-background/50"
                                            value={dealershipSlug}
                                            onChange={(e) => setDealershipSlug(generateSlug(e.target.value))}
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-muted-foreground">
                                        This will be used for your organization's unique URL.
                                    </p>
                                </div>

                                {error && (
                                    <div className="flex items-center gap-2 p-3 text-xs font-medium bg-destructive/10 text-destructive rounded-lg border border-destructive/20">
                                        <AlertCircle className="h-4 w-4 shrink-0" />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-1/3"
                                        onClick={() => setStep(1)}
                                        disabled={isLoading}
                                    >
                                        Back
                                    </Button>
                                    <Button
                                        type="submit"
                                        className="w-2/3 h-11 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            "Finalize Registration"
                                        )}
                                    </Button>
                                </div>
                            </motion.form>
                        )}
                    </AnimatePresence>
                </CardContent>

                <CardFooter className="pt-2 pb-8 flex flex-col space-y-4">
                    <div className="text-sm text-center text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/sign-in" className="text-primary font-semibold hover:underline">
                            Sign In
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </motion.div>
    );
}
