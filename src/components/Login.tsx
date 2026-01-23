import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';


export const Login: React.FC = () => {
    const { signIn, error } = useAuth();
    const { settings } = useSettings();
    const isLightTheme = settings.theme === 'light';

    return (
        <div className={cn(
            "relative flex flex-col items-center justify-center min-h-screen p-4 text-center overflow-hidden font-sans",
            isLightTheme ? "text-slate-800" : "text-slate-100"
        )}>
            {/* Background - subtle overlay for depth, main background comes from DynamicBackground */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className={cn(
                    "absolute inset-0 bg-gradient-to-t via-transparent to-transparent",
                    isLightTheme ? "from-white/30" : "from-black/30"
                )} />
            </div>

            {/* Login Card */}
            <div className="relative z-10 w-full max-w-[400px] animate-fade-in-up">
                {/* Logo Section */}
                <div className="mb-8 flex flex-col items-center">
                    <div className={cn(
                        "relative w-20 h-20 mb-4 rounded-2xl flex items-center justify-center shadow-xl backdrop-blur-sm border",
                        isLightTheme
                            ? "bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-slate-200 shadow-blue-500/5"
                            : "bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border-white/10 shadow-indigo-500/10"
                    )}>
                        <img
                            src="/logo.png"
                            alt="Logo"
                            className="w-12 h-12 object-contain drop-shadow-lg"
                        />
                        <div className="absolute -top-2 -right-2">
                            <Sparkles className="w-6 h-6 text-accent-gold animate-bounce-gentle" />
                        </div>
                    </div>
                    <h1 className={cn(
                        "text-3xl font-bold tracking-tight mb-2",
                        isLightTheme ? "text-slate-900" : "text-white"
                    )}>SunSar Bingo</h1>
                    <p className={cn(
                        "text-sm font-medium",
                        isLightTheme ? "text-slate-500" : "text-slate-400"
                    )}>The social way to achieve your 2026 goals.</p>
                </div>

                {/* Card Content */}
                <div className={cn(
                    "backdrop-blur-md border rounded-2xl p-6 sm:p-8 shadow-2xl",
                    isLightTheme
                        ? "bg-white/80 border-slate-200 shadow-slate-200/50"
                        : "bg-slate-900/50 border-white/10 shadow-black/50"
                )}>
                    <div className="space-y-6">
                        <div className="text-left space-y-2">
                            <h2 className={cn(
                                "text-xl font-semibold",
                                isLightTheme ? "text-slate-900" : "text-white"
                            )}>Welcome back</h2>
                            <p className={cn(
                                "text-sm",
                                isLightTheme ? "text-slate-500" : "text-slate-400"
                            )}>Sign in to continue to your bingo boards.</p>
                        </div>

                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl text-sm flex items-start text-left">
                                <span className="mr-2">⚠️</span>
                                {error}
                            </div>
                        )}

                        <button
                            onClick={signIn}
                            className={cn(
                                "group relative w-full flex items-center justify-center gap-3 px-4 py-3 font-bold rounded-xl transition-all duration-200 shadow-lg hover:tracking-wide active:scale-[0.98]",
                                isLightTheme
                                    ? "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-300"
                                    : "bg-white text-slate-900 hover:bg-slate-200 shadow-white/5"
                            )}
                        >
                            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="G" className="w-5 h-5" />
                            <span>Continue with Google</span>
                            <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                        </button>

                        <div className="relative my-6">
                            <div className="absolute inset-0 flex items-center">
                                <span className={cn(
                                    "w-full border-t",
                                    isLightTheme ? "border-slate-200" : "border-white/10"
                                )} />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className={cn(
                                    "px-2",
                                    isLightTheme ? "bg-white/0 text-slate-400" : "bg-transparent text-slate-500"
                                )}>New to SunSar?</span>
                            </div>
                        </div>

                        <Link
                            to="/help"
                            className={cn(
                                "block w-full py-3 px-4 rounded-xl border font-medium transition-colors text-sm",
                                isLightTheme
                                    ? "border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                    : "border-white/10 text-slate-300 hover:bg-white/5 hover:text-white"
                            )}
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
