import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { Plus, LayoutGrid, Calendar } from 'lucide-react';

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

    // Template Data
    const TEMPLATES = {
        default: {
            name: "2026 Goals",
            items: [
                "Travel to a new country", "Host a dinner party", "Read 12 books", "Go camping", "Try a new hobby",
                "Exercise 3x/week for a month", "Save a specific amount", "Visit a museum", "Date night at a fancy place", "Cook a complex meal",
                "Walk 10k steps for a week", "Watch all Oscar nominees", "FREE SPACE", "Volunteer somewhere", "Learn a new skill",
                "No takeout for a month", "Go to a concert", "Plant a garden", "Digital detox weekend", "Write a journal",
                "Call parents weekly", "Take a spontaneous trip", "Learn a new recipe", "Do a puzzle", "Visit a national park"
            ]
        },
        fitness: {
            name: "Fitness Challenge",
            items: [
                "Run a 5k", "Do 50 pushups in a row", "Try a yoga class", "Drink 3L water for a week", "No sugar for 7 days",
                "Go for a hike", "Meal prep for a week", "Climb a bouldering wall", "Try Pilates", "Walk 15k steps in a day",
                "Do a spin class", "Bike 20km", "FREE SPACE", "Touch your toes", "Hold a plank for 2 min",
                "Try CrossFit", "Go swimming", "Meditate for 10 mins x 7", "Try a new sport", "Sleep 8 hours x 5 days",
                "Do 100 squats", "Run a 10k", "Go to the gym 4x in a week", "Stretch daily for a week", "Join a run club"
            ]
        },
        corporate: {
            name: "Corporate Bingo",
            items: [
                "\"Circle back\"", "\"Let's take this offline\"", "Meeting that could be an email", "\"Synergy\"", "\"Low hanging fruit\"",
                "\"Touch base\"", "Someone forgets to mute", "Screen share fails", "\"Can you see my screen?\"", "Awkward silence",
                "\"Bandwidth\"", "\"Deep dive\"", "FREE SPACE", "Pet interrupts video call", "Echo on the line",
                "\"Per my last email\"", "\"Drill down\"", "\"Out of pocket\"", "\"Hard stop\"", "\"Boil the ocean\"",
                "Reply All disaster", "\"Move the needle\"", "\"Blue sky thinking\"", "\"Paradigm shift\"", "\"Quick win\""
            ]
        },
        travel: {
            name: "Travel Bucket List",
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

    return (
        <div className="min-h-screen bg-bg-dark text-white p-6 relative">
            <div className="max-w-4xl mx-auto">
                <header className="flex justify-between items-center mb-10">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-accent-primary to-accent-secondary bg-clip-text text-transparent">
                            My Boards
                        </h1>
                        <p className="text-slate-400 mt-1">Welcome back, {user?.displayName || 'Bingo Player'}</p>
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
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCreateModalOpen(false)} />
                    <div className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-white">Choose a Template</h2>
                            <button onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white">
                                <Plus className="w-6 h-6 rotate-45" />
                            </button>
                        </div>

                        <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {Object.entries(TEMPLATES).map(([key, template]) => (
                                <button
                                    key={key}
                                    onClick={() => handleCreateBoard(key as keyof typeof TEMPLATES)}
                                    className="flex flex-col items-start p-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-accent-primary/50 transition-all text-left group"
                                >
                                    <h3 className="font-bold text-white group-hover:text-accent-primary transition-colors">{template.name}</h3>
                                    <p className="text-sm text-slate-400 mt-1">Click to create this board</p>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
