
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
        { id: 'dawn', name: 'Dawn', color: 'bg-[#0f111a] from-violet-500/20 to-pink-500/20' },
        { id: 'midnight', name: 'Midnight', color: 'bg-[#020617] from-sky-500/20 to-indigo-500/20' },
        { id: 'forest', name: 'Forest', color: 'bg-[#052e16] from-green-500/20 to-emerald-500/20' },
        { id: 'ocean', name: 'Ocean', color: 'bg-[#083344] from-cyan-500/20 to-teal-500/20' },
        { id: 'sunset', name: 'Sunset', color: 'bg-[#2a0a0a] from-orange-500/20 to-rose-500/20' },
    ];

    const fonts = [
        { id: 'outfit', name: 'Modern', family: 'font-[Outfit]' },
        { id: 'inter', name: 'Clean', family: 'font-[Inter]' },
        { id: 'playfair', name: 'Elegant', family: 'font-["Playfair_Display"]' },
        { id: 'mono', name: 'Tech', family: 'font-["Fira_Code"]' },
    ];

    return (
        <AnimatePresence>
            {isSettingsOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 font-sans">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                        onClick={handleCancel}
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-white/10 flex justify-between items-center sticky top-0 bg-slate-900 z-10">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Palette className="w-5 h-5 text-accent-primary" />
                                Customization
                            </h2>
                            <button onClick={handleCancel} className="text-slate-400 hover:text-white transition-colors">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Theme Section */}
                            <section>
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
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
                                                    : "border-white/10 hover:border-white/30"
                                            )}
                                        >
                                            <div className={cn("h-16 w-full bg-gradient-to-br", theme.color)}></div>
                                            <div className="p-3 bg-slate-800/50">
                                                <span className={cn(
                                                    "text-sm font-medium",
                                                    settings.theme === theme.id ? "text-white" : "text-slate-400"
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
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
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
                                                    ? "bg-white/10 border-accent-primary text-white"
                                                    : "bg-white/5 border-white/5 hover:bg-white/10 text-slate-300"
                                            )}
                                        >
                                            <div>
                                                <span className={cn("text-lg block mb-0.5", font.family)}>Aa</span>
                                                <span className="text-xs text-slate-400">{font.name}</span>
                                            </div>
                                            {settings.font === font.id && <Check className="w-5 h-5 text-accent-primary" />}
                                        </button>
                                    ))}
                                </div>
                                <div className="mt-4 p-4 rounded-xl bg-black/20 border border-white/5">
                                    <p className={cn("text-sm text-slate-300 leading-relaxed",
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
                                <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4" /> Accessibility
                                </h3>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="flex items-center gap-3">
                                        <div className={cn("p-2 rounded-lg", settings.enableAnimation ? "bg-accent-primary/20 text-accent-primary" : "bg-slate-700 text-slate-400")}>
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <div className="font-medium text-white">Background Animation</div>
                                            <div className="text-xs text-slate-400">Glowing blobs and floating particles</div>
                                        </div>
                                    </div>

                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={settings.enableAnimation}
                                            onChange={(e) => updateSettings({ enableAnimation: e.target.checked }, false)}
                                            className="sr-only peer"
                                        />
                                        <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-accent-primary rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-accent-primary"></div>
                                    </label>
                                </div>
                            </section>
                        </div>

                        {/* Footer */}
                        <div className="p-6 border-t border-white/10 flex justify-end gap-3 sticky bottom-0 bg-slate-900 z-10 shrink-0">
                            <button
                                onClick={handleCancel}
                                className="px-4 py-2 rounded-xl font-semibold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
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
