'use client';

import { useParams, useRouter } from 'next/navigation';
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { TaskList } from '@/components/tasks/TaskList';

export default function ProjectTasksPage() {
    const params = useParams();
    const router = useRouter();
    const projectId = Number(params.id);

    return (
        <DashboardCanvas>
            <DashboardContent>
                <DashboardHero
                    eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Project Tasks</>}
                    title="Project tasks framed by the shared dashboard visual system"
                    description="View and manage tasks for this project with the same hero, glass panels, and spacious control-room styling."
                    right={
                        <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                            <Button
                                variant="ghost"
                                onClick={() => router.push(`/dashboard/projects/${projectId}`)}
                            >
                                Back to Project Details
                            </Button>
                        </DashboardSurface>
                    }
                />
                <TaskList projectId={projectId} />
            </DashboardContent>
        </DashboardCanvas>
    );
}
