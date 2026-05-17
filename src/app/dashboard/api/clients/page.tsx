'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { API_BASE_URL, apiKeyApi } from '@/lib/api';
import { APIClient } from '@/types';
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardNotice, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { getErrorMessage } from '@/lib/errors';
import ApiUpgradePromo from '@/components/layout/ApiUpgradePromo';
import { useAuth } from '@/context/AuthContext';
import { hasApiAdminAccess } from '@/lib/access';

function bytesToBase64(bytes: Uint8Array): string {
    let binary = '';
    bytes.forEach((b) => {
        binary += String.fromCharCode(b);
    });
    return btoa(binary);
}

function base64ToBytes(base64: string): Uint8Array {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function buildOpenSSHFromRawPublicKey(rawPublic: Uint8Array): string {
    const algo = new TextEncoder().encode('ssh-ed25519');
    const blob = new Uint8Array(4 + algo.length + 4 + rawPublic.length);
    const view = new DataView(blob.buffer);
    let offset = 0;
    view.setUint32(offset, algo.length, false);
    offset += 4;
    blob.set(algo, offset);
    offset += algo.length;
    view.setUint32(offset, rawPublic.length, false);
    offset += 4;
    blob.set(rawPublic, offset);
    return `ssh-ed25519 ${bytesToBase64(blob)} larago-ui`;
}

async function signTextEd25519(privatePkcs8B64: string, payload: string): Promise<string> {
    const privateKeyBytes = base64ToBytes(privatePkcs8B64);
    const privateKey = await crypto.subtle.importKey(
        'pkcs8',
        toArrayBuffer(privateKeyBytes),
        { name: 'Ed25519' },
        false,
        ['sign']
    );
    const signature = await crypto.subtle.sign('Ed25519', privateKey, new TextEncoder().encode(payload));
    return bytesToBase64(new Uint8Array(signature));
}

export default function APIClientsPage() {
    const { user, isLoading: authLoading } = useAuth();
    const canManageApi = hasApiAdminAccess(user);

    const [clients, setClients] = useState<APIClient[]>([]);
    const [selectedClientID, setSelectedClientID] = useState<string | null>(null);
    const [newClientName, setNewClientName] = useState('');
    const [newClientDescription, setNewClientDescription] = useState('');
    const [scopes, setScopes] = useState('orchestration:read,orchestration:run');
    const [newOpenSSHPublicKey, setNewOpenSSHPublicKey] = useState('');
    const [privateKeyPkcs8B64, setPrivateKeyPkcs8B64] = useState('');
    const [challenge, setChallenge] = useState('');
    const [publicKeyID, setPublicKeyID] = useState<string | null>(null);
    const [latestToken, setLatestToken] = useState('');
    const [latestKeyID, setLatestKeyID] = useState('');
    const [latestPublicKeyFingerprint, setLatestPublicKeyFingerprint] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isBusy, setIsBusy] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const docsURL = (() => {
        try {
            return `${new URL(API_BASE_URL).origin}/api/docs`;
        } catch {
            return '/api/docs';
        }
    })();

    const selectedClient = useMemo(() => clients.find((c) => c.id === selectedClientID) || null, [clients, selectedClientID]);

    const loadClients = useCallback(async () => {
        setIsLoading(true);
        setMessage(null);
        try {
            const res = await apiKeyApi.listClients();
            setClients(res.data.data || []);
        } catch (error: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to load API clients') });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!selectedClientID && clients.length > 0) {
            setSelectedClientID(clients[0].id);
        }
    }, [clients, selectedClientID]);

    useEffect(() => {
        if (authLoading) return;
        if (!canManageApi) {
            setIsLoading(false);
            return;
        }
        void loadClients();
    }, [authLoading, canManageApi, loadClients]);

    const createClient = async () => {
        if (!newClientName.trim()) {
            setMessage({ type: 'error', text: 'Client name is required.' });
            return;
        }
        setIsBusy(true);
        setMessage(null);
        try {
            const res = await apiKeyApi.createClient({
                name: newClientName.trim(),
                description: newClientDescription.trim() || undefined,
            });
            const created = res.data.data;
            setClients((prev) => [created, ...prev]);
            setSelectedClientID(created.id);
            setNewClientName('');
            setNewClientDescription('');
            setMessage({ type: 'success', text: `Created API client: ${created.name}` });
        } catch (error: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to create API client') });
        } finally {
            setIsBusy(false);
        }
    };

    const createKey = async () => {
        if (!selectedClientID) {
            setMessage({ type: 'error', text: 'Select a client first.' });
            return;
        }
        const parsedScopes = scopes.split(',').map((s) => s.trim()).filter(Boolean);
        if (!parsedScopes.length) {
            setMessage({ type: 'error', text: 'At least one scope is required.' });
            return;
        }
        setIsBusy(true);
        setMessage(null);
        try {
            const res = await apiKeyApi.createKey(selectedClientID, { scopes: parsedScopes });
            setLatestToken(res.data.data.full_token_once);
            setLatestKeyID(res.data.data.key_id);
            setMessage({ type: 'success', text: 'API key created. Copy the token now (shown once).' });
        } catch (error: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to create API key') });
        } finally {
            setIsBusy(false);
        }
    };

    const generateEd25519Keypair = async () => {
        setIsBusy(true);
        setMessage(null);
        try {
            const pair = await crypto.subtle.generateKey({ name: 'Ed25519' }, true, ['sign', 'verify']);
            const pubRaw = new Uint8Array(await crypto.subtle.exportKey('raw', pair.publicKey));
            const privPkcs8 = new Uint8Array(await crypto.subtle.exportKey('pkcs8', pair.privateKey));
            const openssh = buildOpenSSHFromRawPublicKey(pubRaw);
            const privateB64 = bytesToBase64(privPkcs8);
            setNewOpenSSHPublicKey(openssh);
            setPrivateKeyPkcs8B64(privateB64);
            setMessage({ type: 'success', text: 'Generated Ed25519 keypair for testing. Public key is ready to upload.' });
        } catch (error: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to generate Ed25519 keypair in browser') });
        } finally {
            setIsBusy(false);
        }
    };

    const uploadPublicKey = async () => {
        if (!selectedClientID) {
            setMessage({ type: 'error', text: 'Select a client first.' });
            return;
        }
        if (!newOpenSSHPublicKey.trim()) {
            setMessage({ type: 'error', text: 'OpenSSH public key is required.' });
            return;
        }
        setIsBusy(true);
        setMessage(null);
        try {
            const res = await apiKeyApi.uploadPublicKey(selectedClientID, newOpenSSHPublicKey.trim());
            setPublicKeyID(res.data.data.id);
            setLatestPublicKeyFingerprint(res.data.data.fingerprint_sha256);
            setChallenge(`activate-${Date.now()}`);
            setMessage({ type: 'success', text: 'Public key uploaded as pending. Activate it next.' });
        } catch (error: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to upload public key') });
        } finally {
            setIsBusy(false);
        }
    };

    const activatePublicKey = async () => {
        if (!selectedClientID || !publicKeyID) {
            setMessage({ type: 'error', text: 'Upload a public key first.' });
            return;
        }
        if (!challenge.trim()) {
            setMessage({ type: 'error', text: 'Challenge is required.' });
            return;
        }
        if (!privateKeyPkcs8B64.trim()) {
            setMessage({ type: 'error', text: 'Private key PKCS8 base64 is required.' });
            return;
        }
        setIsBusy(true);
        setMessage(null);
        try {
            const challengeSignature = await signTextEd25519(privateKeyPkcs8B64.trim(), challenge.trim());
            await apiKeyApi.activatePublicKey(selectedClientID, publicKeyID, challenge.trim(), challengeSignature);
            setMessage({ type: 'success', text: 'Public key activated successfully.' });
        } catch (error: unknown) {
            setMessage({ type: 'error', text: getErrorMessage(error, 'Failed to activate public key') });
        } finally {
            setIsBusy(false);
        }
    };

    if (authLoading || (canManageApi && isLoading)) {
        return <div className="p-4">Loading API administration...</div>;
    }

    return (
        <DashboardCanvas>
            <DashboardContent>
            <DashboardHero
                eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />API Clients</>}
                title="API administration with the new shared dashboard chrome"
                description="Create and manage API clients, keys, and signing credentials inside the same design system now used by access and dashboard surfaces."
                right={
                    <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                        <Button variant="outline" asChild>
                            <a href={docsURL} target="_blank" rel="noreferrer">Open API Docs</a>
                        </Button>
                    </DashboardSurface>
                }
            />

            {!canManageApi ? (
                <ApiUpgradePromo />
            ) : (
            <div className="grid gap-6 lg:grid-cols-[340px,1fr]">
                <DashboardSurface className="space-y-4">
                    <p className="text-sm font-medium text-foreground">Clients</p>
                <div className="space-y-2">
                    <Input placeholder="Client name" value={newClientName} onChange={(e) => setNewClientName(e.target.value)} />
                    <Input placeholder="Description (optional)" value={newClientDescription} onChange={(e) => setNewClientDescription(e.target.value)} />
                    <Button className="w-full" onClick={createClient} isLoading={isBusy}>Create Client</Button>
                </div>
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                    {clients.map((client) => (
                        <button
                            key={client.id}
                            onClick={() => setSelectedClientID(client.id)}
                            className={`w-full rounded-md border px-3 py-2 text-left text-sm ${selectedClientID === client.id ? 'border-primary bg-primary text-primary-foreground' : 'border-border bg-card text-foreground'}`}
                        >
                            <div className="font-medium">{client.name}</div>
                            <div className={`text-xs ${selectedClientID === client.id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>status: {client.status}</div>
                        </button>
                    ))}
                </div>
                </DashboardSurface>

                <DashboardSurface className="space-y-5">
                    <p className="text-sm font-medium text-foreground">Administration</p>
                {message && (
                    <DashboardNotice tone={message.type === 'success' ? 'emerald' : 'red'} className="rounded-md px-3 py-2">
                        {message.text}
                    </DashboardNotice>
                )}

                <div className="rounded-md border border-border p-4 space-y-3">
                    <h3 className="font-medium text-foreground">1) Create API Key</h3>
                    <p className="text-xs text-muted-foreground">Selected client: {selectedClient ? `${selectedClient.name} (#${selectedClient.id})` : 'none'}</p>
                    <Input value={scopes} onChange={(e) => setScopes(e.target.value)} placeholder="orchestration:read,orchestration:run" />
                    <Button onClick={createKey} isLoading={isBusy} disabled={!selectedClientID}>Create Key</Button>
                    {latestToken && (
                        <div className="space-y-2">
                            <p className="text-xs text-muted-foreground">Copy this full token now. It is shown once.</p>
                            <textarea className="w-full rounded-md border border-border bg-background p-2 text-xs font-mono text-foreground" rows={3} value={latestToken} readOnly />
                            <p className="text-xs text-muted-foreground">Key ID: <span className="font-mono">{latestKeyID}</span></p>
                        </div>
                    )}
                </div>

                <div className="rounded-md border border-border p-4 space-y-3">
                    <h3 className="font-medium text-foreground">2) Upload & Activate Ed25519 Public Key</h3>
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={generateEd25519Keypair} isLoading={isBusy}>Generate Browser Keypair</Button>
                    </div>
                    <label className="block text-xs font-medium text-muted-foreground">OpenSSH Public Key</label>
                    <textarea className="w-full rounded-md border border-border bg-background p-2 text-xs font-mono text-foreground" rows={3} value={newOpenSSHPublicKey} onChange={(e) => setNewOpenSSHPublicKey(e.target.value)} />

                    <label className="block text-xs font-medium text-muted-foreground">Private Key (PKCS8 base64) for challenge signing</label>
                    <textarea className="w-full rounded-md border border-border bg-background p-2 text-xs font-mono text-foreground" rows={3} value={privateKeyPkcs8B64} onChange={(e) => setPrivateKeyPkcs8B64(e.target.value)} />

                    <div className="flex flex-wrap gap-2">
                        <Button onClick={uploadPublicKey} isLoading={isBusy} disabled={!selectedClientID}>Upload Public Key</Button>
                        <Button variant="outline" onClick={activatePublicKey} isLoading={isBusy} disabled={!selectedClientID || !publicKeyID}>Activate Public Key</Button>
                    </div>

                    <Input value={challenge} onChange={(e) => setChallenge(e.target.value)} placeholder="Activation challenge text" />
                    {latestPublicKeyFingerprint && (
                        <p className="text-xs text-muted-foreground">Fingerprint: <span className="font-mono">{latestPublicKeyFingerprint}</span></p>
                    )}
                </div>
                </DashboardSurface>
            </div>
            )}
            </DashboardContent>
        </DashboardCanvas>
    );
}
