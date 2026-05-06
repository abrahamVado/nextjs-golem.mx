'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { getErrorMessage } from '@/lib/errors';

interface SystemHealth {
    database_status: string;
    go_routines: number;
}

export default function AdminHealthPage() {
    const [health, setHealth] = useState<SystemHealth | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchHealth();
        // Poll every 5 seconds
        const interval = setInterval(fetchHealth, 5000);
        return () => clearInterval(interval);
    }, []);

    const fetchHealth = async () => {
        try {
            const res = await api.get('/admin/health');
            setHealth(res.data.data);
            setError('');
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to fetch health'));
            setHealth(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading && !health) return <div>Loading...</div>;

    return (
        <div>
            <h2 className="text-2xl font-bold mb-6 text-gray-800 dark:text-gray-100">System Health</h2>

            <div className="grid gap-6 md:grid-cols-2">
                {/* DB Status */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Database Status</h3>
                        <p className="text-sm text-gray-500">MySQL Connectivity</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold capitalize ${health?.database_status === 'healthy' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {health?.database_status || error || 'Unknown'}
                    </div>
                </div>

                {/* Goroutines */}
                <div className="p-6 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white">Goroutines</h3>
                        <p className="text-sm text-gray-500">Active Threads</p>
                    </div>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">
                        {health?.go_routines || '-'}
                    </div>
                </div>
            </div>
        </div>
    );
}
