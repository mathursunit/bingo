import React from 'react';
import { motion } from 'framer-motion';
import { Camera, Check, Edit2, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { BingoItem } from '../../types';

interface BingoTileProps {
    item: BingoItem;
    index: number;
    gridSize: number;
    editMode: boolean;
    activeId?: string | number | null;
    onClick: () => void;
    onEdit?: () => void;
    isLocked?: boolean;
}

export const BingoTile: React.FC<BingoTileProps> = ({
    item,
    // index, // Unused
    gridSize,
    editMode,
    activeId,
    onClick,
    onEdit,
    isLocked
}) => {
    // Styles for different states
    const baseClasses = "relative w-full h-full flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer select-none overflow-hidden transition-all duration-200 border shadow-sm";

    // Font scaling
    const textSize = gridSize >= 5 ? "text-xs sm:text-sm" : "text-sm sm:text-base";

    // State Styles (Pro Look)
    const colors = {
        default: "bg-[var(--theme-bg-subtle)] border-[var(--theme-border)] hover:bg-[var(--theme-bg-base)] hover:border-zinc-600 text-slate-300",
        completed: "bg-emerald-950/20 border-emerald-500/20 text-emerald-200 shadow-[inset_0_0_20px_rgba(16,185,129,0.1)]",
        freeSpace: "bg-amber-950/20 border-amber-500/20 text-amber-500 shadow-[inset_0_0_20px_rgba(245,158,11,0.1)]",
        editing: "bg-slate-900 border-dashed border-slate-600 opacity-60 hover:opacity-100 hover:border-slate-400 shadow-none text-slate-500"
    };

    let stateClass = colors.default;
    if (editMode) {
        stateClass = colors.editing;
    } else if (item.isFreeSpace) {
        stateClass = colors.freeSpace;
    } else if (item.isCompleted) {
        stateClass = colors.completed;
    }

    return (
        <motion.div
            layout={!editMode && !activeId}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={!editMode && !activeId ? { scale: 1.02, y: -2, zIndex: 10, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.5)" } : undefined}
            whileTap={!editMode ? { scale: 0.98 } : undefined}
            onClick={editMode ? onEdit : onClick}
            className={cn(baseClasses, textSize, stateClass)}
        >
            {/* Content */}
            <div className="z-10 text-center w-full px-1">
                {item.isFreeSpace ? (
                    <div className="flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600/80">Bonus</span>
                        <span className="font-bold text-amber-500 text-sm sm:text-base">FREE</span>
                    </div>
                ) : (
                    <span
                        className="font-medium leading-snug block line-clamp-4 break-words"
                        style={{
                            color: item.isCompleted && !editMode ? undefined : item.style?.color, // Override color only if not completed/default
                            fontWeight: item.style?.bold ? 'bold' : undefined,
                            fontStyle: item.style?.italic ? 'italic' : undefined,
                            fontSize: undefined
                        }}
                    >
                        {item.text}
                    </span>
                )}
            </div>

            {/* Indicators */}
            <div className="absolute top-1.5 right-1.5 flex flex-col gap-1 items-end z-20">
                {item.proofPhotos && item.proofPhotos.length > 0 && (
                    <div className="bg-black/40 p-1 rounded-md backdrop-blur-sm">
                        <Camera size={10} className="text-white/90" />
                    </div>
                )}
            </div>

            {/* Due Date Indicator */}
            {item.dueDate && !item.isCompleted && !isLocked && (
                <div className={cn(
                    "flex items-center gap-1 mt-1 text-[10px] font-medium absolute bottom-1.5 left-2 px-1 rounded bg-black/40 backdrop-blur-sm",
                    ((item.dueDate as any).toDate ? (item.dueDate as any).toDate() : new Date(item.dueDate as any)) < new Date() ? "text-red-400" : "text-slate-400"
                )}>
                    <Clock size={10} />
                    <span>{((item.dueDate as any).toDate ? (item.dueDate as any).toDate() : new Date(item.dueDate as any)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                </div>
            )}

            {/* Target Count Indicator */}
            {!item.isFreeSpace && !editMode && (item.targetCount || 1) > 1 && (
                <div className={cn(
                    "absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold shadow-sm",
                    item.isCompleted
                        ? "bg-emerald-500/90 text-white"
                        : (item.currentCount || 0) > 0
                            ? "bg-amber-500/90 text-white" // Partial progress
                            : "bg-slate-700/90 text-slate-300"
                )}>
                    {item.currentCount || 0}/{item.targetCount}
                </div>
            )}

            {/* Edit Icon Overlay */}
            {editMode && (
                <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/40 transition-opacity z-30">
                    <Edit2 size={20} className="text-white drop-shadow-md" />
                </div>
            )}

            {/* Completed Checkmark Background (Stamp Effect) */}
            {item.isCompleted && !item.isFreeSpace && !editMode && (
                <motion.div
                    initial={{ scale: 2, opacity: 0, rotate: -45 }}
                    animate={{ scale: 1, opacity: 0.1, rotate: 12 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className="absolute -bottom-2 -right-2 transform origin-bottom-right pointer-events-none"
                >
                    <Check size={80} strokeWidth={3} />
                </motion.div>
            )}

            {/* Active Completion Effect (Green Glow) */}
            {item.isCompleted && (
                <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-white/10 pointer-events-none" />
            )}

        </motion.div>
    );
};
