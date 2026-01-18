import React, { useState } from 'react';
import { useBingo } from '../hooks/useBingo';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Edit2, Check, LogOut, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const BingoBoard: React.FC = () => {
    const { items, loading, toggleItem, updateItemText, hasWon } = useBingo();
    const { logout, user } = useAuth();
    const [editMode, setEditMode] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempText, setTempText] = useState("");

    const handleEditStart = (index: number, currentText: string) => {
        setEditingIndex(index);
        setTempText(currentText);
    };

    const handleEditSave = (index: number) => {
        updateItemText(index, tempText);
        setEditingIndex(null);
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center text-accent-primary animate-pulse">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading Board...</p>
            </div>
        </div>
    );

    const completedCount = items.filter(i => i.isCompleted).length;
    const progress = (completedCount / 25) * 100;

    return (
        <div className="min-h-screen flex flex-col items-center p-3 pb-24 relative overflow-x-hidden">
            <div className="background-animation" />

            {/* Header */}
            <header className="w-full max-w-[500px] flex justify-between items-center mb-4 pt-2">
                <div>
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-[10px] font-bold text-accent-gold uppercase tracking-widest bg-accent-gold/10 px-3 py-1 rounded-full border border-accent-gold/20 inline-block mb-1"
                    >
                        2026 Edition
                    </motion.div>
                    <h1 className="text-2xl sm:text-3xl font-heading font-bold text-gradient">SunSar Bingo</h1>
                </div>
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="relative cursor-pointer group"
                >
                    <img
                        src={user?.photoURL || ''}
                        alt="User"
                        className="w-10 h-10 sm:w-12 sm:h-12 rounded-full border-2 border-glass-border group-hover:border-accent-primary transition-colors"
                    />
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-bg-dark"></div>
                </motion.div>
            </header>

            {/* Controls Bar */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-[500px] glass-panel p-3 mb-4 flex flex-col gap-3"
            >
                {/* Progress */}
                <div className="w-full">
                    <div className="flex justify-between text-xs text-slate-300 mb-1.5 px-1">
                        <span className="font-semibold">Progress</span>
                        <span className="font-mono text-accent-primary">{Math.round(progress)}%</span>
                    </div>
                    <div className="h-2.5 bg-bg-dark/50 rounded-full overflow-hidden border border-white/5">
                        <motion.div
                            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary relative"
                            initial={{ width: 0 }}
                            animate={{ width: `${progress}%` }}
                            transition={{ duration: 1, ease: "easeOut" }}
                        >
                            <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_10px_white]"></div>
                        </motion.div>
                    </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 justify-between items-center">
                    <p className="text-xs text-slate-500 line-clamp-1 flex-1 mr-2">
                        {editMode ? "Tap text to edit" : "Tap square to toggle"}
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setEditMode(!editMode)}
                            className={cn(
                                "py-1.5 px-4 rounded-full text-xs font-semibold transition-all flex items-center gap-2 border",
                                editMode
                                    ? "bg-accent-gold text-bg-dark border-accent-gold shadow-[0_0_10px_rgba(251,191,36,0.5)]"
                                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                            )}
                        >
                            <Edit2 size={14} />
                            {editMode ? "Done" : "Edit"}
                        </button>
                        <button
                            onClick={logout}
                            className="p-1.5 px-3 rounded-full bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 hover:text-red-200 text-slate-400 transition-all flex items-center gap-1.5"
                        >
                            <LogOut size={14} />
                        </button>
                    </div>
                </div>
            </motion.div>

            {/* The Grid */}
            <div className="w-full max-w-[500px] aspect-square relative">
                <div className="grid grid-cols-5 gap-1.5 sm:gap-2 w-full h-full">
                    {items.map((item, index) => (
                        <motion.div
                            key={item.id}
                            layout
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.02 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (editMode) return;
                                if (item.isFreeSpace) return;
                                toggleItem(index);
                            }}
                            className={cn(
                                "relative rounded-lg flex items-center justify-center p-1 cursor-pointer select-none border backdrop-blur-sm overflow-hidden",
                                // Base styles
                                "bg-bg-card/80 border-white/5 shadow-sm",
                                // Active State
                                item.isCompleted && !item.isFreeSpace && "bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30 border-accent-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]",
                                // Free Space
                                item.isFreeSpace && "bg-gradient-to-br from-accent-gold/20 to-accent-secondary/20 border-accent-gold/50",
                                // Edit Mode
                                editMode && "border-dashed border-slate-500"
                            )}
                        >
                            {/* Content */}
                            <div className="w-full h-full flex items-center justify-center text-center relative z-10">
                                {editMode && editingIndex === index ? (
                                    <textarea
                                        autoFocus
                                        className="w-full h-full bg-bg-dark/90 text-[10px] rounded p-1 text-white border border-accent-gold outline-none resize-none leading-tight"
                                        value={tempText}
                                        onChange={(e) => setTempText(e.target.value)}
                                        onBlur={() => handleEditSave(index)}
                                    />
                                ) : (
                                    <div
                                        className="w-full h-full flex items-center justify-center"
                                        onClick={(e) => {
                                            if (editMode) {
                                                e.stopPropagation();
                                                handleEditStart(index, item.text);
                                            }
                                        }}
                                    >
                                        <span className={cn(
                                            "leading-tight break-words w-full",
                                            item.isFreeSpace ? "text-lg font-bold text-accent-gold" : "text-[9px] sm:text-[11px] font-medium text-slate-200 line-clamp-3 sm:line-clamp-4",
                                            item.isCompleted && !item.isFreeSpace && "text-white"
                                        )}>
                                            {item.text}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Completed Overlay Checkmark */}
                            {item.isCompleted && !item.isFreeSpace && !editMode && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"
                                >
                                    <Check className="w-12 h-12 text-white" />
                                </motion.div>
                            )}

                            {/* Mini check for clarity */}
                            {item.isCompleted && !item.isFreeSpace && !editMode && (
                                <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-accent-primary rounded-full shadow-[0_0_5px_rgba(139,92,246,0.8)]"></div>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Celebration Modal */}
            <AnimatePresence>
                {hasWon && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="glass-panel p-8 text-center max-w-sm w-full relative overflow-hidden border-accent-gold/30"
                        >
                            <div className="absolute inset-0 bg-gradient-to-t from-accent-gold/10 to-transparent pointer-events-none"></div>

                            <motion.div
                                animate={{ rotate: [0, 10, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="inline-block"
                            >
                                <Award className="w-20 h-20 text-accent-gold mx-auto mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                            </motion.div>

                            <h2 className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-gold via-white to-accent-secondary mb-2">BINGO!</h2>
                            <p className="text-slate-300 mb-8 leading-relaxed">2026 is off to an amazing start!</p>

                            <button
                                onClick={() => window.location.reload()}
                                className="w-full py-3 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl font-bold text-white shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform hover:scale-105"
                            >
                                Keep Playing
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
