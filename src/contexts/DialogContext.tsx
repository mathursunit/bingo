import React, { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, HelpCircle, Mail } from 'lucide-react';

// Types
type DialogType = 'alert' | 'confirm' | 'prompt' | 'share';

interface DialogOptions {
    title?: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    inputPlaceholder?: string;
    inputDefaultValue?: string;
    type?: 'info' | 'success' | 'warning' | 'error';
    showRoleSelector?: boolean;
}

interface ShareDialogResult {
    email: string;
    role: 'viewer' | 'editor';
}

interface DialogContextType {
    alert: (message: string, options?: Partial<DialogOptions>) => Promise<void>;
    confirm: (message: string, options?: Partial<DialogOptions>) => Promise<boolean>;
    prompt: (message: string, options?: Partial<DialogOptions>) => Promise<string | null>;
    sharePrompt: (message: string, options?: Partial<DialogOptions>) => Promise<ShareDialogResult | null>;
}

const DialogContext = createContext<DialogContextType | null>(null);

export const useDialog = () => {
    const context = useContext(DialogContext);
    if (!context) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
};

interface DialogState {
    isOpen: boolean;
    type: DialogType;
    options: DialogOptions;
    resolve: ((value: any) => void) | null;
}

export const DialogProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [dialog, setDialog] = useState<DialogState>({
        isOpen: false,
        type: 'alert',
        options: { message: '' },
        resolve: null,
    });

    const [inputValue, setInputValue] = useState('');
    const [selectedRole, setSelectedRole] = useState<'viewer' | 'editor'>('editor');

    const openDialog = useCallback((type: DialogType, options: DialogOptions): Promise<any> => {
        return new Promise((resolve) => {
            setInputValue(options.inputDefaultValue || '');
            setSelectedRole('editor');
            setDialog({
                isOpen: true,
                type,
                options,
                resolve,
            });
        });
    }, []);

    const closeDialog = useCallback((result: any) => {
        if (dialog.resolve) {
            dialog.resolve(result);
        }
        setDialog(prev => ({ ...prev, isOpen: false, resolve: null }));
    }, [dialog.resolve]);

    const alert = useCallback((message: string, options?: Partial<DialogOptions>) => {
        return openDialog('alert', { message, title: 'Notice', confirmText: 'OK', type: 'info', ...options });
    }, [openDialog]);

    const confirm = useCallback((message: string, options?: Partial<DialogOptions>) => {
        return openDialog('confirm', { message, title: 'Confirm', confirmText: 'Yes', cancelText: 'Cancel', type: 'warning', ...options });
    }, [openDialog]);

    const prompt = useCallback((message: string, options?: Partial<DialogOptions>) => {
        return openDialog('prompt', { message, title: 'Input', confirmText: 'OK', cancelText: 'Cancel', inputPlaceholder: '', ...options });
    }, [openDialog]);

    const sharePrompt = useCallback((message: string, options?: Partial<DialogOptions>) => {
        return openDialog('share', { message, title: 'Share Board', confirmText: 'Send Invite', cancelText: 'Cancel', showRoleSelector: true, inputPlaceholder: 'Enter email address', ...options });
    }, [openDialog]);

    const getIcon = () => {
        switch (dialog.options.type) {
            case 'success': return <CheckCircle className="w-8 h-8 text-green-400" />;
            case 'warning': return <AlertCircle className="w-8 h-8 text-amber-400" />;
            case 'error': return <AlertCircle className="w-8 h-8 text-red-400" />;
            default: return <HelpCircle className="w-8 h-8 text-accent-primary" />;
        }
    };

    return (
        <DialogContext.Provider value={{ alert, confirm, prompt, sharePrompt }}>
            {children}

            <AnimatePresence>
                {dialog.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                        onClick={() => {
                            if (dialog.type === 'alert') closeDialog(undefined);
                            else if (dialog.type === 'confirm') closeDialog(false);
                            else closeDialog(null);
                        }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.9, y: 20 }}
                            className="bg-slate-900 border border-white/20 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-4 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    {dialog.type === 'share' ? <Mail className="w-6 h-6 text-accent-primary" /> : getIcon()}
                                    <h3 className="text-lg font-bold text-white">{dialog.options.title}</h3>
                                </div>
                                <button
                                    onClick={() => {
                                        if (dialog.type === 'alert') closeDialog(undefined);
                                        else if (dialog.type === 'confirm') closeDialog(false);
                                        else closeDialog(null);
                                    }}
                                    className="p-1 text-slate-400 hover:text-white rounded-full hover:bg-white/10 transition-colors"
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Body */}
                            <div className="p-6">
                                <p className="text-slate-300 mb-4 whitespace-pre-wrap">{dialog.options.message}</p>

                                {/* Input for prompt/share */}
                                {(dialog.type === 'prompt' || dialog.type === 'share') && (
                                    <input
                                        type={dialog.type === 'share' ? 'email' : 'text'}
                                        autoFocus
                                        value={inputValue}
                                        onChange={e => setInputValue(e.target.value)}
                                        placeholder={dialog.options.inputPlaceholder}
                                        className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-accent-primary/50 transition-colors mb-4"
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' && inputValue.trim()) {
                                                if (dialog.type === 'share') {
                                                    closeDialog({ email: inputValue.trim(), role: selectedRole });
                                                } else {
                                                    closeDialog(inputValue.trim());
                                                }
                                            }
                                        }}
                                    />
                                )}

                                {/* Role Selector for Share */}
                                {dialog.type === 'share' && dialog.options.showRoleSelector && (
                                    <div className="mb-4">
                                        <label className="text-sm font-medium text-slate-400 mb-2 block">Access Level</label>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setSelectedRole('viewer')}
                                                className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${selectedRole === 'viewer'
                                                    ? 'bg-accent-primary/20 text-accent-primary border border-accent-primary/50'
                                                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                👁️ Viewer
                                            </button>
                                            <button
                                                onClick={() => setSelectedRole('editor')}
                                                className={`flex-1 py-2 px-4 rounded-xl font-medium transition-all ${selectedRole === 'editor'
                                                    ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/50'
                                                    : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-white/10'
                                                    }`}
                                            >
                                                ✏️ Editor
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-2">
                                            {selectedRole === 'viewer'
                                                ? 'Can view the board but not make changes'
                                                : 'Can view and edit the board'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Footer */}
                            <div className="flex gap-3 p-4 pt-0">
                                {dialog.type !== 'alert' && (
                                    <button
                                        onClick={() => {
                                            if (dialog.type === 'confirm') closeDialog(false);
                                            else closeDialog(null);
                                        }}
                                        className="flex-1 py-3 rounded-xl font-semibold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                                    >
                                        {dialog.options.cancelText}
                                    </button>
                                )}
                                <button
                                    onClick={() => {
                                        if (dialog.type === 'alert') closeDialog(undefined);
                                        else if (dialog.type === 'confirm') closeDialog(true);
                                        else if (dialog.type === 'share') {
                                            if (inputValue.trim()) {
                                                closeDialog({ email: inputValue.trim(), role: selectedRole });
                                            }
                                        } else {
                                            closeDialog(inputValue.trim() || null);
                                        }
                                    }}
                                    disabled={(dialog.type === 'prompt' || dialog.type === 'share') && !inputValue.trim()}
                                    className="flex-1 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl font-bold text-white shadow-lg hover:shadow-accent-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {dialog.options.confirmText}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </DialogContext.Provider>
    );
};
