"use client"

import { LogOut, LayoutDashboard, CarFront, MapIcon, Wallet, Settings } from "lucide-react"
import { useClerk, useUser } from "@clerk/nextjs"
import { usePathname } from "next/navigation"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar"

// Menu items.
const navItems = [
    {
        title: "Shop Vehicles",
        url: "/customer/shop",
        icon: CarFront,
    },
    {
        title: "My Garage",
        url: "/customer",
        icon: LayoutDashboard,
    },
    {
        title: "Service Network",
        url: "/customer/network",
        icon: MapIcon,
    },
    {
        title: "Refer & Earn",
        url: "/customer/refer",
        icon: Wallet,
    },
]

export function CustomerSidebar() {
    const { signOut } = useClerk()
    const pathname = usePathname()
    const { state } = useSidebar()

    return (
        <Sidebar variant="sidebar" collapsible="icon">
            <SidebarHeader className="flex flex-col items-center justify-center p-4">
                <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                    <span className="font-bold text-sm tracking-tight uppercase truncate max-w-[140px]">
                        ACTION AUTO UTAH
                    </span>
                    <span className="text-[9px] font-extrabold text-green-600 uppercase tracking-widest leading-tight">
                        Powered by Supra AI
                    </span>
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu className="gap-2 px-2 mt-4">
                            {navItems.map((item) => {
                                const isActive = pathname === item.url
                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton
                                            asChild
                                            isActive={isActive}
                                            tooltip={item.title}
                                            className={`h-11 rounded-lg transition-all ${isActive ? 'bg-green-500/10 text-green-600 font-semibold' : 'text-zinc-500 hover:text-foreground hover:bg-zinc-100 dark:hover:bg-zinc-800'}`}
                                        >
                                            <a href={item.url} className="flex items-center gap-3">
                                                <item.icon className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-zinc-400'}`} />
                                                <span>{item.title}</span>
                                            </a>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                )
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t p-4">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="h-11 rounded-lg text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                        >
                            <a href="/customer/settings" className="flex items-center gap-3">
                                <Settings className="w-5 h-5 text-zinc-400" />
                                <span>Settings</span>
                            </a>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            onClick={() => signOut()}
                            className="h-11 rounded-lg text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 font-medium transition-colors"
                        >
                            <LogOut className="w-5 h-5" />
                            <span>Log out</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    )
}
