import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useBingo } from '../hooks/useBingo';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { useSettings } from '../contexts/SettingsContext';
import { cn } from '../lib/utils';
import { Edit2, Check, Award, LogOut, Shuffle, Camera, X, ChevronLeft, ChevronRight, Plus, BookOpen, Printer, LayoutGrid, Share2, Clock, Trash2, Settings } from 'lucide-react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import type { BingoItem } from '../types';
import { MemoriesAlbum } from './MemoriesAlbum';

import { useParams, useNavigate } from 'react-router-dom';

export const BingoBoard: React.FC = () => {
    const { boardId, yearId } = useParams();
    const navigate = useNavigate();
    // For legacy boards, yearId is set and we pass undefined to useBingo (which uses 'years' collection)
    // For new boards, boardId is set and we pass it to useBingo (which uses 'boards' collection)
    const effectiveBoardId = yearId ? undefined : boardId;
    const { items, members, loading, toggleItem, hasWon, bingoCount, isLocked, unlockBoard, jumbleAndLock, saveBoard, completeWithPhoto, addPhotoToTile, decrementProgress, inviteUser, removeMember, title } = useBingo(effectiveBoardId);
    const { logout, user } = useAuth();
    const dialog = useDialog();
    const { openSettings } = useSettings();
    const [editMode, setEditMode] = useState(false);

    // Draft State
    const [draftItems, setDraftItems] = useState<BingoItem[]>([]);

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [memberDetails, setMemberDetails] = useState<{ id: string, name: string, email: string, role: string }[]>([]);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [editFormText, setEditFormText] = useState("");
    const [editFormStyle, setEditFormStyle] = useState<{ color?: string; bold?: boolean; italic?: boolean; fontSize?: 'sm' | 'base' | 'lg' | 'xl' }>({});
    const [editFormTargetCount, setEditFormTargetCount] = useState<number>(1);
    const [editFormDueDate, setEditFormDueDate] = useState<string>("");

    // Walkthrough State
    const [showWalkthrough, setShowWalkthrough] = useState(false);
    const [walkthroughStep, setWalkthroughStep] = useState(0);

    // Undo State
    const [undoState, setUndoState] = useState<{ index: number, wasCompleted: boolean } | null>(null);
    const [showUndoToast, setShowUndoToast] = useState(false);

    useEffect(() => {
        const hasSeenWalkthrough = localStorage.getItem('hasSeenWalkthrough');
        if (!hasSeenWalkthrough && !loading && items.length > 0) {
            setShowWalkthrough(true);
        }
    }, [loading, items]);

    // Fetch member details when share modal opens
    useEffect(() => {
        const fetchMembers = async () => {
            if (isShareModalOpen && members) {
                const details = [];
                for (const [uid, role] of Object.entries(members)) {
                    if (role === 'owner') continue; // Skip owner
                    try {
                        const userDoc = await getDoc(doc(db, 'users', uid));
                        if (userDoc.exists()) {
                            const data = userDoc.data();
                            details.push({
                                id: uid,
                                name: data.displayName || 'Unknown',
                                email: data.email || 'No email',
                                role
                            });
                        }
                    } catch (e) {
                        console.error("Error fetching user:", e);
                    }
                }
                setMemberDetails(details);
            }
        };
        fetchMembers();
    }, [isShareModalOpen, members]);

    const handleRemoveMember = async (uid: string, name: string) => {
        const confirmed = await dialog.confirm(
            `Are you sure you want to remove ${name} from this board?`,
            { title: 'Remove Member', type: 'error', confirmText: 'Remove' }
        );

        if (confirmed) {
            const result = await removeMember(uid);
            if (result.success) {
                setMemberDetails(prev => prev.filter(m => m.id !== uid));
                await dialog.alert(`${name} has been removed.`, { type: 'success' });
            } else {
                await dialog.alert('Failed to remove member.', { type: 'error' });
            }
        }
    };

    const handleInviteClick = async () => {
        const shareResult = await dialog.sharePrompt(
            "Enter their email address to invite them to this board.",
            { title: 'Invite User' }
        );

        if (shareResult) {
            const result = await inviteUser(shareResult.email, shareResult.role);
            if (result.type === 'success') {
                await dialog.alert(result.message, { title: 'Success!', type: 'success' });
                // Members list will update automatically via useBingo effect -> setMembers -> fetchMembers
            } else if (result.type === 'not_found') {
                const sendEmail = await dialog.confirm(
                    `"${shareResult.email}" hasn't signed up yet.\n\nWould you like to send them an email invitation to join SunSar Bingo?`,
                    { title: 'User Not Found', confirmText: 'Send Invite Email', type: 'info' }
                );
                if (sendEmail) {
                    try {
                        const { sendInviteEmail, openMailtoFallback } = await import('../lib/emailService');
                        const emailResult = await sendInviteEmail({
                            recipientEmail: shareResult.email,
                            senderName: user?.displayName || user?.email || 'A friend',
                        });

                        if (emailResult.success) {
                            await dialog.alert(
                                `Invitation sent to ${shareResult.email}! They'll receive an email with instructions to join.`,
                                { title: 'Invitation Sent!', type: 'success' }
                            );
                        } else {
                            openMailtoFallback(shareResult.email, user?.displayName || 'A friend');
                            await dialog.alert(
                                "Your email app should open with a pre-filled invitation. Send it to invite your friend!",
                                { title: 'Email Ready', type: 'info' }
                            );
                        }
                    } catch (err) {
                        const subject = encodeURIComponent("Join me on SunSar Bingo!");
                        const body = encodeURIComponent(`Hey! Come join me on SunSar Bingo to track our 2026 goals together.\n\nSign up here: ${window.location.origin}`);
                        window.open(`mailto:${shareResult.email}?subject=${subject}&body=${body}`);
                        await dialog.alert(
                            "Your email app should open with a pre-filled invitation. Send it to invite your friend!",
                            { title: 'Email Ready', type: 'info' }
                        );
                    }
                }
            } else {
                await dialog.alert(result.message, { title: 'Error', type: 'error' });
            }
        }
    };

    const handleNextStep = () => {
        if (walkthroughStep < 2) {
            setWalkthroughStep(prev => prev + 1);
        } else {
            setShowWalkthrough(false);
            localStorage.setItem('hasSeenWalkthrough', 'true');
        }
    };

    // ... (rest of state items: completion modal, photo viewer, memories, etc)



    // ... (render)
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
    const [completingItemIndex, setCompletingItemIndex] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Photo Viewer State
    const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
    const [viewingItem, setViewingItem] = useState<BingoItem | null>(null);
    const [viewingItemIndex, setViewingItemIndex] = useState<number | null>(null);
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const [isAddingPhoto, setIsAddingPhoto] = useState(false);
    const addPhotoInputRef = useRef<HTMLInputElement>(null);

    // Memories Album State
    const [isMemoriesOpen, setIsMemoriesOpen] = useState(false);

    const [celebrationDismissed, setCelebrationDismissed] = useState(() => {
        return localStorage.getItem('celebrationDismissed') === 'true';
    });

    // Lock state logic
    const [logoTapCount, setLogoTapCount] = useState(0);

    // Backdoor unlock logic
    useEffect(() => {
        if (logoTapCount === 5) {
            unlockBoard();
            setLogoTapCount(0);
            confetti({
                particleCount: 100,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#fbbf24', '#ec4899', '#ffffff']
            });
        }

        let timer: any;
        if (logoTapCount > 0) {
            timer = setTimeout(() => setLogoTapCount(0), 1000);
        }
        return () => clearTimeout(timer);
    }, [logoTapCount, unlockBoard]);

    const handleLogoTap = () => {
        if (!isLocked) return;
        setLogoTapCount(prev => prev + 1);
    };

    const handleFinalize = async () => {
        const confirmed = await dialog.confirm(
            "This will randomly shuffle all tiles (except the center) and LOCK the board.\n\n(Tap the logo 5 times to Undo/Unlock).",
            { title: 'Jumble & Finalize Board?', confirmText: 'Finalize', type: 'warning' }
        );
        if (confirmed) {
            jumbleAndLock();
            setEditMode(false);
        }
    };

    const handleDismiss = () => {
        setCelebrationDismissed(true);
        localStorage.setItem('celebrationDismissed', 'true');
    };

    React.useEffect(() => {
        if (!loading && !hasWon) {
            setCelebrationDismissed(false);
            localStorage.removeItem('celebrationDismissed');
        }
    }, [hasWon, loading]);

    // Open Modal
    const openEditModal = (index: number) => {
        const currentList = editMode ? draftItems : items;
        setEditingItemIndex(index);
        setEditFormText(currentList[index].text);
        setEditFormStyle(currentList[index].style || { color: '#ffffff', fontSize: 'base', bold: false, italic: false });
        setEditFormTargetCount(currentList[index].targetCount || 1);

        // Handle due date
        if (currentList[index].dueDate) {
            const val = currentList[index].dueDate as any;
            const date = typeof val.toDate === 'function' ? val.toDate() : new Date(val);
            // Format to YYYY-MM-DD
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            setEditFormDueDate(`${year}-${month}-${day}`);
        } else {
            setEditFormDueDate("");
        }

        setIsEditModalOpen(true);
    };

    // Modal OK Action (Update Draft Only)
    const handleSaveEdit = () => {
        if (editingItemIndex === null) return;

        let newDueDate: any = undefined;
        if (editFormDueDate) {
            newDueDate = new Date(editFormDueDate + "T12:00:00");
        }

        const newDrafts = [...draftItems];
        newDrafts[editingItemIndex] = {
            ...newDrafts[editingItemIndex],
            text: editFormText,
            style: editFormStyle,
            targetCount: editFormTargetCount,
            dueDate: newDueDate
        };
        setDraftItems(newDrafts);

        setIsEditModalOpen(false);
        setEditingItemIndex(null);
    };

    if (loading) return (
        <div className="flex h-screen items-center justify-center text-accent-primary animate-pulse">
            <div className="text-center">
                <div className="w-12 h-12 border-4 border-accent-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p>Loading Board...</p>
            </div>
        </div>
    );

    const completedCount = items.filter(i => i.isCompleted).length;
    const progress = (completedCount / 25) * 100;

    const formatDate = (timestamp: any) => {
        if (!timestamp) return '-';
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Determine which items to display
    const displayItems = editMode ? draftItems : items;

    const handleQuickComplete = (index: number) => {
        // Capture state before toggle for Undo
        const item = displayItems[index];
        setUndoState({ index, wasCompleted: item.isCompleted });

        toggleItem(index);

        // Show Undo Toast
        setShowUndoToast(true);
        setTimeout(() => setShowUndoToast(false), 3000);
    };

    return (
        <>
            <div className="min-h-screen flex flex-col items-center p-3 pb-24 relative overflow-x-hidden no-print">
                <div className="background-animation" />

                {/* Header */}
                {/* Header Section */}
                <div className="w-full max-w-[500px] flex flex-col gap-6 mb-8 pt-2 px-2">
                    <header className="w-full flex justify-between items-center">
                        <div className="flex items-center">
                            <motion.img
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                src="/logo.png"
                                alt="SunSar Bingo"
                                className="h-10 sm:h-12 w-auto object-contain cursor-pointer active:scale-95 transition-transform"
                                onClick={handleLogoTap}
                            />
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                                onClick={() => setIsMemoriesOpen(true)}
                                className="text-slate-400 hover:text-accent-gold transition-colors p-2 hover:bg-white/5 rounded-full"
                                title="View Memories"
                            >
                                <BookOpen size={18} />
                            </button>
                            <button
                                onClick={() => navigate('/dashboard')}
                                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                                title="Dashboard"
                            >
                                <LayoutGrid size={18} />
                            </button>
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="text-slate-400 hover:text-accent-primary transition-colors p-2 hover:bg-white/5 rounded-full"
                                title="Share Board"
                            >
                                <Share2 size={18} />
                            </button>
                            <button
                                onClick={openSettings}
                                className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
                                title="Settings"
                            >
                                <Settings size={18} />
                            </button>
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="relative cursor-pointer group px-1"
                            >
                                <img
                                    src={user?.photoURL || ''}
                                    alt="User"
                                    className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border-2 border-glass-border group-hover:border-accent-primary transition-colors object-cover shrink-0"
                                />
                            </motion.div>
                            <button
                                onClick={logout}
                                className="text-slate-400 hover:text-red-400 transition-colors p-2 hover:bg-white/5 rounded-full"
                                title="Logout"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    </header>

                    {title && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center"
                        >
                            <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-accent-primary via-accent-secondary to-accent-primary bg-clip-text text-transparent inline-block pb-1">
                                {title}
                            </h1>
                        </motion.div>
                    )}
                </div>

                {/* The Grid */}
                <div className="w-full max-w-[500px] aspect-square relative mb-6">
                    <div className="grid grid-cols-5 grid-rows-5 gap-1.5 sm:gap-2 w-full h-full">
                        {displayItems.map((item, index) => (
                            <motion.div
                                key={item.id}
                                title={item.isCompleted ? `Completed by ${item.completedBy || 'Someone'} on ${formatDate(item.completedAt)}` : undefined}
                                layout
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: index * 0.02 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    if (editMode) return;
                                    // if (isLocked) return; // Allow marking even when locked
                                    if (item.isFreeSpace) return;

                                    if (item.isCompleted) {
                                        // View photos if exist, otherwise just toggle off
                                        if (item.proofPhotos && item.proofPhotos.length > 0) {
                                            setViewingItem(item);
                                            setViewingItemIndex(index);
                                            setCurrentPhotoIndex(0);
                                            setIsPhotoViewerOpen(true);
                                        } else {
                                            handleQuickComplete(index);
                                        }
                                    } else {
                                        // Open completion modal for incomplete items
                                        setCompletingItemIndex(index);
                                        setIsCompletionModalOpen(true);
                                    }
                                }}
                                className={cn(
                                    "relative rounded-lg flex items-center justify-center p-1 cursor-pointer select-none border backdrop-blur-sm overflow-hidden",
                                    "text-[11px] sm:text-sm font-medium leading-tight select-none",
                                    item.isCompleted ? "text-white scale-110 font-semibold" : "text-slate-300",
                                    "bg-bg-card/90 border-white/20 shadow-md hover:border-white/40 hover:bg-bg-card/95 transition-all duration-200",
                                    item.isCompleted && !item.isFreeSpace && "bg-gradient-to-br from-accent-primary/30 to-accent-secondary/30 border-accent-primary/50 shadow-[0_0_15px_rgba(139,92,246,0.15)]",
                                    item.isFreeSpace && "bg-gradient-to-br from-accent-gold/20 to-accent-secondary/20 border-accent-gold/50",
                                    editMode && "border-dashed border-slate-500"
                                    // isLocked && !editMode && "cursor-default" // Always allow cursor pointer for playability
                                )
                                }>
                                <div className="w-full h-full flex items-center justify-center text-center relative z-10">
                                    <div
                                        className="w-full h-full flex items-center justify-center p-1"
                                        onClick={(e) => {
                                            if (editMode) {
                                                e.stopPropagation();
                                                openEditModal(index);
                                            }
                                        }}
                                    >
                                        <span className={cn(
                                            "leading-tight break-words w-full",
                                            item.isFreeSpace ? "text-lg font-bold text-accent-gold" : "font-semibold line-clamp-3 sm:line-clamp-4",
                                            item.isCompleted && !item.isFreeSpace && "text-white"
                                        )}
                                            style={!item.isFreeSpace && !item.isCompleted ? {
                                                color: item.style?.color || '#cbd5e1',
                                                fontWeight: item.style?.bold ? 'bold' : '600',
                                                fontStyle: item.style?.italic ? 'italic' : 'normal',
                                                fontSize: item.style?.fontSize === 'sm' ? '12px' : item.style?.fontSize === 'lg' ? '18px' : item.style?.fontSize === 'xl' ? '22px' : undefined
                                            } : undefined}
                                        >
                                            {item.text}
                                        </span>
                                    </div>
                                </div>

                                {/* Due Date Indicator */}
                                {item.dueDate && !item.isCompleted && !isLocked && (
                                    <div className={cn(
                                        "flex items-center gap-1 mt-1 text-[10px] font-medium absolute bottom-1 right-1 px-1 rounded bg-black/40 backdrop-blur-sm",
                                        ((item.dueDate as any).toDate ? (item.dueDate as any).toDate() : new Date(item.dueDate as any)) < new Date() ? "text-red-400" : "text-slate-400"
                                    )}>
                                        <Clock size={8} />
                                        <span>{((item.dueDate as any).toDate ? (item.dueDate as any).toDate() : new Date(item.dueDate as any)).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                    </div>
                                )}


                                {
                                    item.isCompleted && !item.isFreeSpace && !editMode && (
                                        <>
                                            <motion.div
                                                initial={{ scale: 0 }}
                                                animate={{ scale: 1 }}
                                                className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20"
                                            >
                                                <Check className="w-12 h-12 text-white" />
                                            </motion.div>
                                            <div className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-accent-primary rounded-full shadow-[0_0_5px_rgba(139,92,246,0.8)]"></div>
                                            {item.proofPhotos && item.proofPhotos.length > 0 && (
                                                <div className="absolute bottom-0.5 left-0.5 p-0.5 bg-accent-gold/80 rounded-sm flex items-center gap-0.5">
                                                    <Camera className="w-2.5 h-2.5 text-black" />
                                                    {item.proofPhotos.length > 1 && (
                                                        <span className="text-[8px] font-bold text-black">{item.proofPhotos.length}</span>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    )
                                }

                                {/* Progress indicator for multi-count tiles (e.g., "1/2") */}
                                {!item.isFreeSpace && !editMode && (item.targetCount || 1) > 1 && (
                                    <div className={cn(
                                        "absolute bottom-0.5 right-0.5 px-1 py-0.5 rounded text-[8px] font-bold",
                                        item.isCompleted
                                            ? "bg-green-500/80 text-white"
                                            : (item.currentCount || 0) > 0
                                                ? "bg-amber-500/80 text-white" // Partial progress
                                                : "bg-slate-600/80 text-slate-300"
                                    )}>
                                        {item.currentCount || 0}/{item.targetCount}
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Controls Bar */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-[500px] glass-panel p-4 flex flex-col gap-4"
                >
                    <div className="w-full">
                        <div className="flex justify-between text-xs text-slate-300 mb-1.5 px-1">
                            <span className="font-semibold">Progress</span>
                            <div className="flex gap-3">
                                <span className="font-mono text-accent-gold font-bold">{bingoCount}/12 Bingos</span>
                                <span className="font-mono text-accent-primary">{Math.round(progress)}%</span>
                            </div>
                        </div>
                        <div className="h-3 bg-bg-dark/50 rounded-full overflow-hidden border border-white/5">
                            <motion.div
                                className="h-full bg-gradient-to-r from-accent-primary to-accent-secondary relative"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 1, ease: "easeOut" }}
                            >
                                <div className="absolute top-0 right-0 bottom-0 w-[1px] bg-white/50 shadow-[0_0_10px_white]"></div>
                            </motion.div>
                        </div>
                    </div>

                    <div className="flex justify-center gap-2">
                        {editMode ? (
                            <>
                                <div className="flex gap-2 w-full">
                                    <button
                                        onClick={() => setEditMode(false)}
                                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={() => {
                                            saveBoard(draftItems);
                                            setEditMode(false);
                                        }}
                                        className="flex-1 py-2.5 px-4 rounded-xl text-sm font-semibold bg-green-500/20 text-green-200 border border-green-500/50 hover:bg-green-500/30 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Check size={16} />
                                        Save Changes
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex gap-2 justify-center w-full flex-wrap">
                                {!isLocked && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setDraftItems([...items]); // Init drafts
                                                setEditMode(true);
                                            }}
                                            className="flex-1 py-2 px-4 text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 min-w-[100px]"
                                        >
                                            <Edit2 size={12} />
                                            Edit Board
                                        </button>
                                        <button
                                            onClick={handleFinalize}
                                            className="flex-1 py-2 px-4 text-xs font-medium text-red-400 hover:text-red-300 transition-colors flex items-center justify-center gap-2 min-w-[100px]"
                                        >
                                            <Shuffle size={12} />
                                            Jumble & Finalize
                                        </button>
                                    </>
                                )}
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 py-2 px-4 text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 min-w-[100px]"
                                >
                                    <Printer size={12} />
                                    Print Status
                                </button>
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Celebration Modal */}
                <AnimatePresence>
                    {hasWon && !celebrationDismissed && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
                        >
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="glass-panel p-8 text-center max-w-sm w-full relative overflow-hidden border-accent-gold/30"
                            >
                                <div className="absolute inset-0 bg-gradient-to-t from-accent-gold/10 to-transparent pointer-events-none"></div>

                                <motion.div
                                    animate={{ rotate: [0, 10, -10, 0] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="inline-block"
                                >
                                    <Award className="w-20 h-20 text-accent-gold mx-auto mb-4 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]" />
                                </motion.div>

                                <h2 className="text-4xl font-heading font-bold text-transparent bg-clip-text bg-gradient-to-r from-accent-gold via-white to-accent-secondary mb-2">BINGO!</h2>
                                <p className="text-slate-300 mb-8 leading-relaxed">2026 is off to an amazing start!</p>

                                <button
                                    onClick={handleDismiss}
                                    className="w-full py-3 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl font-bold text-white shadow-lg hover:shadow-[0_0_20px_rgba(139,92,246,0.4)] transition-all transform hover:scale-105"
                                >
                                    Keep Playing
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Edit Modal */}
                <AnimatePresence>
                    {isEditModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                            onClick={() => setIsEditModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-bg-dark border border-accent-gold/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl relative overflow-hidden"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-xl font-bold text-white mb-4">Edit Tile</h3>

                                {/* Preview */}
                                <div className="mb-4 flex justify-center">
                                    <div className="w-32 h-32 rounded-lg bg-bg-card/80 border border-white/10 flex items-center justify-center p-2 text-center overflow-hidden">
                                        <span className={cn("font-hand font-semibold leading-tight break-words")}
                                            style={{
                                                color: editFormStyle.color || '#ffffff',
                                                fontWeight: editFormStyle.bold ? 'bold' : '600',
                                                fontStyle: editFormStyle.italic ? 'italic' : 'normal',
                                                fontSize: editFormStyle.fontSize === 'sm' ? '12px' : editFormStyle.fontSize === 'lg' ? '18px' : editFormStyle.fontSize === 'xl' ? '22px' : '16px'
                                            }}
                                        >
                                            {editFormText || "Preview Text"}
                                        </span>
                                    </div>
                                </div>

                                {/* Text Input */}
                                <div className="mb-4">
                                    <label className="text-xs text-slate-400 mb-1 block">Text Content</label>
                                    <textarea
                                        className="w-full bg-black/20 text-white rounded-lg p-3 border border-white/10 focus:border-accent-primary outline-none min-h-[80px]"
                                        value={editFormText}
                                        onChange={(e) => setEditFormText(e.target.value)}
                                        placeholder="Enter bingo task..."
                                    />
                                </div>

                                {/* Styling Controls */}
                                <div className="mb-6 space-y-3">
                                    <div>
                                        <label className="text-xs text-slate-400 mb-1 block">Color</label>
                                        <div className="flex gap-2 flex-wrap">
                                            {['#ffffff', '#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#ec4899', '#a855f7'].map(color => (
                                                <button
                                                    key={color}
                                                    className={cn("w-6 h-6 rounded-full border border-white/10 transition-transform active:scale-90", editFormStyle.color === color && "ring-2 ring-white scale-110")}
                                                    style={{ backgroundColor: color }}
                                                    onClick={() => setEditFormStyle(prev => ({ ...prev, color }))}
                                                />
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1">
                                            <label className="text-xs text-slate-400 mb-1 block">Size</label>
                                            <div className="flex bg-black/20 rounded-lg p-1">
                                                {['sm', 'base', 'lg', 'xl'].map((size) => (
                                                    <button
                                                        key={size}
                                                        onClick={() => setEditFormStyle(prev => ({ ...prev, fontSize: size as any }))}
                                                        className={cn(
                                                            "flex-1 py-1 text-[10px] font-bold rounded transition-colors uppercase",
                                                            (editFormStyle.fontSize || 'base') === size ? "bg-accent-primary text-white" : "text-slate-400 hover:text-white"
                                                        )}
                                                    >
                                                        {size === 'base' ? 'M' : size}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-xs text-slate-400 mb-1 block">Style</label>
                                            <div className="flex gap-1 bg-black/20 rounded-lg p-1">
                                                <button
                                                    onClick={() => setEditFormStyle(prev => ({ ...prev, bold: !prev.bold }))}
                                                    className={cn("w-8 h-full rounded flex items-center justify-center font-bold transition-colors", editFormStyle.bold ? "bg-white text-black" : "text-slate-400 hover:text-white")}
                                                >
                                                    B
                                                </button>
                                                <button
                                                    onClick={() => setEditFormStyle(prev => ({ ...prev, italic: !prev.italic }))}
                                                    className={cn("w-8 h-full rounded flex items-center justify-center italic transition-colors font-serif", editFormStyle.italic ? "bg-white text-black" : "text-slate-400 hover:text-white")}
                                                >
                                                    I
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mb-6 pt-4 border-t border-white/10">
                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-300">Target Count</label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="100"
                                            value={editFormTargetCount}
                                            onChange={(e) => setEditFormTargetCount(parseInt(e.target.value) || 1)}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-accent-primary/50 transition-colors"
                                        />
                                        <p className="text-xs text-slate-500">How many times to complete this?</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-sm font-semibold text-slate-300">Due Date (Optional)</label>
                                        <input
                                            type="date"
                                            value={editFormDueDate}
                                            onChange={(e) => setEditFormDueDate(e.target.value)}
                                            className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-accent-primary/50 transition-colors [color-scheme:dark]"
                                        />
                                    </div>
                                </div>



                                {/* Actions */}
                                <div className="flex gap-3">
                                    <button
                                        onClick={() => setIsEditModalOpen(false)}
                                        className="flex-1 py-3 rounded-xl font-semibold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        className="flex-1 py-3 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg hover:shadow-violet-500/25 active:scale-95 transition-all"
                                    >
                                        Ok
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Completion Confirmation Modal */}
                <AnimatePresence>
                    {isCompletionModalOpen && completingItemIndex !== null && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                            onClick={() => { setIsCompletionModalOpen(false); setCompletingItemIndex(null); }}
                        >
                            <motion.div
                                initial={{ scale: 0.9, y: 20 }}
                                animate={{ scale: 1, y: 0 }}
                                exit={{ scale: 0.9, y: 20 }}
                                className="bg-bg-dark border border-accent-primary/30 p-6 rounded-2xl w-full max-w-sm shadow-2xl"
                                onClick={e => e.stopPropagation()}
                            >
                                {(() => {
                                    const item = displayItems[completingItemIndex];
                                    const targetCount = item?.targetCount || 1;
                                    const currentCount = item?.currentCount || 0;
                                    const isMultiCount = targetCount > 1;
                                    const hasProgress = currentCount > 0;

                                    return (
                                        <>
                                            <h3 className="text-xl font-bold text-white mb-2 text-center">
                                                {hasProgress ? 'Add Progress' : 'Complete Task'}
                                            </h3>
                                            <p className="text-slate-300 text-sm text-center mb-2 line-clamp-2">
                                                &ldquo;{item?.text}&rdquo;
                                            </p>

                                            {/* Progress indicator for multi-count tiles */}
                                            {isMultiCount && (
                                                <div className="text-center mb-4">
                                                    <span className={cn(
                                                        "inline-block px-3 py-1 rounded-full text-sm font-bold",
                                                        hasProgress ? "bg-amber-500/20 text-amber-400" : "bg-slate-600/50 text-slate-400"
                                                    )}>
                                                        Progress: {currentCount} / {targetCount}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                {/* Photo Upload Input (Hidden) */}
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    capture="environment"
                                                    ref={fileInputRef}
                                                    className="hidden"
                                                    onChange={async (e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file && completingItemIndex !== null) {
                                                            setIsUploading(true);
                                                            try {
                                                                await completeWithPhoto(completingItemIndex, file);
                                                                setIsCompletionModalOpen(false);
                                                                setCompletingItemIndex(null);
                                                            } catch (err) {
                                                                alert('Failed to upload photo. Please try again.');
                                                            } finally {
                                                                setIsUploading(false);
                                                            }
                                                        }
                                                    }}
                                                />

                                                <button
                                                    onClick={() => fileInputRef.current?.click()}
                                                    disabled={isUploading}
                                                    className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    <Camera size={20} />
                                                    {isUploading ? 'Uploading...' : (isMultiCount ? 'Add Photo & +1' : 'Add Photo & Complete')}
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        toggleItem(completingItemIndex!);
                                                        setIsCompletionModalOpen(false);
                                                        setCompletingItemIndex(null);
                                                    }}
                                                    disabled={isUploading}
                                                    className="w-full py-3 px-4 bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:shadow-green-500/25 active:scale-95 transition-all disabled:opacity-50"
                                                >
                                                    <Check size={20} />
                                                    {isMultiCount ? `Mark +1 (${currentCount + 1}/${targetCount})` : 'Mark Complete'}
                                                </button>

                                                {/* Remove Progress button - only show if there's existing progress */}
                                                {hasProgress && (
                                                    <button
                                                        onClick={() => {
                                                            decrementProgress(completingItemIndex!);
                                                            setIsCompletionModalOpen(false);
                                                            setCompletingItemIndex(null);
                                                        }}
                                                        disabled={isUploading}
                                                        className="w-full py-2 rounded-xl font-semibold text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                                    >
                                                        Remove Progress ({currentCount - 1}/{targetCount})
                                                    </button>
                                                )}

                                                <button
                                                    onClick={() => { setIsCompletionModalOpen(false); setCompletingItemIndex(null); }}
                                                    disabled={isUploading}
                                                    className="w-full py-3 rounded-xl font-semibold bg-white/5 text-slate-400 hover:bg-white/10 transition-colors disabled:opacity-50"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        </>
                                    );
                                })()}
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Photo Gallery Viewer Modal */}
                <AnimatePresence>
                    {isPhotoViewerOpen && viewingItem && viewingItem.proofPhotos && viewingItem.proofPhotos.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md"
                            onClick={() => { setIsPhotoViewerOpen(false); setViewingItem(null); setViewingItemIndex(null); }}
                        >
                            <motion.div
                                initial={{ scale: 0.9 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0.9 }}
                                className="relative max-w-lg w-full"
                                onClick={e => e.stopPropagation()}
                            >
                                {/* Close Button */}
                                <button
                                    onClick={() => { setIsPhotoViewerOpen(false); setViewingItem(null); setViewingItemIndex(null); }}
                                    className="absolute -top-12 right-0 p-2 text-white/70 hover:text-white transition-colors z-10"
                                >
                                    <X size={28} />
                                </button>

                                {/* Photo Gallery */}
                                <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                                    {/* Photo with Navigation */}
                                    <div className="relative bg-black">
                                        <img
                                            src={viewingItem.proofPhotos[currentPhotoIndex]}
                                            alt={`Proof photo ${currentPhotoIndex + 1}`}
                                            className="w-full h-auto max-h-[50vh] object-contain"
                                        />

                                        {/* Navigation Arrows */}
                                        {viewingItem.proofPhotos.length > 1 && (
                                            <>
                                                <button
                                                    onClick={() => setCurrentPhotoIndex(prev => prev > 0 ? prev - 1 : viewingItem.proofPhotos!.length - 1)}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white/80 hover:text-white hover:bg-black/70 transition-all"
                                                >
                                                    <ChevronLeft size={24} />
                                                </button>
                                                <button
                                                    onClick={() => setCurrentPhotoIndex(prev => prev < viewingItem.proofPhotos!.length - 1 ? prev + 1 : 0)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-black/50 rounded-full text-white/80 hover:text-white hover:bg-black/70 transition-all"
                                                >
                                                    <ChevronRight size={24} />
                                                </button>
                                            </>
                                        )}

                                        {/* Photo Counter */}
                                        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-3 py-1 bg-black/60 rounded-full text-white text-xs font-medium">
                                            {currentPhotoIndex + 1} / {viewingItem.proofPhotos.length}
                                        </div>
                                    </div>

                                    {/* Thumbnail Strip */}
                                    {viewingItem.proofPhotos.length > 1 && (
                                        <div className="flex gap-1 p-2 bg-bg-dark/80 overflow-x-auto">
                                            {viewingItem.proofPhotos.map((photo, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => setCurrentPhotoIndex(idx)}
                                                    className={cn(
                                                        "w-12 h-12 rounded-md overflow-hidden border-2 flex-shrink-0 transition-all",
                                                        currentPhotoIndex === idx ? "border-accent-primary" : "border-transparent opacity-60 hover:opacity-100"
                                                    )}
                                                >
                                                    <img src={photo} alt="" className="w-full h-full object-cover" />
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Info */}
                                    <div className="p-4 bg-bg-dark/95">
                                        <p className="text-white font-semibold mb-1">{viewingItem.text}</p>
                                        <p className="text-slate-400 text-xs">
                                            Completed by {viewingItem.completedBy} • {formatDate(viewingItem.completedAt)}
                                        </p>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-4 flex gap-2">
                                    {/* Add More Photos Button */}
                                    {viewingItem.proofPhotos.length < 5 && (
                                        <>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                capture="environment"
                                                ref={addPhotoInputRef}
                                                className="hidden"
                                                onChange={async (e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file && viewingItemIndex !== null && viewingItem) {
                                                        setIsAddingPhoto(true);
                                                        try {
                                                            const newPhotoUrl = await addPhotoToTile(viewingItemIndex, file);
                                                            // Optimistically update viewingItem with new photo
                                                            if (newPhotoUrl) {
                                                                const updatedPhotos = [...(viewingItem.proofPhotos || []), newPhotoUrl];
                                                                setViewingItem({ ...viewingItem, proofPhotos: updatedPhotos });
                                                                setCurrentPhotoIndex(updatedPhotos.length - 1);
                                                            }
                                                        } catch (err) {
                                                            alert('Failed to add photo. Max 5 photos allowed.');
                                                        } finally {
                                                            setIsAddingPhoto(false);
                                                            if (addPhotoInputRef.current) addPhotoInputRef.current.value = '';
                                                        }
                                                    }
                                                }}
                                            />
                                            <button
                                                onClick={() => addPhotoInputRef.current?.click()}
                                                disabled={isAddingPhoto}
                                                className="flex-1 py-2 px-4 bg-accent-gold/20 text-accent-gold rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-accent-gold/30 transition-colors disabled:opacity-50"
                                            >
                                                <Plus size={18} />
                                                {isAddingPhoto ? 'Adding...' : `Add Photo (${viewingItem.proofPhotos.length}/5)`}
                                            </button>
                                        </>
                                    )}
                                </div>

                                {/* Mark as In Progress Button */}
                                <button
                                    onClick={() => {
                                        const idx = items.findIndex(i => i.id === viewingItem.id);
                                        if (idx !== -1) toggleItem(idx);
                                        setIsPhotoViewerOpen(false);
                                        setViewingItem(null);
                                        setViewingItemIndex(null);
                                    }}
                                    className="mt-2 w-full py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                                >
                                    Mark as In Progress
                                </button>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Undo Toast */}
                <AnimatePresence>
                    {showUndoToast && undoState && (
                        <motion.div
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 50 }}
                            className="fixed bottom-24 left-1/2 -translate-x-1/2 bg-slate-900 border border-white/20 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-4"
                        >
                            <span>Marked as {undoState.wasCompleted ? "incomplete" : "complete"}</span>
                            <button
                                onClick={() => {
                                    toggleItem(undoState.index);
                                    setShowUndoToast(false);
                                }}
                                className="font-bold text-accent-primary hover:text-white transition-colors"
                            >
                                Undo
                            </button>
                            <button onClick={() => setShowUndoToast(false)} className="text-slate-400 hover:text-white">
                                <X size={16} />
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
                {/* Walkthrough Overlay */}
                <AnimatePresence>
                    {showWalkthrough && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm"
                        >
                            <motion.div
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="bg-slate-900 border border-white/20 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden"
                            >
                                {/* Decorative Elements */}
                                <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none">
                                    <Award className="w-32 h-32 text-accent-gold rotate-12" />
                                </div>

                                <div className="relative z-10 text-center">
                                    <h3 className="text-2xl font-bold text-white mb-2">Welcome! 👋</h3>
                                    <p className="text-slate-400 mb-8 h-12">
                                        {walkthroughStep === 0 && "Tap any tile to mark it as complete."}
                                        {walkthroughStep === 1 && "Start 'Edit Mode' to add your own tasks."}
                                        {walkthroughStep === 2 && "Invite friends to play together!"}
                                    </p>

                                    <div className="flex justify-center mb-8">
                                        <div className="w-32 h-32 bg-black/40 rounded-2xl border border-white/10 flex items-center justify-center relative">
                                            <AnimatePresence mode="wait">
                                                {walkthroughStep === 0 && (
                                                    <motion.div
                                                        key="step0"
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                        className="absolute inset-0 flex items-center justify-center"
                                                    >
                                                        <div className="w-16 h-16 bg-accent-primary/20 rounded-lg border border-accent-primary flex items-center justify-center">
                                                            <Check className="w-8 h-8 text-white" />
                                                        </div>
                                                        <motion.div
                                                            animate={{ scale: [1, 1.2, 1], opacity: [0, 1, 0] }}
                                                            transition={{ repeat: Infinity, duration: 1.5 }}
                                                            className="absolute w-20 h-20 rounded-full border-2 border-white/50"
                                                        />
                                                    </motion.div>
                                                )}
                                                {walkthroughStep === 1 && (
                                                    <motion.div
                                                        key="step1"
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                    >
                                                        <Edit2 className="w-12 h-12 text-blue-400" />
                                                    </motion.div>
                                                )}
                                                {walkthroughStep === 2 && (
                                                    <motion.div
                                                        key="step2"
                                                        initial={{ opacity: 0, scale: 0.8 }}
                                                        animate={{ opacity: 1, scale: 1 }}
                                                        exit={{ opacity: 0, scale: 0.8 }}
                                                    >
                                                        <Share2 className="w-12 h-12 text-green-400" />
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-center mb-6">
                                        {[0, 1, 2].map(i => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "w-2 h-2 rounded-full transition-colors",
                                                    i === walkthroughStep ? "bg-white" : "bg-white/20"
                                                )}
                                            />
                                        ))}
                                    </div>

                                    <button
                                        onClick={handleNextStep}
                                        className="w-full py-3 bg-white text-black font-bold rounded-xl hover:bg-slate-200 transition-colors"
                                    >
                                        {walkthroughStep === 2 ? "Let's Play!" : "Next"}
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Print Layout */}
            <div className="only-print hidden">
                <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" className="h-12 w-auto" alt="Logo" />
                        <h1 className="text-2xl font-bold">2026 Edition</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-widest mb-0.5">Status Report</p>
                        <p className="text-xl font-bold">{bingoCount} / 12 Bingos</p>
                    </div>
                </div>

                <div className="grid grid-cols-5 gap-0 border-2 border-black">
                    {items.slice(0, 25).map((item) => (
                        <div key={item.id} className="aspect-square border border-black p-1.5 flex flex-col justify-between relative overflow-hidden min-h-[100px]">
                            <div className="text-[11px] font-bold leading-tight z-10">{item.text}</div>
                            {item.isCompleted && !item.isFreeSpace && (
                                <div className="mt-0.5 relative z-10">
                                    <div className="text-[7px] uppercase font-bold text-slate-700">Completed by:</div>
                                    <div className="text-[9px] font-mono font-bold leading-none">{item.completedBy || 'User'}</div>
                                    <div className="text-[7px] text-slate-600 mt-0.5">{formatDate(item.completedAt)}</div>
                                </div>
                            )}
                            {item.isCompleted && (
                                <div className="absolute bottom-1 right-1 text-3xl font-bold text-slate-200 opacity-60 pointer-events-none z-0">
                                    ✓
                                </div>
                            )}
                            {item.isFreeSpace && <div className="absolute inset-0 flex items-center justify-center font-bold text-xl rotate-[-45deg] opacity-20">FREE</div>}
                        </div>
                    ))}
                </div>

                <div className="mt-4 text-[9px] text-center border-t border-black pt-2 flex justify-between text-slate-500">
                    <span>Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}</span>
                    <span>bingo.mysunsar.com</span>
                </div>
            </div>

            {/* Memories Album */}
            <MemoriesAlbum
                items={items}
                isOpen={isMemoriesOpen}
                onClose={() => setIsMemoriesOpen(false)}
            />

            {/* Share Modal */}
            {isShareModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsShareModalOpen(false)} />
                    <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Share2 className="w-5 h-5 text-accent-primary" />
                                Shared With
                            </h2>
                            <button onClick={() => setIsShareModalOpen(false)} className="text-slate-400 hover:text-white">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6">
                            {memberDetails.length === 0 ? (
                                <div className="text-center text-slate-400 py-8">
                                    <p>This board hasn't been shared yet.</p>
                                </div>
                            ) : (
                                <div className="space-y-4 mb-6">
                                    {memberDetails.map(member => (
                                        <div key={member.id} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                                                    {member.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-semibold text-white">{member.name}</div>
                                                    <div className="text-xs text-slate-400">{member.email} • {member.role}</div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRemoveMember(member.id, member.name)}
                                                className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                title="Remove User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <button
                                onClick={handleInviteClick}
                                className="w-full py-3 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl font-bold text-white shadow-lg hover:shadow-accent-primary/25 transition-all flex items-center justify-center gap-2"
                            >
                                <Plus size={18} />
                                Invite New User
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
