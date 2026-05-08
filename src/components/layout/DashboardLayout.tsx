"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import ProjectNavigatorSidebar from "./ProjectNavigatorSidebar";
import RightSidebarControls from "./RightSidebarControls";
import TopBar from "./TopBar";
import { useUI } from "@/components/providers/ui-provider";
import { cn } from "@/lib/utils";
import { PageReveal } from "@/components/motion/PageReveal";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(false);
    const { settings } = useUI();
    const pathname = usePathname();
    const useProjectNavigator = pathname === "/dashboard/projects" || pathname.startsWith("/dashboard/projects/");

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            {useProjectNavigator ? (
                <ProjectNavigatorSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            ) : (
                <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            )}
            <RightSidebarControls
                isOpen={rightPanelOpen}
                onOpen={() => setRightPanelOpen(true)}
                onClose={() => setRightPanelOpen(false)}
            />

            <div className="flex flex-1 flex-col overflow-y-auto">
                <TopBar onMenuClick={() => setSidebarOpen(true)} onRightMenuClick={() => setRightPanelOpen(true)} />
                <main className={cn("flex-1", !rightPanelOpen && "lg:pr-14")}>
                    <PageReveal
                        className={cn(
                            settings.layoutMode === "boxed"
                                ? "mx-auto w-full max-w-[1600px] px-4 pt-[5px] sm:px-6 lg:px-8"
                                : "w-full p-[5px]"
                        )}
                        dependencyKey={pathname}
                    >
                        {children}
                    </PageReveal>
                </main>
            </div>
        </div>
    );
}
