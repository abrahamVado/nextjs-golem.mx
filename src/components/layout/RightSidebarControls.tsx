"use client";

import Link from "next/link";
import { Bell, LogOut, Moon, Sun, Minimize2, Maximize2, X, SlidersHorizontal, UserCog } from "lucide-react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useUI } from "@/components/providers/ui-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { resolveAssetURL } from "@/lib/assets";
import LanguageSwitcher from "./LanguageSwitcher";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import Image from "next/image";

export default function RightSidebarControls({
    isOpen,
    onOpen,
    onClose,
}: {
    isOpen: boolean;
    onOpen: () => void;
    onClose: () => void;
}) {
    const { user, logout } = useAuth();
    const { settings, updateSettings, headerTitle, headerDescription } = useUI();
    const { __, locale, setLocale } = useLanguage();
    const router = useRouter();
    const isDark = settings.themeMode === "dark";
    const isBoxed = settings.layoutMode === "boxed";

    const displayName = user?.name || user?.full_name || user?.email || "User";
    const avatarSrc = resolveAssetURL(user?.avatar_url);
    const languageFlagSrc = locale === "en" ? "/flags/us.svg" : "/flags/mx.svg";
    const languageLabel = locale === "en" ? "USA" : "MX";
    const avatarInitials = displayName
        .split(" ")
        .filter(Boolean)
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

    return (
        <>
            {!isOpen && (
                <aside className="fixed right-0 top-0 z-30 hidden h-screen w-14 flex-col items-center border-l border-border bg-background/95 py-3 shadow-md backdrop-blur lg:flex">
                    <div className="relative group mb-2">
                        <button
                            type="button"
                            onClick={() => router.push("/dashboard/settings")}
                            aria-label="Go to user settings"
                            className="relative h-9 w-9 overflow-hidden rounded-full border border-border bg-muted text-[10px] font-semibold text-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {avatarSrc ? (
                                <Image src={avatarSrc} alt={`${displayName} avatar`} fill className="object-cover" sizes="36px" unoptimized />
                            ) : (
                                <span>{avatarInitials}</span>
                            )}
                        </button>
                        <div className="absolute right-full top-1/2 z-50 mr-[13px] hidden w-auto min-w-max -translate-y-1/2 rounded-md border bg-popover p-2 shadow-md group-hover:block whitespace-nowrap bg-white dark:bg-gray-800 before:absolute before:-right-2 before:top-0 before:h-full before:w-2 before:content-['']">
                            User settings
                        </div>
                    </div>
                    <div className="relative group mb-2">
                        <button
                            type="button"
                            onClick={() => logout()}
                            aria-label={__("common.logout")}
                            className="rounded-md p-2 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-red-600 focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <LogOut className="h-6 w-6" />
                        </button>
                        <div className="absolute right-full top-1/2 z-50 mr-[13px] hidden w-auto min-w-max -translate-y-1/2 rounded-md border bg-popover p-2 shadow-md group-hover:block whitespace-nowrap bg-white dark:bg-gray-800 before:absolute before:-right-2 before:top-0 before:h-full before:w-2 before:content-['']">
                            {__("common.logout")}
                        </div>
                    </div>
                    <div className="relative group mb-2">
                        <Link
                            href="/dashboard/notifications"
                            aria-label={__("common.notifications")}
                            className="relative block rounded-md p-2 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <Bell className="h-6 w-6" />
                            <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" aria-hidden="true" />
                        </Link>
                        <div className="absolute right-full top-1/2 z-50 mr-[13px] hidden w-auto min-w-max -translate-y-1/2 rounded-md border bg-popover p-2 shadow-md group-hover:block whitespace-nowrap bg-white dark:bg-gray-800 before:absolute before:-right-2 before:top-0 before:h-full before:w-2 before:content-['']">
                            {__("common.notifications")}
                        </div>
                    </div>
                    <div className="relative group">
                        <button
                            type="button"
                            onClick={onOpen}
                            aria-label="Open controls"
                            className="rounded-md p-2 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            <SlidersHorizontal className="h-6 w-6" />
                        </button>
                        <div className="absolute right-full top-1/2 z-50 mr-[13px] hidden w-auto min-w-max -translate-y-1/2 rounded-md border bg-popover p-2 shadow-md group-hover:block whitespace-nowrap bg-white dark:bg-gray-800 before:absolute before:-right-2 before:top-0 before:h-full before:w-2 before:content-['']">
                            Open controls
                        </div>
                    </div>
                    <div className="mt-2 flex flex-col items-center gap-2">
                        <div className="relative group mb-2">
                            <button
                                type="button"
                                onClick={() => updateSettings({ themeMode: isDark ? "light" : "dark" })}
                                aria-label={isDark ? __("theme.light") : __("theme.dark")}
                                className="rounded-md p-2 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {isDark ? <Sun className="h-6 w-6" /> : <Moon className="h-6 w-6" />}
                            </button>
                            <div className="absolute right-full top-1/2 z-50 mr-[13px] hidden w-auto min-w-max -translate-y-1/2 rounded-md border bg-popover p-2 shadow-md group-hover:block whitespace-nowrap bg-white dark:bg-gray-800 before:absolute before:-right-2 before:top-0 before:h-full before:w-2 before:content-['']">
                                {isDark ? __("theme.light") : __("theme.dark")}
                            </div>
                        </div>
                        <div className="relative group mb-2">
                            <button
                                type="button"
                                onClick={() => setLocale(locale === "en" ? "es" : "en")}
                                aria-label={`Language ${languageLabel}`}
                                className="rounded-md p-1 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                <Image
                                    src={languageFlagSrc}
                                    alt={`${languageLabel} flag`}
                                    width={22}
                                    height={14}
                                    className="h-[14px] w-[22px] rounded-[1px] object-cover"
                                />
                            </button>
                            <div className="absolute right-full top-1/2 z-50 mr-[13px] hidden w-auto min-w-max -translate-y-1/2 rounded-md border bg-popover p-2 shadow-md group-hover:block whitespace-nowrap bg-white dark:bg-gray-800 before:absolute before:-right-2 before:top-0 before:h-full before:w-2 before:content-['']">
                                {`Language: ${languageLabel}`}
                            </div>
                        </div>
                        <div className="relative group">
                            <button
                                type="button"
                                onClick={() => updateSettings({ layoutMode: isBoxed ? "full" : "boxed" })}
                                aria-label={isBoxed ? "Full Width" : "Boxed"}
                                className="rounded-md p-2 text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
                            >
                                {isBoxed ? <Maximize2 className="h-6 w-6" /> : <Minimize2 className="h-6 w-6" />}
                            </button>
                            <div className="absolute right-full top-1/2 z-50 mr-[13px] hidden w-auto min-w-max -translate-y-1/2 rounded-md border bg-popover p-2 shadow-md group-hover:block whitespace-nowrap bg-white dark:bg-gray-800 before:absolute before:-right-2 before:top-0 before:h-full before:w-2 before:content-['']">
                                {isBoxed ? "Full Width" : "Boxed"}
                            </div>
                        </div>
                    </div>
                </aside>
            )}
            <div
                className={cn("fixed inset-0 z-40 bg-black/50 transition-opacity", isOpen ? "opacity-100" : "pointer-events-none opacity-0")}
                onClick={onClose}
            />
            <aside
                className={cn(
                    "fixed right-0 top-0 z-50 h-screen w-[320px] border-l border-border bg-background shadow-xl transition-transform duration-300",
                    isOpen ? "translate-x-0" : "translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-between border-b border-border px-4">
                    <div>
                        <h2 className="text-sm font-semibold text-foreground">{headerTitle || __("common.dashboard")}</h2>
                        {headerDescription && <p className="text-xs text-muted-foreground">{headerDescription}</p>}
                    </div>
                    <button onClick={onClose} className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="space-y-6 p-4">
                    <div className="space-y-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Display</p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                className="flex-1 justify-start"
                                onClick={() => updateSettings({ layoutMode: isBoxed ? "full" : "boxed" })}
                            >
                                {isBoxed ? <Maximize2 className="mr-2 h-4 w-4" /> : <Minimize2 className="mr-2 h-4 w-4" />}
                                {isBoxed ? "Full Width" : "Boxed"}
                            </Button>
                            <Button
                                variant="outline"
                                className="flex-1 justify-start"
                                onClick={() => updateSettings({ themeMode: isDark ? "light" : "dark" })}
                            >
                                {isDark ? <Sun className="mr-2 h-4 w-4" /> : <Moon className="mr-2 h-4 w-4" />}
                                {isDark ? __("theme.light") : __("theme.dark")}
                            </Button>
                        </div>
                        <div className="flex items-center gap-2 rounded-md border border-border p-3">
                            <Bell className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-foreground">{__("common.notifications")}</span>
                            <span className="ml-auto h-2 w-2 rounded-full bg-red-500" />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Language</p>
                        <LanguageSwitcher />
                    </div>

                    <div className="space-y-3 rounded-md border border-border p-3">
                        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account</p>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => router.push("/dashboard/settings")}
                                title="Go to user settings"
                                className="relative h-10 w-10 overflow-hidden rounded-full border border-border bg-muted text-xs font-semibold text-foreground"
                            >
                                {avatarSrc ? (
                                    <Image src={avatarSrc} alt="Avatar" fill className="object-cover" sizes="40px" unoptimized />
                                ) : (
                                    <span>{avatarInitials}</span>
                                )}
                                <span className="absolute -bottom-0.5 -right-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full border border-border bg-background text-muted-foreground">
                                    <UserCog className="h-2.5 w-2.5" />
                                </span>
                            </button>
                            <div className="min-w-0">
                                <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
                                <p className="truncate text-xs text-muted-foreground">{user?.role || "User"}</p>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            onClick={() => logout()}
                            className="w-full justify-start text-muted-foreground hover:text-red-600"
                            title={__("common.logout")}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            {__("common.logout")}
                        </Button>
                    </div>
                </div>
            </aside>
        </>
    );
}
