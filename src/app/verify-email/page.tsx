import { VerifyEmailForm } from "@/components/auth/VerifyEmailForm";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export default function VerifyEmailPage() {
    return (
        <div className="min-h-screen relative flex items-center justify-center p-4 bg-[#050505] overflow-hidden">
            {/* Dynamic Mesh Background Glows */}
            <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] rounded-full bg-primary/5 blur-[150px]" />
            <div className="absolute bottom-[-20%] right-[-20%] w-[50%] h-[50%] rounded-full bg-primary/5 blur-[130px]" />

            {/* Subtle Overlay Pattern */}
            <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] pointer-events-none" />

            <Suspense fallback={
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-10 w-10 animate-spin text-emerald-500" />
                    <p className="text-sm font-medium text-emerald-500/60 uppercase tracking-widest italic">Securing authentication...</p>
                </div>
            }>
                <VerifyEmailForm />
            </Suspense>
        </div>
    );
}
