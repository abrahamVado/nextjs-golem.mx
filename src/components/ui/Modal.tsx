import { ReactNode, useEffect } from 'react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
    maxWidth?: string;
    fullScreen?: boolean;
}

export function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-md", fullScreen = false }: ModalProps) {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const modalClasses = fullScreen
        ? `relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-[95vw] h-[95vh] flex flex-col`
        : `relative bg-white dark:bg-gray-800 rounded-lg shadow-xl ${maxWidth} w-full mx-4 max-h-[90vh] overflow-y-auto`;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={modalClasses}>
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700 shrink-0">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{title}</h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className={`p-6 ${fullScreen ? 'flex-1 overflow-y-auto' : ''}`}>
                    {children}
                </div>
            </div>
        </div>
    );
}
