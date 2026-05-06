import { useCallback, useEffect, useState } from 'react';
import { Epic } from '@/types';
import { projectApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { CreateEpicModal } from './CreateEpicModal';

interface EpicListProps {
    projectId: number;
}

export function EpicList({ projectId }: EpicListProps) {
    const [epics, setEpics] = useState<Epic[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const fetchEpics = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await projectApi.getEpics(projectId);
            setEpics(res.data.data);
        } catch (error) {
            console.error('Failed to fetch epics:', error);
        } finally {
            setIsLoading(false);
        }
    }, [projectId]);

    useEffect(() => {
        void fetchEpics();
    }, [fetchEpics]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Epics</h3>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    New Epic
                </Button>
            </div>

            {isLoading ? (
                <div className="text-sm text-gray-500">Loading epics...</div>
            ) : epics.length === 0 ? (
                <div className="text-sm text-gray-500 border rounded-md p-8 text-center bg-gray-50">
                    No epics found. Create one to get started.
                </div>
            ) : (
                <div className="border rounded-md overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {epics.map((epic) => (
                                <tr key={epic.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{epic.name}</div>
                                        {epic.description && (
                                            <div className="text-sm text-gray-500 truncate max-w-xs">{epic.description}</div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${epic.status === 'DONE' ? 'bg-green-100 text-green-800' :
                                                epic.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' :
                                                    'bg-gray-100 text-gray-800'}`}>
                                            {epic.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {epic.due_date ? new Date(epic.due_date).toLocaleDateString() : '-'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            <CreateEpicModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                projectId={projectId}
                onSuccess={fetchEpics}
            />
        </div>
    );
}
