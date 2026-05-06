import React, { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface DropdownMenuItem {
    label: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
}

interface DropdownMenuProps {
    items: DropdownMenuItem[];
}

export function DropdownMenu({ items }: DropdownMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    return (
        <div className="relative" ref={menuRef}>
            <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                    e.stopPropagation();
                    setIsOpen(!isOpen);
                }}
                className="h-8 w-8 p-0 cursor-pointer"
            >
                <MoreVertical className="h-4 w-4" />
            </Button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1" role="menu">
                        {items.map((item, index) => (
                            <button
                                key={index}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    item.onClick();
                                    setIsOpen(false);
                                }}
                                className={`block w-full text-left px-4 py-2 text-sm cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 ${item.variant === 'destructive'
                                        ? 'text-red-600 dark:text-red-400'
                                        : 'text-gray-700 dark:text-gray-200'
                                    }`}
                                role="menuitem"
                            >
                                {item.label}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
