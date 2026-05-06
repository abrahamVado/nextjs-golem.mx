"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageTitleProps = {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
};

export default function PageTitle({ title, description, actions, className }: PageTitleProps) {
    return (
        <div className={cn("mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between", className)}>
            <div className="min-w-0">
                <h1 className="text-xl font-semibold text-foreground md:text-2xl">{title}</h1>
                {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {actions ? <div className="w-full md:w-auto">{actions}</div> : null}
        </div>
    );
}
