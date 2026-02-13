"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
    User,
    Calendar,
    Inbox,
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
} from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useUser, useClerk, useOrganization } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LogOut,
  User as UserIcon,
  Settings as SettingsIcon,
} from "lucide-react";

const data = {
    navMain: [
        {
            title: "Dashboard",
            url: "/",
            icon: LayoutDashboard,
        },
        {
            title: "All Inventory",
            url: "/inventory",
            icon: Car,
        },
        {
            title: "Appointments",
            url: "/appointments",
            icon: Calendar,
        },
        {
            title: "Inquiries",
            url: "/leads",
            icon: Inbox, // Inquiries Page
        },
    ],

  services: [
    {
      title: "Transportation",
      url: "/transportation",
      icon: Truck,
    },
    {
      title: "Driver Tracker",
      url: "/driver-tracker",
      icon: User,
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
  ],
  account: [
    {
      title: "Profile",
      url: "/profile",
      icon: User,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { user } = useUser();
  const { signOut } = useClerk();
  const { organization } = useOrganization();

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r" {...props}>
      <SidebarHeader className="h-16 border-b flex items-center px-6">
        <div className="flex items-center gap-2">
          <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground overflow-hidden">
            {organization?.imageUrl ? (
              <img
                src={organization.imageUrl}
                alt={organization.name}
                className="size-full object-cover"
              />
            ) : (
              <Car className="size-5" />
            )}
          </div>
          <div className="flex flex-col gap-0.5 leading-none group-data-[collapsible=icon]:hidden">
            <span className="font-bold text-sm tracking-tight uppercase truncate max-w-[140px]">
              {organization?.name || "ACTION AUTO UTAH"}
            </span>
            <span className="text-[9px] font-extrabold text-green-600 uppercase tracking-widest leading-tight">
              Powered by Supra AI
            </span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="p-2">
        <SidebarMenu>
          {data.navMain.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={pathname === item.url}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
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
                  <Link href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              )}
            </SidebarMenuItem>
          ))}
        </SidebarMenu>

        <div className="px-4 py-2 mt-4 text-[11px] font-semibold uppercase text-muted-foreground tracking-wider group-data-[collapsible=icon]:hidden">
          Account
        </div>

        <SidebarMenu>
          {data.account.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={pathname === item.url}
              >
                <Link href={item.url}>
                  <item.icon />
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="p-4 border-t">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12 w-full data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground">
                  <Avatar className="h-8 w-8 rounded-lg">
                    <AvatarImage
                      src={user?.imageUrl}
                      alt={user?.fullName || ""}
                    />
                    <AvatarFallback className="rounded-lg">
                      {user?.firstName?.substring(0, 1).toUpperCase() || "US"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
                    <span className="truncate font-semibold">
                      {user?.fullName}
                    </span>
                    <span className="truncate text-xs">
                      {user?.primaryEmailAddress?.emailAddress}
                    </span>
                  </div>
                  <ChevronRight className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                side="bottom"
                align="end"
                sideOffset={4}
              >
                <DropdownMenuLabel className="p-0 font-normal">
                  <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarImage
                        src={user?.imageUrl}
                        alt={user?.fullName || ""}
                      />
                      <AvatarFallback className="rounded-lg">
                        {user?.firstName?.substring(0, 1).toUpperCase() || "US"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <span className="truncate font-semibold">
                        {user?.fullName}
                      </span>
                      <span className="truncate text-xs">
                        {user?.primaryEmailAddress?.emailAddress}
                      </span>
                    </div>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => (window.location.href = "/profile")}
                >
                  <UserIcon className="mr-2 size-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon className="mr-2 size-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>
                  <LogOut className="mr-2 size-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
