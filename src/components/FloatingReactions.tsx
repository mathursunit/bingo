import React, { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';
import { type BingoItem, type Reaction } from '../types';

interface FloatingReaction extends Reaction {
    id: string; // unique ID for animation key
    x: number; // random X position percentage
}

export const FloatingReactions: React.FC<{ items: BingoItem[] }> = ({ items }) => {
    const [floating, setFloating] = useState<FloatingReaction[]>([]);
    const prevReactionsRef = useRef<Record<number, number>>({}); // itemId -> reactionCount
    const initializedRef = useRef(false);
    const { settings } = useSettings();
    const isLightTheme = settings.theme === 'light';

    useEffect(() => {
        // Initialize refs on first load to avoid flooding specific board load
        if (!initializedRef.current) {
            items.forEach(item => {
                prevReactionsRef.current[item.id] = item.reactions?.length || 0;
            });
            initializedRef.current = true;
            return;
        }

        // Check for new reactions
        items.forEach(item => {
            const currentCount = item.reactions?.length || 0;
            const prevCount = prevReactionsRef.current[item.id] || 0;

            if (currentCount > prevCount) {
                // New reaction(s) found!
                const newReactions = item.reactions!.slice(prevCount);

                newReactions.forEach(reaction => {
                    // Only show reactions that are recent (validating timestamp just in case)
                    // But since we are diffing count, it implies it just arrived in our local state.
                    addFloating(reaction);
                });
            }
            // Update ref
            prevReactionsRef.current[item.id] = currentCount;
        });
    }, [items]);

    const addFloating = (reaction: Reaction) => {
        const id = Math.random().toString(36).substring(7);
        const x = Math.random() * 80 + 10; // 10% to 90% screen width

        setFloating(prev => [...prev, { ...reaction, id, x }]);

        // Remove after animation
        setTimeout(() => {
            setFloating(prev => prev.filter(r => r.id !== id));
        }, 4000);
    };

    return (
        <div className="fixed inset-0 pointer-events-none z-[100] overflow-hidden">
            <AnimatePresence>
                {floating.map(r => (
                    <motion.div
                        key={r.id}
                        initial={{ y: '110vh', opacity: 0, x: `${r.x}vw`, scale: 0.5, rotate: 0 }}
                        animate={{
                            y: '-10vh',
                            opacity: [0, 1, 1, 0],
                            scale: [0.5, 1.5, 1.2],
                            rotate: [0, -10, 10, 0]
                        }}
                        transition={{ duration: 4, ease: "easeOut" }}
                        className="absolute top-0 flex flex-col items-center"
                    >
                        <span className="text-6xl drop-shadow-2xl filter">{r.emoji}</span>
                        {/* Only show name if it's not me? Or always show? */}
                        {r.byName && (
                            <div className={cn(
                                "text-sm font-bold text-center mt-2 px-3 py-1 rounded-full backdrop-blur-md border shadow-lg",
                                isLightTheme
                                    ? "bg-white/80 text-slate-800 border-slate-200"
                                    : "bg-black/40 text-white/90 border-white/10"
                            )}>
                                {r.byName}
                            </div>
                        )}
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};
