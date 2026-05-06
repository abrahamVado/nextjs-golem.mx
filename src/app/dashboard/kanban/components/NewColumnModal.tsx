"use client";

import clsx from "clsx";
import { FormEvent } from "react";
import { X } from "lucide-react";

interface Props {
    open: boolean;
    onClose: () => void;
    onSubmit: (event: FormEvent<HTMLFormElement>) => void;
    columnTitle: string;
    setColumnTitle: (value: string) => void;
    columnColor: string;
    setColumnColor: (value: string) => void;
    columnColorClass: Record<string, string>;
}

export default function NewColumnModal({
    open,
    onClose,
    onSubmit,
    columnTitle,
    setColumnTitle,
    columnColor,
    setColumnColor,
    columnColorClass,
}: Props) {
    return (
        <div className={clsx("modal-backdrop", open && "active")} onClick={onClose}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Add New Column</h2>
                        <button className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <hr className="mb-4 border-slate-200 dark:border-slate-800" />
                    <form className="space-y-4" onSubmit={onSubmit}>
                        <input
                            className="w-full px-3 py-2 border rounded-lg bg-background text-foreground dark:bg-slate-900 dark:border-slate-700"
                            placeholder="Column title"
                            value={columnTitle}
                            onChange={(e) => setColumnTitle(e.target.value)}
                            required
                        />
                        <div className="grid grid-cols-4 gap-2">
                            {Object.keys(columnColorClass).map((color) => (
                                <button
                                    key={color}
                                    type="button"
                                    className={clsx("w-full h-8 rounded-lg border-2", columnColorClass[color], columnColor === color ? "border-primary" : "border-transparent")}
                                    onClick={() => setColumnColor(color)}
                                />
                            ))}
                        </div>
                        <div className="flex justify-end gap-3">
                            <button type="button" className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg" onClick={onClose}>
                                Cancel
                            </button>
                            <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 rounded-lg shadow-md">
                                Create
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
