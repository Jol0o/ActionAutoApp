"use client";

import * as React from "react";
import { SidebarProvider, SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { DriverSidebar } from "@/components/driver-sidebar";
import { NotificationBell } from "@/components/NotificationBell";
import { NotificationProvider } from "@/context/NotificationContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
import { useOrg } from "@/hooks/useOrg";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function DriverLayoutContent({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const { user } = useUser();
  const { signOut } = useClerk();
  const { isLoaded, isDriver, organizationId, accountType } = useOrg();
  const router = useRouter();
  const [guardPassed, setGuardPassed] = React.useState(false);

  React.useEffect(() => {
    if (!isLoaded) return;

    // accountType is undefined means data hasn't resolved yet — wait
    if (accountType === undefined) return;

    // If not a driver, redirect to dealer dashboard
    if (!isDriver) {
      router.push("/");
      return;
    }
    // If driver but no org (not approved yet), redirect to pending
    if (!organizationId) {
      router.push("/driver/pending");
      return;
    }

    // All checks passed
    setGuardPassed(true);
  }, [isLoaded, isDriver, organizationId, accountType, router]);

  // Show loading while guard is checking
  if (!guardPassed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <DriverSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center justify-between px-2 sm:px-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || ""} />
                    <AvatarFallback>
                      {user?.firstName?.substring(0, 1).toUpperCase() || "DR"}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.fullName}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.primaryEmailAddress?.emailAddress}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push("/driver/profile")}>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/driver/settings")}>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => signOut()}>Log out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-hidden bg-background">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}

export default function DriverLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <DriverLayoutContent>{children}</DriverLayoutContent>
      </NotificationProvider>
    </ThemeProvider>
  );
}
