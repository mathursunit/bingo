import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp, updateDoc, deleteField, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { useDialog } from '../contexts/DialogContext';
import { useSettings } from '../contexts/SettingsContext';
import { Plus, LayoutGrid, Calendar, Trash2, LogOut, Users, Settings } from 'lucide-react';

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
}

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
    const dialog = useDialog();
    const { openSettings } = useSettings();
    const navigate = useNavigate();
    const [boards, setBoards] = useState<BoardSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [previewTemplate, setPreviewTemplate] = useState<keyof typeof TEMPLATES | null>(null);

    // Template Data
    const TEMPLATES = {
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
                            myRole: role as 'owner' | 'editor' | 'viewer'
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
                            myRole: 'owner' as const
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
                                    myRole: data.ownerId === user.uid ? 'owner' : (data.members?.[user.uid] || 'viewer') as any
                                } as BoardSummary);
                            }
                        }
                    });
                } catch (e) {
                    console.log('Direct years fetch failed:', e);
                }

                const allBoards = Array.from(allBoardsMap.values());

                // Fetch owner names for shared boards
                const sharedBoards = allBoards.filter(b => b.myRole !== 'owner' && b.ownerId);
                const ownerIds = [...new Set(sharedBoards.map(b => b.ownerId!))];

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
                    if (board.myRole !== 'owner' && board.ownerId && ownerNames[board.ownerId]) {
                        return { ...board, ownerName: ownerNames[board.ownerId] };
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

            // Pad if necessary
            while (shuffled.length < 24) shuffled.push("Bonus Task ✨");

            const newItems = [];
            let itemIndex = 0;
            for (let i = 0; i < 25; i++) {
                if (i === 12) {
                    newItems.push({
                        id: i,
                        text: "FREE SPACE ✨",
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
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-white">Loading Dashboard...</div>;
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
        <div className="min-h-screen bg-bg-dark text-white p-6 relative">
            <div className="max-w-4xl mx-auto">
                <header className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
                    <div className="flex items-center gap-4">
                        <img
                            src="/logo.png"
                            alt="SunSar Bingo"
                            className="h-14 w-auto object-contain cursor-pointer active:scale-95 transition-transform mix-blend-screen"
                        />
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                                My Boards
                            </h1>
                            <p className="text-slate-400 mt-1 text-sm">Welcome back, {user?.displayName || 'Bingo Player'}</p>
                        </div>
                    </div>
                    <div className="flex gap-3 items-center">
                        <button
                            onClick={openSettings}
                            className="p-2.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors border border-transparent hover:border-white/10"
                            title="Settings"
                        >
                            <Settings size={20} />
                        </button>
                        <button
                            onClick={logout}
                            className="bg-white/5 hover:bg-white/10 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors border border-white/5 hover:border-white/10"
                        >
                            Logout
                        </button>
                    </div>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Create New Card */}
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="group relative flex flex-col items-center justify-center h-48 rounded-2xl border-2 border-dashed border-slate-700 bg-white/5 hover:bg-white/10 hover:border-accent-primary transition-all cursor-pointer"
                    >
                        <div className="w-12 h-12 rounded-full bg-accent-primary/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus className="w-6 h-6 text-accent-primary" />
                        </div>
                        <span className="font-semibold text-slate-300 group-hover:text-white">Create New Board</span>
                    </button>

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
                                className="group relative h-48 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 hover:border-accent-primary/50 p-6 flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-4px] hover:shadow-xl overflow-hidden active:scale-[0.99]"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                    <LayoutGrid className="w-24 h-24" />
                                </div>

                                {/* Delete button for owned boards */}
                                <button
                                    onClick={(e) => handleDeleteBoard(e, board.id, board.title)}
                                    className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-white/10 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-20"
                                    title="Delete Board"
                                >
                                    <Trash2 size={18} />
                                </button>

                                {/* Shared badge for owned boards */}
                                {board.sharedCount && board.sharedCount > 0 && (
                                    <div className="absolute top-4 left-4 z-10 pointer-events-none">
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                                            <Users size={10} />
                                            Shared with {board.sharedCount}
                                        </span>
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-xl font-bold text-white mb-2 line-clamp-1 group-active:scale-[0.98] transition-transform">{board.title}</h3>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Calendar className="w-3 h-3" />
                                        {board.createdAt?.toDate ? board.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-accent-primary/20 text-accent-primary border border-accent-primary/20 group-hover:bg-accent-primary group-hover:text-white transition-colors">
                                        Open Board
                                    </span>
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
                                        className="group relative h-48 rounded-2xl bg-gradient-to-br from-slate-800/80 to-slate-900/80 border border-white/10 hover:border-accent-secondary/50 p-6 flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-4px] hover:shadow-xl overflow-hidden active:scale-[0.99]"
                                    >
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
                                            <LayoutGrid className="w-24 h-24" />
                                        </div>

                                        {/* Leave button for shared boards */}
                                        <button
                                            onClick={(e) => handleLeaveBoard(e, board.id, board.title)}
                                            className="absolute top-4 right-4 p-2 text-slate-500 hover:text-amber-400 hover:bg-white/10 rounded-full transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100 z-20"
                                            title="Leave Board"
                                        >
                                            <LogOut size={18} />
                                        </button>

                                        {/* Role Badge */}
                                        <div className="absolute top-4 left-4 z-10 pointer-events-none">
                                            <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${board.myRole === 'editor'
                                                ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30'
                                                : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                                }`}>
                                                {board.myRole === 'editor' ? '✏️ Editor' : '👁️ Viewer'}
                                            </span>
                                        </div>

                                        <div className="mt-6">
                                            <h3 className="text-xl font-bold text-white mb-1 line-clamp-1">{board.title}</h3>
                                            {board.ownerName && (
                                                <div className="text-xs text-slate-500 mb-1">
                                                    Shared by <span className="text-slate-400">{board.ownerName}</span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-2 text-xs text-slate-400">
                                                <Calendar className="w-3 h-3" />
                                                {board.createdAt?.toDate ? board.createdAt.toDate().toLocaleDateString() : 'Unknown date'}
                                            </div>
                                        </div>

                                        <div className="mt-auto">
                                            <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/20 group-hover:bg-accent-secondary group-hover:text-white transition-colors">
                                                Open Board
                                            </span>
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
                                    <div className="flex justify-center mb-6">
                                        <div className="aspect-square w-full max-w-[420px] grid grid-cols-5 gap-2 p-3 bg-slate-950/50 rounded-xl border border-white/10">
                                            {TEMPLATES[previewTemplate].items.slice(0, 25).map((item, i) => {
                                                const isCenter = i === 12;
                                                const isFreeSpace = item.trim().toUpperCase() === "FREE SPACE" || isCenter;

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`
                                                            relative rounded-lg flex items-center justify-center p-1 text-center select-none overflow-hidden 
                                                            text-[8px] sm:text-[10px] leading-tight font-medium border shadow-sm
                                                            ${isFreeSpace
                                                                ? 'bg-gradient-to-br from-accent-gold/20 to-accent-secondary/20 border-accent-gold/50 text-accent-gold font-bold'
                                                                : 'bg-white/5 border-white/10 text-slate-300'}
                                                        `}
                                                    >
                                                        {isFreeSpace ? "FREE" : item}
                                                    </div>
                                                );
                                            })}
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
                                            Create Board
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
