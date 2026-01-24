import React, { useState, useRef, useEffect } from 'react';
import { Type } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface FontControlProps {
    scale: number;
    onScaleChange: (scale: number) => void;
    isLightTheme: boolean;
}

export const FontControl: React.FC<FontControlProps> = ({ scale, onScaleChange, isLightTheme }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Auto-close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div ref={containerRef} className="relative z-30 flex items-center">
            {/* Toggle Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "p-3 rounded-full shadow-lg border transition-all duration-300 backdrop-blur-md flex items-center justify-center",
                    isLightTheme
                        ? "bg-white/80 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-slate-200/50"
                        : "bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-700 shadow-black/30",
                    isOpen && "ring-2 ring-accent-primary border-transparent"
                )}
                title="Adjust Text Size"
            >
                <Type size={20} />
            </button>

            {/* Slider Panel */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, height: 200, scale: 1, y: 0 }}
                        exit={{ opacity: 0, height: 0, scale: 0.95, y: -20 }}
                        className={cn(
                            "absolute top-full mt-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 p-3 rounded-full border shadow-2xl backdrop-blur-xl w-14 overflow-hidden origin-top",
                            isLightTheme
                                ? "bg-white/95 border-slate-200"
                                : "bg-slate-900/95 border-slate-700"
                        )}
                    >
                        <span className={cn("text-[10px] font-bold mt-1 select-none", isLightTheme ? "text-slate-400" : "text-slate-500")}>Aa</span>

                        {/* Vertical Slider Wrapper */}
                        <div className="flex-1 w-full flex items-center justify-center py-2 relative">
                            <input
                                type="range"
                                min="0.75"
                                max="1.5"
                                step="0.05"
                                value={scale}
                                onChange={(e) => onScaleChange(parseFloat(e.target.value))}
                                className="w-32 -rotate-90 absolute cursor-pointer"
                                style={{
                                    accentColor: isLightTheme ? '#6366f1' : '#818cf8', // Indigo
                                }}
                            />
                        </div>

                        <span className={cn("text-lg font-bold mb-1 select-none", isLightTheme ? "text-slate-700" : "text-slate-200")}>Aa</span>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
