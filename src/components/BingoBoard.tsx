import React, { useState } from 'react';
import { useBingo } from '../hooks/useBingo';
import { useAuth } from '../contexts/AuthContext';
import { cn } from '../lib/utils';
import { Edit2, Check, LogOut, Award } from 'lucide-react';

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

    if (loading) return <div className="flex h-screen items-center justify-center text-accent-primary">Loading Board...</div>;

    const completedCount = items.filter(i => i.isCompleted).length;
    const progress = (completedCount / 25) * 100;

    return (
        <div className="min-h-screen flex flex-col items-center p-4 pb-20 relative">
            <div className="background-animation" />

            {/* Header */}
            <header className="w-full max-w-2xl flex justify-between items-center mb-6 pt-4 animate-fade-in">
                <div>
                    <span className="text-xs font-bold text-accent-gold uppercase tracking-widest bg-accent-gold/10 px-2 py-1 rounded-full border border-accent-gold/20">2026 Edition</span>
                    <h1 className="text-2xl font-heading font-bold mt-1 text-white">SunSar Bingo</h1>
                </div>
                <div className="flex items-center gap-3">
                    <div className="hidden sm:block text-right">
                        <p className="text-xs text-slate-400">Logged in as</p>
                        <p className="text-sm font-semibold">{user?.displayName?.split(' ')[0]}</p>
                    </div>
                    <img src={user?.photoURL || ''} alt="User" className="w-10 h-10 rounded-full border-2 border-accent-primary/50" />
                </div>
            </header>

            {/* Controls */}
            <div className="w-full max-w-2xl glass-panel p-4 mb-6 flex flex-col sm:flex-row gap-4 items-center justify-between animate-fade-in" style={{ animationDelay: '0.1s' }}>
                <div className="w-full sm:w-1/2">
                    <div className="flex justify-between text-xs text-slate-300 mb-1">
                        <span>Progress</span>
                        <span>{completedCount}/25</span>
                    </div>
                    <div className="h-2 bg-slate-700/50 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary transition-all duration-1000 ease-out"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => setEditMode(!editMode)}
                        className={cn(
                            "p-2 px-4 rounded-full text-sm font-semibold transition-all flex items-center gap-2",
                            editMode ? "bg-accent-gold text-bg-dark" : "bg-white/10 hover:bg-white/20"
                        )}
                    >
                        <Edit2 size={16} />
                        {editMode ? "Done Editing" : "Edit Board"}
                    </button>
                    <button onClick={logout} className="p-2 rounded-full bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-slate-400 transition-all">
                        <LogOut size={18} />
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full max-w-2xl aspect-square glass-panel p-3 sm:p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        onClick={() => !editMode && !item.isFreeSpace && toggleItem(index)}
                        className={cn(
                            "relative rounded-xl flex items-center justify-center text-center p-1 sm:p-2 text-[10px] sm:text-xs cursor-pointer transition-all duration-300 select-none border",
                            // Base styles
                            "bg-bg-card border-glass-border hover:-translate-y-1 hover:border-white/20 hover:shadow-lg",
                            // Active State
                            item.isCompleted && !item.isFreeSpace && "bg-accent-primary/20 border-accent-primary shadow-[0_0_15px_rgba(139,92,246,0.3)] font-semibold",
                            // Free Space
                            item.isFreeSpace && "bg-gradient-to-br from-accent-gold/20 to-accent-secondary/20 border-accent-gold text-accent-gold font-bold text-sm",
                            // Edit Mode
                            editMode && "border-dashed border-slate-500 hover:border-accent-gold cursor-text"
                        )}
                    >
                        {/* Edit Input or Text */}
                        {editMode && editingIndex === index ? (
                            <textarea
                                autoFocus
                                className="w-full h-full bg-bg-dark rounded p-1 text-white border-none resize-none focus:ring-1 focus:ring-accent-gold outline-none"
                                value={tempText}
                                onChange={(e) => setTempText(e.target.value)}
                                onBlur={() => handleEditSave(index)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.currentTarget.blur(); } }}
                            />
                        ) : (
                            <span
                                className="line-clamp-4"
                                onClick={(e) => {
                                    if (editMode) {
                                        e.stopPropagation();
                                        handleEditStart(index, item.text);
                                    }
                                }}
                            >
                                {item.isFreeSpace ? <span dangerouslySetInnerHTML={{ __html: item.text.replace('\n', '<br/>') }} /> : item.text}
                            </span>
                        )}

                        {/* Checkmark Decoration */}
                        {item.isCompleted && !item.isFreeSpace && !editMode && (
                            <div className="absolute -top-1 -right-1 bg-accent-primary rounded-full p-0.5 animate-pop-in shadow-lg">
                                <Check size={10} className="text-white" />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {hasWon && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="glass-panel p-8 text-center max-w-sm w-full mx-4 shadow-[0_0_50px_rgba(139,92,246,0.5)] animate-pop-in">
                        <Award className="w-16 h-16 text-accent-gold mx-auto mb-4 animate-bounce" />
                        <h2 className="text-3xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-gold to-accent-secondary mb-2">BINGO!</h2>
                        <p className="text-slate-300 mb-6">Congratulations on hitting a milestone!</p>
                        <button
                            onClick={() => window.location.reload()} // Just a simple reset of the modal state in this version, ideally handled by state
                            className="px-6 py-2 bg-accent-primary rounded-full font-bold hover:bg-accent-primary/80"
                        >
                            Celebrate! 🎉
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
