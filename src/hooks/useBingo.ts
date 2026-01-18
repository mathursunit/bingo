import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, Timestamp, getDoc, deleteField } from 'firebase/firestore';
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

        // Create a deep copy to avoid mutating state directly
        const newItems = items.map(item => ({ ...item }));
        const item = newItems[index];

        // Toggle
        item.isCompleted = !item.isCompleted;
        if (item.isCompleted) {
            item.completedBy = user?.displayName || user?.email || 'Unknown';
            item.completedAt = Timestamp.now();
            triggerConfetti(0.5);
        } else {
            // Use null instead of undefined for Firestore
            item.completedBy = null as any;
            item.completedAt = null as any;
        }

        // Optimistic update
        setItems(newItems);
        checkWin(newItems);

        // Save to DB
        try {
            const docRef = doc(db, 'years', YEAR_DOC_ID);
            await updateDoc(docRef, {
                items: newItems,
                lastUpdated: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating bingo board:", error);
            // Revert state if sync fails? Optionally could reload from DB
        }
    };

    const updateItemText = async (index: number, newText: string) => {
        const newItems = items.map(item => ({ ...item })); // Deep copy
        newItems[index].text = newText;
        setItems(newItems);

        try {
            const docRef = doc(db, 'years', YEAR_DOC_ID);
            await updateDoc(docRef, {
                items: newItems,
                lastUpdated: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating text:", error);
        }
    };

    const updateItemStyle = async (index: number, newStyle: BingoItem['style']) => {
        const newItems = items.map(item => ({ ...item })); // Deep copy
        newItems[index] = { ...newItems[index], style: newStyle };
        setItems(newItems);

        try {
            const docRef = doc(db, 'years', YEAR_DOC_ID);
            await updateDoc(docRef, {
                items: newItems,
                lastUpdated: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating style:", error);
        }
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

        if (isBingo) {
            if (!hasWon) {
                setHasWon(true);
                triggerConfetti(2);
            }
        } else {
            setHasWon(false);
        }
    };

    const bingoCount = useMemo(() => {
        const wins = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
        ];
        const completedIndices = new Set(items.filter(i => i.isCompleted).map(i => i.id));
        return wins.reduce((acc, line) => line.every(i => completedIndices.has(i)) ? acc + 1 : acc, 0);
    }, [items]);

    // Lock State Logic
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        const unsub = onSnapshot(doc(db, 'years', '2026'), (doc) => {
            if (doc.exists()) {
                setIsLocked(doc.data().isLocked || false);
            }
        });
        return () => unsub();
    }, []);

    const lockBoard = async () => {
        // Just lock without jumbling (if needed, but main flow is jumble)
        await setDoc(doc(db, 'years', '2026'), { isLocked: true }, { merge: true });
    };

    const jumbleAndLock = async () => {
        // Backup current order
        const currentItems = [...items];

        // Shuffle everything except center (index 12)
        // Extract center
        const center = currentItems[12];
        const others = [...currentItems.slice(0, 12), ...currentItems.slice(13)];

        // Fisher-Yates shuffle
        for (let i = others.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [others[i], others[j]] = [others[j], others[i]];
        }

        // Reconstruct: 0-11, Center, 12-23
        const newItems = [
            ...others.slice(0, 12),
            center,
            ...others.slice(12)
        ];

        await setDoc(doc(db, 'years', '2026'), {
            isLocked: true,
            items: newItems,
            itemsBackup: currentItems, // Save backup
            lastUpdated: Timestamp.now()
        }, { merge: true });
    };

    const unlockBoard = async () => {
        // Restore from backup if exists
        try {
            const docRef = doc(db, 'years', '2026');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.itemsBackup) {
                    // Restore backup and delete the field
                    await updateDoc(docRef, {
                        items: data.itemsBackup,
                        itemsBackup: deleteField(),
                        isLocked: false,
                        lastUpdated: Timestamp.now()
                    });
                } else {
                    // Normal unlock
                    await updateDoc(docRef, { isLocked: false, lastUpdated: Timestamp.now() });
                }
            }
        } catch (error) {
            console.error("Error unlocking board:", error);
        }
    };

    return { items, loading, toggleItem, updateItemText, updateItemStyle, hasWon, bingoCount, isLocked, lockBoard, jumbleAndLock, unlockBoard };
};

