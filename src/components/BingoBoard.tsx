import React, { useState, useEffect, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useBingo } from '../hooks/useBingo';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';

import { useSounds } from '../hooks/useSounds';
import { cn } from '../lib/utils';
import { Edit2, Check, Award, Camera, Share2, Printer, Rocket, BookOpen, Trash2, X, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import type { BingoItem } from '../types';
import { MemoriesAlbum } from './MemoriesAlbum';
import { FloatingReactions } from './FloatingReactions';
import "../styles/visualPolish.css"; // visual polish styles
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragOverlay } from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, rectSortingStrategy } from '@dnd-kit/sortable';
import { DraggableTile } from './ui/DraggableTile';
import { BingoTile } from './ui/BingoTile';
import { Modal } from './ui/Modal';

import { useParams } from 'react-router-dom';

export const BingoBoard: React.FC = () => {
    const { boardId, yearId } = useParams();

    // For legacy boards, yearId is set and we pass undefined to useBingo (which uses 'years' collection)
    // For new boards, boardId is set and we pass it to useBingo (which uses 'boards' collection)
    const effectiveBoardId = yearId ? undefined : boardId;
    const { items, members, loading, toggleItem, hasWon, bingoCount, isLocked, unlockBoard, jumbleAndLock, saveBoard, completeWithPhoto, addPhotoToTile, addReaction, deletePhoto, decrementProgress, inviteUser, removeMember, title, gridSize, updateTitle } = useBingo(effectiveBoardId);
    const { user } = useAuth();
    const dialog = useDialog();
    const { playClick, playSuccess, playBingo, playWhoosh } = useSounds();
    const [editMode, setEditMode] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitleValue, setEditingTitleValue] = useState('');




    // Local State for Drag & Drop and Edits
    const [localItems, setLocalItems] = useState(items);
    const [activeId, setActiveId] = useState<string | number | null>(null);

    // Sync local items with upstream items unless we are actively editing/dragging
    useEffect(() => {
        if (!activeId && !editMode) {
            setLocalItems(items);
        } else if (editMode && localItems.length === 0 && items.length > 0) {
            // Initial sync on entering edit mode if empty
            setLocalItems(items);
        }
    }, [items, activeId, editMode]);

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        if (!editMode) return;
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (over && active.id !== over.id && editMode) {
            setLocalItems((currentItems) => {
                const oldIndex = currentItems.findIndex((item) => item.id === active.id);
                const newIndex = currentItems.findIndex((item) => item.id === over!.id);
                const newItems = arrayMove(currentItems, oldIndex, newIndex);
                saveBoard(newItems);
                return newItems;
            });
        }
    };

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isGoLiveModalOpen, setIsGoLiveModalOpen] = useState(false);
    const [shouldShuffleOnLive, setShouldShuffleOnLive] = useState(false);
    const [memberDetails, setMemberDetails] = useState<{ id: string, name: string, email: string, role: string }[]>([]);
    const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);
    const [editFormText, setEditFormText] = useState("");
    const [editFormStyle, setEditFormStyle] = useState<{ color?: string; bold?: boolean; italic?: boolean; fontSize?: 'sm' | 'base' | 'lg' | 'xl' }>({});
    const [editFormTargetCount, setEditFormTargetCount] = useState<number>(1);
    const [editFormDueDate, setEditFormDueDate] = useState<string>("");
    const [editFormIsFreeSpace, setEditFormIsFreeSpace] = useState(false);
    const [photoUploadMode, setPhotoUploadMode] = useState<'complete' | 'add'>('complete');

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



    const handleGoLive = () => {
        // Trigger generic click sound
        playClick();

        jumbleAndLock(shouldShuffleOnLive);

        // Success effect
        confetti({
            particleCount: 150,
            spread: 60,
            origin: { y: 0.7 },
            colors: ['#22c55e', '#ffffff']
        });
        playSuccess();

        setIsGoLiveModalOpen(false);
        setEditMode(false);
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

    // Play celebration sound on bingo win
    const prevHasWonRef = useRef(hasWon);
    React.useEffect(() => {
        if (hasWon && !prevHasWonRef.current && !loading) {
            playBingo();
        }
        prevHasWonRef.current = hasWon;
    }, [hasWon, loading, playBingo]);

    // Open Modal
    const openEditModal = (index: number) => {
        const currentList = localItems.length > 0 ? localItems : items;
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

        setEditFormIsFreeSpace(!!currentList[index].isFreeSpace);

        setIsEditModalOpen(true);
    };

    // Modal OK Action (Update Draft Only)
    const handleSaveEdit = () => {
        if (editingItemIndex === null) return;

        let newDueDate: any = undefined;
        if (editFormDueDate) {
            newDueDate = new Date(editFormDueDate + "T12:00:00");
        }

        const newDrafts = [...localItems];
        newDrafts[editingItemIndex] = {
            ...newDrafts[editingItemIndex],
            text: editFormText,
            style: editFormStyle,
            targetCount: editFormTargetCount,
            dueDate: newDueDate,
            isFreeSpace: editFormIsFreeSpace,
            // If marking as free space, effectively completed for bingo logic (handled in useBingo checkWin)
            isCompleted: (newDrafts[editingItemIndex].isCompleted) || editFormIsFreeSpace // Keep completed if free
        };
        setLocalItems(newDrafts);
        saveBoard(newDrafts); // Save immediately on modal close

        setIsEditModalOpen(false);
        setEditingItemIndex(null);
    };

    // Determine which items to display
    // Determine which items to display
    const displayItems = localItems.length > 0 ? localItems : items;

    // Sync viewingItem with items
    useEffect(() => {
        if (viewingItemIndex !== null && displayItems?.[viewingItemIndex]) {
            setViewingItem(displayItems[viewingItemIndex]);
        }
    }, [displayItems, viewingItemIndex]);

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



    const handleQuickComplete = (index: number) => {
        // Capture state before toggle for Undo
        const item = displayItems[index];
        setUndoState({ index, wasCompleted: item.isCompleted });

        // Play appropriate sound
        if (item.isCompleted) {
            playClick(); // Un-completing
        } else {
            playSuccess(); // Completing
        }

        toggleItem(index);

        // Show Undo Toast
        setShowUndoToast(true);
        setTimeout(() => setShowUndoToast(false), 3000);
    };

    return (
        <>
            <div className="min-h-screen bg-transparent text-white p-6 pb-24 relative overflow-x-hidden no-print">
                <input
                    type="file"
                    accept="image/*"
                    ref={addPhotoInputRef}
                    className="hidden"
                    onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file && viewingItemIndex !== null) {
                            try {
                                await addPhotoToTile(viewingItemIndex, file);
                            } catch (e) {
                                console.error(e);
                                alert("Failed to add photo");
                            }
                            e.target.value = '';
                        }
                    }}
                />
                <FloatingReactions items={items} />

                <div className="max-w-4xl mx-auto">
                    {/* Navigation Bar - Matches Dashboard */}
                    <header className="flex justify-between items-center mb-8 py-2">

                        {/* Editable Board Title - Compact in header */}
                        <div className="flex-1 mx-4 min-w-0">
                            {isEditingTitle ? (
                                <input
                                    type="text"
                                    value={editingTitleValue}
                                    onChange={(e) => setEditingTitleValue(e.target.value)}
                                    onBlur={() => {
                                        if (editingTitleValue.trim()) {
                                            updateTitle(editingTitleValue.trim());
                                        }
                                        setIsEditingTitle(false);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            if (editingTitleValue.trim()) {
                                                updateTitle(editingTitleValue.trim());
                                            }
                                            setIsEditingTitle(false);
                                        } else if (e.key === 'Escape') {
                                            setIsEditingTitle(false);
                                        }
                                    }}
                                    autoFocus
                                    className="bg-transparent border-b-2 border-accent-primary text-white text-lg sm:text-xl font-bold outline-none w-full max-w-[200px]"
                                />
                            ) : (
                                <button
                                    onClick={() => {
                                        setEditingTitleValue(title || 'My Bingo');
                                        setIsEditingTitle(true);
                                    }}
                                    className="text-white text-lg sm:text-xl font-bold truncate max-w-[200px] hover:text-accent-primary transition-colors flex items-center gap-1 group"
                                    title="Click to edit board name"
                                >
                                    <span className="bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent truncate">
                                        {title || 'My Bingo'}
                                    </span>
                                    <Edit2 size={14} className="opacity-0 group-hover:opacity-70 transition-opacity flex-shrink-0" />
                                </button>
                            )}
                            <p className="text-slate-500 text-xs mt-0.5">
                                {gridSize}×{gridSize} • {items.filter(i => i.isCompleted && !i.isFreeSpace).length}/{items.filter(i => !i.isFreeSpace).length}
                            </p>
                        </div>
                        <div className="flex items-center gap-1 sm:gap-2">

                            <button
                                onClick={() => setIsMemoriesOpen(true)}
                                className="p-2.5 text-slate-400 hover:text-accent-gold hover:bg-white/5 rounded-full transition-colors"
                                title="View Memories"
                            >
                                <BookOpen size={20} />
                            </button>
                            <button
                                onClick={() => setIsShareModalOpen(true)}
                                className="p-2.5 text-slate-400 hover:text-accent-primary hover:bg-white/5 rounded-full transition-colors"
                                title="Share Board"
                            >
                                <Share2 size={20} />
                            </button>
                        </div>
                    </header>



                    {/* Drag Context Wrapper */}
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragStart={handleDragStart}
                        onDragEnd={handleDragEnd}
                    >
                        {/* Centered Grid Container */}
                        <div className="flex justify-center mb-6">
                            <div className="w-full max-w-[520px] aspect-square relative">
                                <SortableContext items={displayItems.map(i => i.id)} strategy={rectSortingStrategy}>
                                    <div
                                        className={cn(
                                            "grid gap-1.5 sm:gap-2 w-full h-full",
                                            gridSize === 3 && "grid-cols-3 grid-rows-3",
                                            gridSize === 4 && "grid-cols-4 grid-rows-4",
                                            gridSize === 5 && "grid-cols-5 grid-rows-5",
                                            gridSize === 6 && "grid-cols-6 grid-rows-6",
                                        )}
                                        style={{ perspective: '1000px' }}
                                    >
                                        {displayItems.map((item, index) => (
                                            <DraggableTile
                                                key={item.id}
                                                id={item.id}
                                                disabled={!editMode}
                                            >
                                                <BingoTile
                                                    item={item}
                                                    index={index}
                                                    gridSize={gridSize}
                                                    editMode={editMode}
                                                    activeId={activeId}
                                                    isLocked={isLocked}
                                                    onEdit={() => openEditModal(index)}
                                                    onClick={() => {
                                                        if (item.isFreeSpace) return;
                                                        if (item.isCompleted) {
                                                            if (item.proofPhotos && item.proofPhotos.length > 0) {
                                                                setViewingItem(item);
                                                                setViewingItemIndex(index);
                                                                setCurrentPhotoIndex(0);
                                                                setIsPhotoViewerOpen(true);
                                                            } else {
                                                                handleQuickComplete(index);
                                                            }
                                                        } else {
                                                            playWhoosh();
                                                            setCompletingItemIndex(index);
                                                            setIsCompletionModalOpen(true);
                                                        }
                                                    }}
                                                />
                                            </DraggableTile>
                                        ))}
                                    </div>
                                </SortableContext>
                            </div>
                        </div>

                        {/* Drag Overlay for smooth visuals */}
                        <DragOverlay>
                            {activeId ? (
                                <div className={cn(
                                    "relative w-full h-full flex flex-col items-center justify-center p-1 sm:p-2 text-center select-none overflow-hidden",
                                    "bingo-tile bg-white/10 backdrop-blur-md border-2 border-accent-primary shadow-2xl glass-panel"
                                )}
                                    style={{
                                        width: '100px', height: '100px'
                                    }}
                                >
                                    <span className="text-white font-bold text-sm">
                                        {localItems.find(i => i.id === activeId)?.text}
                                    </span>
                                </div>
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </div>

                {/* Controls Bar - Outside grid container to stack vertically */}
                <div className="flex justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-[520px] glass-panel p-4 flex flex-col gap-4"
                    >
                        <div className="w-full">
                            <div className="flex justify-between text-xs text-slate-300 mb-1.5 px-1">
                                <span className="font-semibold">Progress</span>
                                <div className="flex gap-3">
                                    <span className="font-mono text-accent-gold font-bold">{bingoCount}/{gridSize * 2 + 2} Bingos</span>
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
                                                saveBoard(localItems);
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
                                                    setLocalItems([...items]); // Init local items
                                                    setEditMode(true);
                                                }}
                                                className="flex-1 py-2 px-4 text-xs font-medium text-slate-400 hover:text-white transition-colors flex items-center justify-center gap-2 min-w-[100px]"
                                            >
                                                <Edit2 size={12} />
                                                Edit Board
                                            </button>
                                            <button
                                                onClick={() => {
                                                    playClick();
                                                    setIsGoLiveModalOpen(true);
                                                }}
                                                className="flex-1 py-2 px-4 text-xs font-bold text-white bg-gradient-to-r from-accent-primary to-accent-secondary hover:shadow-lg hover:shadow-accent-primary/20 transition-all rounded-lg flex items-center justify-center gap-2 min-w-[120px]"
                                            >
                                                <Rocket size={14} />
                                                Go Live 🚀
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
                </div>

                {/* Celebration Modal */}
                <AnimatePresence>
                    {
                        hasWon && !celebrationDismissed && (
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
                        )
                    }
                </AnimatePresence>

                {/* Edit Modal */}
                <Modal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    title="Edit Tile"
                    size="sm"
                    footer={
                        <>
                            <button
                                onClick={() => setIsEditModalOpen(false)}
                                className="flex-1 py-2.5 rounded-xl font-semibold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveEdit}
                                className="flex-1 py-2.5 px-4 bg-gradient-to-r from-violet-600 to-fuchsia-600 rounded-xl font-bold text-white shadow-lg hover:shadow-violet-500/25 active:scale-95 transition-all"
                            >
                                Save Changes
                            </button>
                        </>
                    }
                >
                    {/* Preview */}
                    <div className="mb-6 flex justify-center">
                        <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-lg bg-bg-card/80 border border-white/10 flex items-center justify-center p-2 text-center overflow-hidden relative">
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
                    <div className="mb-6">
                        <div className="flex items-center gap-3 mb-3 bg-white/5 p-3 rounded-xl border border-white/5">
                            <label className="flex items-center gap-2 cursor-pointer flex-1">
                                <input
                                    type="checkbox"
                                    checked={editFormIsFreeSpace}
                                    onChange={(e) => {
                                        const checked = e.target.checked;
                                        setEditFormIsFreeSpace(checked);
                                        if (checked) {
                                            setEditFormText("FREE!");
                                        }
                                    }}
                                    className="w-4 h-4 rounded border-gray-500 bg-black/50 text-accent-primary focus:ring-accent-primary"
                                />
                                <span className={cn("text-sm font-bold transition-colors", editFormIsFreeSpace ? "text-accent-primary" : "text-slate-300")}>
                                    Flag as FREE Space 🚦
                                </span>
                            </label>
                            {editFormIsFreeSpace && (
                                <div className="flex gap-1 bg-black/80 rounded-full p-1 px-1.5 border border-white/20">
                                    <div className="w-2 h-2 rounded-full bg-red-900/30" />
                                    <div className="w-2 h-2 rounded-full bg-yellow-900/30" />
                                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_#22c55e]" />
                                </div>
                            )}
                        </div>

                        <label className="text-xs text-slate-400 mb-1 block">Text Content</label>
                        <textarea
                            className={cn("w-full bg-black/20 text-white rounded-lg p-3 border border-white/10 focus:border-accent-primary outline-none min-h-[80px]", editFormIsFreeSpace && "opacity-50 cursor-not-allowed")}
                            disabled={editFormIsFreeSpace}
                            value={editFormText}
                            onChange={(e) => setEditFormText(e.target.value)}
                            placeholder="Enter bingo task..."
                        />
                    </div>

                    {/* Styling Controls */}
                    <div className={cn("transition-opacity duration-300", editFormIsFreeSpace && "opacity-30 pointer-events-none")}>
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

                        <div className="space-y-4 pt-4 border-t border-white/10">
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-slate-300">Repeat Goal</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="100"
                                    value={editFormTargetCount}
                                    onChange={(e) => setEditFormTargetCount(parseInt(e.target.value) || 1)}
                                    className="w-full bg-slate-950/50 border border-white/10 rounded-xl p-3 text-white placeholder-slate-500 focus:outline-none focus:border-accent-primary/50 transition-colors"
                                />
                                <p className="text-xs text-slate-500">How many times should this be completed?</p>
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
                    </div>
                </Modal>

                {/* Details / Completion Modal */}
                {(() => {
                    const item = completingItemIndex !== null ? displayItems[completingItemIndex] : null;
                    const targetCount = item?.targetCount || 1;
                    const currentCount = item?.currentCount || 0;
                    const isMultiCount = targetCount > 1;
                    const hasProgress = currentCount > 0;

                    if (!item) return null;

                    return (
                        <Modal
                            isOpen={isCompletionModalOpen && completingItemIndex !== null}
                            onClose={() => { setIsCompletionModalOpen(false); setCompletingItemIndex(null); }}
                            title={item.isCompleted ? 'Tile Details' : (hasProgress ? 'Add Progress' : 'Complete Task')}
                            size="sm"
                        >
                            <div className="space-y-4">
                                <p className="text-slate-300 text-sm text-center mb-4 line-clamp-3 italic">
                                    &ldquo;{item.text}&rdquo;
                                </p>

                                {/* Progress indicator */}
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

                                {/* EXISTING PHOTOS */}
                                {item.proofPhotos && item.proofPhotos.length > 0 && (
                                    <div className="mb-6 bg-black/20 p-3 rounded-xl border border-white/5">
                                        <label className="text-xs text-slate-400 mb-2 block font-semibold uppercase tracking-wider">Attached Photos</label>
                                        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                                            {item.proofPhotos.map((photo, i) => (
                                                <div
                                                    key={i}
                                                    className="relative w-20 h-20 flex-shrink-0 group rounded-lg overflow-hidden border border-white/10 touch-none select-none"
                                                    onContextMenu={(e) => e.preventDefault()}
                                                >
                                                    <img src={photo} alt="" className="w-full h-full object-cover pointer-events-none" />
                                                    <button
                                                        onClick={async (e) => {
                                                            e.stopPropagation();
                                                            if (window.confirm('Delete this photo?')) {
                                                                await deletePhoto(completingItemIndex!, i);
                                                            }
                                                        }}
                                                        className="absolute top-1 right-1 bg-red-500/90 p-1.5 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 shadow-md"
                                                    >
                                                        <Trash2 size={12} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    {/* Photo Upload Input (Hidden) */}
                                    <input
                                        type="file"
                                        accept="image/*"
                                        ref={fileInputRef}
                                        className="hidden"
                                        onChange={async (e) => {
                                            const file = e.target.files?.[0];
                                            if (file && completingItemIndex !== null) {
                                                setIsUploading(true);
                                                try {
                                                    if (photoUploadMode === 'complete') {
                                                        await completeWithPhoto(completingItemIndex, file);
                                                    } else {
                                                        await addPhotoToTile(completingItemIndex, file);
                                                    }
                                                    setIsCompletionModalOpen(false);
                                                    setCompletingItemIndex(null);
                                                } catch (err) {
                                                    alert('Failed to upload photo.');
                                                } finally {
                                                    setIsUploading(false);
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                    />

                                    {/* 1. Add Photo Only */}
                                    <button
                                        onClick={() => {
                                            setPhotoUploadMode('add');
                                            setTimeout(() => fileInputRef.current?.click(), 0);
                                        }}
                                        disabled={isUploading}
                                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:shadow-blue-500/25 active:scale-95 transition-all disabled:opacity-50"
                                    >
                                        <Camera size={20} />
                                        {isUploading && photoUploadMode === 'add' ? 'Uploading...' : 'Add Photo (Keep Status)'}
                                    </button>

                                    {/* 2. Add Photo & Complete (if not completed) */}
                                    {!item.isCompleted && (
                                        <button
                                            onClick={() => {
                                                setPhotoUploadMode('complete');
                                                setTimeout(() => fileInputRef.current?.click(), 0);
                                            }}
                                            disabled={isUploading}
                                            className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 hover:shadow-amber-500/25 active:scale-95 transition-all disabled:opacity-50"
                                        >
                                            <Check size={20} />
                                            {isUploading && photoUploadMode === 'complete' ? 'Uploading...' : (isMultiCount ? 'Add Photo & +1' : 'Add Photo & Complete')}
                                        </button>
                                    )}

                                    {/* 3. Toggle Status */}
                                    <button
                                        onClick={() => {
                                            toggleItem(completingItemIndex!);
                                            setIsCompletionModalOpen(false);
                                            setCompletingItemIndex(null);
                                        }}
                                        disabled={isUploading}
                                        className={cn(
                                            "w-full py-3 px-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50",
                                            item.isCompleted
                                                ? "bg-slate-700 hover:bg-slate-600"
                                                : "bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-green-500/25"
                                        )}
                                    >
                                        {item.isCompleted ? <X size={20} /> : <Check size={20} />}
                                        {item.isCompleted ? 'Mark Incomplete' : (isMultiCount ? `Mark +1 (${currentCount + 1}/${targetCount})` : 'Mark Complete')}
                                    </button>

                                    {/* Remove Progress (if applicable) */}
                                    {hasProgress && !item.isCompleted && (
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
                            </div>
                        </Modal>
                    );
                })()}

                {/* Photo Gallery Viewer Modal */}
                <AnimatePresence>
                    {
                        isPhotoViewerOpen && viewingItem && viewingItem.proofPhotos && viewingItem.proofPhotos.length > 0 && (
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
                                            <p className="text-slate-400 text-xs mb-4">
                                                Completed by {viewingItem.completedBy} • {formatDate(viewingItem.completedAt)}
                                            </p>

                                            <div className="flex gap-2 justify-center pb-1">
                                                {['❤️', '🔥', '👏', '🎉', '🤩', '💯'].map(emoji => (
                                                    <button
                                                        key={emoji}
                                                        onClick={() => {
                                                            if (viewingItemIndex !== null) {
                                                                addReaction(viewingItemIndex, emoji);
                                                                playClick();
                                                            }
                                                        }}
                                                        className="text-2xl hover:scale-125 transition-transform p-2 rounded-full hover:bg-white/10 active:scale-95"
                                                        title="React"
                                                    >
                                                        {emoji}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="mt-4 flex gap-3 justify-center">
                                        <button
                                            onClick={async () => {
                                                if (window.confirm("Delete this photo?")) {
                                                    await deletePhoto(viewingItemIndex!, currentPhotoIndex);
                                                    if (viewingItem?.proofPhotos?.length === 1) {
                                                        setIsPhotoViewerOpen(false);
                                                    } else {
                                                        setCurrentPhotoIndex(0);
                                                    }
                                                }
                                            }}
                                            className="flex-1 py-3 bg-red-500/10 text-red-400 rounded-xl font-semibold hover:bg-red-500/20 flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={20} />
                                            Delete Photo
                                        </button>

                                        <button
                                            onClick={() => addPhotoInputRef.current?.click()}
                                            className="flex-1 py-3 bg-white/10 text-white rounded-xl font-semibold hover:bg-white/20 flex items-center justify-center gap-2"
                                        >
                                            <Plus size={20} />
                                            Add Photo
                                        </button>
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
                        )
                    }
                </AnimatePresence>

                {/* Undo Toast */}
                <AnimatePresence>
                    {
                        showUndoToast && undoState && (
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
                        )
                    }
                </AnimatePresence>
                {/* Walkthrough Overlay */}
                <AnimatePresence>
                    {
                        showWalkthrough && (
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
                        )
                    }
                </AnimatePresence>
            </div>

            {/* Print Layout */}
            <div className="only-print hidden">
                <div className="flex justify-between items-end mb-4 border-b-2 border-black pb-2">
                    <div className="flex items-center gap-3">
                        <img src="/logo.png" className="h-12 w-auto" alt="Logo" />
                        <h1 className="text-2xl font-bold">{title || '2026 Edition'}</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-xs uppercase tracking-widest mb-0.5">Status Report ({gridSize}×{gridSize})</p>
                        <p className="text-xl font-bold">{bingoCount} / {gridSize * 2 + 2} Bingos</p>
                    </div>
                </div>

                <div className={`grid gap-0 border-2 border-black ${gridSize === 3 ? 'grid-cols-3' :
                    gridSize === 4 ? 'grid-cols-4' :
                        gridSize === 5 ? 'grid-cols-5' :
                            'grid-cols-6'
                    }`}>
                    {items.map((item) => (
                        <div key={item.id} className="aspect-square border border-black p-1.5 flex flex-col justify-between relative overflow-hidden min-h-[80px]">
                            <div className={`font-bold leading-tight z-10 ${gridSize >= 5 ? 'text-[10px]' : 'text-[11px]'}`}>{item.text}</div>
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
            </div >

            {/* Memories Album */}
            < MemoriesAlbum
                items={items}
                isOpen={isMemoriesOpen}
                onClose={() => setIsMemoriesOpen(false)}
            />

            {/* Share Modal */}
            <Modal
                isOpen={isShareModalOpen}
                onClose={() => setIsShareModalOpen(false)}
                title={
                    <span className="flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-accent-primary" />
                        Shared With
                    </span>
                }
                size="md"
            >
                <div>
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
            </Modal>

            {/* Go Live Modal */}
            <Modal
                isOpen={isGoLiveModalOpen}
                onClose={() => setIsGoLiveModalOpen(false)}
                title={
                    <span className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-accent-primary" />
                        Ready to Go Live?
                    </span>
                }
                size="sm"
                footer={
                    <>
                        <button
                            onClick={() => setIsGoLiveModalOpen(false)}
                            className="flex-1 py-3 rounded-xl font-semibold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                        >
                            Not Yet
                        </button>
                        <button
                            onClick={handleGoLive}
                            className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl font-bold text-white shadow-lg hover:shadow-green-500/25 transition-all"
                        >
                            Let's Go! 🚀
                        </button>
                    </>
                }
            >
                <div>
                    <p className="text-slate-300 mb-6 leading-relaxed">
                        Going live will <strong>lock the board</strong> for play mode. You won't be able to edit items easily anymore.
                    </p>

                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6 cursor-pointer hover:bg-white/10 transition-colors"
                        onClick={() => setShouldShuffleOnLive(!shouldShuffleOnLive)}>
                        <div className="flex items-start gap-3">
                            <div className={`mt-1 w-5 h-5 rounded border flex items-center justify-center transition-colors ${shouldShuffleOnLive ? 'bg-accent-primary border-accent-primary' : 'border-slate-500'}`}>
                                {shouldShuffleOnLive && <Check size={14} className="text-white" />}
                            </div>
                            <div>
                                <div className="font-semibold text-white">Shuffle Items?</div>
                                <div className="text-xs text-slate-400 mt-1">
                                    Randomize the grid arrangement one last time before locking.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </Modal>


        </>
    );
};
