import en from "./locales/en.json";
import es from "./locales/es.json";

export const locales = {
    en,
    es,
};

export type Locale = keyof typeof locales;
export type Translations = typeof en;

export const defaultLocale: Locale = "en";
