"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthActions, useUser } from '@/providers/AuthProvider';
import { apiClient } from '@/lib/api-client';
import { toast } from 'sonner';
import { UserCheck, Car, Briefcase, Loader2, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';

export default function OnboardingPage() {
    const { refreshUser } = useAuthActions();
    const { user, isLoaded } = useUser();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [selectedRole, setSelectedRole] = useState<string | null>(null);

    if (!isLoaded) return null;

    // If already completed, redirect away
    if (user?.onboardingCompleted) {
        router.push('/');
        return null;
    }

    const handleRoleSelection = async (role: string) => {
        setIsLoading(true);
        setSelectedRole(role);
        try {
            const response = await apiClient.completeOnboarding(role);
            if (response.status === 200) {
                console.log('role', role);
                toast.success('Account setup complete!');
                await refreshUser();
                switch (role) {
                    case 'customer':
                        router.push('/customer');
                        break;
                    case 'driver':
                        router.push('/driver');
                        break;
                    case 'dealership':
                        router.push('/');
                        break;
                    default:
                        router.push('/admin/dashboard');
                        break;
                }
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to complete onboarding');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020202] flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.05),transparent_50%)]">
            <div className="w-full max-w-2xl space-y-8">
                <div className="space-y-4 text-center">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-xs font-medium"
                    >
                        Welcome to Action Auto
                    </motion.div>
                    <h1 className="text-4xl font-bold tracking-tight text-white">
                        Complete Your Account
                    </h1>
                    <p className="text-zinc-500 text-lg font-light">
                        Please select how you want to use the platform.
                    </p>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <IdentityCard
                        icon={<UserCheck className="h-6 w-6" />}
                        title="I am a Customer"
                        description="I want to browse vehicles and manage my appointments."
                        onClick={() => handleRoleSelection("customer")}
                        isLoading={isLoading && selectedRole === "customer"}
                        disabled={isLoading}
                    />
                    <IdentityCard
                        icon={<Car className="h-6 w-6" />}
                        title="I am a Driver"
                        description="I want to sign up as a transportation provider."
                        onClick={() => handleRoleSelection("driver")}
                        isLoading={isLoading && selectedRole === "driver"}
                        disabled={isLoading}
                    />
                    <IdentityCard
                        icon={<Briefcase className="h-6 w-6" />}
                        title="I am a Dealer"
                        description="I want to manage my dealership and inventory."
                        onClick={() => handleRoleSelection("dealership")}
                        isLoading={isLoading && selectedRole === "dealership"}
                        disabled={isLoading}
                    />
                </div>
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
