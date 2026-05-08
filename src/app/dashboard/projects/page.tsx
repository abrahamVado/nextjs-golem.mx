"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

type Project = {
    id: string;
};

export default function ProjectsPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadFirstProject = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get<{ data: Project[] }>("/projects");
                if (!active) return;
                const projects = response.data.data || [];
                if (projects.length === 0) {
                    return;
                }
                const firstProjectId = projects[0].id;
                router.replace(`/dashboard/projects/${encodeURIComponent(firstProjectId)}`);
            } catch (requestError: unknown) {
                if (!active) return;
                setError(getErrorMessage(requestError, "Failed to load projects"));
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadFirstProject();
        return () => {
            active = false;
        };
    }, [router]);

    if (loading) {
        return <div className="p-6 text-sm text-slate-600">Loading project workspace...</div>;
    }

    if (error) {
        return <div className="p-6 text-sm text-red-600">{error}</div>;
    }

    return <div className="p-6 text-sm text-slate-600">No projects are available yet.</div>;
}
