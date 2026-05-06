"use client";

import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/components/providers/ui-provider";
import { LanguageProvider } from "@/components/providers/language-provider";
import { SessionProvider } from "@/components/providers/session-provider";
import { WorkspaceProvider } from "@/components/providers/workspace-provider";
import { FeedbackProvider } from "@/components/providers/feedback-provider";
import { GSAPProvider } from "@/components/providers/gsap-provider";

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <GSAPProvider>
            <AuthProvider>
                <SessionProvider>
                    <UIProvider>
                        <LanguageProvider>
                            <WorkspaceProvider>
                                <FeedbackProvider>
                                    {children}
                                </FeedbackProvider>
                            </WorkspaceProvider>
                        </LanguageProvider>
                    </UIProvider>
                </SessionProvider>
            </AuthProvider>
        </GSAPProvider>
    );
}
