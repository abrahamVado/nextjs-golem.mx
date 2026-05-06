'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';
import { DashboardCanvas, DashboardContent, DashboardEmpty, DashboardHero, DashboardModalFrame, DashboardNotice, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { webhookApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useFeedback } from '@/components/providers/feedback-provider';
import { getErrorMessage } from '@/lib/errors';

interface Webhook {
    id: number;
    url: string;
    events: string[];
    created_at: string;
}

const AVAILABLE_EVENTS = [
    'project.created',
    'project.updated',
    'task.created',
    'task.updated',
    'milestone.reached'
];

export default function WebhooksPage() {
    const feedback = useFeedback();
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [endpointUnavailable, setEndpointUnavailable] = useState(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    // Form State
    const [url, setUrl] = useState('');
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [formLoading, setFormLoading] = useState(false);

    useEffect(() => {
        fetchWebhooks();
    }, []);

    const fetchWebhooks = async () => {
        try {
            const res = await webhookApi.getAll();
            setEndpointUnavailable(false);
            setErrorMessage(null);
            setWebhooks(res.data.data || []);
        } catch (error) {
            if (axios.isAxiosError(error) && error.response?.status === 404) {
                setEndpointUnavailable(true);
                setWebhooks([]);
                setErrorMessage(null);
            } else {
                setErrorMessage(getErrorMessage(error, 'Failed to fetch webhooks.'));
                console.error('Failed to fetch webhooks', error);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormLoading(true);
        try {
            await webhookApi.create({ url, events: selectedEvents });
            setIsCreateModalOpen(false);
            setUrl('');
            setSelectedEvents([]);
            fetchWebhooks();
            feedback.success('Webhook created');
        } catch (error) {
            console.error('Failed to create webhook', error);
            feedback.error('Failed to create webhook');
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Are you sure you want to delete this webhook?')) return;
        try {
            await webhookApi.delete(id);
            setWebhooks(webhooks.filter(w => w.id !== id));
            feedback.success('Webhook deleted');
        } catch (error) {
            console.error('Failed to delete webhook', error);
            feedback.error('Failed to delete webhook');
        }
    };

    const toggleEvent = (event: string) => {
        if (selectedEvents.includes(event)) {
            setSelectedEvents(selectedEvents.filter(e => e !== event));
        } else {
            setSelectedEvents([...selectedEvents, event]);
        }
    };

    if (loading) return <div className="p-8">Loading webhooks...</div>;

    return (
        <DashboardCanvas>
            <DashboardContent>
            <DashboardHero
                eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Webhooks</>}
                title="Webhooks aligned with the new shared dashboard language"
                description="Configure outgoing event notifications to external systems from the same design system as access, projects, and API admin."
                right={
                    <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                        <Button onClick={() => setIsCreateModalOpen(true)} disabled={endpointUnavailable}>
                            + New Webhook
                        </Button>
                    </DashboardSurface>
                }
            />

            {endpointUnavailable ? (
                <DashboardSurface>
                    <DashboardNotice tone="amber">
                        <div className="space-y-1">
                            <h3 className="font-semibold">Webhooks are not enabled in this backend yet</h3>
                            <p>The dashboard is ready for webhook management, but the current API does not expose the route yet. Once the backend endpoint is added, your subscriptions will appear here automatically.</p>
                        </div>
                    </DashboardNotice>
                </DashboardSurface>
            ) : null}

            {errorMessage ? (
                <DashboardSurface>
                    <DashboardNotice tone="red">
                        <div className="space-y-1">
                            <h3 className="font-semibold">We couldn&apos;t load webhooks</h3>
                            <p>{errorMessage}</p>
                        </div>
                    </DashboardNotice>
                </DashboardSurface>
            ) : null}

            {!endpointUnavailable && !errorMessage && webhooks.length === 0 ? (
                <DashboardSurface>
                    <DashboardEmpty
                        title="No webhooks configured."
                        description="Create your first outbound subscription and it will appear here with its event bindings."
                        action={<Button onClick={() => setIsCreateModalOpen(true)}>Create Webhook</Button>}
                    />
                </DashboardSurface>
            ) : !endpointUnavailable && !errorMessage ? (
                <div className="space-y-4">
                    {webhooks.map((webhook) => (
                        <DashboardSurface key={webhook.id} className="flex justify-between items-start p-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white font-mono text-sm">{webhook.url}</h3>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    {webhook.events.map(event => (
                                        <span key={event} className="px-2 py-1 text-xs font-medium rounded bg-purple-100 text-purple-800">
                                            {event}
                                        </span>
                                    ))}
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Created: {new Date(webhook.created_at).toLocaleDateString()}
                                </p>
                            </div>
                            <Button variant="destructive" onClick={() => handleDelete(webhook.id)}>
                                Delete
                            </Button>
                        </DashboardSurface>
                    ))}
                </div>
            ) : null}

            {isCreateModalOpen && !endpointUnavailable ? (
            <DashboardModalFrame width="max-w-lg">
                <div className="border-b border-slate-200 px-6 py-5">
                    <h2 className="text-xl font-semibold tracking-[-0.03em] text-slate-950">Create Webhook</h2>
                </div>
                <div className="px-6 py-6">
                <form onSubmit={handleCreate} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Payload URL</label>
                        <Input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/webhooks"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-2">Events to subscribe</label>
                        <div className="space-y-2 border border-gray-200 p-3 rounded-md max-h-48 overflow-y-auto">
                            {AVAILABLE_EVENTS.map(event => (
                                <label key={event} className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={selectedEvents.includes(event)}
                                        onChange={() => toggleEvent(event)}
                                        className="rounded text-blue-600 focus:ring-blue-500"
                                    />
                                    <span className="text-sm">{event}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-2">
                        <Button type="button" variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                            Cancel
                        </Button>
                        <Button type="submit" isLoading={formLoading} disabled={!url || selectedEvents.length === 0}>
                            Create Webhook
                        </Button>
                    </div>
                </form>
                </div>
            </DashboardModalFrame>
            ) : null}
            </DashboardContent>
        </DashboardCanvas>
    );
}
