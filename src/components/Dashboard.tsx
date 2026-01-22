import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp, updateDoc, deleteField, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';

import { Plus, LayoutGrid, Calendar, Trash2, LogOut, Users, Pencil, Check, X } from 'lucide-react';
import { Skeleton } from '../components/ui/Skeleton';

interface BoardSummary {
    id: string;
    title: string;
    theme?: string;
    createdAt: any;
    isLocked?: boolean;
    ownerId?: string;
    ownerName?: string;
    sharedCount?: number;
    myRole?: 'owner' | 'editor' | 'viewer';
    members?: Record<string, string>;
}

export const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const dialog = useDialog();

    const navigate = useNavigate();
    const [boards, setBoards] = useState<BoardSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<keyof typeof TEMPLATES | null>(null);
    const [selectedGridSize, setSelectedGridSize] = useState<number>(5);
    const [editingBoardId, setEditingBoardId] = useState<string | null>(null);
    const [editTitleValue, setEditTitleValue] = useState("");

    const handleStartEdit = (e: React.MouseEvent, board: BoardSummary) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingBoardId(board.id);
        setEditTitleValue(board.title);
    };

    const handleSaveEdit = async (e: React.MouseEvent | React.KeyboardEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!editingBoardId) return;

        try {
            await updateDoc(doc(db, 'boards', editingBoardId), {
                title: editTitleValue
            });
            setBoards(prev => prev.map(b =>
                b.id === editingBoardId ? { ...b, title: editTitleValue } : b
            ));
        } catch (error) {
            console.error("Error updating title:", error);
        }
        setEditingBoardId(null);
    };

    const handleCancelEdit = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setEditingBoardId(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSaveEdit(e);
        } else if (e.key === 'Escape') {
            e.stopPropagation(); // prevent modal close if inside one?
            setEditingBoardId(null);
        } else {
            e.stopPropagation(); // prevent card click
        }
    };

    const GRID_SIZE_OPTIONS = [
        { size: 3, label: '3×3', description: 'Quick (9 tiles)', icon: '⚡' },
        { size: 4, label: '4×4', description: 'Compact (16 tiles)', icon: '📝' },
        { size: 5, label: '5×5', description: 'Classic (25 tiles)', icon: '⭐' },
        { size: 6, label: '6×6', description: 'Extended (36 tiles)', icon: '🚀' },
    ];

    // Template Data
    const TEMPLATES = {
        blank: {
            name: "Blank Canvas 📝",
            items: []
        },
        default: {
            name: "2026 Goals 🎯",
            items: [
                "Travel to a new country", "Host a dinner party", "Read 12 books", "Go camping", "Try a new hobby",
                "Exercise 3x/week for a month", "Save a specific amount", "Visit a museum", "Date night at a fancy place", "Cook a complex meal",
                "Walk 10k steps for a week", "Watch all Oscar nominees", "FREE SPACE", "Volunteer somewhere", "Learn a new skill",
                "No takeout for a month", "Go to a concert", "Plant a garden", "Digital detox weekend", "Write a journal",
                "Call parents weekly", "Take a spontaneous trip", "Learn a new recipe", "Do a puzzle", "Visit a national park"
            ]
        },
        fitness: {
            name: "Fitness Challenge 💪",
            items: [
                "Run a 5k", "Do 50 pushups in a row", "Try a yoga class", "Drink 3L water for a week", "No sugar for 7 days",
                "Go for a hike", "Meal prep for a week", "Climb a bouldering wall", "Try Pilates", "Walk 15k steps in a day",
                "Do a spin class", "Bike 20km", "FREE SPACE", "Touch your toes", "Hold a plank for 2 min",
                "Try CrossFit", "Go swimming", "Meditate for 10 mins x 7", "Try a new sport", "Sleep 8 hours x 5 days",
                "Do 100 squats", "Run a 10k", "Go to the gym 4x in a week", "Stretch daily for a week", "Join a run club"
            ]
        },
        couples: {
            name: "Couple Goals ❤️",
            items: [
                "Date night (no phones)", "Cook a meal together", "Weekend getaway", "Watch a whole series", "Breakfast in bed",
                "Go for a long walk", "Plan a future trip", "Give each other massages", "Recreate first date", "Take a dance class",
                "Stargazing date", "Write love letters", "FREE SPACE", "Visit a winery/brewery", "Do a puzzle together",
                "Double date", "Sunset picnic", "Bake something sweet", "Volunteer together", "Learn a couple's skill",
                "Game night", "Make a photo album", "Try a new restaurant", "Surprise gift", "Kiss in the rain"
            ]
        },
        personal: {
            name: "Personal Growth 🌱",
            items: [
                "Read 1 book/month", "Learn a new language", "Start a journal", "Digital detox (24h)", "Meditate daily (1 week)",
                "Drink 2L water daily", "Wake up at 6am (1 week)", "Declutter a room", "Learn to invest", "Take a solo trip",
                "Volunteer", "Compliment a stranger", "FREE SPACE", "No social media (weekend)", "Learn an instrument",
                "Cook a new cuisine", "Write a gratitude list", "Take a cold shower", "Listen to a podcast", "Fix sleep schedule",
                "Walk 10k steps", "Call an old friend", "Create a vision board", "Save 10% income", "Take a course"
            ]
        },
        knitting: {
            name: "Knitting Goals 🧶",
            items: [
                "Finish a WIP", "Cast on a sweater", "Learn brioche", "Knit socks", "Stash bust project",
                "Try colorwork", "Knit a hat", "Use luxury yarn", "Fix a mistake", "Knit a gift",
                "Block a project", "Organize needles", "FREE SPACE", "Try a new fiber", "Knit in public",
                "Attend a knit night", "Learn magic loop", "Design a pattern", "Teach someone to knit", "Finish a blanket",
                "Knit a shawl", "Try cables", "Buy souvenir yarn", "Weave in ends immediately", "Knit a gauge swatch"
            ]
        },
        weaving: {
            name: "Weaving Goals 🧵",
            items: [
                "Warp the loom", "Weave a rug", "Try a new structure", "Sample a pattern", "Use handspun yarn",
                "Finish a scarf", "Hemstitching", "Fix a broken warp", "Weave a towel", "Try tapestry",
                "Mix fibers", "Organize yarn stash", "FREE SPACE", "Weave a placemat", "Attend a workshop",
                "Try doublewidth", "Weave transparency", "Calculate warp correctly", "Finish raw edges", "Weave with rags",
                "Try tablet weaving", "Rigid heddle project", "Floor loom project", "Visit a mill", "Share a project online"
            ]
        },
        spinning: {
            name: "Spinning Goals 🎡",
            items: [
                "Spin 100g fiber", "Ply a yarn", "Try a new breed", "Spin lace weight", "Spin art yarn",
                "Comb fleece", "Card a batt", "Spin on a drop spindle", "Clean the wheel", "Spin distinct colors",
                "Skein and wash", "Fractal spin", "FREE SPACE", "Spin silk", "Spin cotton",
                "Navajo ply", "Spin for a project", "Participate in Tour de Fleece", "Sample a blend", "Teach spinning",
                "Spin consistent grist", "Dye fiber", "Blend colors on hackle", "Spin exotic fiber", "Fill a bobbin"
            ]
        },
        painting: {
            name: "Painting Goals 🎨",
            items: [
                "Paint a landscape", "Try watercolors", "Paint a portrait", "Mix a new color", "Paint en plein air",
                "Visit a gallery", "Finish a sketchbook", "Try oils", "Paint a still life", "Use a palette knife",
                "Paint an animal", "Try abstract", "FREE SPACE", "Clean brushes properly", "Paint on canvas",
                "Paint on wood", "Follow a tutorial", "Paint a sky", "Try gouache", "Varnish a painting",
                "Frame a piece", "Paint daily for a week", "Recreate a master", "Paint a self-portrait", "Host a paint night"
            ]
        },
        corporate: {
            name: "Corporate Bingo 💼",
            items: [
                "\"Circle back\"", "\"Let's take this offline\"", "Meeting that could be an email", "\"Synergy\"", "\"Low hanging fruit\"",
                "\"Touch base\"", "Someone forgets to mute", "Screen share fails", "\"Can you see my screen?\"", "Awkward silence",
                "\"Bandwidth\"", "\"Deep dive\"", "FREE SPACE", "Pet interrupts video call", "Echo on the line",
                "\"Per my last email\"", "\"Drill down\"", "\"Out of pocket\"", "\"Hard stop\"", "\"Boil the ocean\"",
                "Reply All disaster", "\"Move the needle\"", "\"Blue sky thinking\"", "\"Paradigm shift\"", "\"Quick win\""
            ]
        },
        travel: {
            name: "Travel Bucket List ✈️",
            items: [
                "Visit a new continent", "Go on a solo trip", "See the Northern Lights", "Swim in an ocean", "Road trip across 3 states",
                "Fly First Class", "Visit a National Park", "Eat street food", "Stay in a hostel", "Learn 'Hello' in 5 languages",
                "Visit a Wonder of the World", "Go on a cruise", "FREE SPACE", "Make a travel vlog", "Sleep under the stars",
                "Visit a castle", "Ride a train", "See a volcano", "Go scuba diving", "Watch a sunrise on a mountain",
                "Visit a winery", "Ride a camel/elephant", "Go skiing/snowboarding", "Visit a tropical island", "Send a postcard"
            ]
        }
    };

    useEffect(() => {
        if (!user) return;

        const fetchBoards = async () => {
            try {
                console.log('Fetching boards for user:', user.uid, user.email);
                const allBoardsMap = new Map<string, BoardSummary>();

                // Primary query: Fetch boards where user is in the members map
                // This works with Firestore security rules and captures all roles (owner, editor, viewer)
                try {
                    const memberQuery = query(
                        collection(db, 'boards'),
                        where(`members.${user.uid}`, 'in', ['owner', 'editor', 'viewer'])
                    );
                    const memberSnapshot = await getDocs(memberQuery);
                    console.log('Boards with membership found:', memberSnapshot.docs.length);

                    memberSnapshot.docs.forEach(doc => {
                        const data = doc.data();
                        const role = data.members?.[user.uid];
                        // Count shared users (excluding owner)
                        const membersMap = data.members || {};
                        const sharedCount = Object.values(membersMap).filter(r => r !== 'owner').length;

                        allBoardsMap.set(doc.id, {
                            id: doc.id,
                            ...data,
                            sharedCount,
                            myRole: role as 'owner' | 'editor' | 'viewer',
                            members: membersMap
                        } as BoardSummary);
                    });
                } catch (e) {
                    console.error('Error querying boards by membership:', e);
                }

                // 2. Check the legacy 'years' collection for the user's old board
                try {
                    const yearsQuery = query(
                        collection(db, 'years'),
                        where('ownerId', '==', user.uid)
                    );
                    const yearsSnapshot = await getDocs(yearsQuery);
                    console.log('Legacy boards (years collection) found:', yearsSnapshot.docs.length);

                    yearsSnapshot.docs.forEach(doc => {
                        const data = doc.data();
                        allBoardsMap.set(`legacy_${doc.id}`, {
                            id: doc.id,
                            title: data.title || `2026 Bingo`,
                            createdAt: data.createdAt,
                            isLocked: data.isLocked,
                            ownerId: data.ownerId,
                            myRole: 'owner' as const,
                            members: {}
                        } as BoardSummary);
                    });
                } catch (e) {
                    console.log('Years collection query failed:', e);
                }

                // 4. Also check the '2026' document directly in years collection
                try {
                    const legacyDoc = await getDocs(collection(db, 'years'));
                    console.log('All years docs:', legacyDoc.docs.length);
                    legacyDoc.docs.forEach(doc => {
                        const data = doc.data();
                        // Check if this user created it or is a member
                        if (data.ownerId === user.uid || data.members?.[user.uid]) {
                            const key = `legacy_years_${doc.id}`;
                            if (!allBoardsMap.has(key)) {
                                allBoardsMap.set(key, {
                                    id: doc.id,
                                    title: data.title || `${doc.id} Bingo`,
                                    createdAt: data.createdAt,
                                    isLocked: data.isLocked,
                                    ownerId: data.ownerId,
                                    myRole: data.ownerId === user.uid ? 'owner' : (data.members?.[user.uid] || 'viewer') as any,
                                    members: data.members || {}
                                } as BoardSummary);
                            }
                        }
                    });
                } catch (e) {
                    console.log('Direct years fetch failed:', e);
                }

                const allBoards = Array.from(allBoardsMap.values());

                // Fetch owner names for shared boards
                const ownerIdsSet = new Set<string>();
                allBoards.forEach(b => {
                    if (b.myRole !== 'owner') {
                        if (b.ownerId && b.ownerId !== user.uid) ownerIdsSet.add(b.ownerId);
                        if (b.members) {
                            Object.entries(b.members).forEach(([uid, role]) => {
                                if (role === 'owner' && uid !== user.uid) ownerIdsSet.add(uid);
                            });
                        }
                    }
                });
                const ownerIds = Array.from(ownerIdsSet);

                // Lookup owner names from users collection
                const ownerNames: Record<string, string> = {};
                for (const ownerId of ownerIds) {
                    try {
                        const userDoc = await getDoc(doc(db, 'users', ownerId));
                        if (userDoc.exists()) {
                            const userData = userDoc.data();
                            ownerNames[ownerId] = userData.displayName || userData.email || 'Unknown';
                        }
                    } catch (e) {
                        console.log('Could not fetch owner info for:', ownerId);
                    }
                }

                // Update boards with owner names
                const boardsWithOwners = allBoards.map(board => {
                    let displayOwnerId = board.ownerId;
                    if (board.members) {
                        // Find an owner that is NOT the current user
                        const memberOwner = Object.keys(board.members).find(uid => board.members![uid] === 'owner' && uid !== user.uid);
                        if (memberOwner) displayOwnerId = memberOwner;
                    }

                    if (board.myRole !== 'owner' && displayOwnerId && ownerNames[displayOwnerId]) {
                        return { ...board, ownerName: ownerNames[displayOwnerId] };
                    }
                    return board;
                });

                console.log('Total boards to display:', boardsWithOwners.length, boardsWithOwners.map(b => b.title));
                setBoards(boardsWithOwners);
            } catch (error) {
                console.error("Error fetching boards:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchBoards();
    }, [user]);

    const handleCreateBoard = async (templateKey: keyof typeof TEMPLATES) => {
        if (!user) return;

        const template = TEMPLATES[templateKey];
        const gridSize = selectedGridSize;
        const totalCells = gridSize * gridSize;
        const centerIndex = gridSize % 2 === 1 ? Math.floor(totalCells / 2) : -1; // Only odd grids have center
        const itemsNeeded = gridSize % 2 === 1 ? totalCells - 1 : totalCells; // Account for free space

        const title = await dialog.prompt(
            "What would you like to call this board?",
            { title: 'Board Title', inputDefaultValue: template.name, confirmText: 'Create' }
        );
        if (!title) return;

        try {
            // Filter out explicit FREE SPACE from source to avoid duplicates when we inject it
            const rawItems = template.items.filter(i => i.trim().toUpperCase() !== "FREE SPACE" && i !== "FREE SPACE");

            // Shuffle
            const shuffled = [...rawItems].sort(() => 0.5 - Math.random());

            // Pad if necessary (cycle through items if not enough)
            while (shuffled.length < itemsNeeded) {
                shuffled.push(rawItems[shuffled.length % rawItems.length] || `Goal ${shuffled.length + 1}`);
            }

            const newItems = [];
            let itemIndex = 0;
            for (let i = 0; i < totalCells; i++) {
                if (i === centerIndex && gridSize % 2 === 1) {
                    newItems.push({
                        id: i,
                        text: "FREE ✨",
                        isCompleted: true,
                        isFreeSpace: true,
                        completedBy: 'System'
                    });
                } else {
                    newItems.push({
                        id: i,
                        text: shuffled[itemIndex],
                        isCompleted: false,
                        isFreeSpace: false,
                        targetCount: 1,
                        currentCount: 0
                    });
                    itemIndex++;
                }
            }

            const docRef = await addDoc(collection(db, 'boards'), {
                title,
                gridSize,
                ownerId: user.uid,
                members: { [user.uid]: 'owner' },
                items: newItems,
                createdAt: Timestamp.now(),
                isLocked: false,
                lastUpdated: Timestamp.now()
            });

            navigate(`/board/${docRef.id}`);
        } catch (error) {
            console.error("Error creating board:", error);
            await dialog.alert("Failed to create board. Please try again.", { title: 'Error', type: 'error' });
        } finally {
            setIsCreateModalOpen(false);
            setPreviewTemplate(null);
            setSelectedGridSize(5); // Reset to default
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-transparent p-6 relative">
                <div className="max-w-6xl mx-auto">
                    {/* Header Skeleton */}
                    <header className="flex justify-between items-center mb-12 py-2">
                        <Skeleton className="h-10 w-32 md:w-40" />
                        <div className="flex gap-2 items-center">
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="w-10 h-10 rounded-full" />
                            <Skeleton className="w-20 h-10 rounded-xl" />
                        </div>
                    </header>

                    {/* Hero Skeleton */}
                    <div className="mb-10">
                        <Skeleton className="h-12 w-64 mb-3 rounded-lg" />
                        <Skeleton className="h-6 w-48 rounded-md" />
                    </div>

                    {/* Grid Skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <Skeleton key={i} className="h-48 rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const handleDeleteBoard = async (e: React.MouseEvent, boardId: string, boardTitle: string) => {
        e.stopPropagation(); // Prevent opening the board

        const confirmed = await dialog.confirm(
            `This will permanently delete "${boardTitle}" and all its data.\n\nThis action cannot be undone.`,
            { title: 'Delete Board?', confirmText: 'Delete', type: 'error' }
        );

        if (confirmed) {
            try {
                await deleteDoc(doc(db, 'boards', boardId));
                setBoards(prev => prev.filter(b => b.id !== boardId));
                await dialog.alert('Board deleted successfully.', { title: 'Deleted', type: 'success' });
            } catch (error) {
                console.error("Error deleting board:", error);
                await dialog.alert('Failed to delete board. Please try again.', { title: 'Error', type: 'error' });
            }
        }
    };

    const handleLeaveBoard = async (e: React.MouseEvent, boardId: string, boardTitle: string) => {
        e.stopPropagation(); // Prevent opening the board

        if (!user) return;

        const confirmed = await dialog.confirm(
            `You will no longer have access to "${boardTitle}".\n\nYou can ask the owner to re-share it if needed.`,
            { title: 'Leave Board?', confirmText: 'Leave', type: 'warning' }
        );

        if (confirmed) {
            try {
                // Remove user from the board's members map
                await updateDoc(doc(db, 'boards', boardId), {
                    [`members.${user.uid}`]: deleteField()
                });
                setBoards(prev => prev.filter(b => b.id !== boardId));
                await dialog.alert('You have left the board.', { title: 'Left Board', type: 'success' });
            } catch (error) {
                console.error("Error leaving board:", error);
                await dialog.alert('Failed to leave board. Please try again.', { title: 'Error', type: 'error' });
            }
        }
    };

    return (
        <div>
            <div className="max-w-6xl mx-auto">


                {/* Hero / Greeting Section */}
                <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-semibold text-white tracking-tight">
                            My Boards
                        </h1>
                        <p className="text-slate-400 mt-1">
                            Welcome back, <span className="text-white font-medium">{user?.displayName?.split(' ')[0] || 'Bingo Player'}</span>
                        </p>
                    </div>

                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-bg-dark font-bold rounded-lg hover:bg-slate-200 transition-colors shadow-lg active:scale-95"
                    >
                        <Plus className="w-5 h-5" />
                        <span>New Board</span>
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* (Card Removed) */}

                    {/* My Boards - boards I own */}
                    {boards.filter(b => b.myRole === 'owner').map(board => {
                        const isLegacyBoard = board.id === '2026' || !board.ownerId;
                        const boardPath = isLegacyBoard ? `/board/legacy/${board.id}` : `/board/${board.id}`;

                        return (
                            <div
                                key={board.id}
                                onClick={(e) => {
                                    e.preventDefault();
                                    console.log('Navigating to board:', boardPath);
                                    navigate(boardPath);
                                }}
                                className="pro-card group relative h-48 p-6 flex flex-col justify-between cursor-pointer overflow-hidden active:scale-[0.99] hover:bg-zinc-900"
                            >
                                {/* Action Buttons Container */}
                                <div className="absolute top-4 right-4 flex gap-2 z-20">
                                    <button
                                        onClick={(e) => handleDeleteBoard(e, board.id, board.title)}
                                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-white/10 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                        title="Delete Board"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>

                                {/* Content Stack */}
                                <div className="relative z-10 flex flex-col h-full">
                                    <div className="flex-1">
                                        {/* Badge Area */}
                                        <div className="h-7 mb-2">
                                            {!!board.sharedCount && board.sharedCount > 0 && (
                                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                                    <Users size={10} />
                                                    Shared with {board.sharedCount}
                                                </span>
                                            )}
                                        </div>

                                        {editingBoardId === board.id ? (
                                            <div className="flex items-center gap-2 mb-1.5 z-30 relative" onClick={e => e.stopPropagation()}>
                                                <input
                                                    type="text"
                                                    value={editTitleValue}
                                                    onChange={(e) => setEditTitleValue(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    onClick={e => e.stopPropagation()}
                                                    autoFocus
                                                    className="bg-black/50 text-white font-bold text-xl rounded px-2 py-0.5 border border-accent-primary outline-none min-w-0 flex-1 w-full"
                                                />
                                                <button onClick={handleSaveEdit} className="p-1 text-green-400 hover:bg-green-400/20 rounded-full transition-colors"><Check size={18} /></button>
                                                <button onClick={handleCancelEdit} className="p-1 text-red-400 hover:bg-red-400/20 rounded-full transition-colors"><X size={18} /></button>
                                            </div>
                                        ) : (
                                            <div className="flex items-start gap-2 pr-8 mb-1.5">
                                                <h3 className="text-xl font-bold text-white line-clamp-2 group-hover:text-accent-primary transition-colors">
                                                    {board.title}
                                                </h3>
                                                <button
                                                    onClick={(e) => handleStartEdit(e, board)}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-all z-20"
                                                    title="Rename Board"
                                                >
                                                    <Pencil size={14} />
                                                </button>
                                            </div>
                                        )}

                                        <div className="flex items-center gap-2 text-xs text-slate-400">
                                            <Calendar className="w-3.5 h-3.5" />
                                            {board.createdAt?.toDate ? board.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                                        </div>
                                    </div>

                                    <div className="mt-4">
                                        <span className="inline-block px-4 py-1.5 rounded-xl text-xs font-bold bg-accent-primary/10 text-accent-primary border border-accent-primary/20 group-hover:bg-accent-primary group-hover:text-white transition-all shadow-sm">
                                            Open Board
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Shared With Me Section */}
                {boards.filter(b => b.myRole !== 'owner').length > 0 && (
                    <>
                        <h2 className="text-xl font-bold text-white mt-10 mb-6 flex items-center gap-2">
                            <span className="bg-gradient-to-r from-accent-secondary to-pink-500 bg-clip-text text-transparent">
                                Shared With Me
                            </span>
                            <span className="text-sm font-normal text-slate-500">
                                ({boards.filter(b => b.myRole !== 'owner').length})
                            </span>
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {boards.filter(b => b.myRole !== 'owner').map(board => {
                                const isLegacyBoard = board.id === '2026' || !board.ownerId;
                                const boardPath = isLegacyBoard ? `/board/legacy/${board.id}` : `/board/${board.id}`;

                                return (
                                    <div
                                        key={board.id}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            console.log('Navigating to shared board:', boardPath);
                                            navigate(boardPath);
                                        }}
                                        className="pro-card group relative h-48 p-6 flex flex-col justify-between cursor-pointer overflow-hidden active:scale-[0.99] hover:bg-zinc-900"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                            <LayoutGrid className="w-24 h-24" />
                                        </div>

                                        {/* Action Buttons Container */}
                                        <div className="absolute top-4 right-4 flex gap-2 z-20">
                                            <button
                                                onClick={(e) => handleLeaveBoard(e, board.id, board.title)}
                                                className="p-2 text-slate-500 hover:text-amber-400 hover:bg-white/10 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                                                title="Leave Board"
                                            >
                                                <LogOut size={18} />
                                            </button>
                                        </div>

                                        {/* Content Stack */}
                                        <div className="relative z-10 flex flex-col h-full">
                                            <div className="flex-1">
                                                {/* Badge Area */}
                                                <div className="h-7 mb-2">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${board.myRole === 'editor'
                                                        ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30'
                                                        : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                        }`}>
                                                        {board.myRole === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
                                                    </span>
                                                </div>

                                                <h3 className="text-xl font-bold text-white mb-1 line-clamp-1 pr-8">
                                                    {board.title}
                                                </h3>
                                                {board.ownerName && (
                                                    <div className="text-xs text-slate-500 mb-1.5">
                                                        Shared by <span className="text-slate-400">{board.ownerName}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    {board.createdAt?.toDate ? board.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                                                </div>
                                            </div>

                                            <div className="mt-4">
                                                <span className="inline-block px-4 py-1.5 rounded-xl text-xs font-bold bg-accent-secondary/10 text-accent-secondary border border-accent-secondary/20 group-hover:bg-accent-secondary group-hover:text-white transition-all shadow-sm">
                                                    Open Board
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* Template Selection Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { if (previewTemplate) setPreviewTemplate(null); else setIsCreateModalOpen(false); }} />
                    <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold text-white">
                                {previewTemplate ? TEMPLATES[previewTemplate].name : "Choose a Template"}
                            </h2>
                            <button onClick={() => { if (previewTemplate) setPreviewTemplate(null); else setIsCreateModalOpen(false); }} className="text-slate-400 hover:text-white">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {previewTemplate ? (
                                <div className="space-y-6">
                                    {/* Grid Size Selector */}
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">Grid Size</h3>
                                        <div className="grid grid-cols-4 gap-2">
                                            {GRID_SIZE_OPTIONS.map(({ size, label, icon }) => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedGridSize(size)}
                                                    className={`p-3 rounded-xl border text-center transition-all ${selectedGridSize === size
                                                        ? 'bg-accent-primary/20 border-accent-primary text-white'
                                                        : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10 hover:text-white'
                                                        }`}
                                                >
                                                    <span className="text-lg block">{icon}</span>
                                                    <span className="font-bold text-sm">{label}</span>
                                                    <span className="text-[10px] block opacity-70">{size * size} tiles</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Preview Grid */}
                                    <div className="flex justify-center">
                                        <div
                                            className={`aspect-square w-full max-w-[380px] grid gap-1.5 p-3 bg-slate-950/50 rounded-xl border border-white/10 ${selectedGridSize === 3 ? 'grid-cols-3' :
                                                selectedGridSize === 4 ? 'grid-cols-4' :
                                                    selectedGridSize === 5 ? 'grid-cols-5' :
                                                        'grid-cols-6'
                                                }`}
                                        >
                                            {(() => {
                                                const totalCells = selectedGridSize * selectedGridSize;
                                                const centerIndex = selectedGridSize % 2 === 1 ? Math.floor(totalCells / 2) : -1;
                                                const rawItems = TEMPLATES[previewTemplate].items.filter(i => i.trim().toUpperCase() !== "FREE SPACE");

                                                return Array.from({ length: totalCells }, (_, i) => {
                                                    const isFreeSpace = i === centerIndex && selectedGridSize % 2 === 1;
                                                    const itemIndex = i < centerIndex || centerIndex === -1 ? i : i - 1;
                                                    const text = isFreeSpace ? "FREE" : (rawItems[itemIndex % rawItems.length] || `Goal ${i + 1}`);

                                                    return (
                                                        <div
                                                            key={i}
                                                            className={`
                                                                relative rounded-lg flex items-center justify-center p-1 text-center select-none overflow-hidden 
                                                                ${selectedGridSize <= 4 ? 'text-[9px] sm:text-[11px]' : 'text-[7px] sm:text-[9px]'}
                                                                leading-tight font-medium border shadow-sm
                                                                ${isFreeSpace
                                                                    ? 'bg-gradient-to-br from-accent-gold/20 to-accent-secondary/20 border-accent-gold/50 text-accent-gold font-bold'
                                                                    : 'bg-white/5 border-white/10 text-slate-300'}
                                                            `}
                                                        >
                                                            <span className="line-clamp-2">{text}</span>
                                                        </div>
                                                    );
                                                });
                                            })()}
                                        </div>
                                    </div>

                                    <div className="flex gap-3 pt-4">
                                        <button
                                            onClick={() => setPreviewTemplate(null)}
                                            className="flex-1 py-3 rounded-xl font-semibold bg-white/5 text-slate-300 hover:bg-white/10 transition-colors"
                                        >
                                            Back
                                        </button>
                                        <button
                                            onClick={() => handleCreateBoard(previewTemplate)}
                                            className="flex-1 py-3 bg-gradient-to-r from-accent-primary to-accent-secondary rounded-xl font-bold text-white shadow-lg hover:shadow-accent-primary/25 transition-all"
                                        >
                                            Create {selectedGridSize}×{selectedGridSize} Board
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {Object.entries(TEMPLATES).map(([key, template]) => (
                                        <button
                                            key={key}
                                            onClick={() => setPreviewTemplate(key as keyof typeof TEMPLATES)}
                                            className="flex flex-col items-start p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-accent-primary/50 transition-all text-left group"
                                        >
                                            <h3 className="font-bold text-white group-hover:text-accent-primary transition-colors">{template.name}</h3>
                                            <p className="text-sm text-slate-400 mt-1">Click to preview</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
