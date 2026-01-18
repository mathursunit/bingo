import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
    const { signIn, error } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <div className="background-animation" />

            <div className="glass-panel p-8 max-w-md w-full flex flex-col items-center gap-6 animate-fade-in">
                <div className="rounded-full bg-accent-primary/20 p-4 mb-2">
                    <Sparkles className="w-10 h-10 text-accent-gold animate-pulse" />
                </div>

                <h1 className="text-4xl font-heading font-bold text-gradient">
                    SunSar Bingo
                </h1>

                <p className="text-slate-300 font-light text-lg">
                    Ready for the 2026 adventures? <br />
                    Sign in to view the shared board.
                </p>

                {error && (
                    <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg text-sm border border-red-500/30">
                        {error}
                    </div>
                )}

                <button
                    onClick={signIn}
                    className="group relative px-8 py-3 bg-white text-bg-dark font-bold rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    <span className="flex items-center gap-2">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                        Sign in with Google
                    </span>
                </button>
            </div>

            <footer className="absolute bottom-4 text-slate-500 text-xs">
                Restricted Access • Sara & Sunit Only
            </footer>
        </div>
    );
};
