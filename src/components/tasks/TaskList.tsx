import { useCallback, useEffect, useState } from 'react';
import { taskApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { getErrorMessage } from '@/lib/errors';
import { useFeedback } from '@/components/providers/feedback-provider';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { useLanguage } from '@/components/providers/language-provider';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
}

interface TaskListProps {
    projectId: number;
}

const defaultForm = {
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
};

function toTaskModel(input: unknown): Task {
    const data = input as Record<string, unknown>;
    return {
        id: Number(data.id || 0),
        title: String(data.title || ''),
        description: String(data.description || ''),
        status: String(data.status || 'TODO').toUpperCase(),
        priority: String(data.priority || 'MEDIUM').toUpperCase(),
        created_at: String(data.created_at || ''),
    };
}

export function TaskList({ projectId }: TaskListProps) {
    const feedback = useFeedback();
    const { __ } = useLanguage();
    const { currentTeamId } = useWorkspace();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const [formData, setFormData] = useState(defaultForm);
    const [formLoading, setFormLoading] = useState(false);

    const fetchTasks = useCallback(async () => {
        if (!currentTeamId) {
            setLoading(false);
            setTasks([]);
            return;
        }
        setLoading(true);
        try {
            const res = await taskApi.listByProject(projectId, currentTeamId);
            setTasks((res.data.data || []).map(toTaskModel));
        } catch (err: unknown) {
            setError(getErrorMessage(err, __('tasks.fetch_error')));
        } finally {
            setLoading(false);
        }
    }, [__, currentTeamId, projectId]);

    useEffect(() => {
        if (projectId) {
            void fetchTasks();
        }
    }, [projectId, fetchTasks]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentTeamId) return;
        setFormLoading(true);
        try {
            await taskApi.create(projectId, currentTeamId, formData);
            setIsCreateModalOpen(false);
            setFormData(defaultForm);
            await fetchTasks();
            feedback.success(__('tasks.created_success'));
        } catch (err: unknown) {
            feedback.error(getErrorMessage(err, __('tasks.create_error')));
        } finally {
            setFormLoading(false);
        }
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedTask || !currentTeamId) return;
        setFormLoading(true);
        try {
            await taskApi.update(selectedTask.id, currentTeamId, formData);
            setIsEditModalOpen(false);
            setSelectedTask(null);
            setFormData(defaultForm);
            await fetchTasks();
            feedback.success(__('tasks.updated_success'));
        } catch (err: unknown) {
            feedback.error(getErrorMessage(err, __('tasks.update_error')));
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedTask || !currentTeamId) return;
        setFormLoading(true);
        try {
            await taskApi.remove(selectedTask.id, currentTeamId);
            setIsDeleteModalOpen(false);
            setSelectedTask(null);
            await fetchTasks();
            feedback.success(__('tasks.deleted_success'));
        } catch (err: unknown) {
            feedback.error(getErrorMessage(err, __('tasks.delete_error')));
        } finally {
            setFormLoading(false);
        }
    };

    const handleStatusChange = async (taskId: number, newStatus: string) => {
        if (!currentTeamId) return;
        try {
            const task = tasks.find((item) => item.id === taskId);
            if (!task) return;

            await taskApi.update(taskId, currentTeamId, {
                title: task.title,
                description: task.description,
                priority: task.priority,
                status: newStatus,
            });
            await fetchTasks();
            feedback.success(__('tasks.status_updated_success'));
        } catch (err: unknown) {
            feedback.error(getErrorMessage(err, __('tasks.status_error')));
        }
    };

    const openEditModal = (task: Task) => {
        setSelectedTask(task);
        setFormData({
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
        });
        setIsEditModalOpen(true);
    };

    const openDeleteModal = (task: Task) => {
        setSelectedTask(task);
        setIsDeleteModalOpen(true);
    };

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            TODO: 'bg-gray-100 text-gray-800',
            IN_PROGRESS: 'bg-blue-100 text-blue-800',
            DONE: 'bg-green-100 text-green-800',
            IN_REVIEW: 'bg-purple-100 text-purple-800',
            BACKLOG: 'bg-slate-100 text-slate-800',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) return <div className="p-4 text-sm text-gray-500">{__('tasks.loading')}</div>;
    if (error) return <div className="p-4 text-sm text-red-500">{error}</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{__('tasks.title')}</h3>
                <Button onClick={() => setIsCreateModalOpen(true)}>
                    {__('tasks.create')}
                </Button>
            </div>

            {tasks.length === 0 ? (
                <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                    <p className="text-gray-500 mb-4">{__('tasks.no_tasks')}</p>
                    <Button onClick={() => setIsCreateModalOpen(true)}>{__('tasks.create')}</Button>
                </div>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <div key={task.id} className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-sm transition-shadow">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className="font-medium text-gray-900 dark:text-white">{task.title}</h4>
                                        <select
                                            value={task.status}
                                            onChange={(e) => void handleStatusChange(task.id, e.target.value)}
                                            className="text-xs px-2 py-1 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="BACKLOG">{__('tasks.backlog')}</option>
                                            <option value="TODO">{__('tasks.todo')}</option>
                                            <option value="IN_PROGRESS">{__('tasks.in_progress')}</option>
                                            <option value="IN_REVIEW">{__('tasks.in_review')}</option>
                                            <option value="DONE">{__('tasks.done')}</option>
                                        </select>
                                    </div>
                                    <p className="text-sm text-gray-500 mb-2">{task.description}</p>
                                    <div className="flex gap-2">
                                        <span className={`px-2 py-0.5 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                                            {task.status.replace('_', ' ')}
                                        </span>
                                        <span className="px-2 py-0.5 text-xs font-medium rounded bg-orange-100 text-orange-800">
                                            {task.priority}
                                        </span>
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    <button
                                        onClick={() => openEditModal(task)}
                                        className="text-blue-600 hover:text-blue-800 text-sm"
                                    >
                                        {__('common.edit')}
                                    </button>
                                    <button
                                        onClick={() => openDeleteModal(task)}
                                        className="text-red-600 hover:text-red-800 text-sm"
                                    >
                                        {__('common.delete')}
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title={__('tasks.create')}>
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{__('tasks.task_title')}</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{__('tasks.description')}</label>
                        <textarea
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{__('tasks.status')}</label>
                        <select
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="BACKLOG">{__('tasks.backlog')}</option>
                            <option value="TODO">{__('tasks.todo')}</option>
                            <option value="IN_PROGRESS">{__('tasks.in_progress')}</option>
                            <option value="IN_REVIEW">{__('tasks.in_review')}</option>
                            <option value="DONE">{__('tasks.done')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{__('tasks.priority')}</label>
                        <select
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="LOW">{__('tasks.low')}</option>
                            <option value="MEDIUM">{__('tasks.medium')}</option>
                            <option value="HIGH">{__('tasks.high')}</option>
                            <option value="URGENT">{__('tasks.urgent')}</option>
                        </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                            {__('common.cancel')}
                        </Button>
                        <Button type="submit" isLoading={formLoading}>
                            {__('tasks.create')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={__('tasks.edit')}>
                <form onSubmit={handleEdit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">{__('tasks.task_title')}</label>
                        <Input
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{__('tasks.description')}</label>
                        <textarea
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{__('tasks.status')}</label>
                        <select
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="BACKLOG">{__('tasks.backlog')}</option>
                            <option value="TODO">{__('tasks.todo')}</option>
                            <option value="IN_PROGRESS">{__('tasks.in_progress')}</option>
                            <option value="IN_REVIEW">{__('tasks.in_review')}</option>
                            <option value="DONE">{__('tasks.done')}</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{__('tasks.priority')}</label>
                        <select
                            className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                            value={formData.priority}
                            onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                        >
                            <option value="LOW">{__('tasks.low')}</option>
                            <option value="MEDIUM">{__('tasks.medium')}</option>
                            <option value="HIGH">{__('tasks.high')}</option>
                            <option value="URGENT">{__('tasks.urgent')}</option>
                        </select>
                    </div>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setIsEditModalOpen(false)}>
                            {__('common.cancel')}
                        </Button>
                        <Button type="submit" isLoading={formLoading}>
                            {__('common.save_changes')}
                        </Button>
                    </div>
                </form>
            </Modal>

            <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title={__('tasks.delete')}>
                <div className="space-y-4">
                    <p className="text-gray-600">
                        {__('tasks.delete_confirm', { title: selectedTask?.title || '' })}
                    </p>
                    <div className="flex gap-2 justify-end">
                        <Button type="button" variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>
                            {__('common.cancel')}
                        </Button>
                        <Button variant="destructive" onClick={() => void handleDelete()} isLoading={formLoading}>
                            {__('tasks.delete')}
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}
