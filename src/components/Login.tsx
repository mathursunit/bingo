import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Sparkles } from 'lucide-react';

export const Login: React.FC = () => {
    const { signIn, error } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 text-center">
            <div className="background-animation" />

            <div className="glass-panel p-8 max-w-md w-full flex flex-col items-center gap-6 animate-fade-in">
                <div className="flex flex-col items-center gap-2 mb-2">
                    <img
                        src="/logo.png"
                        alt="SunSar Bingo"
                        className="h-24 w-auto object-contain drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]"
                    />
                    <div className="rounded-full bg-accent-primary/20 p-2 hidden">
                        <Sparkles className="w-6 h-6 text-accent-gold animate-pulse" />
                    </div>
                </div>

                <h1 className="text-4xl font-heading font-bold text-gradient sr-only">
                    SunSar Bingo
                </h1>

                <p className="text-slate-300 font-light text-lg">
                    Track your goals, share with friends,<br />
                    and make 2026 your best year yet.
                </p>

                {error && (
                    <div className="bg-red-500/20 text-red-200 px-4 py-2 rounded-lg text-sm border border-red-500/30">
                        {error}
                    </div>
                )}

                <button
                    onClick={signIn}
                    className="group relative px-6 py-3 bg-white text-bg-dark font-bold rounded-full transition-all hover:scale-105 hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]"
                >
                    <span className="flex items-center gap-2">
                        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                        Sign in / Sign up with Google
                    </span>
                </button>
            </div>

            <footer className="absolute bottom-4 text-slate-500 text-xs">
                © 2026 SunSar Bingo • Free & Open Source
            </footer>
        </div>
    );
};
