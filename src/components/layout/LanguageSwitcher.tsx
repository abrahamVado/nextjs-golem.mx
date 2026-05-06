"use client";

import Image from "next/image";
import { useLanguage } from "@/components/providers/language-provider";

export default function LanguageSwitcher() {
    const { locale, setLocale } = useLanguage();

    return (
        <div className="flex items-center gap-2">
            <button
                type="button"
                onClick={() => setLocale("en")}
                aria-pressed={locale === "en"}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    locale === "en"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title="English (USA)"
            >
                <Image src="/flags/us.svg" alt="USA flag" width={18} height={12} className="h-3 w-[18px] rounded-[1px] object-cover" />
                <span>USA</span>
            </button>
            <button
                type="button"
                onClick={() => setLocale("es")}
                aria-pressed={locale === "es"}
                className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm transition-colors ${
                    locale === "es"
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
                title="Espanol (Mexico)"
            >
                <Image src="/flags/mx.svg" alt="Mexico flag" width={18} height={12} className="h-3 w-[18px] rounded-[1px] object-cover" />
                <span>MX</span>
            </button>
        </div>
    );
}
