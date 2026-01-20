import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, LayoutGrid, Calendar, Trash2 } from 'lucide-react';

interface BoardSummary {
    id: string;
    title: string;
    theme?: string;
    createdAt: any;
    isLocked?: boolean;
}

export const Dashboard: React.FC = () => {
    const { user, logout } = useAuth();
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
                // Query boards where I am the owner
                // TODO: Add support for 'members' map check or 'users' collection lookup
                const q = query(
                    collection(db, 'boards'),
                    where('ownerId', '==', user.uid)
                );

                const snapshot = await getDocs(q);
                const fetchedBoards: BoardSummary[] = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                } as BoardSummary));

                setBoards(fetchedBoards);
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
        const title = prompt("Enter board title:", template.name);
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
            alert("Failed to create board");
        } finally {
            setIsCreateModalOpen(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-white">Loading Dashboard...</div>;
    }

    const handleDeleteBoard = async (e: React.MouseEvent, boardId: string, boardTitle: string) => {
        e.stopPropagation(); // Prevent opening the board

        if (confirm(`Are you sure you want to delete the board "${boardTitle}"?\n\nThis action cannot be undone.`)) {
            try {
                await deleteDoc(doc(db, 'boards', boardId));
                setBoards(prev => prev.filter(b => b.id !== boardId));
            } catch (error) {
                console.error("Error deleting board:", error);
                alert("Failed to delete board");
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
                            className="h-14 w-auto object-contain cursor-pointer active:scale-95 transition-transform"
                        />
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                                My Boards
                            </h1>
                            <p className="text-slate-400 mt-1 text-sm">Welcome back, {user?.displayName || 'Bingo Player'}</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={logout}
                            className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg text-sm font-semibold transition-colors"
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

                    {/* Board Cards */}
                    {boards.map(board => (
                        <div
                            key={board.id}
                            onClick={() => navigate(`/board/${board.id}`)}
                            className="group relative h-48 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 hover:border-accent-secondary/50 p-6 flex flex-col justify-between cursor-pointer transition-all hover:translate-y-[-4px] hover:shadow-xl overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                <LayoutGrid className="w-24 h-24" />
                            </div>

                            <button
                                onClick={(e) => handleDeleteBoard(e, board.id, board.title)}
                                className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-white/10 rounded-full transition-all opacity-0 group-hover:opacity-100 z-10"
                                title="Delete Board"
                            >
                                <Trash2 size={18} />
                            </button>

                            <div>
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{board.title}</h3>
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
                    ))}
                </div>
            </div>

            {/* Template Selection Modal */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setIsCreateModalOpen(false); setPreviewTemplate(null); }} />
                    <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center shrink-0">
                            <h2 className="text-xl font-bold text-white">
                                {previewTemplate ? TEMPLATES[previewTemplate].name : "Choose a Template"}
                            </h2>
                            <button onClick={() => { setIsCreateModalOpen(false); setPreviewTemplate(null); }} className="text-slate-400 hover:text-white">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            {previewTemplate ? (
                                <div className="space-y-6">
                                    <div className="flex justify-center mb-6">
                                        <div className="aspect-square w-full max-w-[320px] grid grid-cols-5 gap-1.5 p-2 bg-slate-950/50 rounded-xl border border-white/10">
                                            {TEMPLATES[previewTemplate].items.slice(0, 25).map((item, i) => {
                                                const isCenter = i === 12;
                                                const isFreeSpace = item.trim().toUpperCase() === "FREE SPACE" || isCenter;

                                                return (
                                                    <div
                                                        key={i}
                                                        className={`
                                                            relative rounded flex items-center justify-center p-0.5 text-center select-none overflow-hidden 
                                                            text-[6px] sm:text-[8px] leading-tight font-medium border shadow-sm
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
