"use client";

import * as React from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Settings, Bell, MapPin, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export default function DriverSettingsPage() {
  const { user } = useUser();
  const { theme, setTheme } = useTheme();

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your preferences.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Moon className="size-4" />
            Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="dark-mode" className="flex items-center gap-2">
              <span>Dark Mode</span>
            </Label>
            <Switch
              id="dark-mode"
              checked={theme === "dark"}
              onCheckedChange={(checked) =>
                setTheme(checked ? "dark" : "light")
              }
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="size-4" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="load-notifications">New load assignments</Label>
            <Switch id="load-notifications" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="status-notifications">Status updates</Label>
            <Switch id="status-notifications" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MapPin className="size-4" />
            Location
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="auto-share">Auto-share location on login</Label>
              <p className="text-xs text-muted-foreground mt-0.5">
                Automatically start GPS sharing when you open the app.
              </p>
            </div>
            <Switch id="auto-share" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
