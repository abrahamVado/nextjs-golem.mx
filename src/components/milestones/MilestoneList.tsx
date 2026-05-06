import { useCallback, useEffect, useState } from 'react';
import { Milestone } from '@/types';
import { projectApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CreateMilestoneModal } from './CreateMilestoneModal';

interface MilestoneListProps {
    projectId: number;
}

export function MilestoneList({ projectId }: MilestoneListProps) {
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchMilestones = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await projectApi.getMilestones(projectId);
            setMilestones(res.data.data);
        } catch (error) {
            console.error('Failed to fetch milestones:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void fetchMilestones();
    }, [fetchMilestones]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Milestones</h3>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    New Milestone
                </Button>
            </div>

            {isLoading ? (
                <div className="text-sm text-gray-500">Loading milestones...</div>
            ) : milestones.length === 0 ? (
                <div className="text-sm text-gray-500 border rounded-md p-8 text-center bg-gray-50">
                    No milestones found. Create one to get started.
                </div>
            ) : (
                <div className="space-y-4">
                    {milestones.map((milestone) => (
                        <div key={milestone.id} className="border rounded-md p-4 bg-white shadow-sm">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h4 className="font-medium text-gray-900">{milestone.name}</h4>
                                        <span className={`px-2 py-0.5 text-xs rounded-full 
                                           ${milestone.status === 'CLOSED' ? 'bg-green-100 text-green-800' :
                                                'bg-blue-100 text-blue-800'}`}>
                                            {milestone.status}
                                        </span>
                                    </div>
                                    {milestone.description && (
                                        <p className="mt-1 text-sm text-gray-500">{milestone.description}</p>
                                    )}
                                </div>
                                <div className="text-sm text-gray-500 text-right">
                                    <div>Due: {milestone.due_date ? new Date(milestone.due_date).toLocaleDateString() : 'No date'}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <CreateMilestoneModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                projectId={projectId}
                onSuccess={fetchMilestones}
            />
        </div>
    );
}
