import { useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { type BingoYear, type BingoItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { triggerConfetti } from '../utils/confetti';

const YEAR_DOC_ID = '2026';
const TOTAL_CELLS = 25;

const INITIAL_ITEMS: string[] = [
    "Travel to a new country", "Host a dinner party", "Read 12 books", "Go camping", "Try a new hobby",
    "Exercise 3x/week for a month", "Save a specific amount", "Visit a museum", "Date night at a fancy place", "Cook a complex meal",
    "Walk 10k steps for a week", "Watch all Oscar nominees", "FREE SPACE", "Volunteer somewhere", "Learn a new skill",
    "No takeout for a month", "Go to a concert", "Plant a garden", "Digital detox weekend", "Write a journal",
    "Call parents weekly", "Take a spontaneous trip", "Learn a new recipe", "Do a puzzle", "Visit a national park"
];

export const useBingo = () => {
    const { user } = useAuth();
    const [items, setItems] = useState<BingoItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasWon, setHasWon] = useState(false);

    useEffect(() => {
        if (!user) return;

        const docRef = doc(db, 'years', YEAR_DOC_ID);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as BingoYear;
                // Sort items by ID just in case
                setItems(data.items.sort((a, b) => a.id - b.id));
                // Check win condition locally for UI
                checkWin(data.items);
            } else {
                // Initialize if not exists
                initializeBoard();
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const initializeBoard = async () => {
        // Shuffle the initial items to be random
        const shuffled = [...INITIAL_ITEMS].sort(() => 0.5 - Math.random());

        const newItems: BingoItem[] = [];
        let itemIndex = 0;

        for (let i = 0; i < TOTAL_CELLS; i++) {
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
                    isFreeSpace: false
                });
                itemIndex++;
            }
        }

        await setDoc(doc(db, 'years', YEAR_DOC_ID), {
            year: 2026,
            items: newItems,
            lastUpdated: Timestamp.now()
        });
    };

    const toggleItem = async (index: number) => {
        if (!items.length) return;

        const newItems = [...items];
        const item = newItems[index];

        // Toggle
        item.isCompleted = !item.isCompleted;
        if (item.isCompleted) {
            item.completedBy = user?.displayName || user?.email || 'Unknown';
            item.completedAt = Timestamp.now();
            triggerConfetti(0.5); // Small confetti on check
        } else {
            item.completedBy = undefined;
            item.completedAt = undefined;
        }

        // Optimistic update
        setItems(newItems);
        checkWin(newItems);

        // Save to DB
        const docRef = doc(db, 'years', YEAR_DOC_ID);
        await updateDoc(docRef, {
            items: newItems,
            lastUpdated: Timestamp.now()
        });
    };

    const updateItemText = async (index: number, newText: string) => {
        const newItems = [...items];
        newItems[index].text = newText;
        setItems(newItems);

        const docRef = doc(db, 'years', YEAR_DOC_ID);
        await updateDoc(docRef, {
            items: newItems,
            lastUpdated: Timestamp.now()
        });
    };

    const checkWin = (currentItems: BingoItem[]) => {
        const wins = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Cols
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
        ];

        const completedIndices = new Set(currentItems.filter(i => i.isCompleted).map(i => i.id));
        let isBingo = false;

        for (let combination of wins) {
            if (combination.every(idx => completedIndices.has(idx))) {
                isBingo = true;
                break;
            }
        }

        if (isBingo && !hasWon) {
            setHasWon(true);
            triggerConfetti(2); // BIG confetti
        } else if (!isBingo) {
            setHasWon(false);
        }
    };

    return { items, loading, toggleItem, updateItemText, hasWon };
};
