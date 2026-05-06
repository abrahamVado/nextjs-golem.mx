import React, { useState } from 'react';
import { Button } from './Button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/Popover';
import { Input } from './Input';
import {
    FolderKanban, Star, Heart, Cloud, Zap, Flag, Tag, Bookmark,
    Briefcase, Building, Home, Globe, Layout, Layers, Box,
    Code, Database, Server, Cpu, Terminal, Shield, Lock,
    Settings, Users, User, Smile
} from 'lucide-react';

interface IconPickerProps {
    value: string;
    onChange: (value: string) => void;
}

const ICONS = [
    { name: 'folder-kanban', icon: FolderKanban },
    { name: 'briefcase', icon: Briefcase },
    { name: 'building', icon: Building },
    { name: 'home', icon: Home },
    { name: 'globe', icon: Globe },
    { name: 'star', icon: Star },
    { name: 'heart', icon: Heart },
    { name: 'cloud', icon: Cloud },
    { name: 'zap', icon: Zap },
    { name: 'flag', icon: Flag },
    { name: 'tag', icon: Tag },
    { name: 'bookmark', icon: Bookmark },
    { name: 'layout', icon: Layout },
    { name: 'layers', icon: Layers },
    { name: 'box', icon: Box },
    { name: 'code', icon: Code },
    { name: 'database', icon: Database },
    { name: 'server', icon: Server },
    { name: 'cpu', icon: Cpu },
    { name: 'terminal', icon: Terminal },
    { name: 'shield', icon: Shield },
    { name: 'lock', icon: Lock },
    { name: 'settings', icon: Settings },
    { name: 'users', icon: Users },
    { name: 'user', icon: User },
    { name: 'smile', icon: Smile },
];

export function IconPicker({ value, onChange }: IconPickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [customIcon, setCustomIcon] = useState('');

    const handleCustomIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setCustomIcon(val);
        // If it's a single emoji or short text, update immediately
        if (val.length <= 2) {
            onChange(val);
        }
    };

    const SelectedIcon = ICONS.find(i => i.name === value)?.icon || FolderKanban;

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="outline" className="w-12 h-12 p-0 rounded-lg flex items-center justify-center text-2xl">
                    {ICONS.find(i => i.name === value) ? (
                        <SelectedIcon className="w-6 h-6" />
                    ) : (
                        value || <FolderKanban className="w-6 h-6" />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-2">
                <div className="space-y-2">
                    <Input
                        placeholder="Type an emoji..."
                        value={customIcon}
                        onChange={handleCustomIconChange}
                        className="mb-2"
                    />
                    <div className="grid grid-cols-5 gap-2">
                        {ICONS.map((item) => (
                            <button
                                key={item.name}
                                type="button"
                                className={`p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center ${value === item.name ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30' : ''}`}
                                onClick={() => {
                                    onChange(item.name);
                                    setIsOpen(false);
                                    setCustomIcon('');
                                }}
                            >
                                <item.icon className="w-5 h-5" />
                            </button>
                        ))}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}

export function getIconComponent(iconName: string) {
    const iconDef = ICONS.find(i => i.name === iconName);
    if (iconDef) return iconDef.icon;
    return null;
}
