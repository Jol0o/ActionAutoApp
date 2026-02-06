"use client"

import { OrganizationList } from "@clerk/nextjs"
import { Car } from "lucide-react"

export default function OrgSelectionPage() {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="mb-8 flex flex-col items-center gap-2">
                <div className="flex aspect-square size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-lg">
                    <Car className="size-8" />
                </div>
                <div className="flex flex-col items-center text-center">
                    <h1 className="text-2xl font-bold tracking-tight">ACTION AUTO UTAH</h1>
                    <p className="text-[10px] font-extrabold text-green-600 uppercase tracking-widest leading-none">
                        Powered by Supra AI
                    </p>
                </div>
            </div>

            <div className="w-full max-w-md bg-card border rounded-2xl shadow-xl overflow-hidden p-6">
                <div className="mb-6 text-center">
                    <h2 className="text-xl font-semibold">Dealership Selection</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                        Select an existing dealership or create a new one to continue.
                    </p>
                </div>

                <div className="flex justify-center">
                    <OrganizationList
                        hidePersonal={true}
                        afterCreateOrganizationUrl="/"
                        afterSelectOrganizationUrl="/"
                        appearance={{
                            elements: {
                                rootBox: "w-full",
                                card: "shadow-none border-none p-0 w-full bg-transparent",
                                organizationListTrigger: "border-border",
                                organizationSwitcherTrigger: "bg-muted",
                                organizationListCreateOrganizationTrigger: "text-primary hover:text-primary/80 font-semibold",
                            }
                        }}
                    />
                </div>
            </div>

            <p className="mt-8 text-xs text-muted-foreground">
                Need help? Contact your system administrator.
            </p>
        </div>
    )
}
