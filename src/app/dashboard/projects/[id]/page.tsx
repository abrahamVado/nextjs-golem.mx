"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import KanbanPage from "../../kanban/page";

export default function ProjectKanbanPage() {
    const params = useParams();
    const projectId = String(params.id || "");

    // Seed current project so Kanban loads the correct board
    useEffect(() => {
        if (!projectId) return;
        if (typeof window !== "undefined") {
            localStorage.setItem("current_project_id", projectId);
        }
    }, [projectId]);

    // Render Kanban directly
    return <KanbanPage initialProjectId={projectId} />;
}
