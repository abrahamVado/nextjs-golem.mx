import { useState } from 'react';
import { CreateMilestoneRequest } from '@/types';
import { projectApi } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { getErrorMessage } from '@/lib/errors';

interface CreateMilestoneModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: number;
    onSuccess: () => void;
}

export function CreateMilestoneModal({ isOpen, onClose, projectId, onSuccess }: CreateMilestoneModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState<CreateMilestoneRequest>({
        name: '',
        description: '',
        start_date: '',
        due_date: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const payload: CreateMilestoneRequest = {
                ...formData,
                start_date: formData.start_date ? new Date(formData.start_date).toISOString() : undefined,
                due_date: formData.due_date ? new Date(formData.due_date).toISOString() : undefined,
            };

            await projectApi.createMilestone(projectId, payload);
            setFormData({ name: '', description: '', start_date: '', due_date: '' });
            onSuccess();
            onClose();
        } catch (err: unknown) {
            setError(getErrorMessage(err, 'Failed to create milestone'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create New Milestone">
            <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-500 p-3 rounded-md text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium mb-1">Name</label>
                    <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Milestone Name"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Description</label>
                    <textarea
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Description..."
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Start Date</label>
                        <Input
                            type="date"
                            value={formData.start_date}
                            onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Due Date</label>
                        <Input
                            type="date"
                            value={formData.due_date}
                            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button type="submit" isLoading={isLoading}>
                        Create Milestone
                    </Button>
                </div>
            </form>
        </Modal>
    );
}
