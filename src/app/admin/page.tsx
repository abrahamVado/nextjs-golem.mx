'use client';

import { useEffect, useState } from 'react';
import api, { adminApi } from '@/lib/api';
import { SessionPolicy } from '@/types';
import { Button } from '@/components/ui/Button';
import { getErrorMessage } from '@/lib/errors';
import { useFeedback } from '@/components/providers/feedback-provider';

interface DashboardStats {
    total_users: number;
    total_teams: number;
    total_projects: number;
    total_revenue: number;
}

export default function AdminDashboard() {
    const feedback = useFeedback();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [policy, setPolicy] = useState<SessionPolicy | null>(null);
    const [savingPolicy, setSavingPolicy] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        void fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const [statsRes, policyRes] = await Promise.all([
                api.get('/admin/stats'),
                adminApi.getSessionPolicy(),
            ]);
            setStats(statsRes.data.data);
            setPolicy(policyRes.data.data);
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to fetch stats'));
        } finally {
            setLoading(false);
        }
    };

    const updatePolicy = async () => {
        if (!policy) return;
        setSavingPolicy(true);
        try {
            await adminApi.updateSessionPolicy(policy);
            feedback.success('Session policy updated');
        } catch (err: unknown) {
            feedback.error(getErrorMessage(err, 'Failed to update session policy'));
        } finally {
            setSavingPolicy(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Loading admin stats...</div>;
    if (error) return <div className="p-8 text-center text-red-500">Error: {error}</div>;

    return (
        <div>
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mb-8">Dashboard</h2>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatCard title="Total Users" value={stats?.total_users} />
                <StatCard title="Total Teams" value={stats?.total_teams} />
                <StatCard title="Total Projects" value={stats?.total_projects} />
                <StatCard title="Est. MRR" value={`$${((stats?.total_revenue || 0) / 100).toFixed(2)}`} />
            </div>

            {policy && (
                <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900">Session Policy</h3>
                    <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <Field label="Access Minutes" value={policy.access_token_minutes} onChange={(value) => setPolicy({ ...policy, access_token_minutes: value })} />
                        <Field label="Refresh Days" value={policy.refresh_token_days} onChange={(value) => setPolicy({ ...policy, refresh_token_days: value })} />
                        <Field label="Remember Refresh Days" value={policy.remember_refresh_token_days} onChange={(value) => setPolicy({ ...policy, remember_refresh_token_days: value })} />
                        <Field label="Idle Timeout Minutes" value={policy.idle_timeout_minutes} onChange={(value) => setPolicy({ ...policy, idle_timeout_minutes: value })} />
                        <Field label="Warning Seconds" value={policy.warning_before_expiry_seconds} onChange={(value) => setPolicy({ ...policy, warning_before_expiry_seconds: value })} />
                    </div>
                    <div className="mt-4 flex justify-end">
                        <Button onClick={updatePolicy} isLoading={savingPolicy}>Save Policy</Button>
                    </div>
                </div>
            )}
        </div>
    );
}

function StatCard({ title, value }: { title: string; value: string | number | undefined }) {
    return (
        <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-gray-100">{value}</p>
        </div>
    );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (value: number) => void }) {
    return (
        <label className="text-sm">
            <span className="block text-gray-600">{label}</span>
            <input
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2"
                type="number"
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
            />
        </label>
    );
}
