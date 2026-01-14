"use client"

import * as React from "react"
import { usePathname } from "next/navigation"
import {
    BarChart3,
    Car,
    ChevronRight,
    ClipboardList,
    DollarSign,
    Home,
    LayoutDashboard,
    Search,
    Settings,
    Tag,
    Truck,
    AlertCircle,
    PlusCircle,
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
    SidebarProvider,
    SidebarRail,
} from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
        },
        {
            title: "My Work",
            url: "/my-work",
            icon: ClipboardList,
        },
        {
            title: "Needs Attention",
            url: "/needs-attention",
            icon: AlertCircle,
        },
        {
            title: "All Inventory",
            url: "/inventory",
            icon: Car,
        },
    ],
    services: [
        {
            title: "Auto Finder",
            url: "/auto-finder",
            icon: Search,
        },
        {
            title: "Appraisals",
            url: "/appraisals",
            icon: Tag,
        },
        {
            title: "Transportation",
            url: "/transportation",
            icon: Truck,
        },
        {
            title: "Recon/Workflow",
            url: "/recon",
            icon: Settings,
        },
        {
            title: "Inventory Pricing",
            url: "/pricing",
            icon: DollarSign,
        },
        {
            title: "Dealer Analytics",
            url: "/analytics",
            icon: BarChart3,
        },
        {
            title: "Reports",
            url: "/reports",
            icon: ClipboardList,
            items: [
                {
                    title: "Sales Report",
                    url: "#",
                },
                {
                    title: "Inventory Health",
                    url: "#",
                },
            ],
        },
        {
            title: "Settings",
            url: "/settings",
            icon: Settings,
            items: [
                {
                    title: "General",
                    url: "#",
                },
                {
                    title: "Team",
                    url: "#",
                },
            ],
        },
    ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const pathname = usePathname()
    return (
        <Sidebar variant="inset" collapsible="icon" className="border-r" {...props}>
            <SidebarHeader className="h-16 border-b flex items-center px-6">
                <div className="flex items-center gap-2">
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                        <Car className="size-5" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
                        <span className="font-bold text-lg tracking-tight">ACTION AUTO</span>
                        <span className="text-[10px] uppercase tracking-[0.2em] font-medium text-muted-foreground">UTAH</span>
                    </div>
                </div>
            </SidebarHeader>
            <SidebarContent className="p-2">
                <SidebarMenu>
                    {data.navMain.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            <SidebarMenuButton asChild tooltip={item.title} isActive={pathname === item.url}>
                                <a href={item.url}>
                                    <item.icon />
                                    <span>{item.title}</span>
                                </a>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>

                <div className="px-4 py-2 mt-4 text-[11px] font-semibold uppercase text-muted-foreground tracking-wider group-data-[collapsible=icon]:hidden">
                    Services
                </div>

                <SidebarMenu>
                    {data.services.map((item) => (
                        <SidebarMenuItem key={item.title}>
                            {item.items ? (
                                <SidebarMenuButton asChild tooltip={item.title}>
                                    <div className="flex items-center w-full">
                                        <item.icon />
                                        <span className="flex-1">{item.title}</span>
                                        <ChevronRight className="ml-auto size-4 group-data-[state=open]/collapsible:rotate-90" />
                                    </div>
                                </SidebarMenuButton>
                            ) : (
                                <SidebarMenuButton
                                    asChild
                                    tooltip={item.title}
                                    isActive={pathname === item.url}
                                >
                                    <a href={item.url}>
                                        <item.icon />
                                        <span>{item.title}</span>
                                    </a>
                                </SidebarMenuButton>
                            )}
                        </SidebarMenuItem>
                    ))}
                </SidebarMenu>
            </SidebarContent>
            <SidebarFooter className="p-4 border-t">
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton className="h-10 border bg-background group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
                            <PlusCircle className="size-4 mr-2 group-data-[collapsible=icon]:mr-0" />
                            <span className="group-data-[collapsible=icon]:hidden">Add Products</span>
                            <Badge variant="secondary" className="ml-auto bg-green-500 text-white hover:bg-green-600 group-data-[collapsible=icon]:hidden">New!</Badge>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
