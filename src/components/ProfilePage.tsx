
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Edit2, Check, Award, Grid, Camera } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';

export const ProfilePage: React.FC = () => {
    const { user, updateProfileName } = useAuth();
    const { settings } = useSettings();
    const isLightTheme = settings.theme === 'light';

    // Stats
    const [stats, setStats] = useState({
        totalBoards: 0,
        totalTiles: 0,
        totalBingos: 0,
        totalPhotos: 0
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(user?.displayName || '');

    useEffect(() => {
        if (!user) return;
        setEditName(user.displayName || '');

        const fetchStats = async () => {
            try {
                // Fetch all boards user owns or is member of
                const q = query(collection(db, 'boards'), where(`members.${user.uid}`, 'in', ['owner', 'editor', 'viewer']));
                const snap = await getDocs(q);

                let boards = 0;
                let tiles = 0;
                let photos = 0;

                snap.docs.forEach(d => {
                    const data = d.data();
                    boards++;

                    if (data.items) {
                        data.items.forEach((item: any) => {
                            if (item.isCompleted && !item.isFreeSpace) tiles++;
                            if (item.proofPhotos) photos += item.proofPhotos.length;
                        });
                    }
                });

                setStats({
                    totalBoards: boards,
                    totalTiles: tiles,
                    totalBingos: 0,
                    totalPhotos: photos
                });
            } catch (e) {
                console.error("Error fetching stats", e);
            }
        };
        fetchStats();
    }, [user]);

    const handleUpdateName = async () => {
        if (!user || !editName.trim()) return;
        try {
            await updateProfileName(editName.trim());
            setIsEditing(false);
        } catch (e) {
            console.error("Failed to update name", e);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 animate-in fade-in duration-500">
            {/* Header / Profile Card */}
            <div className={cn(
                "rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden border",
                isLightTheme
                    ? "bg-gradient-to-br from-indigo-100 to-slate-100 border-white shadow-indigo-100"
                    : "bg-gradient-to-br from-indigo-900/50 to-slate-900/50 border-white/10"
            )}>
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar */}
                    <div className="relative">
                        <div className={cn(
                            "w-32 h-32 rounded-full border-4 flex items-center justify-center overflow-hidden shadow-xl",
                            isLightTheme ? "bg-slate-200 border-white" : "bg-slate-800 border-white/10"
                        )}>
                            {user?.photoURL ? (
                                <img src={user.photoURL} alt="Profile" className="w-full h-full object-cover" />
                            ) : (
                                <User size={64} className="text-slate-500" />
                            )}
                        </div>
                        <button className="absolute bottom-0 right-0 p-2 bg-accent-primary rounded-full text-white shadow-lg hover:scale-105 transition-transform">
                            <Camera size={16} />
                        </button>
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <div className="mb-2">
                            <span className="text-sm font-semibold text-accent-secondary uppercase tracking-wider">Player Profile</span>
                        </div>

                        {isEditing ? (
                            <div className="flex items-center gap-3 justify-center md:justify-start">
                                <input
                                    value={editName}
                                    onChange={e => setEditName(e.target.value)}
                                    className={cn(
                                        "border rounded-lg px-4 py-2 text-2xl font-bold outline-none focus:border-accent-primary w-full max-w-xs",
                                        isLightTheme
                                            ? "bg-white/80 border-slate-300 text-slate-800"
                                            : "bg-black/30 border-white/20 text-white"
                                    )}
                                    autoFocus
                                />
                                <button onClick={handleUpdateName} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
                                    <Check size={24} />
                                </button>
                            </div>
                        ) : (
                            <h1 className={cn(
                                "text-4xl font-bold mb-2 flex items-center justify-center md:justify-start gap-3 group",
                                isLightTheme ? "text-slate-900" : "text-white"
                            )}>
                                {user?.displayName || 'Bingo Player'}
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className={cn(
                                        "opacity-0 group-hover:opacity-100 transition-opacity",
                                        isLightTheme ? "text-slate-400 hover:text-slate-700" : "text-slate-400 hover:text-white"
                                    )}
                                >
                                    <Edit2 size={20} />
                                </button>
                            </h1>
                        )}
                        <p className={cn(isLightTheme ? "text-slate-600" : "text-slate-400")}>{user?.email}</p>
                        <p className="text-slate-500 text-sm mt-1">Joined January 2026</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <h2 className={cn(
                "text-2xl font-bold mb-6 flex items-center gap-2",
                isLightTheme ? "text-slate-800" : "text-white"
            )}>
                <Award className="text-accent-gold" /> Lifetime Stats
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    label="Active Boards"
                    value={stats.totalBoards}
                    icon={<Grid size={24} className="text-violet-400" />}
                    delay={0}
                    isLightTheme={isLightTheme}
                />
                <StatCard
                    label="Tiles Completed"
                    value={stats.totalTiles}
                    icon={<Check size={24} className="text-emerald-400" />}
                    delay={0.1}
                    isLightTheme={isLightTheme}
                />
                <StatCard
                    label="Bingos Won"
                    value="--"
                    icon={<Award size={24} className="text-amber-400" />}
                    delay={0.2}
                    isLightTheme={isLightTheme}
                />
                <StatCard
                    label="Photos Added"
                    value={stats.totalPhotos}
                    icon={<Camera size={24} className="text-pink-400" />}
                    delay={0.3}
                    isLightTheme={isLightTheme}
                />
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon, delay, isLightTheme }: { label: string, value: string | number, icon: React.ReactNode, delay: number, isLightTheme: boolean }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className={cn(
            "p-6 rounded-2xl flex flex-col items-center justify-center text-center transition-colors border",
            isLightTheme
                ? "bg-white border-slate-200 hover:bg-slate-50 shadow-sm"
                : "bg-white/5 border-white/10 hover:bg-white/10"
        )}
    >
        <div className={cn(
            "mb-3 p-3 rounded-full",
            isLightTheme ? "bg-slate-100" : "bg-white/5"
        )}>
            {icon}
        </div>
        <div className={cn(
            "text-3xl font-bold mb-1",
            isLightTheme ? "text-slate-800" : "text-white"
        )}>{value}</div>
        <div className={cn(
            "text-sm font-medium uppercase tracking-wide",
            isLightTheme ? "text-slate-500" : "text-slate-400"
        )}>{label}</div>
    </motion.div>
);
