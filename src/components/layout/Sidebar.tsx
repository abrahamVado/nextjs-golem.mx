import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { useUI } from "@/components/providers/ui-provider";
import { useLanguage } from "@/components/providers/language-provider";
import { isClientRole } from "@/lib/access";
import {
    LayoutDashboard,
    Settings,
    Bell,
    Webhook,
    ShieldAlert,
    Users,
    KeyRound,
    Binary,
    FileText,
    ChevronLeft,
    ChevronRight,
    Ticket,
    Columns3,
    FolderKanban,
    UsersRound,
    ChevronDown,
    LucideIcon
} from "lucide-react";
import { Button } from "../ui/Button";

export default function Sidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();
    const { user } = useAuth();
    const { settings, updateSettings } = useUI();
    const { __ } = useLanguage();
    const [expandedItem, setExpandedItem] = useState<string | null>(null);
    const clientOnly = isClientRole(user);

    const toggleSidebar = () => {
        updateSettings({ sidebarCollapsed: !settings.sidebarCollapsed });
    };

    const toggleExpand = (label: string) => {
        setExpandedItem(expandedItem === label ? null : label);
    };

    type NavItem = {
        label: string;
        href: string;
        icon: LucideIcon;
        subItems?: { label: string; href: string; icon: LucideIcon }[];
    };

    const navItems: NavItem[] = [
        { label: __("common.dashboard"), href: "/dashboard", icon: LayoutDashboard },
        { label: __("nav.tickets") || "Tickets", href: "/dashboard/tickets", icon: Ticket },
        { label: "Projects", href: "/dashboard/projects", icon: FolderKanban },
        { label: "Teams", href: "/dashboard/teams", icon: UsersRound },
        ...(!clientOnly ? [{
            label: "Kanban", href: "/dashboard/kanban", icon: Columns3
        }] : []),
        ...(!clientOnly ? [{
            label: __("nav.access_control"),
            href: "/dashboard/access",
            icon: ShieldAlert,
            subItems: [
                { label: "Users", href: "/dashboard/access/users", icon: Users },
                { label: "Roles", href: "/dashboard/access/roles", icon: ShieldAlert },
            ]
        }] : []),
        ...(!clientOnly ? [{
            label: "API Security",
            href: "/dashboard/api",
            icon: KeyRound,
            subItems: [
                { label: "Administration", href: "/dashboard/api/clients", icon: KeyRound },
                { label: "Orchestration", href: "/dashboard/api/orchestration", icon: Binary },
                { label: "API Docs", href: "/dashboard/api/docs", icon: FileText },
            ]
        }] : []),
        ...(!clientOnly ? [{ label: __("common.notifications"), href: "/dashboard/notifications", icon: Bell }] : []),
        ...(!clientOnly ? [{ label: __("nav.webhooks"), href: "/dashboard/webhooks", icon: Webhook }] : []),
        { label: __("common.settings"), href: "/dashboard/settings", icon: Settings },
    ];

    return (
        <>
            {/* Mobile Overlay */}
            <div
                className={cn(
                    "fixed inset-0 z-40 bg-black/50 lg:hidden",
                    isOpen ? "block" : "hidden"
                )}
                onClick={onClose}
            />

            {/* Sidebar Container */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col border-r bg-background transition-all duration-300 ease-in-out lg:static lg:translate-x-0",
                    settings.enableGlassmorphism
                        ? "border-border lg:border-border/60 lg:bg-background/60 lg:backdrop-blur-2xl lg:supports-[backdrop-filter]:bg-background/40 dark:lg:border-white/10"
                        : "bg-sidebar border-slate-300 dark:border-sidebar-border",
                    isOpen ? "translate-x-0" : "-translate-x-full",
                    settings.sidebarCollapsed ? "w-20" : "w-64"
                )}
            >
                <div className={cn("flex h-16 items-center border-b border-border/10", settings.sidebarCollapsed ? "justify-center px-0" : "justify-between px-6")}>
                    <span className={cn(
                        "font-bold tracking-tight bg-gradient-to-r from-indigo-500 to-violet-500 bg-clip-text text-transparent transition-all duration-300",
                        settings.sidebarCollapsed ? "text-3xl" : "text-xl"
                    )}>
                        {settings.sidebarCollapsed ? "L" : "Golem.mx"}
                    </span>
                    {!settings.sidebarCollapsed && (
                        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden lg:flex h-8 w-8">
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                <nav className={cn(
                    "flex-1 space-y-2 p-2 mt-4 max-h-[calc(100vh-8rem)] scrollbar-hide",
                    settings.sidebarCollapsed ? "overflow-visible" : "overflow-y-auto"
                )}>
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || (item.subItems && item.subItems.some(sub => pathname === sub.href));
                        const Icon = item.icon;
                        const isExpanded = expandedItem === item.label;

                        if (item.subItems) {
                            return (
                                <div key={item.label} className="relative group">
                                    <button
                                        onClick={() => !settings.sidebarCollapsed && toggleExpand(item.label)}
                                        className={cn(
                                            "flex w-full items-center rounded-md text-sm font-medium transition-all duration-200",
                                            settings.sidebarCollapsed
                                                ? "justify-center px-0 py-3"
                                                : "gap-3 px-3 py-2 justify-between",
                                            isActive
                                                ? "bg-primary/10 text-primary shadow-md"
                                                : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                            settings.enableAnimations && !settings.sidebarCollapsed && "hover:translate-x-1"
                                        )}
                                        title={settings.sidebarCollapsed ? item.label : ""}
                                    >
                                        <div className={cn("flex items-center gap-3", settings.sidebarCollapsed && "justify-center w-full")}>
                                            <Icon className={cn("transition-all duration-200", settings.sidebarCollapsed ? "h-6 w-6 scale-110" : "h-5 w-5")} />
                                            {!settings.sidebarCollapsed && <span>{item.label}</span>}
                                        </div>
                                        {!settings.sidebarCollapsed && (
                                            <ChevronDown className={cn("h-4 w-4 transition-transform", isExpanded ? "rotate-180" : "")} />
                                        )}
                                    </button>

                                    {/* Expanded Sub-menu (Mobile/Desktop Expanded) */}
                                    {!settings.sidebarCollapsed && isExpanded && (
                                        <div className="ml-4 mt-1 border-l-2 border-border/10 pl-2 space-y-1">
                                            {item.subItems.map((subItem) => {
                                                const isSubActive = pathname === subItem.href;
                                                const SubIcon = subItem.icon;
                                                return (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        onClick={() => onClose()}
                                                        className={cn(
                                                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all duration-200",
                                                            isSubActive
                                                                ? "text-primary bg-primary/5"
                                                                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                                                        )}
                                                    >
                                                        <SubIcon className="h-4 w-4" />
                                                        {subItem.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Floating Sub-menu (Collapsed Mode) */}
                                    {settings.sidebarCollapsed && (
                                        <div className="absolute left-full top-0 ml-2 w-48 rounded-md border bg-popover p-2 shadow-md hidden group-hover:block z-50 bg-white dark:bg-gray-800 before:absolute before:-left-2 before:top-0 before:h-full before:w-2 before:content-['']">
                                            <div className="px-2 py-1.5 text-sm font-semibold text-foreground border-b mb-1">
                                                {item.label}
                                            </div>
                                            {item.subItems.map((subItem) => {
                                                const SubIcon = subItem.icon;
                                                return (
                                                    <Link
                                                        key={subItem.href}
                                                        href={subItem.href}
                                                        className="flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground"
                                                    >
                                                        <SubIcon className="h-4 w-4" />
                                                        {subItem.label}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => onClose()}
                                className={cn(
                                    "flex items-center rounded-md text-sm font-medium transition-all duration-200 group relative",
                                    settings.sidebarCollapsed
                                        ? "justify-center px-0 py-3"
                                        : "gap-3 px-3 py-2",
                                    isActive
                                        ? "bg-primary/10 text-primary shadow-md"
                                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                                    settings.enableAnimations && !settings.sidebarCollapsed && "hover:translate-x-1"
                                )}
                            >
                                <Icon className={cn("transition-all duration-200", settings.sidebarCollapsed ? "h-6 w-6 scale-110" : "h-5 w-5")} />
                                {!settings.sidebarCollapsed && <span>{item.label}</span>}

                                {/* Tooltip for Collapsed Mode */}
                                {settings.sidebarCollapsed && (
                                    <div className="absolute left-full top-0 ml-2 w-auto min-w-max rounded-md border bg-popover p-2 shadow-md hidden group-hover:block z-50 bg-white dark:bg-gray-800 before:absolute before:-left-2 before:top-0 before:h-full before:w-2 before:content-['']">
                                        <div className="px-2 py-1.5 text-sm font-semibold text-foreground">
                                            {item.label}
                                        </div>
                                    </div>
                                )}
                            </Link>
                        );
                    })}
                </nav>

                {settings.sidebarCollapsed && (
                    <div className="flex justify-center pb-4">
                        <Button variant="ghost" size="icon" onClick={toggleSidebar} className="hidden lg:flex">
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}

                <div className={cn("border-t border-border/10 p-4", settings.sidebarCollapsed && "flex justify-center")}>
                    {!settings.sidebarCollapsed ? (
                        <div className="rounded-lg bg-card/50 p-3 text-xs text-muted-foreground backdrop-blur-sm">
                            <p>{__("common.version")}</p>
                        </div>
                    ) : (
                        <div className="text-xs text-muted-foreground font-bold">v1.0</div>
                    )}
                </div>
            </aside>
        </>
    );
}


