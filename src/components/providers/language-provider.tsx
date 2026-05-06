"use client";

import React, { createContext, useContext, useState } from "react";
import { locales, Locale, defaultLocale } from "@/i18n";

type LanguageContextType = {
    locale: Locale;
    setLocale: (locale: Locale) => void;
    __: (key: string, replacements?: Record<string, string>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocaleState] = useState<Locale>(() => {
        if (typeof window === "undefined") return defaultLocale;
        const savedLocale = localStorage.getItem("larago-locale") as Locale | null;
        if (savedLocale && locales[savedLocale]) {
            return savedLocale;
        }
        return defaultLocale;
    });

    const setLocale = (newLocale: Locale) => {
        if (locales[newLocale]) {
            setLocaleState(newLocale);
            localStorage.setItem("larago-locale", newLocale);
        }
    };

    const __ = (key: string, replacements?: Record<string, string>): string => {
        const currentTranslations = locales[locale];
        const parts = key.split(".");

        let value: unknown = currentTranslations;
        for (const part of parts) {
            if (value && typeof value === "object" && part in (value as Record<string, unknown>)) {
                value = (value as Record<string, unknown>)[part];
            } else {
                return key;
            }
        }

        if (typeof value !== "string") return key;

        let translated = value;
        if (replacements) {
            Object.entries(replacements).forEach(([k, v]) => {
                translated = translated.replace(`:${k}`, v);
            });
        }

        return translated;
    };

    return (
        <LanguageContext.Provider value={{ locale, setLocale, __ }}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (context === undefined) {
        throw new Error("useLanguage must be used within a LanguageProvider");
    }
    return context;
};
