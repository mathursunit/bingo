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

    const handleCreateBoard = async () => {
        if (!user) return;

        const title = prompt("Enter board title (e.g., '2026 Goals'):", "2026 Goals");
        if (!title) return;

        try {
            // Create a new board document
            // We rely on useBingo's initializeBoard logic to populate items logic 
            // when we first visit the board, OR we can populate here.
            // Let's populate minimal metadata here and let useBingo handle the items on first load if empty.
            // Actually useBingo currently initializes if doc doesn't exist. 
            // So we just need to generate an ID.

            // Wait, if we use addDoc, it creates the doc. useBingo sees it exists.
            // So we need to put the items in NOW or update useBingo to check for empty items.
            // useBingo checks `if (docSnap.exists())`.
            // So if we create it here, useBingo sees it exists.
            // So we MUST initialize items here.

            const INITIAL_ITEMS = [
                "Travel to a new country", "Host a dinner party", "Read 12 books", "Go camping", "Try a new hobby",
                "Exercise 3x/week for a month", "Save a specific amount", "Visit a museum", "Date night at a fancy place", "Cook a complex meal",
                "Walk 10k steps for a week", "Watch all Oscar nominees", "FREE SPACE", "Volunteer somewhere", "Learn a new skill",
                "No takeout for a month", "Go to a concert", "Plant a garden", "Digital detox weekend", "Write a journal",
                "Call parents weekly", "Take a spontaneous trip", "Learn a new recipe", "Do a puzzle", "Visit a national park"
            ];

            // Shuffle
            const shuffled = [...INITIAL_ITEMS].sort(() => 0.5 - Math.random());
            const newItems = [];
            let itemIndex = 0;
            for (let i = 0; i < 25; i++) {
                if (i === 12) {
                    newItems.push({
                        id: i,
                        text: "2026 ✨",
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
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-bg-dark flex items-center justify-center text-white">Loading Dashboard...</div>;
    }

    return (
        <div className="min-h-screen bg-bg-dark text-white p-6">
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
                        onClick={handleCreateBoard}
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
        </div>
    );
};
