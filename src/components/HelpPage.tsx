import React from 'react';
import { motion } from 'framer-motion';
import {
    ArrowLeft, HelpCircle, LayoutGrid, CheckSquare,
    Share2, Camera, Settings, Sparkles, BookOpen, Crown
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HelpSection = ({ title, icon: Icon, children, delay = 0 }: { title: string, icon: any, children: React.ReactNode, delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-sm hover:bg-white/10 transition-colors"
    >
        <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-accent-primary/20 rounded-lg text-accent-primary">
                <Icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <div className="text-slate-300 space-y-3 leading-relaxed">
            {children}
        </div>
    </motion.div>
);

const Step = ({ number, title, text }: { number: number, title: string, text: string }) => (
    <div className="flex gap-4">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-white/20 flex items-center justify-center font-bold text-sm text-white">
            {number}
        </div>
        <div>
            <h4 className="font-semibold text-white mb-1">{title}</h4>
            <p className="text-sm text-slate-400">{text}</p>
        </div>
    </div>
);

export const HelpPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-bg-dark text-white p-6 relative overflow-x-hidden">
            {/* Header */}
            <div className="max-w-4xl mx-auto">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to Dashboard
                </motion.button>

                <div className="text-center mb-16">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-accent-primary to-accent-secondary mb-6 shadow-2xl shadow-accent-primary/20"
                    >
                        <BookOpen size={40} className="text-white" />
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl sm:text-5xl font-extrabold mb-4"
                    >
                        How to <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">Bingo</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400 max-w-2xl mx-auto"
                    >
                        Your complete guide to mastering the art of 2026 Bingo. Turn your goals into a game!
                    </motion.p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
                    <HelpSection title="Getting Started" icon={Sparkles} delay={0.3}>
                        <p>Welcome to your digital accountability partner! The app is designed to make achieving your 2026 goals fun and social.</p>
                        <div className="mt-4 space-y-4">
                            <Step number={1} title="Sign Up" text="You're already here! Your account is safe with us." />
                            <Step number={2} title="Create a Board" text="Choose a template or start from scratch." />
                            <Step number={3} title="Invite Friends" text="Everything is better together." />
                        </div>
                    </HelpSection>

                    <HelpSection title="Creating Boards" icon={LayoutGrid} delay={0.4}>
                        <p>Your board is your battlefield. You can customize it to fit your exact needs.</p>
                        <div className="mt-4 bg-black/20 rounded-xl p-4 border border-white/5">
                            <h4 className="font-semibold text-accent-gold mb-2 flex items-center gap-2">
                                <Crown size={16} /> Pro Tips:
                            </h4>
                            <ul className="list-disc list-inside space-y-1 text-sm text-slate-400">
                                <li><strong>3x3 Grid:</strong> Quick, focused mini-goals.</li>
                                <li><strong>5x5 Grid:</strong> The classic Bingo experience.</li>
                                <li><strong>Templates:</strong> We have pre-made ideas for inspiration!</li>
                                <li><strong>Shuffle:</strong> Don't like the layout? Hit shuffle before locking.</li>
                            </ul>
                        </div>
                    </HelpSection>

                    <HelpSection title="Playing the Game" icon={CheckSquare} delay={0.5}>
                        <p>Once your board is finalized, the fun begins. Tap a tile to interact with it.</p>
                        <div className="space-y-3 mt-4">
                            <div className="flex items-start gap-3">
                                <Camera className="text-accent-secondary shrink-0 mt-1" size={18} />
                                <div>
                                    <span className="text-white font-medium">Add Proof:</span>
                                    <p className="text-sm">Upload a photo to mark a tile as "In Progress" or "Completed".</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <CheckSquare className="text-green-400 shrink-0 mt-1" size={18} />
                                <div>
                                    <span className="text-white font-medium">Mark Complete:</span>
                                    <p className="text-sm">Tap "Mark Complete" when you're done. Watch the tile light up!</p>
                                </div>
                            </div>
                        </div>
                    </HelpSection>

                    <HelpSection title="Shared Boards" icon={Share2} delay={0.6}>
                        <p>Compete or collaborate with friends on the same board.</p>
                        <div className="mt-4 space-y-2 text-sm">
                            <p>👥 <strong>Invite Users:</strong> Click the share icon and add friends by email.</p>
                            <p>🏆 <strong>Competition:</strong> See who completes tiles first. The tile will show the name of the winner!</p>
                            <p>👀 <strong>Live Updates:</strong> Watch changes happen in real-time.</p>
                        </div>
                    </HelpSection>

                    <HelpSection title="Advanced Features" icon={Settings} delay={0.7}>
                        <p>Customize your experience in the settings menu.</p>
                        <ul className="mt-2 space-y-2 text-sm text-slate-400">
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                                Toggle sound effects on/off
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                                Switch dynamic backgrounds
                            </li>
                            <li className="flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-accent-primary" />
                                Edit incomplete boards anytime
                            </li>
                        </ul>
                    </HelpSection>

                    <div className="md:col-span-2 mt-8">
                        <div className="bg-gradient-to-r from-accent-primary/10 to-accent-secondary/10 border border-white/10 rounded-2xl p-8 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-accent-primary to-accent-secondary" />
                            <HelpCircle className="w-12 h-12 text-white mx-auto mb-4 opacity-80" />
                            <h3 className="text-2xl font-bold text-white mb-2">Ready to start?</h3>
                            <p className="text-slate-400 mb-6">Create your first board and start your journey.</p>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="px-8 py-3 bg-white text-bg-dark font-bold rounded-xl hover:bg-slate-200 transition-colors shadow-lg shadow-white/10"
                            >
                                Go to Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
