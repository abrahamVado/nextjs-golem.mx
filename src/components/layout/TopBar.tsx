"use client";

import { Menu, SlidersHorizontal } from "lucide-react";

export default function TopBar({
    onMenuClick,
    onRightMenuClick,
}: {
    onMenuClick: () => void;
    onRightMenuClick: () => void;
}) {
    return (
        <header className="sticky top-0 z-30 flex h-16 w-full shrink-0 items-center justify-between border-b border-border bg-background/95 px-4 shadow-sm backdrop-blur lg:mr-[2.6rem] lg:w-[calc(100%-2.6rem)] lg:px-6">
            <div className="flex items-center gap-4">
                <button
                    onClick={onMenuClick}
                    className="lg:hidden rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                    <Menu className="h-6 w-6" />
                </button>
                {/* Breadcrumbs could go here */}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={onRightMenuClick}
                    className="rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground lg:hidden"
                    aria-label="Open controls"
                >
                    <SlidersHorizontal className="h-6 w-6" />
                </button>
            </div>
        </header>
    );
}
