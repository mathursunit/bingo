import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

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
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Content */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        transition={{ duration: 0.2 }}
                        className={cn(
                            "relative w-full bg-[var(--theme-bg-subtle)] border border-[var(--theme-border)] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]",
                            sizeClasses[size],
                            className
                        )}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        {(title || showCloseButton) && (
                            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--theme-border)] shrink-0">
                                <div className="text-lg sm:text-xl font-bold text-slate-100 truncate pr-4">
                                    {title}
                                </div>
                                {showCloseButton && (
                                    <button
                                        onClick={onClose}
                                        className="text-slate-400 hover:text-slate-100 hover:bg-white/10 p-2 rounded-full transition-colors"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        )}

                        {/* Body */}
                        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar">
                            {children}
                        </div>

                        {/* Footer */}
                        {footer && (
                            <div className="p-4 sm:p-6 border-t border-[var(--theme-border)] bg-[var(--theme-bg-base)]/50 shrink-0 flex justify-end gap-3 rounded-b-2xl">
                                {footer}
                            </div>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
