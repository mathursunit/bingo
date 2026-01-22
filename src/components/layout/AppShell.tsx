import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, LogOut, Menu, HelpCircle, User, Settings } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { cn } from '../../lib/utils';

interface AppShellProps {
    children: React.ReactNode;
}

export const AppShell: React.FC<AppShellProps> = ({ children }) => {
    const { logout, user } = useAuth();
    const { openSettings, settings, updateSettings } = useSettings();
    const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);
    const location = useLocation();

    // Close sidebar on route change (mobile)
    React.useEffect(() => {
        setIsSidebarOpen(false);
    }, [location.pathname]);

    const navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: LayoutGrid },
        { label: 'Profile', path: '/profile', icon: User },
        { label: 'Help & Guide', path: '/help', icon: HelpCircle },
    ];



    return (
        <div className="min-h-screen bg-transparent text-slate-200 flex">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-[var(--theme-bg-subtle)] border-r border-[var(--theme-border)] transform transition-transform duration-200 lg:translate-x-0 lg:static flex flex-col",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo Area */}
                <div className="h-16 flex items-center px-6 border-b border-[var(--theme-border)] shrink-0">
                    <img src="/logo.png" alt="SunSar Bingo" className="h-8 w-auto" />
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                    <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-3">Menu</div>
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-[var(--theme-accent-primary)]/10 text-[var(--theme-accent-primary)]"
                                    : "text-slate-400 hover:text-slate-100 hover:bg-white/5"
                            )}
                        >
                            <item.icon size={18} />
                            {item.label}
                        </NavLink>
                    ))}
                    <button
                        onClick={openSettings}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
                    >
                        <Settings size={18} />
                        Settings
                    </button>
                    <div className="px-3 py-3 border-t border-white/5 mt-2">
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Theme</div>
                        <div className="flex justify-between gap-1">
                            {[
                                { id: 'light', color: 'bg-slate-200 ring-1 ring-slate-400' },
                                { id: 'dawn', color: 'bg-orange-400' },
                                { id: 'midnight', color: 'bg-indigo-500' },
                                { id: 'cosmic', color: 'bg-violet-500' },
                                { id: 'lavender', color: 'bg-fuchsia-500' },
                                { id: 'forest', color: 'bg-emerald-500' },
                                { id: 'ocean', color: 'bg-cyan-500' },
                                { id: 'sunset', color: 'bg-rose-500' }
                            ].map((t) => (
                                <button
                                    key={t.id}
                                    onClick={() => updateSettings({ theme: t.id })}
                                    className={cn(
                                        "w-6 h-6 rounded-full transition-all duration-300 relative",
                                        t.color,
                                        settings.theme === t.id
                                            ? "ring-2 ring-white ring-offset-2 ring-offset-[var(--theme-bg-subtle)] scale-110 z-10"
                                            : "opacity-40 hover:opacity-100 hover:scale-105"
                                    )}
                                    title={t.id}
                                />
                            ))}
                        </div>
                    </div>
                </nav>

                {/* User Footer */}
                <div className="p-4 border-t border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] shrink-0">
                    <div className="flex items-center gap-3 mb-4 px-2">
                        {user?.photoURL ? (
                            <img src={user.photoURL} className="w-8 h-8 rounded-full bg-slate-800 object-cover" alt="User" />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center">
                                <User size={14} className="text-slate-400" />
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.displayName || 'User'}</p>
                            <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                        </div>
                    </div>
                    <button
                        onClick={logout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                    >
                        <LogOut size={16} />
                        Sign Out
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-transparent relative">
                {/* Mobile Header */}
                <header className="h-16 flex items-center justify-between px-4 lg:hidden border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] shrink-0">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400">
                        <Menu size={24} />
                    </button>
                    <img src="/logo.png" alt="SunSar Bingo" className="h-8 w-auto" />
                    <div className="w-8" /> {/* Spacer */}
                </header>

                {/* Scrollable Content */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-8">
                    <div className="max-w-7xl mx-auto h-full">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
};
