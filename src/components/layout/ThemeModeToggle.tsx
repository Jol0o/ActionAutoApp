"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ThemeModeToggleProps {
    className?: string;
    compact?: boolean;
}

export function ThemeModeToggle({ className, compact = false }: ThemeModeToggleProps) {
    const { theme, setTheme } = useTheme();
    const isDark = theme === "dark";
    const currentThemeLabel = isDark ? "Dark" : "Light";
    const nextThemeLabel = isDark ? "light" : "dark";

    const handleToggle = React.useCallback(() => {
        setTheme(isDark ? "light" : "dark");
    }, [isDark, setTheme]);

    return (
        <Button
            type="button"
            variant="outline"
            size={compact ? "icon" : "sm"}
            onClick={handleToggle}
            title={`Current mode: ${currentThemeLabel}. Switch to ${nextThemeLabel} mode`}
            aria-label={`Current mode: ${currentThemeLabel}. Switch to ${nextThemeLabel} mode`}
            className={cn(
                compact
                    ? "h-9 w-9 rounded-full"
                    : "h-9 rounded-full px-3 gap-2 text-xs font-semibold",
                className,
            )}
        >
            {isDark ? (
                <Sun className="size-4 text-amber-500" />
            ) : (
                <Moon className="size-4 text-slate-600" />
            )}
            {!compact && (
                <span className="hidden sm:inline">
                    {isDark ? "Dark" : "Light"}
                </span>
            )}
            <span className="sr-only">
                Current mode: {currentThemeLabel}. Activate to switch to {nextThemeLabel} mode.
            </span>
        </Button>
    );
}
