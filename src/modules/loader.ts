import { loadEntry, modules } from "./registry_gen";

type ModuleViewComponent = React.ComponentType<Record<string, never>>;

export type AppRegistry = Record<string, never>;

export interface ModuleEntry {
    register: (app: AppRegistry) => void;
    views: Record<string, ModuleViewComponent>;
}

class ModuleLoader {
    private loadedModules: Map<string, ModuleEntry> = new Map();

    async init() {
        console.log("[Loader] Initializing frontend modules...");

        for (const mod of modules) {
            if (!mod.frontend?.entry) continue;

            try {
                const entryModule = (await loadEntry(mod.id)) as ModuleEntry;
                if (entryModule.register) {
                    entryModule.register({});
                }

                this.loadedModules.set(mod.id, entryModule);
                console.log(`[Loader] Loaded ${mod.id}`);
            } catch (error) {
                console.error(`[Loader] Failed to load ${mod.id}:`, error);
            }
        }
    }

    getView(viewKey: string): ModuleViewComponent | null {
        const [modID, viewName] = viewKey.split(".");
        if (!modID || !viewName) return null;

        const mod = this.loadedModules.get(modID);
        if (!mod || !mod.views) return null;

        return mod.views[viewKey] || null;
    }
}

export const moduleLoader = new ModuleLoader();
