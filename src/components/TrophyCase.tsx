import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { db } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { BADGES, type UserBadgeProgress } from '../data/badges';
import { cn } from '../lib/utils';
import { motion } from 'framer-motion';
import { Award, Lock } from 'lucide-react';

export const TrophyCase: React.FC = () => {
    const { user } = useAuth();
    const { settings } = useSettings();
    const isLightTheme = settings.theme === 'light';
    const [userProgress, setUserProgress] = useState<Record<string, UserBadgeProgress>>({});
    const [loading, setLoading] = useState(true);

    // Fetch User Badges
    useEffect(() => {
        if (!user) return;
        setLoading(true);
        const docRef = doc(db, `users/${user.uid}/badges/progress`);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                setUserProgress(docSnap.data() as Record<string, UserBadgeProgress>);
            } else {
                setUserProgress({});
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    // Group badges by category
    const categories = ['Speed', 'Creativity', 'Social'] as const;

    return (
        <div className={cn(
            "rounded-3xl border shadow-xl overflow-hidden mt-12 p-6 md:p-8",
            isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-white/10"
        )}>
            <div className="flex items-center gap-3 mb-8">
                <div className={cn("p-3 rounded-2xl", isLightTheme ? "bg-amber-100 text-amber-600" : "bg-amber-500/10 text-amber-500")}>
                    <Award size={32} />
                </div>
                <div>
                    <h2 className={cn("text-2xl font-bold", isLightTheme ? "text-slate-900" : "text-white")}>Trophy Case</h2>
                    <p className="text-slate-400 text-sm">Achievements & Milestones</p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12 text-slate-500 animate-pulse">Loading trophies...</div>
            ) : (
                <div className="space-y-10">
                    {categories.map(cat => (
                        <div key={cat}>
                            <h3 className={cn("text-lg font-bold mb-4 flex items-center gap-2", isLightTheme ? "text-slate-700" : "text-slate-300")}>
                                {cat === 'Speed' && '⚡'}
                                {cat === 'Creativity' && '🎨'}
                                {cat === 'Social' && '🤝'}
                                {cat}
                            </h3>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {BADGES.filter(b => b.category === cat).map(badge => {
                                    const progress = userProgress[badge.id]?.progress || 0;
                                    const isUnlocked = progress >= badge.maxProgress;
                                    const isHidden = badge.isHidden && !isUnlocked;

                                    return (
                                        <motion.div
                                            key={badge.id}
                                            whileHover={{ scale: 1.02 }}
                                            className={cn(
                                                "relative p-4 rounded-2xl border flex flex-col items-center text-center transition-all h-full",
                                                isUnlocked
                                                    ? (isLightTheme ? "bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 shadow-sm" : "bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30")
                                                    : (isLightTheme ? "bg-slate-50 border-slate-100 opacity-80" : "bg-white/5 border-white/5 opacity-60")
                                            )}
                                        >
                                            {/* Icon */}
                                            <div className={cn(
                                                "w-16 h-16 rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner relative overflow-hidden",
                                                isUnlocked
                                                    ? (isLightTheme ? "bg-white shadow-amber-100" : "bg-black/30 shadow-black/50")
                                                    : "bg-black/10 grayscale"
                                            )}>
                                                {isHidden ? <Lock size={20} className="text-slate-400" /> : badge.icon}

                                                {/* Shine effect for unlocked */}
                                                {isUnlocked && (
                                                    <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent w-full h-full skew-x-12 translate-x-full animate-shimmer" />
                                                )}
                                            </div>

                                            {/* Text */}
                                            <h4 className={cn("font-bold text-sm mb-1", isUnlocked ? (isLightTheme ? "text-slate-900" : "text-white") : "text-slate-500")}>
                                                {isHidden ? "???" : badge.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 mb-3 leading-snug">
                                                {isHidden ? "Keep playing to unlock." : badge.description}
                                            </p>

                                            {/* Progress Bar (if incremental and not yet unlocked) */}
                                            {!isUnlocked && !isHidden && badge.maxProgress > 1 && (
                                                <div className="w-full mt-auto">
                                                    <div className="flex justify-between text-[10px] text-slate-400 mb-1 font-mono">
                                                        <span>{progress}</span>
                                                        <span>{badge.maxProgress}</span>
                                                    </div>
                                                    <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                                        <div
                                                            className="h-full bg-accent-primary rounded-full transition-all duration-500"
                                                            style={{ width: `${(progress / badge.maxProgress) * 100}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Unlocked Date */}
                                            {isUnlocked && userProgress[badge.id]?.unlockedAt && (
                                                <div className="mt-auto text-[10px] text-amber-500 font-medium bg-amber-500/10 px-2 py-0.5 rounded-full">
                                                    Unlocked!
                                                </div>
                                            )}
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};
