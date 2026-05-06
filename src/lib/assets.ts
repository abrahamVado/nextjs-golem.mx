import { API_BASE_URL } from "@/lib/api";

function apiOrigin(): string {
    try {
        return new URL(API_BASE_URL).origin;
    } catch {
        return "";
    }
}

export function resolveAssetURL(raw?: string | null): string | undefined {
    if (!raw) return undefined;
    const value = raw.trim();
    if (!value) return undefined;
    if (value.startsWith("data:") || value.startsWith("blob:")) {
        return value;
    }

    const origin = apiOrigin();

    try {
        const parsed = new URL(value);
        if (parsed.pathname.startsWith("/uploads/")) {
            if (!origin) return parsed.toString();
            return `${origin}${parsed.pathname}${parsed.search}${parsed.hash}`;
        }
        return parsed.toString();
    } catch {
        if (value.startsWith("/uploads/")) {
            return origin ? `${origin}${value}` : value;
        }
        if (value.startsWith("uploads/")) {
            return origin ? `${origin}/${value}` : `/${value}`;
        }
        if (origin && value.startsWith("/")) {
            return `${origin}${value}`;
        }
        if (origin && value.includes("/uploads/")) {
            const idx = value.indexOf("/uploads/");
            if (idx >= 0) {
                return `${origin}${value.slice(idx)}`;
            }
        }
        return value;
    }
}
