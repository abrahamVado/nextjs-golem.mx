"use client";

import React, { createContext, useContext, useState } from "react";

type TeamSummary = {
    id: number;
    name: string;
};

type ProjectSummary = {
    id: number;
    name: string;
};

type WorkspaceContextType = {
    currentTeamId: number | null;
    setCurrentTeamId: (teamID: number | null) => void;
    currentProjectId: number | null;
    setCurrentProjectId: (projectID: number | null) => void;
    teams: TeamSummary[];
    setTeams: (teams: TeamSummary[]) => void;
    projectsByTeam: Record<number, ProjectSummary[]>;
    setProjectsForTeam: (teamID: number, projects: ProjectSummary[]) => void;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

function parseStoredNumber(key: string): number | null {
    if (typeof window === "undefined") return null;
    const value = localStorage.getItem(key);
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
    const [currentTeamIdState, setCurrentTeamIdState] = useState<number | null>(() => parseStoredNumber("current_team_id"));
    const [currentProjectIdState, setCurrentProjectIdState] = useState<number | null>(() => parseStoredNumber("current_project_id"));
    const [teams, setTeamsState] = useState<TeamSummary[]>([]);
    const [projectsByTeam, setProjectsByTeam] = useState<Record<number, ProjectSummary[]>>({});

    const setCurrentTeamId = React.useCallback((teamID: number | null) => {
        setCurrentTeamIdState(teamID);
        if (typeof window !== "undefined") {
            if (teamID) localStorage.setItem("current_team_id", String(teamID));
            else localStorage.removeItem("current_team_id");
        }
    }, []);

    const setCurrentProjectId = React.useCallback((projectID: number | null) => {
        setCurrentProjectIdState(projectID);
        if (typeof window !== "undefined") {
            if (projectID) localStorage.setItem("current_project_id", String(projectID));
            else localStorage.removeItem("current_project_id");
        }
    }, []);

    const setTeams = React.useCallback((nextTeams: TeamSummary[]) => {
        setTeamsState(nextTeams);
        setCurrentTeamIdState((prev) => {
            if (nextTeams.length === 0) {
                if (typeof window !== "undefined") localStorage.removeItem("current_team_id");
                return null;
            }
            const hasCurrent = prev != null && nextTeams.some((team) => team.id === prev);
            if (!hasCurrent) {
                const newId = nextTeams[0].id;
                if (typeof window !== "undefined") localStorage.setItem("current_team_id", String(newId));
                return newId;
            }
            return prev;
        });
    }, []);

    const setProjectsForTeam = React.useCallback((teamID: number, projects: ProjectSummary[]) => {
        setProjectsByTeam((prev) => ({ ...prev, [teamID]: projects }));
        setCurrentTeamIdState((currentTeamId) => {
            if (currentTeamId === teamID) {
                setCurrentProjectIdState((currentProjectId) => {
                    if (projects.length === 0) {
                        if (typeof window !== "undefined") localStorage.removeItem("current_project_id");
                        return null;
                    }
                    const hasCurrent = currentProjectId != null && projects.some((project) => project.id === currentProjectId);
                    if (!hasCurrent) {
                        const newId = projects[0].id;
                        if (typeof window !== "undefined") localStorage.setItem("current_project_id", String(newId));
                        return newId;
                    }
                    return currentProjectId;
                });
            }
            return currentTeamId;
        });
    }, []);

    const contextValue = React.useMemo(() => ({
        currentTeamId: currentTeamIdState,
        setCurrentTeamId,
        currentProjectId: currentProjectIdState,
        setCurrentProjectId,
        teams,
        setTeams,
        projectsByTeam,
        setProjectsForTeam,
    }), [currentTeamIdState, setCurrentTeamId, currentProjectIdState, setCurrentProjectId, teams, setTeams, projectsByTeam, setProjectsForTeam]);

    return (
        <WorkspaceContext.Provider value={contextValue}>
            {children}
        </WorkspaceContext.Provider>
    );
}

export function useWorkspace() {
    const context = useContext(WorkspaceContext);
    if (!context) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
}
