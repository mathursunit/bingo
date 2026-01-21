
import { motion } from 'framer-motion';
import {
    ArrowLeft, CheckSquare, Share2, BookOpen,
    Plus, UserPlus, Trophy
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const WalkthroughStep = ({ number, title, text, imageSrc }: { number: number, title: string, text: string, imageSrc?: string }) => (
    <div className="relative pl-8 border-l border-white/10 pb-8 last:pb-0 last:border-l-0">
        <div className="absolute -left-4 top-0 w-8 h-8 rounded-full bg-slate-900 border border-accent-primary text-accent-primary font-bold flex items-center justify-center text-sm shadow-[0_0_10px_rgba(139,92,246,0.2)]">
            {number}
        </div>
        <div className="mb-2">
            <h4 className="text-lg font-bold text-white">{title}</h4>
            <p className="text-slate-400 text-sm mt-1">{text}</p>
        </div>
        {imageSrc && (
            <motion.div
                whileHover={{ scale: 1.02 }}
                className="mt-4 rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-black/40 group relative"
            >
                <img src={imageSrc} alt={title} className="w-full h-auto object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            </motion.div>
        )}
    </div>
);

export const HelpPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-transparent text-white p-6 relative overflow-x-hidden pb-32">
            {/* Header */}
            <div className="max-w-5xl mx-auto">
                <motion.button
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8 group"
                >
                    <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    Back to App
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
                        How to Play <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">Bingo</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-xl text-slate-400 max-w-2xl mx-auto"
                    >
                        A step-by-step guide to turning your 2026 goals into a social game.
                    </motion.p>
                </div>

                <div className="grid gap-12">
                    {/* SECTION 1: CREATING A BOARD */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-blue-500/20 rounded-xl text-blue-400">
                                <Plus size={32} />
                            </div>
                            <h2 className="text-3xl font-bold">1. Creating a Board</h2>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                            <WalkthroughStep
                                number={1}
                                title="Start from Dashboard"
                                text="Click the 'Create Board' button on your dashboard. You can choose to start fresh or use a template (like 'Self Care' or 'Travel')."
                                imageSrc="/assets/help/dashboard.png"
                            />
                            <WalkthroughStep
                                number={2}
                                title="Customize Setup"
                                text="Give your board a name (e.g., '2026 Goals') and choose a Grid Size. 3x3 is great for quick games, while 5x5 is the classic challenge."
                            />
                            <WalkthroughStep
                                number={3}
                                title="Fill Your Tiles"
                                text="The most fun part! Fill in each tile with a specific goal. You can drag to reorder or click 'Shuffle' to mix them up."
                                imageSrc="/assets/help/grid.png"
                            />
                            <WalkthroughStep
                                number={4}
                                title="Lock & Play"
                                text="When you're happy, click 'Go Live'. This locks the grid structure so you can start marking progress."
                            />
                        </div>
                    </motion.div>

                    {/* SECTION 2: PLAYING THE GAME */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-green-500/20 rounded-xl text-green-400">
                                <CheckSquare size={32} />
                            </div>
                            <h2 className="text-3xl font-bold">2. Playing & Tracking</h2>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                            <WalkthroughStep
                                number={1}
                                title="Tap to Interact"
                                text="Tap any tile on your board. If it's a '1-time' goal, you can complete it instantly. For multi-count goals (e.g., 'Read 5 Books'), you can add progress."
                            />
                            <WalkthroughStep
                                number={2}
                                title="Add Photo Proof"
                                text="Don't just say you did it—prove it! Upload photos directly to the tile. This is great for memories later."
                                imageSrc="/assets/help/modal.png"
                            />
                            <WalkthroughStep
                                number={3}
                                title="Win with Bingo!"
                                text="Complete a full row, column, or diagonal to get a BINGO! Watch out for the confetti celebration."
                            />
                        </div>
                    </motion.div>

                    {/* SECTION 3: SOCIAL FEATURES */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        <div className="flex items-center gap-4 mb-6">
                            <div className="p-3 bg-purple-500/20 rounded-xl text-purple-400">
                                <UserPlus size={32} />
                            </div>
                            <h2 className="text-3xl font-bold">3. Playing with Friends</h2>
                        </div>

                        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Share2 size={20} className="text-accent-secondary" />
                                        Shared Boards
                                    </h3>
                                    <p className="text-slate-400 mb-4">
                                        Invite friends to the <strong>same board</strong>. You all share the same grid but complete tiles individually (or together!).
                                    </p>
                                    <ul className="space-y-3">
                                        <li className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-2" />
                                            <span className="text-sm text-slate-300">Great for couples (e.g., "Our 2026 Bucket List")</span>
                                        </li>
                                        <li className="flex items-start gap-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent-primary mt-2" />
                                            <span className="text-sm text-slate-300">Perfect for team challenges</span>
                                        </li>
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                        <Trophy size={20} className="text-accent-gold" />
                                        Competition Mode
                                    </h3>
                                    <p className="text-slate-400 mb-4">
                                        When playing on a shared board, the tile shows <strong>who completed it first</strong>.
                                    </p>
                                    <div className="bg-black/40 rounded-xl p-4 border border-white/5">
                                        <div className="text-center">
                                            <span className="text-xs text-slate-500 uppercase tracking-widest">Tile Status</span>
                                            <div className="mt-2 font-bold text-white">"Run a Marathon"</div>
                                            <div className="text-xs text-accent-primary mt-1">Completed by You</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                <div className="mt-16 text-center">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="px-8 py-4 bg-white text-bg-dark font-bold rounded-2xl text-lg hover:scale-105 transition-transform shadow-xl shadow-white/10"
                    >
                        Let's Get Started
                    </button>
                </div>
            </div>
        </div>
    );
};
