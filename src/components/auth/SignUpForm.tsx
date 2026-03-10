"use client";

import React, { useState } from "react";
import { useSignUp } from "@/providers/AuthProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail, Lock, User, ArrowRight, AlertCircle, Sparkles, Car, ShieldCheck, UserCheck, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type SignUpStep = "details" | "identity";
type UserRole = "customer" | "driver" | "dealership";

export function SignUpForm({ onToggleMode }: { onToggleMode?: () => void }) {
    const { signUp, isLoaded } = useSignUp();
    const router = useRouter();

    const [step, setStep] = useState<SignUpStep>("details");
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleNextStep = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !email || !password) return;
        setStep("identity");
    };

    const handleSubmit = async (role: UserRole) => {
        if (!isLoaded) return;
        setSelectedRole(role);
        setIsLoading(true);
        setError(null);

        try {
            const firstName = name.split(" ")[0] || "";
            const lastName = name.split(" ").slice(1).join(" ") || "";

            const result = await (signUp as any).create({
                emailAddress: email,
                password: password,
                firstName,
                lastName,
                role: role // 'customer', 'driver', or 'dealership' (maps to 'admin' in backend flow)
            });

            if (result.status === "needs_verification") {
                toast.success("Account created! Please verify your email.");
                router.push(`/verify-email?email=${encodeURIComponent(email)}`);
            }
        } catch (err: any) {
            const errorMessage = err.errors?.[0]?.longMessage || "Failed to create account";
            setError(errorMessage);
            toast.error(errorMessage);
            setIsLoading(false);
        }
    };

    const containerVariants = {
        initial: { opacity: 0, x: 20 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -20 },
        transition: { duration: 0.4, ease: "easeOut" } as const
    };

    return (
        <div className="w-full">
            <AnimatePresence mode="wait">
                {step === "details" ? (
                    <motion.div key="step-details" {...containerVariants} className="space-y-8">
                        <div className="space-y-3">
                            <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                                Create Account <Sparkles className="h-8 w-8 text-emerald-500" />
                            </h1>
                            <p className="text-zinc-500 text-lg font-light">
                                Let&apos;s get you started with Action Auto Utah.
                            </p>
                        </div>

                        <form onSubmit={handleNextStep} className="space-y-6">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold ml-1">Full Name</Label>
                                    <Input
                                        type="text"
                                        placeholder="John Doe"
                                        className="h-14 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-2xl placeholder:text-zinc-700"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold ml-1">Email Address</Label>
                                    <Input
                                        type="email"
                                        placeholder="name@example.com"
                                        className="h-14 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-2xl placeholder:text-zinc-700"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold ml-1">Password</Label>
                                    <Input
                                        type="password"
                                        placeholder="Minimum 8 characters"
                                        className="h-14 bg-white/[0.03] border-white/10 focus:border-emerald-500/50 focus:ring-emerald-500/20 transition-all rounded-2xl placeholder:text-zinc-700"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        minLength={8}
                                    />
                                </div>
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-14 bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition-all active:scale-[0.98] rounded-2xl text-lg shadow-[0_20px_40px_-10px_rgba(16,185,129,0.3)]"
                            >
                                <span className="flex items-center gap-2">
                                    Select Account Type <ArrowRight className="h-5 w-5" />
                                </span>
                            </Button>
                        </form>
                    </motion.div>
                ) : (
                    <motion.div key="step-identity" {...containerVariants} className="space-y-8">
                        <div className="space-y-3">
                            <button
                                onClick={() => setStep("details")}
                                className="text-emerald-500 text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all mb-4"
                            >
                                ← Back to details
                            </button>
                            <h1 className="text-4xl font-bold tracking-tight text-white flex items-center gap-3">
                                Almost There
                            </h1>
                            <p className="text-zinc-500 text-lg font-light leading-relaxed">
                                Choose how you want to use the platform.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-4">
                            {/* Role Cards */}
                            <IdentityCard
                                icon={<UserCheck className="h-6 w-6" />}
                                title="I am a Customer"
                                description="I want to browse vehicles and manage my appointments."
                                onClick={() => handleSubmit("customer")}
                                isLoading={isLoading && selectedRole === "customer"}
                                disabled={isLoading}
                            />
                            <IdentityCard
                                icon={<Car className="h-6 w-6" />}
                                title="I am a Driver"
                                description="I want to sign up as a transportation provider."
                                onClick={() => handleSubmit("driver")}
                                isLoading={isLoading && selectedRole === "driver"}
                                disabled={isLoading}
                            />
                            <IdentityCard
                                icon={<Briefcase className="h-6 w-6" />}
                                title="I am a Dealer"
                                description="I want to manage my dealership and inventory."
                                onClick={() => handleSubmit("dealership")}
                                isLoading={isLoading && selectedRole === "dealership"}
                                disabled={isLoading}
                            />
                        </div>

                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex items-center gap-2 p-4 text-sm font-medium bg-red-500/10 text-red-400 rounded-2xl border border-red-500/20"
                            >
                                <AlertCircle className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <p className="text-center text-zinc-600 text-[11px] px-8 leading-relaxed">
                            By clicking an option, you agree to our Terms of Service. <br />A 6-digit verification code will be sent to <span className="text-zinc-400">{email}</span>.
                        </p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="text-center pt-8">
                <p className="text-zinc-500 text-sm font-light">
                    Already have an account?{" "}
                    <button
                        onClick={onToggleMode}
                        className="text-blue-500 font-bold hover:underline ml-1"
                    >
                        Sign in
                    </button>
                </p>
            </div>
        </div>
    );
}

function IdentityCard({ icon, title, description, onClick, isLoading, disabled }: any) {
    return (
        <button
            onClick={onClick}
            disabled={disabled}
            className="group relative flex items-center gap-6 p-6 text-left bg-white/[0.02] border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/[0.03] transition-all rounded-[1.5rem] disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden active:scale-[0.98]"
        >
            <div className="h-12 w-12 rounded-xl bg-white/[0.05] group-hover:bg-emerald-500/10 flex items-center justify-center text-zinc-400 group-hover:text-emerald-500 transition-colors shrink-0">
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
            </div>
            <div>
                <h3 className="text-white font-bold text-lg group-hover:text-emerald-400 transition-colors">{title}</h3>
                <p className="text-zinc-500 text-sm font-light leading-relaxed group-hover:text-zinc-400 transition-colors">{description}</p>
            </div>
            <ArrowRight className="absolute right-6 h-5 w-5 text-zinc-700 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
        </button>
    );
}
