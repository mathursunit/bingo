import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSettings } from '../../contexts/SettingsContext';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: React.ReactNode;
    children: React.ReactNode;
    footer?: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    className?: string;
    showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md',
    className,
    showCloseButton = true
}) => {
    const { settings } = useSettings();
    const isLightTheme = settings.theme === 'light';

    // Size classes
    const sizeClasses = {
        sm: 'max-w-sm',
        md: 'max-w-md',
        lg: 'max-w-lg',
        xl: 'max-w-xl',
        full: 'max-w-4xl' // Not actually full screen, but wide
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={cn(
                            "absolute inset-0 backdrop-blur-sm",
                            isLightTheme ? "bg-black/40" : "bg-black/60"
                        )}
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "relative w-full rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
                            isLightTheme
                                ? "bg-white border border-slate-200"
                                : "bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)]",
                            sizeClasses[size],
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className={cn(
                                "flex items-center justify-between p-4 sm:p-6 border-b shrink-0",
                                isLightTheme ? "border-slate-200" : "border-[var(--theme-border)]"
                            )}>
                                <div className={cn(
                                    "text-lg sm:text-xl font-bold truncate pr-4",
                                    isLightTheme ? "text-slate-800" : "text-slate-100"
                                )}>
                                    {title}
                                </div>
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className={cn(
                                            "p-2 rounded-full transition-colors",
                                            isLightTheme
                                                ? "text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                                                : "text-slate-400 hover:text-slate-100 hover:bg-white/10"
                                        )}
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Body */}
                        <div className={cn(
                            "p-4 sm:p-6 overflow-y-auto custom-scrollbar",
                            isLightTheme ? "text-slate-700" : "text-slate-300"
                        )}>
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className={cn(
                                "p-4 sm:p-6 border-t shrink-0 flex justify-end gap-3 rounded-b-2xl",
                                isLightTheme
                                    ? "border-slate-200 bg-slate-50"
                                    : "border-[var(--theme-border)] bg-[var(--theme-bg-base)]/50"
                            )}>
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
