import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { LayoutGrid, LogOut, Menu, HelpCircle, User, Settings, Sun, Moon } from 'lucide-react';
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
        { label: 'Help & Guide', path: '/help', icon: HelpCircle },
    ];

    const toggleTheme = () => {
        const themes = ['dawn', 'midnight', 'forest', 'ocean', 'sunset'];
        const currentIndex = themes.indexOf(settings.theme);
        const nextIndex = (currentIndex + 1) % themes.length;
        updateSettings({ theme: themes[nextIndex] });
    };

    return (
        <div className="min-h-screen bg-[var(--theme-bg-base)] text-slate-200 flex">
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
                    <button
                        onClick={toggleTheme}
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-slate-100 hover:bg-white/5 transition-colors"
                    >
                        {settings.theme === 'dawn' ? <Sun size={18} /> : <Moon size={18} />}
                        Theme: <span className="capitalize">{settings.theme}</span>
                    </button>
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
            <main className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden bg-[var(--theme-bg-base)]">
                {/* Mobile Header */}
                <header className="h-16 flex items-center justify-between px-4 lg:hidden border-b border-[var(--theme-border)] bg-[var(--theme-bg-subtle)] shrink-0">
                    <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-slate-400">
                        <Menu size={24} />
                    </button>
                    <span className="font-semibold text-white">SunSar Bingo</span>
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
