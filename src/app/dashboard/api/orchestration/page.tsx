'use client';

import { useMemo, useState } from 'react';
import { API_BASE_URL } from '@/lib/api';
import { DashboardCanvas, DashboardContent, DashboardHero, DashboardSurface } from '@/components/layout/dashboard-visuals';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
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

function sha256Hex(input: string): Promise<string> {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(input)).then((hash) => {
        const bytes = new Uint8Array(hash);
        return Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
    });
}

function normalizeQuery(raw: string): string {
    if (!raw) return '';
    const params = new URLSearchParams(raw);
    const entries = Array.from(params.entries()).sort(([aK, aV], [bK, bV]) => {
        if (aK === bK) return aV.localeCompare(bV);
        return aK.localeCompare(bK);
    });
    return entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join('&');
}

export default function APIOrchestrationPage() {
    const { user, isLoading: authLoading } = useAuth();
    const canManageApi = hasApiAdminAccess(user);

    const [fullToken, setFullToken] = useState('');
    const [privatePkcs8B64, setPrivatePkcs8B64] = useState('');
    const [endpoint, setEndpoint] = useState<'health' | 'run'>('health');
    const [payload, setPayload] = useState('{"task":"demo"}');
    const [requestPreview, setRequestPreview] = useState('');
    const [responseOutput, setResponseOutput] = useState('');
    const [isSending, setIsSending] = useState(false);
    const docsURL = (() => {
        try {
            return `${new URL(API_BASE_URL).origin}/api/docs`;
        } catch {
            return '/api/docs';
        }
    })();

    const keyID = useMemo(() => {
        const idx = fullToken.indexOf('.');
        if (idx <= 0) return '';
        return fullToken.slice(0, idx);
    }, [fullToken]);

    const sendSignedRequest = async () => {
        if (!fullToken.trim()) {
            setResponseOutput('Missing full API token.');
            return;
        }
        if (!privatePkcs8B64.trim()) {
            setResponseOutput('Missing private key PKCS8 base64.');
            return;
        }

        const method = endpoint === 'health' ? 'GET' : 'POST';
        const path = endpoint === 'health' ? '/orchestration/health' : '/orchestration/run';
        const bodyText = endpoint === 'health' ? '' : payload;
        const ts = Math.floor(Date.now() / 1000);
        const nonce = `ui-${ts}-${Math.floor(Math.random() * 100000)}`;

        const bodyHash = await sha256Hex(bodyText);
        const canonical = [
            method,
            `/api/v1${path}`,
            normalizeQuery(''),
            bodyHash,
            String(ts),
            nonce,
            keyID,
        ].join('\n');

        setRequestPreview(canonical);

        setIsSending(true);
        setResponseOutput('');
        try {
            const signature = await signTextEd25519(privatePkcs8B64.trim(), canonical);
            const response = await fetch(`${API_BASE_URL}${path}`, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': fullToken.trim(),
                    'X-Timestamp': String(ts),
                    'X-Nonce': nonce,
                    'X-Signature': signature,
                },
                body: endpoint === 'health' ? undefined : bodyText,
                signal: AbortSignal.timeout(15000),
            });

            const text = await response.text();
            setResponseOutput(`HTTP ${response.status}\n${text}`);
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Unknown orchestration error';
            setResponseOutput(message);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <DashboardCanvas>
            <DashboardContent>
            <DashboardHero
                eyebrow={<><span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_0_6px_rgba(16,185,129,0.16)]" />Orchestration</>}
                title="Signed orchestration requests with the same command-center framing"
                description="Build, sign, and send orchestration requests with a guided workflow inside the shared dashboard design system."
                right={
                    <DashboardSurface className="border-slate-200/80 bg-white/75 p-4 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                        <Button variant="outline" asChild>
                            <a href={docsURL} target="_blank" rel="noreferrer">Open API Docs</a>
                        </Button>
                    </DashboardSurface>
                }
            />

            {authLoading ? (
                <div className="p-4 text-sm text-muted-foreground">Loading API access...</div>
            ) : !canManageApi ? (
                <ApiUpgradePromo />
            ) : (
                <div className="grid gap-6 lg:grid-cols-[1.1fr,0.9fr]">
                    <DashboardSurface className="space-y-5">
                        <h3 className="text-base font-semibold text-foreground">Request Builder</h3>
                        <div className="grid gap-4">
                            <div>
                                <label className="block text-xs font-medium uppercase text-muted-foreground">Full API Token</label>
                                <textarea
                                    className="mt-1 w-full rounded-md border border-border bg-background p-2 text-xs font-mono text-foreground"
                                    rows={3}
                                    value={fullToken}
                                    onChange={(e) => setFullToken(e.target.value)}
                                    placeholder="key_id.secret"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-medium uppercase text-muted-foreground">Private Key (PKCS8 base64)</label>
                                <textarea
                                    className="mt-1 w-full rounded-md border border-border bg-background p-2 text-xs font-mono text-foreground"
                                    rows={4}
                                    value={privatePkcs8B64}
                                    onChange={(e) => setPrivatePkcs8B64(e.target.value)}
                                    placeholder="base64 pkcs8 private key"
                                />
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <label className="block text-xs font-medium uppercase text-muted-foreground">Endpoint</label>
                                    <select
                                        className="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                                        value={endpoint}
                                        onChange={(e) => setEndpoint(e.target.value as 'health' | 'run')}
                                    >
                                        <option value="health">GET /orchestration/health</option>
                                        <option value="run">POST /orchestration/run</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium uppercase text-muted-foreground">Parsed Key ID</label>
                                    <Input value={keyID} readOnly />
                                </div>
                            </div>

                            {endpoint === 'run' && (
                                <div>
                                    <label className="block text-xs font-medium uppercase text-muted-foreground">Run Payload JSON</label>
                                    <textarea
                                        className="mt-1 w-full rounded-md border border-border bg-background p-2 text-xs font-mono text-foreground"
                                        rows={4}
                                        value={payload}
                                        onChange={(e) => setPayload(e.target.value)}
                                    />
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Button onClick={sendSignedRequest} isLoading={isSending}>Send Signed Request</Button>
                            </div>
                        </div>
                    </DashboardSurface>

                    <div className="space-y-6">
                        <DashboardSurface className="space-y-2 p-4">
                            <h3 className="text-sm font-medium text-foreground">Canonical Request Preview</h3>
                            <pre className="max-h-56 overflow-auto rounded bg-muted/40 p-2 text-xs text-foreground whitespace-pre-wrap">{requestPreview || 'No request generated yet.'}</pre>
                        </DashboardSurface>

                        <DashboardSurface className="space-y-2 p-4">
                            <h3 className="text-sm font-medium text-foreground">Response</h3>
                            <pre className="max-h-72 overflow-auto rounded bg-muted/40 p-2 text-xs text-foreground whitespace-pre-wrap">{responseOutput || 'No response yet.'}</pre>
                        </DashboardSurface>
                    </div>
                </div>
            )}
            </DashboardContent>
        </DashboardCanvas>
    );
}
