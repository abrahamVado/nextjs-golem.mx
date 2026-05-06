"use client";

import { useUI } from "@/components/providers/ui-provider";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import PageTitle from "@/components/layout/PageTitle";

export default function UISettingsPage() {
    const { settings, updateSettings } = useUI();

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <PageTitle
                title="Forbidden UI Techniques"
                description="Unlock advanced visual effects. Performance may vary."
            />

            <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-indigo-500/20 bg-background/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle>Glass Dimension</CardTitle>
                        <CardDescription>Enable heavy blur and transparency effects.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h4 className="font-medium">Glassmorphism</h4>
                            <p className="text-xs text-muted-foreground">Applies backdrop-filter: blur(20px)</p>
                        </div>
                        <Button
                            variant={settings.enableGlassmorphism ? "default" : "outline"}
                            onClick={() => updateSettings({ enableGlassmorphism: !settings.enableGlassmorphism })}
                        >
                            {settings.enableGlassmorphism ? "Active" : "Disabled"}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-indigo-500/20 bg-background/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle>Temporal Flux</CardTitle>
                        <CardDescription>Enable global animations and transitions.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h4 className="font-medium">Animations</h4>
                            <p className="text-xs text-muted-foreground">Shimmers, Meteors, and Auroras</p>
                        </div>
                        <Button
                            variant={settings.enableAnimations ? "default" : "outline"}
                            onClick={() => updateSettings({ enableAnimations: !settings.enableAnimations })}
                        >
                            {settings.enableAnimations ? "Active" : "Disabled"}
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-indigo-500/20 bg-background/50 backdrop-blur-xl">
                    <CardHeader>
                        <CardTitle>Film Grain</CardTitle>
                        <CardDescription>Add a subtle texture overlay for texture.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-between items-center">
                        <div className="space-y-1">
                            <h4 className="font-medium">Noise Overlay</h4>
                            <p className="text-xs text-muted-foreground">SVG Noise filter</p>
                        </div>
                        <Button
                            variant={settings.enableNoise ? "default" : "outline"}
                            onClick={() => updateSettings({ enableNoise: !settings.enableNoise })}
                        >
                            {settings.enableNoise ? "Active" : "Disabled"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
