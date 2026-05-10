"use client";

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";

type UISettings = {
    enableGlassmorphism: boolean;
    enableAnimations: boolean;
    enableNoise: boolean;
    themeColor: "indigo" | "violet" | "rose";
    themeMode: "light" | "dark";
    sidebarCollapsed: boolean;
    layoutMode: "boxed" | "full";
};

type UIContextType = {
    settings: UISettings;
    updateSettings: (newSettings: Partial<UISettings>) => void;
    headerTitle: string;
    setHeaderTitle: (title: string) => void;
    headerDescription: string;
    setHeaderDescription: (desc: string) => void;
};

const defaultSettings: UISettings = {
    enableGlassmorphism: true,
    enableAnimations: true,
    enableNoise: true,
    themeColor: "indigo",
    themeMode: "light",
    sidebarCollapsed: false,
    layoutMode: "boxed",
};

let lastUISettingsRaw: string | null = null;
let lastUISettingsSnapshot: UISettings = defaultSettings;

function resolveInitialSettings(): UISettings {
    if (typeof window === "undefined") return defaultSettings;

    const saved = localStorage.getItem("larago-ui-settings");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const legacyTheme = localStorage.getItem("theme");
    let resolvedThemeMode: UISettings["themeMode"] = prefersDark ? "dark" : "light";

    if (legacyTheme === "dark" || legacyTheme === "light") {
        resolvedThemeMode = legacyTheme;
    }

    if (!saved) {
        const fallbackRaw = JSON.stringify({ ...defaultSettings, themeMode: resolvedThemeMode });
        if (lastUISettingsRaw === fallbackRaw) {
            return lastUISettingsSnapshot;
        }
        lastUISettingsRaw = fallbackRaw;
        lastUISettingsSnapshot = { ...defaultSettings, themeMode: resolvedThemeMode };
        return lastUISettingsSnapshot;
    }

    try {
        const parsed = JSON.parse(saved) as Partial<UISettings>;
        if (parsed.themeMode === "dark" || parsed.themeMode === "light") {
            resolvedThemeMode = parsed.themeMode;
        }
        const raw = JSON.stringify({ ...defaultSettings, ...parsed, themeMode: resolvedThemeMode });
        if (lastUISettingsRaw === raw) {
            return lastUISettingsSnapshot;
        }
        lastUISettingsRaw = raw;
        lastUISettingsSnapshot = { ...defaultSettings, ...parsed, themeMode: resolvedThemeMode };
        return lastUISettingsSnapshot;
    } catch (error) {
        console.error("Failed to parse UI settings", error);
        const fallbackRaw = JSON.stringify({ ...defaultSettings, themeMode: resolvedThemeMode });
        if (lastUISettingsRaw === fallbackRaw) {
            return lastUISettingsSnapshot;
        }
        lastUISettingsRaw = fallbackRaw;
        lastUISettingsSnapshot = { ...defaultSettings, themeMode: resolvedThemeMode };
        return lastUISettingsSnapshot;
    }
}

const UIContext = createContext<UIContextType | undefined>(undefined);

function subscribeUISettings(onStoreChange: () => void) {
    window.addEventListener("storage", onStoreChange);
    return () => window.removeEventListener("storage", onStoreChange);
}

export function UIProvider({ children }: { children: React.ReactNode }) {
    const storedSettings = useSyncExternalStore(subscribeUISettings, resolveInitialSettings, () => defaultSettings);
    const [settings, setSettings] = useState<UISettings>(storedSettings);
    const [headerTitle, setHeaderTitle] = useState("");
    const [headerDescription, setHeaderDescription] = useState("");

    useEffect(() => {
        document.documentElement.classList.toggle("dark", settings.themeMode === "dark");
        localStorage.setItem("theme", settings.themeMode);
    }, [settings.themeMode]);

    const updateSettings = (newSettings: Partial<UISettings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...newSettings };
            localStorage.setItem("larago-ui-settings", JSON.stringify(updated));
            if (newSettings.themeMode) {
                document.documentElement.classList.toggle("dark", newSettings.themeMode === "dark");
                localStorage.setItem("theme", newSettings.themeMode);
            }
            return updated;
        });
    };

    return (
        <UIContext.Provider value={{ settings, updateSettings, headerTitle, setHeaderTitle, headerDescription, setHeaderDescription }}>
            <div
                data-theme-color={settings.themeColor}
                className={settings.enableNoise ? "ui-noise-bg" : ""}
            >
                {children}
                {settings.enableNoise && (
                    <div className="pointer-events-none fixed inset-0 z-[99999] h-full w-full opacity-[0.03] [background-image:radial-gradient(rgba(15,23,42,0.16)_0.7px,transparent_0.7px)] [background-size:12px_12px]" />
                )}
            </div>
        </UIContext.Provider>
    );
}

export const useUI = () => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error("useUI must be used within a UIProvider");
    }
    return context;
};
