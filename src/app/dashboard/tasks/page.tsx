'use client';

import { useCallback, useEffect, useState } from 'react';
import { projectApi, taskApi, teamApi } from '@/lib/api';
import { DashboardCanvas, DashboardContent, DashboardEmpty, DashboardHero, DashboardModalFrame, DashboardNotice, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useLanguage } from '@/components/providers/language-provider';
import { getErrorMessage } from '@/lib/errors';
import { useWorkspace } from '@/components/providers/workspace-provider';
import { useFeedback } from '@/components/providers/feedback-provider';

interface Task {
    id: number;
    title: string;
    description: string;
    status: string;
    priority: string;
    created_at: string;
}

interface Project {
    id: number;
    name: string;
}

const defaultForm = {
    title: '',
    description: '',
    status: 'TODO',
    priority: 'MEDIUM',
};

function toProjectModel(input: unknown): Project {
    const data = input as Record<string, unknown>;
    return {
        id: Number(data.id || 0),
        name: String(data.name || ''),
    };
}

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

export default function TasksPage() {
    const { __ } = useLanguage();
    const feedback = useFeedback();
    const {
        currentTeamId,
        setCurrentTeamId,
        currentProjectId,
        setCurrentProjectId,
        setTeams: setWorkspaceTeams,
        projectsByTeam,
        setProjectsForTeam,
    } = useWorkspace();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const [formData, setFormData] = useState(defaultForm);
    const [formLoading, setFormLoading] = useState(false);

    const fetchTasks = useCallback(async () => {
        try {
            const teamsRes = await teamApi.getMyTeams();
            const teamsData = (teamsRes.data.data || []).map((team) => ({ id: team.id, name: team.name }));
            setWorkspaceTeams(teamsData);

            if (teamsData.length === 0) {
                setTasks([]);
                setProjects([]);
                setLoading(false);
                return;
            }

            const activeTeamID = currentTeamId && teamsData.some((team) => team.id === currentTeamId)
                ? currentTeamId
                : teamsData[0].id;
            setCurrentTeamId(activeTeamID);

            const cachedProjects = projectsByTeam[activeTeamID];
            const projectList = cachedProjects && cachedProjects.length > 0
                ? cachedProjects
                : (await projectApi.listProjects(activeTeamID)).data.data.map(toProjectModel);

            setProjects(projectList);
            setProjectsForTeam(activeTeamID, projectList);

            if (projectList.length === 0) {
                setTasks([]);
                setLoading(false);
                return;
            }

            const activeProjectID = currentProjectId && projectList.some((project) => project.id === currentProjectId)
                ? currentProjectId
                : projectList[0].id;
            setCurrentProjectId(activeProjectID);

            const res = await taskApi.listByProject(activeProjectID, activeTeamID);
            setTasks((res.data.data || []).map(toTaskModel));
        } catch (err: unknown) {
            const status = typeof err === 'object' && err !== null && 'response' in err
                ? (err as { response?: { status?: number } }).response?.status
                : undefined;
            if (status === 404 || status === 403) {
                setTasks([]);
            } else {
                setError(getErrorMessage(err, __('tasks.fetch_error')));
            }
        } finally {
            setLoading(false);
        }
    }, [__, currentProjectId, currentTeamId, projectsByTeam, setCurrentProjectId, setCurrentTeamId, setProjectsForTeam, setWorkspaceTeams]);

    useEffect(() => {
        void fetchTasks();
    }, [fetchTasks]);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentProjectId || !currentTeamId) return;
        setFormLoading(true);
        try {
            await taskApi.create(currentProjectId, currentTeamId, formData);
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
            BACKLOG: 'bg-slate-100 text-slate-800',
            TODO: 'bg-gray-100 text-gray-800',
            IN_PROGRESS: 'bg-blue-100 text-blue-800',
            IN_REVIEW: 'bg-purple-100 text-purple-800',
            DONE: 'bg-green-100 text-green-800',
            ARCHIVED: 'bg-zinc-100 text-zinc-700',
        };
        return colors[status] || 'bg-gray-100 text-gray-800';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            BACKLOG: __('tasks.backlog'),
            TODO: __('tasks.todo'),
            IN_PROGRESS: __('tasks.in_progress'),
            IN_REVIEW: __('tasks.in_review'),
            DONE: __('tasks.done'),
            ARCHIVED: __('tasks.archived'),
        };
        return labels[status] || status;
    };

    const getPriorityLabel = (priority: string) => {
        const labels: Record<string, string> = {
            LOW: __('tasks.low'),
            MEDIUM: __('tasks.medium'),
            HIGH: __('tasks.high'),
            URGENT: __('tasks.urgent'),
        };
        return labels[priority] || priority;
    };

    if (loading) return <div className="dashboard-shell">{__('tasks.loading')}</div>;

    return (
        <DashboardCanvas>
            <DashboardContent>
            <DashboardHero
                eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Tasks</>}
                title={__('tasks.title')}
                description={__('tasks.subtitle')}
                right={
                    currentProjectId ? (
                        <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                            <Button onClick={() => setIsCreateModalOpen(true)}>
                                + {__('tasks.create')}
                            </Button>
                        </DashboardSurface>
                    ) : null
                }
            />

            {error ? <DashboardNotice tone="red">{error}</DashboardNotice> : null}

            {projects.length === 0 ? (
                <DashboardSurface>
                    <DashboardEmpty title={__('tasks.need_project')} description="Create or select a project before working with tasks in this view." />
                </DashboardSurface>
            ) : tasks.length === 0 ? (
                <DashboardSurface>
                    <DashboardEmpty
                        title={__('tasks.no_tasks')}
                        description="This project is ready for its first task."
                        action={<Button onClick={() => setIsCreateModalOpen(true)}>{__('tasks.create_first')}</Button>}
                    />
                </DashboardSurface>
            ) : (
                <div className="space-y-4">
                    {tasks.map((task) => (
                        <DashboardSurface key={task.id} className="p-6 transition-shadow hover:shadow-[0_24px_60px_rgba(15,23,42,0.10)]">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{task.title}</h3>
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
                                    <p className="text-sm text-gray-500 mb-4">{task.description}</p>
                                    <div className="flex gap-2">
                                        <span className={`px-2 py-1 text-xs font-medium rounded ${getStatusColor(task.status)}`}>
                                            {getStatusLabel(task.status)}
                                        </span>
                                        <span className="px-2 py-1 text-xs font-medium rounded bg-orange-100 text-orange-800">
                                            {getPriorityLabel(task.priority)}
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
                        </DashboardSurface>
                    ))}
                </div>
            )}

            {isCreateModalOpen ? (
            <DashboardModalFrame width="max-w-lg">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{__('tasks.create')}</h2>
                </div>
                <div className="px-6 py-6">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{__('tasks.status')}</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                </div>
            </DashboardModalFrame>
            ) : null}

            {isEditModalOpen ? (
            <DashboardModalFrame width="max-w-lg">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{__('tasks.edit')}</h2>
                </div>
                <div className="px-6 py-6">
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows={3}
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">{__('tasks.status')}</label>
                        <select
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                </div>
            </DashboardModalFrame>
            ) : null}

            {isDeleteModalOpen ? (
            <DashboardModalFrame width="max-w-lg">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">{__('tasks.delete')}</h2>
                </div>
                <div className="px-6 py-6">
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
                </div>
            </DashboardModalFrame>
            ) : null}
            </DashboardContent>
        </DashboardCanvas>
    );
}
