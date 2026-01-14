import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"
import { Input } from "@/components/ui/input"
import { Search, Bell, MapPin, User, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const geistSans = Geist({
    variable: "--font-geist-sans",
    subsets: ["latin"],
});

const geistMono = Geist_Mono({
    variable: "--font-geist-mono",
    subsets: ["latin"],
});

export const metadata: Metadata = {
    title: "Action Auto Utah Dashboard",
    description: "Advanced Car Dealership Management",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${geistSans.variable} ${geistMono.variable} antialiased`}
            >
                <SidebarProvider>
                    <AppSidebar />
                    <SidebarInset>
                        <header className="flex h-16 shrink-0 items-center justify-between px-4 border-b">
                            <div className="flex items-center gap-4 flex-1">
                                <SidebarTrigger className="-ml-1" />

                                <div className="flex items-center gap-2 text-sm text-muted-foreground border-r pr-4 h-8">
                                    <span className="font-medium whitespace-nowrap">Location:</span>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="sm" className="h-8 gap-1 font-normal">
                                                All Locations <ChevronDown className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="start">
                                            <DropdownMenuItem>All Locations</DropdownMenuItem>
                                            <DropdownMenuItem>Lehi, UT</DropdownMenuItem>
                                            <DropdownMenuItem>Orem, UT</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>

                                <div className="relative max-w-md w-full">
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="search"
                                        placeholder="Search Inventory..."
                                        className="w-full bg-background pl-8 h-9"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full">
                                    <Plus className="size-5" />
                                </Button>
                                <Button variant="outline" size="icon" className="h-9 w-9 rounded-full relative">
                                    <Bell className="size-5" />
                                    <span className="absolute top-2 right-2 size-2 bg-destructive/100 rounded-full border-2 border-background"></span>
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Avatar" />
                                                <AvatarFallback>AA</AvatarFallback>
                                            </Avatar>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent className="w-56" align="end" forceMount>
                                        <DropdownMenuLabel className="font-normal">
                                            <div className="flex flex-col space-y-1">
                                                <p className="text-sm font-medium leading-none">Sarah Jenkins</p>
                                                <p className="text-xs leading-none text-muted-foreground">
                                                    sarah@actionautoutah.com
                                                </p>
                                            </div>
                                        </DropdownMenuLabel>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>Profile</DropdownMenuItem>
                                        <DropdownMenuItem>Settings</DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem>Log out</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </header>
                        <main className="flex-1 overflow-hidden bg-background">
                            {children}
                        </main>
                    </SidebarInset>
                </SidebarProvider>
            </body>
        </html>
    );
}
