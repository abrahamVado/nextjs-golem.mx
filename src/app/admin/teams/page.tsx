'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';
import { useFeedback } from '@/components/providers/feedback-provider';

interface Team {
    id: number;
    name: string;
    slug: string;
    owner_id: number;
    created_at: string;
}

export default function AdminTeamsPage() {
    const feedback = useFeedback();
    const [teams, setTeams] = useState<Team[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchTeams();
    }, []);

    const fetchTeams = async () => {
        try {
            const res = await api.get('/admin/teams');
            setTeams(res.data.data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to fetch teams'));
        } finally {
            setLoading(false);
        }
    };

    const handleUpdatePlan = async (teamId: number) => {
        const newPlan = prompt("Enter new plan ID (e.g., 'pro', 'enterprise', 'free'):");
        if (!newPlan) return;

        try {
            await api.put(`/admin/teams/${teamId}/plan`, { plan_id: newPlan });
            feedback.success('Plan updated successfully');
        } catch (err: unknown) {
            feedback.error('Update failed: ' + getErrorMessage(err, 'request failed'));
        }
    };

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-red-500">{error}</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">Teams Directory</h2>
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Team Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Slug</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                        {teams.map((team) => (
                            <tr key={team.id}>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900 dark:text-white">{team.name}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {team.slug}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {new Date(team.created_at).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button
                                        onClick={() => handleUpdatePlan(team.id)}
                                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                    >
                                        Set Plan
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
