import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';


export const Login: React.FC = () => {
    const { signIn, error } = useAuth();

    return (
        <div className="relative flex flex-col items-center justify-center min-h-screen p-4 text-center overflow-hidden bg-bg-dark text-slate-100 font-sans">
            {/* Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                {/* Only overlay gradient here, base background comes from App.tsx */}
                <div className="absolute inset-0 bg-gradient-to-t from-bg-dark via-transparent to-transparent opacity-80" />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-[400px] animate-fade-in-up">
                {/* Logo Section */}
                <div className="mb-8 flex flex-col items-center">
                    <div className="relative w-20 h-20 mb-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center border border-white/10 shadow-xl shadow-indigo-500/10 backdrop-blur-sm">
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-12 h-12 object-contain drop-shadow-lg"
                        />
                        <div className="absolute -top-2 -right-2">
                            <Sparkles className="w-6 h-6 text-accent-gold animate-bounce-gentle" />
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight text-white mb-2">SunSar Bingo</h1>
                    <p className="text-slate-400 text-sm font-medium">The social way to achieve your 2026 goals.</p>
                </div>

                {/* Card Content */}
                <div className="bg-bg-card/50 backdrop-blur-md border border-[var(--theme-border)] rounded-2xl p-6 sm:p-8 shadow-2xl">
                    <div className="space-y-6">
                        <div className="text-left space-y-2">
                            <h2 className="text-xl font-semibold text-white">Welcome back</h2>
                            <p className="text-sm text-slate-400">Sign in to continue to your bingo boards.</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-200 px-4 py-3 rounded-xl text-sm flex items-start text-left">
                                <span className="mr-2">⚠️</span>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={signIn}
                            className="group relative w-full flex items-center justify-center gap-3 px-4 py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-all duration-200 shadow-lg hover:tracking-wide active:scale-[0.98]"
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                            <span>Continue with Google</span>
                            <ArrowRight className="w-4 h-4 text-slate-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t border-white/10" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-bg-card px-2 text-slate-500">New to SunSar?</span>
                            </div>
                        </div>

                        <Link
                            to="/help"
                            className="block w-full py-3 px-4 rounded-xl border border-white/10 text-slate-300 font-medium hover:bg-white/5 hover:text-white transition-colors text-sm"
                        >
                            Check out how it works
                        </Link>
                    </div>
                </div>

                <div className="mt-8 text-center">
                    <p className="text-xs text-slate-500">
                        © 2026 SunSar Bingo • <a href="#" className="hover:text-slate-400 underline decoration-slate-700">Privacy</a> • <a href="#" className="hover:text-slate-400 underline decoration-slate-700">Terms</a>
                    </p>
                </div>
            </div>
        </div>
    );
};
