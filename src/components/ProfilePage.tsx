
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Edit2, Check, Award, Grid, Camera } from 'lucide-react';
import { motion } from 'framer-motion';

export const ProfilePage: React.FC = () => {
    const { user, updateProfileName } = useAuth();

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
            <div className="bg-gradient-to-br from-indigo-900/50 to-slate-900/50 border border-white/10 rounded-3xl p-8 mb-12 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-accent-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                    {/* Avatar */}
                    <div className="relative">
                        <div className="w-32 h-32 rounded-full bg-slate-800 border-4 border-white/10 flex items-center justify-center overflow-hidden shadow-xl">
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
                                    className="bg-black/30 border border-white/20 rounded-lg px-4 py-2 text-2xl font-bold text-white outline-none focus:border-accent-primary w-full max-w-xs"
                                    autoFocus
                                />
                                <button onClick={handleUpdateName} className="p-2 bg-green-500/20 text-green-400 rounded-lg hover:bg-green-500/30">
                                    <Check size={24} />
                                </button>
                            </div>
                        ) : (
                            <h1 className="text-4xl font-bold text-white mb-2 flex items-center justify-center md:justify-start gap-3 group">
                                {user?.displayName || 'Bingo Player'}
                                <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white">
                                    <Edit2 size={20} />
                                </button>
                            </h1>
                        )}
                        <p className="text-slate-400">{user?.email}</p>
                        <p className="text-slate-500 text-sm mt-1">Joined January 2026</p>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                <Award className="text-accent-gold" /> Lifetime Stats
            </h2>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <StatCard
                    label="Active Boards"
                    value={stats.totalBoards}
                    icon={<Grid size={24} className="text-violet-400" />}
                    delay={0}
                />
                <StatCard
                    label="Tiles Completed"
                    value={stats.totalTiles}
                    icon={<Check size={24} className="text-emerald-400" />}
                    delay={0.1}
                />
                <StatCard
                    label="Bingos Won"
                    value="--"
                    icon={<Award size={24} className="text-amber-400" />}
                    delay={0.2}
                />
                <StatCard
                    label="Photos Added"
                    value={stats.totalPhotos}
                    icon={<Camera size={24} className="text-pink-400" />}
                    delay={0.3}
                />
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon, delay }: { label: string, value: string | number, icon: React.ReactNode, delay: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay }}
        className="bg-white/5 border border-white/10 p-6 rounded-2xl flex flex-col items-center justify-center text-center hover:bg-white/10 transition-colors"
    >
        <div className="mb-3 p-3 bg-white/5 rounded-full">
            {icon}
        </div>
        <div className="text-3xl font-bold text-white mb-1">{value}</div>
        <div className="text-sm text-slate-400 font-medium uppercase tracking-wide">{label}</div>
    </motion.div>
);
