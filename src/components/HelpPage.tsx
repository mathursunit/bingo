
import { motion } from 'framer-motion';
import {
    ArrowLeft, CheckSquare, Share2, BookOpen,
    Plus, UserPlus, Trophy, Palette, Zap, Camera,
    Sparkles, LayoutGrid
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';

const FeatureCard = ({ icon: Icon, title, description, color }: {
    icon: React.ElementType,
    title: string,
    description: string,
    color: string
}) => (
    <motion.div
        whileHover={{ scale: 1.02 }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm"
    >
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center mb-4", color)}>
            <Icon size={24} className="text-white" />
        </div>
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-slate-400 text-sm">{description}</p>
    </motion.div>
);

const StepCard = ({ number, title, description }: { number: number, title: string, description: string }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent-primary/20 border border-accent-primary/50 flex items-center justify-center text-accent-primary font-bold">
            {number}
        </div>
        <div>
            <h4 className="font-semibold text-white mb-1">{title}</h4>
            <p className="text-slate-400 text-sm">{description}</p>
        </div>
    </div>
);

export const HelpPage = () => {
    const navigate = useNavigate();
    const { settings } = useSettings();
    const isLightTheme = settings.theme === 'light';

    return (
        <div className={cn(
            "min-h-screen p-6 relative overflow-x-hidden pb-32 bg-transparent",
            isLightTheme ? "text-slate-800" : "text-white"
        )}>
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate(-1)}
                    className={cn(
                        "flex items-center gap-2 transition-colors mb-8 group",
                        isLightTheme ? "text-slate-600 hover:text-slate-900" : "text-slate-400 hover:text-white"
                    )}
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back
                </motion.button>

                {/* Hero Section */}
                <div className="text-center mb-16">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-primary to-accent-secondary mb-6 shadow-2xl"
                    >
                        <BookOpen size={40} className="text-white" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl font-extrabold mb-4"
                    >
                        Welcome to <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">SunSar Bingo</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className={cn(
                            "text-xl max-w-2xl mx-auto",
                            isLightTheme ? "text-slate-600" : "text-slate-400"
                        )}
                    >
                        Turn your 2026 goals into a beautiful, social game. Track progress, celebrate wins, and stay motivated together.
                    </motion.p>
                </div>

                {/* Quick Features Grid */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-16"
                >
                    <FeatureCard
                        icon={LayoutGrid}
                        title="Custom Boards"
                        description="Create 3x3, 4x4, or 5x5 grids for any goal type"
                        color="bg-blue-500"
                    />
                    <FeatureCard
                        icon={Camera}
                        title="Photo Memories"
                        description="Attach photos to tiles and build a visual journal"
                        color="bg-green-500"
                    />
                    <FeatureCard
                        icon={UserPlus}
                        title="Shared Boards"
                        description="Invite friends to track goals together"
                        color="bg-purple-500"
                    />
                    <FeatureCard
                        icon={Palette}
                        title="8 Themes"
                        description="Beautiful themes including 3 with animations"
                        color="bg-pink-500"
                    />
                </motion.div>

                {/* Getting Started Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                            <Plus size={28} />
                        </div>
                        <h2 className="text-2xl font-bold">Getting Started</h2>
                    </div>

                    <div className={cn(
                        "rounded-3xl p-8 backdrop-blur-sm space-y-6",
                        isLightTheme
                            ? "bg-white/60 border border-slate-200"
                            : "bg-white/5 border border-white/10"
                    )}>
                        <StepCard
                            number={1}
                            title="Create Your Board"
                            description="From the dashboard, click 'Create Board'. Choose from templates like 'Fitness', 'Travel', or 'Self Care' — or start blank."
                        />
                        <StepCard
                            number={2}
                            title="Customize Your Goals"
                            description="Write specific, actionable goals for each tile. You can set multi-count targets (e.g., 'Run 10 miles' with progress tracking) and due dates."
                        />
                        <StepCard
                            number={3}
                            title="Go Live"
                            description="Click 'Go Live' to lock your board and start playing. The board structure is now set — time to start completing goals!"
                        />
                    </div>
                </motion.section>

                {/* Playing the Game Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                            <CheckSquare size={28} />
                        </div>
                        <h2 className="text-2xl font-bold">Playing & Tracking</h2>
                    </div>

                    <div className={cn(
                        "rounded-3xl p-8 backdrop-blur-sm",
                        isLightTheme
                            ? "bg-white/60 border border-slate-200"
                            : "bg-white/5 border border-white/10"
                    )}>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-yellow-400" />
                                    Completing Goals
                                </h3>
                                <ul className={cn(
                                    "space-y-3 text-sm",
                                    isLightTheme ? "text-slate-600" : "text-slate-400"
                                )}>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-2 flex-shrink-0" />
                                        <span><strong>Tap any tile</strong> to open it and mark progress</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-2 flex-shrink-0" />
                                        <span><strong>Add photos</strong> as proof and memories</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-2 flex-shrink-0" />
                                        <span><strong>Track multi-count</strong> goals with +/- buttons</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="space-y-4">
                                <h3 className="font-bold text-lg flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-400" />
                                    Winning Bingo
                                </h3>
                                <p className={cn(
                                    "text-sm",
                                    isLightTheme ? "text-slate-600" : "text-slate-400"
                                )}>
                                    Complete any full <strong>row</strong>, <strong>column</strong>, or <strong>diagonal</strong> to score a BINGO!
                                    Watch for the confetti celebration when you hit one. The goal is to fill the entire board — but each bingo along the way is a victory.
                                </p>
                                <div className={cn(
                                    "p-4 rounded-xl text-center",
                                    isLightTheme ? "bg-amber-50 border border-amber-200" : "bg-amber-500/10 border border-amber-500/30"
                                )}>
                                    <span className="font-bold text-amber-500">Pro tip:</span>
                                    <span className={cn("ml-2 text-sm", isLightTheme ? "text-slate-700" : "text-slate-300")}>
                                        The center tile is a FREE space!
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Collaboration Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                            <Share2 size={28} />
                        </div>
                        <h2 className="text-2xl font-bold">Playing Together</h2>
                    </div>

                    <div className={cn(
                        "rounded-3xl p-8 backdrop-blur-sm",
                        isLightTheme
                            ? "bg-white/60 border border-slate-200"
                            : "bg-white/5 border border-white/10"
                    )}>
                        <div className="grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <UserPlus className="w-5 h-5 text-accent-secondary" />
                                    Invite Collaborators
                                </h3>
                                <p className={cn(
                                    "text-sm mb-4",
                                    isLightTheme ? "text-slate-600" : "text-slate-400"
                                )}>
                                    Share your board with friends, family, or teammates. Everyone can view progress and complete tiles together.
                                </p>
                                <ul className={cn(
                                    "space-y-2 text-sm",
                                    isLightTheme ? "text-slate-600" : "text-slate-400"
                                )}>
                                    <li>• <strong>Editors</strong> can mark goals complete</li>
                                    <li>• <strong>Viewers</strong> can see progress</li>
                                    <li>• <strong>Owner</strong> controls board settings</li>
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                    <Trophy className="w-5 h-5 text-amber-400" />
                                    Competition Mode
                                </h3>
                                <p className={cn(
                                    "text-sm mb-4",
                                    isLightTheme ? "text-slate-600" : "text-slate-400"
                                )}>
                                    On shared boards, tiles show <strong>who completed them first</strong>. Race your friends to complete the most goals!
                                </p>
                                <div className={cn(
                                    "rounded-xl p-4 border text-center",
                                    isLightTheme ? "bg-slate-50 border-slate-200" : "bg-black/40 border-white/5"
                                )}>
                                    <span className={cn(
                                        "text-xs uppercase tracking-widest",
                                        isLightTheme ? "text-slate-500" : "text-slate-500"
                                    )}>Example</span>
                                    <div className="mt-2 font-bold">"Run a 5K"</div>
                                    <div className="text-xs text-accent-primary mt-1">✓ Completed by Sunit</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.section>

                {/* Themes Section */}
                <motion.section
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.7 }}
                    className="mb-16"
                >
                    <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-pink-500/20 rounded-xl text-pink-400">
                            <Palette size={28} />
                        </div>
                        <h2 className="text-2xl font-bold">Themes & Customization</h2>
                    </div>

                    <div className={cn(
                        "rounded-3xl p-8 backdrop-blur-sm",
                        isLightTheme
                            ? "bg-white/60 border border-slate-200"
                            : "bg-white/5 border border-white/10"
                    )}>
                        <p className={cn(
                            "text-sm mb-6",
                            isLightTheme ? "text-slate-600" : "text-slate-400"
                        )}>
                            Choose from <strong>8 beautiful themes</strong> to match your style. Access themes anytime from the sidebar or Settings.
                        </p>

                        <div className="grid grid-cols-4 sm:grid-cols-8 gap-3 mb-6">
                            {[
                                { name: 'Light', color: 'bg-sky-100', animated: true },
                                { name: 'Dawn', color: 'bg-orange-400', animated: false },
                                { name: 'Midnight', color: 'bg-indigo-600', animated: false },
                                { name: 'Cosmic', color: 'bg-violet-600', animated: true },
                                { name: 'Lavender', color: 'bg-fuchsia-600', animated: true },
                                { name: 'Forest', color: 'bg-emerald-600', animated: false },
                                { name: 'Ocean', color: 'bg-cyan-600', animated: false },
                                { name: 'Sunset', color: 'bg-rose-600', animated: false },
                            ].map((theme) => (
                                <div key={theme.name} className="text-center">
                                    <div className={cn(
                                        "w-10 h-10 rounded-full mx-auto mb-2 relative",
                                        theme.color,
                                        theme.name === 'Light' && "border border-slate-300"
                                    )}>
                                        {theme.animated && (
                                            <Zap className="absolute -top-1 -right-1 w-4 h-4 text-yellow-400 drop-shadow" />
                                        )}
                                    </div>
                                    <span className={cn(
                                        "text-xs",
                                        isLightTheme ? "text-slate-600" : "text-slate-400"
                                    )}>{theme.name}</span>
                                </div>
                            ))}
                        </div>

                        <div className={cn(
                            "flex items-center gap-3 p-4 rounded-xl",
                            isLightTheme ? "bg-blue-50 border border-blue-200" : "bg-blue-500/10 border border-blue-500/30"
                        )}>
                            <Zap className="w-5 h-5 text-blue-400" />
                            <p className={cn(
                                "text-sm",
                                isLightTheme ? "text-blue-800" : "text-blue-200"
                            )}>
                                <strong>Animated themes</strong> (Light, Cosmic, Lavender) feature moving backgrounds with clouds, stars, or petals!
                            </p>
                        </div>
                    </div>
                </motion.section>

                {/* CTA */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="text-center"
                >
                    <button
                        onClick={() => navigate('/dashboard')}
                        className={cn(
                            "px-8 py-4 font-bold rounded-2xl text-lg hover:scale-105 transition-transform shadow-xl",
                            isLightTheme
                                ? "bg-slate-900 text-white shadow-slate-300"
                                : "bg-white text-slate-900 shadow-white/10"
                        )}
                    >
                        Start Playing →
                    </button>
                </motion.div>
            </div>
        </div>
    );
};
