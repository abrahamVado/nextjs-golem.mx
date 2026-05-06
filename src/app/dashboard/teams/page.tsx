"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardCanvas, DashboardContent, DashboardEmpty, DashboardHero, DashboardNotice, DashboardSectionHeading, DashboardSurface } from "@/components/layout/dashboard-visuals";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import { getErrorMessage } from "@/lib/errors";

type Team = {
    id: string;
    name: string;
    slug?: string;
};

type Project = {
    id: string;
    name: string;
    description?: string;
};

type Member = {
    user_id: string;
    name: string;
    email: string;
};

export default function TeamsPage() {
    const [teams, setTeams] = useState<Team[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [projects, setProjects] = useState<Project[]>([]);
    const [members, setMembers] = useState<Member[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        const loadTeams = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.get<{ data: Team[] }>("/teams");
                if (!active) return;
                const nextTeams = response.data.data || [];
                setTeams(nextTeams);
                setSelectedTeamId(nextTeams[0]?.id || null);
            } catch (requestError: unknown) {
                if (!active) return;
                setError(getErrorMessage(requestError, "Failed to load teams"));
            } finally {
                if (active) setLoading(false);
            }
        };

        void loadTeams();
        return () => {
            active = false;
        };
    }, []);

    useEffect(() => {
        let active = true;
        if (!selectedTeamId) {
            setProjects([]);
            setMembers([]);
            return;
        }

        const loadDetails = async () => {
            setDetailsLoading(true);
            setError(null);
            try {
                const [projectsResponse, membersResponse] = await Promise.all([
                    api.get<{ data: Project[] }>(`/teams/${selectedTeamId}/projects`),
                    api.get<{ data: Member[] }>(`/teams/${selectedTeamId}/members`),
                ]);
                if (!active) return;
                setProjects(projectsResponse.data.data || []);
                setMembers(membersResponse.data.data || []);
            } catch (requestError: unknown) {
                if (!active) return;
                setError(getErrorMessage(requestError, "Failed to load team details"));
            } finally {
                if (active) setDetailsLoading(false);
            }
        };

        void loadDetails();
        return () => {
            active = false;
        };
    }, [selectedTeamId]);

    const selectedTeam = useMemo(
        () => teams.find((team) => team.id === selectedTeamId) || null,
        [teams, selectedTeamId]
    );

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Teams</>}
                    title="Teams with the same polished access-era visual system"
                    description="View team members and the projects available to each workspace with the shared hero, palette, and glass-panel treatment."
                    right={
                        teams.length > 0 ? (
                            <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                                <div className="mb-3 text-[11px] font-extrabold uppercase tracking-[0.18em] text-slate-500">Switch team</div>
                                <div className="flex flex-wrap gap-2">
                                    {teams.map((team) => (
                                        <Button
                                            key={team.id}
                                            variant={team.id === selectedTeamId ? "default" : "outline"}
                                            onClick={() => setSelectedTeamId(team.id)}
                                        >
                                            {team.name}
                                        </Button>
                                    ))}
                                </div>
                            </DashboardSurface>
                        ) : null
                    }
                />

            {error ? (
                <DashboardNotice tone="red">{error}</DashboardNotice>
            ) : null}

            {loading ? (
                <DashboardSurface className="text-sm text-muted-foreground">
                    Loading teams...
                </DashboardSurface>
            ) : !selectedTeam ? (
                <DashboardSurface>
                    <DashboardEmpty
                        title="No teams available"
                        description="The current backend only exposes existing company teams, and none were returned for this user."
                    />
                </DashboardSurface>
            ) : (
                <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                    <DashboardSurface>
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <div>
                                <h2 className="text-lg font-semibold text-foreground">{selectedTeam.name}</h2>
                                <p className="text-sm text-muted-foreground">
                                    {selectedTeam.slug ? `Slug: ${selectedTeam.slug}` : "Team projects currently available"}
                                </p>
                            </div>
                            {detailsLoading ? <span className="text-xs text-muted-foreground">Refreshing…</span> : null}
                        </div>

                        {projects.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                No projects are linked to this team yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {projects.map((project) => (
                                    <div key={project.id} className="rounded-xl border border-border/60 bg-background/60 p-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <div>
                                                <h3 className="font-medium text-foreground">{project.name}</h3>
                                                <p className="mt-1 text-sm text-muted-foreground">
                                                    {project.description || "No description yet."}
                                                </p>
                                            </div>
                                            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                                                Active
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DashboardSurface>

                    <DashboardSurface>
                        <DashboardSectionHeading title="Members" description="People returned by the current backend for this team." />

                        {members.length === 0 ? (
                            <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                                No members were returned for this team.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {members.map((member) => (
                                    <div key={member.user_id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-background/60 p-4">
                                        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                                            {(member.name || member.email).slice(0, 2).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="font-medium text-foreground">{member.name || "Unnamed user"}</div>
                                            <div className="truncate text-sm text-muted-foreground">{member.email}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </DashboardSurface>
                </div>
            )}
            </DashboardContent>
        </DashboardCanvas>
    );
}
