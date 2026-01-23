
import React from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { Palette, Type, Zap, X, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const SettingsModal: React.FC = () => {
    const { isSettingsOpen, closeSettings, settings, updateSettings } = useSettings();
    const initialSettingsRef = React.useRef(settings);

    // Snapshot settings when the modal opens to allow revert on cancel
    React.useEffect(() => {
        if (isSettingsOpen) {
            initialSettingsRef.current = settings;
        }
    }, [isSettingsOpen]);

    if (!isSettingsOpen) return null;

    const handleCancel = () => {
        updateSettings(initialSettingsRef.current, false);
        closeSettings();
    };

    const handleSave = () => {
        updateSettings(settings, true);
        closeSettings();
    };

    const themes = [
        { id: 'light', name: 'Light', color: 'bg-white from-slate-100 to-sky-50', animated: true },
        { id: 'dawn', name: 'Dawn', color: 'bg-[#0f111a] from-violet-500/20 to-pink-500/20', animated: false },
        { id: 'cosmic', name: 'Cosmic', color: 'bg-[#2e1065] from-violet-600/20 to-pink-600/20', animated: true },
        { id: 'lavender', name: 'Lavender', color: 'bg-[#3b0764] from-fuchsia-500/20 to-purple-500/20', animated: true },
        { id: 'midnight', name: 'Midnight', color: 'bg-[#020617] from-sky-500/20 to-indigo-500/20', animated: false },
        { id: 'forest', name: 'Forest', color: 'bg-[#052e16] from-green-500/20 to-emerald-500/20', animated: false },
        { id: 'ocean', name: 'Ocean', color: 'bg-[#083344] from-cyan-500/20 to-teal-500/20', animated: false },
        { id: 'sunset', name: 'Sunset', color: 'bg-[#2a0a0a] from-orange-500/20 to-rose-500/20', animated: false },
    ];

    const fonts = [
        { id: 'outfit', name: 'Modern', family: 'font-[Outfit]' },
        { id: 'inter', name: 'Clean', family: 'font-[Inter]' },
        { id: 'playfair', name: 'Elegant', family: 'font-["Playfair_Display"]' },
        { id: 'mono', name: 'Tech', family: 'font-["Fira_Code"]' },
    ];

    const isLightTheme = settings.theme === 'light';

    return (
        <AnimatePresence>
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={handleCancel}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className={cn(
                            "relative w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col border",
                            isLightTheme
                                ? "bg-white border-slate-200"
                                : "bg-slate-900 border-white/10"
                        )}
                    >
                        {/* Header */}
                        <div className={cn(
                            "p-6 border-b flex justify-between items-center sticky top-0 z-10",
                            isLightTheme
                                ? "bg-white border-slate-100"
                                : "bg-slate-900 border-white/10"
                        )}>
                            <h2 className={cn(
                                "text-xl font-bold flex items-center gap-2",
                                isLightTheme ? "text-slate-800" : "text-white"
                            )}>
                                <Palette className="w-5 h-5 text-accent-primary" />
                                Customization
                            </h2>
                            <button onClick={handleCancel} className={cn(
                                "transition-colors",
                                isLightTheme
                                    ? "text-slate-400 hover:text-slate-600"
                                    : "text-slate-400 hover:text-white"
                            )}>
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Theme Section */}
                            <section>
                                <h3 className={cn(
                                    "text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2",
                                    isLightTheme ? "text-slate-500" : "text-slate-400"
                                )}>
                                    <Palette className="w-4 h-4" /> Theme
                                </h3>
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                                    {themes.map((theme) => (
                                        <button
                                            key={theme.id}
                                            onClick={() => updateSettings({ theme: theme.id }, false)}
                                            className={cn(
                                                "relative group overflow-hidden rounded-xl border transition-all duration-300",
                                                settings.theme === theme.id
                                                    ? "border-accent-primary ring-2 ring-accent-primary/50"
                                                    : isLightTheme
                                                        ? "border-slate-200 hover:border-slate-300"
                                                        : "border-white/10 hover:border-white/30"
                                            )}
                                        >
                                            <div className={cn("h-16 w-full bg-gradient-to-br relative", theme.color)}>
                                                {/* Animated badge */}
                                                {theme.animated && (
                                                    <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/40 backdrop-blur-sm rounded text-[10px] font-bold text-white/90 flex items-center gap-1">
                                                        <Zap className="w-2.5 h-2.5" />
                                                        <span>Animated</span>
                                                    </div>
                                                )}
                                            </div>
                                            <div className={cn(
                                                "p-3",
                                                isLightTheme ? "bg-slate-50" : "bg-slate-800/50"
                                            )}>
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    settings.theme === theme.id
                                                        ? (isLightTheme ? "text-slate-900" : "text-white")
                                                        : "text-slate-400"
                                                )}>
                                                    {theme.name}
                                                </span>
                                            </div>
                                            {settings.theme === theme.id && (
                                                <div className="absolute top-2 right-2 w-5 h-5 bg-accent-primary rounded-full flex items-center justify-center shadow-lg">
                                                    <Check className="w-3 h-3 text-white" />
                                                </div>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </section>

                            {/* Font Section */}
                            <section>
                                <h3 className={cn(
                                    "text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2",
                                    isLightTheme ? "text-slate-500" : "text-slate-400"
                                )}>
                                    <Type className="w-4 h-4" /> Typography
                                </h3>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {fonts.map((font) => (
                                        <button
                                            key={font.id}
                                            onClick={() => updateSettings({ font: font.id }, false)}
                                            className={cn(
                                                "flex items-center justify-between p-4 rounded-xl border transition-all duration-200 text-left",
                                                settings.font === font.id
                                                    ? "bg-accent-primary/10 border-accent-primary text-accent-primary"
                                                    : isLightTheme
                                                        ? "bg-white border-slate-200 hover:bg-slate-50 text-slate-600"
                                                        : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-300"
                                            )}
                                        >
                                            <div>
                                                <span className={cn("text-lg block mb-0.5", font.family)}>Aa</span>
                                                <span className="text-xs opacity-70">{font.name}</span>
                                            </div>
                                            {settings.font === font.id && <Check className="w-5 h-5" />}
                                        </button>
                                    ))}
                                </div>
                                <div className={cn(
                                    "mt-4 p-4 rounded-xl border",
                                    isLightTheme
                                        ? "bg-slate-50 border-slate-200"
                                        : "bg-black/20 border-white/5"
                                )}>
                                    <p className={cn("text-sm leading-relaxed",
                                        isLightTheme ? "text-slate-600" : "text-slate-300",
                                        settings.font === 'outfit' && 'font-[Outfit]',
                                        settings.font === 'inter' && 'font-[Inter]',
                                        settings.font === 'playfair' && 'font-["Playfair_Display"]',
                                        settings.font === 'mono' && 'font-["Fira_Code"]'
                                    )}>
                                        The quick brown fox jumps over the lazy dog. 1234567890.
                                    </p>
                                </div>
                            </section>

                            {/* Motion Section */}
                            <section>
                                <h3 className={cn(
                                    "text-sm font-semibold uppercase tracking-wider mb-4 flex items-center gap-2",
                                    isLightTheme ? "text-slate-500" : "text-slate-400"
                                )}>
                                    <Zap className="w-4 h-4" /> Experience
                                </h3>

                                {/* Animation Toggle */}
                                <div className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border mb-3",
                                    isLightTheme
                                        ? "bg-white border-slate-200"
                                        : "bg-white/5 border-white/10"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg",
                                            settings.enableAnimation
                                                ? "bg-accent-primary/20 text-accent-primary"
                                                : isLightTheme ? "bg-slate-100 text-slate-400" : "bg-slate-700 text-slate-400"
                                        )}>
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <div className={cn("font-medium", isLightTheme ? "text-slate-800" : "text-white")}>Live Backgrounds</div>
                                            <div className={cn("text-xs", isLightTheme ? "text-slate-500" : "text-slate-400")}>Dynamic particles and ambient effects</div>
                                        </div>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.enableAnimation}
                                            onChange={(e) => updateSettings({ enableAnimation: e.target.checked }, false)}
                                            className="sr-only peer"
                                        />
                                        <div className={cn(
                                            "w-11 h-6 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary",
                                            isLightTheme ? "bg-slate-200" : "bg-slate-700"
                                        )}></div>
                                    </label>
                                </div>

                                {/* Sound Toggle */}
                                <div className={cn(
                                    "flex items-center justify-between p-4 rounded-xl border",
                                    isLightTheme
                                        ? "bg-white border-slate-200"
                                        : "bg-white/5 border-white/10"
                                )}>
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg",
                                            settings.enableSound
                                                ? "bg-emerald-500/20 text-emerald-400"
                                                : isLightTheme ? "bg-slate-100 text-slate-400" : "bg-slate-700 text-slate-400"
                                        )}>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
                                                <path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
                                                <path d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
                                            </svg>
                                        </div>
                                        <div>
                                            <div className={cn("font-medium", isLightTheme ? "text-slate-800" : "text-white")}>Sound Effects</div>
                                            <div className={cn("text-xs", isLightTheme ? "text-slate-500" : "text-slate-400")}>Satisfying clicks and celebrations</div>
                                        </div>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.enableSound}
                                            onChange={(e) => updateSettings({ enableSound: e.target.checked }, false)}
                                            className="sr-only peer"
                                        />
                                        <div className={cn(
                                            "w-11 h-6 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500",
                                            isLightTheme ? "bg-slate-200" : "bg-slate-700"
                                        )}></div>
                                    </label>
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className={cn(
                            "p-6 border-t flex justify-end gap-3 sticky bottom-0 z-10 shrink-0",
                            isLightTheme
                                ? "bg-white border-slate-100"
                                : "bg-slate-900 border-white/10"
                        )}>
                            <button
                                onClick={handleCancel}
                                className={cn(
                                    "px-4 py-2 rounded-xl font-semibold transition-colors",
                                    isLightTheme
                                        ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                        : "bg-white/5 text-slate-300 hover:bg-white/10"
                                )}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="px-6 py-2 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl font-bold text-white shadow-lg hover:shadow-accent-primary/25 transition-all active:scale-95"
                            >
                                Save Changes
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};
