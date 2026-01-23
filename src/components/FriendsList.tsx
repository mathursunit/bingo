import React, { useState } from 'react';
import { useFriends } from '../hooks/useFriends';
import { useSettings } from '../contexts/SettingsContext';
import { useDialog } from '../contexts/DialogContext';
import { User, Check, X, Clock, Trash2, Mail } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

export const FriendsList: React.FC = () => {
    const { friends, incomingRequests, outgoingRequests, sendFriendRequest, acceptFriendRequest, rejectFriendRequest, removeFriend } = useFriends();
    const { settings } = useSettings();
    const isLightTheme = settings.theme === 'light';
    const dialog = useDialog();

    // Tabs: friends, requests, search
    const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'search'>('friends');
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Search Handler
    const handleSendRequest = async () => {
        if (!searchTerm.trim()) return;
        setIsSearching(true);
        try {
            const result = await sendFriendRequest(searchTerm.trim());
            if (result.success) {
                await dialog.alert(`Request sent to ${searchTerm}!`, { type: 'success' });
                setSearchTerm('');
            } else {
                await dialog.alert(result.message, { type: 'error' });
            }
        } catch (e) {
            await dialog.alert("Something went wrong. Check the email and try again.", { type: 'error' });
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className={cn(
            "rounded-3xl border shadow-xl overflow-hidden mt-8 max-w-4xl mx-auto",
            isLightTheme ? "bg-white border-slate-200" : "bg-slate-900 border-white/10"
        )}>
            {/* Header / Tabs */}
            <div className={cn(
                "p-4 border-b flex items-center justify-between",
                isLightTheme ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/5"
            )}>
                <div className="flex gap-2">
                    <button
                        onClick={() => setActiveTab('friends')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold transition-all relative",
                            activeTab === 'friends'
                                ? "bg-accent-primary text-white shadow-lg shadow-accent-primary/25"
                                : isLightTheme ? "text-slate-600 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        My Friends
                        {friends.length > 0 && <span className="ml-2 text-xs opacity-80 bg-black/20 px-1.5 rounded-full">{friends.length}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold transition-all relative",
                            activeTab === 'requests'
                                ? "bg-accent-secondary text-white shadow-lg shadow-accent-secondary/25"
                                : isLightTheme ? "text-slate-600 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Requests
                        {incomingRequests.length > 0 && (
                            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-slate-900">
                                {incomingRequests.length}
                            </span>
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('search')}
                        className={cn(
                            "px-4 py-2 rounded-xl text-sm font-bold transition-all",
                            activeTab === 'search'
                                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/25"
                                : isLightTheme ? "text-slate-600 hover:bg-slate-200" : "text-slate-400 hover:text-white hover:bg-white/5"
                        )}
                    >
                        Find People
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="p-6 min-h-[300px]">
                <AnimatePresence mode="wait">
                    {/* MY FRIENDS LIST */}
                    {activeTab === 'friends' && (
                        <motion.div
                            key="friends"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {friends.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className={cn("w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-4", isLightTheme ? "bg-slate-100" : "bg-white/5")}>
                                        <User size={32} className="text-slate-400" />
                                    </div>
                                    <h3 className={cn("text-lg font-bold mb-2", isLightTheme ? "text-slate-800" : "text-white")}>No friends yet</h3>
                                    <p className="text-slate-400 text-sm mb-6">Connect with people to share boards and compete!</p>
                                    <button
                                        onClick={() => setActiveTab('search')}
                                        className="px-6 py-2 bg-accent-primary text-white rounded-xl font-bold hover:shadow-lg transition-all"
                                    >
                                        Find Friends
                                    </button>
                                </div>
                            ) : (
                                <div className="grid sm:grid-cols-2 gap-4">
                                    {friends.map(friend => (
                                        <div key={friend.uid} className={cn(
                                            "flex items-center gap-4 p-4 rounded-xl border transition-all",
                                            isLightTheme ? "bg-white border-slate-200 hover:shadow-md" : "bg-white/5 border-white/5 hover:bg-white/10"
                                        )}>
                                            {friend.photoURL ? (
                                                <img src={friend.photoURL} alt={friend.displayName} className="w-12 h-12 rounded-full object-cover bg-slate-800" />
                                            ) : (
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-lg">
                                                    {friend.displayName.charAt(0)}
                                                </div>
                                            )}
                                            <div className="flex-1 min-w-0">
                                                <h4 className={cn("font-bold truncate", isLightTheme ? "text-slate-900" : "text-white")}>{friend.displayName}</h4>
                                                <p className="text-xs text-slate-400 truncate">{friend.email}</p>
                                            </div>
                                            <button
                                                onClick={async () => {
                                                    if (await dialog.confirm("Are you sure you want to remove this friend?", { type: 'error', confirmText: 'Remove' })) {
                                                        removeFriend(friend.uid);
                                                    }
                                                }}
                                                className={cn(
                                                    "p-2 rounded-lg transition-colors",
                                                    isLightTheme ? "text-slate-400 hover:text-red-500 hover:bg-red-50" : "text-slate-600 hover:text-red-400 hover:bg-red-500/10"
                                                )}
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    )}

                    {/* REQUESTS LIST */}
                    {activeTab === 'requests' && (
                        <motion.div
                            key="requests"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                        >
                            {/* Incoming Section */}
                            <div className="mb-8">
                                <h3 className={cn("text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2", isLightTheme ? "text-slate-500" : "text-slate-400")}>
                                    <Mail size={14} /> Incoming Requests
                                </h3>
                                {incomingRequests.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No pending requests.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {incomingRequests.map(req => (
                                            <div key={req.id} className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border",
                                                isLightTheme ? "bg-white border-slate-200" : "bg-white/5 border-white/5"
                                            )}>
                                                {req.fromUserPhoto ? (
                                                    <img src={req.fromUserPhoto} className="w-10 h-10 rounded-full object-cover" />
                                                ) : (
                                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold">
                                                        {req.fromUserName.charAt(0)}
                                                    </div>
                                                )}
                                                <div className="flex-1">
                                                    <div className={cn("font-bold", isLightTheme ? "text-slate-900" : "text-white")}>{req.fromUserName}</div>
                                                    <div className="text-xs text-slate-400">Sent you a friend request</div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => acceptFriendRequest(req)}
                                                        className="p-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
                                                        title="Accept"
                                                    >
                                                        <Check size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => rejectFriendRequest(req.id)}
                                                        className={cn("p-2 rounded-lg transition-colors border", isLightTheme ? "border-slate-300 text-slate-500 hover:bg-slate-100" : "border-white/10 text-slate-400 hover:bg-white/10")}
                                                        title="Decline"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Outgoing Section */}
                            <div>
                                <h3 className={cn("text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2", isLightTheme ? "text-slate-500" : "text-slate-400")}>
                                    <Clock size={14} /> Sent Requests
                                </h3>
                                {outgoingRequests.length === 0 ? (
                                    <p className="text-sm text-slate-500 italic">No sent requests.</p>
                                ) : (
                                    <div className="space-y-3">
                                        {outgoingRequests.map(req => (
                                            <div key={req.id} className={cn(
                                                "flex items-center justify-between p-3 rounded-xl border opacity-70",
                                                isLightTheme ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/5"
                                            )}>
                                                <div className="flex items-center gap-3">
                                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold", isLightTheme ? "bg-slate-200 text-slate-600" : "bg-white/10 text-white")}>
                                                        {req.toUserEmail.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className={cn("text-sm font-bold", isLightTheme ? "text-slate-900" : "text-white")}>{req.toUserEmail}</div>
                                                        <div className="text-[10px] text-slate-400">Pending...</div>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => rejectFriendRequest(req.id)} // Reuse reject to cancel
                                                    className="text-xs text-red-400 hover:underline"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}

                    {/* SEARCH TAB */}
                    {activeTab === 'search' && (
                        <motion.div
                            key="search"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="max-w-md mx-auto py-8"
                        >
                            <div className="text-center mb-6">
                                <h3 className={cn("text-xl font-bold mb-2", isLightTheme ? "text-slate-900" : "text-white")}>Add a Friend</h3>
                                <p className="text-slate-400 text-sm">Enter their email address to send a request.</p>
                            </div>

                            <div className="relative mb-4">
                                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-500" />
                                </div>
                                <input
                                    type="email"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="friend@example.com"
                                    className={cn(
                                        "w-full pl-10 pr-4 py-3 rounded-xl outline-none border transition-all",
                                        isLightTheme
                                            ? "bg-slate-50 border-slate-200 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-slate-900 placeholder:text-slate-400"
                                            : "bg-black/20 border-white/10 focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20 text-white placeholder:text-slate-500"
                                    )}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSendRequest()}
                                />
                            </div>

                            <button
                                onClick={handleSendRequest}
                                disabled={!searchTerm || isSearching}
                                className="w-full py-3 bg-emerald-500 text-white font-bold rounded-xl hover:bg-emerald-600 hover:shadow-lg hover:shadow-emerald-500/25 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
                            >
                                {isSearching ? 'Sending...' : 'Send Request'}
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};
