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
    const [isLocked, setIsLocked] = useState(false);

    useEffect(() => {
        if (!user) return;

        const docRef = doc(db, 'years', YEAR_DOC_ID);

        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as BingoYear;
                // Important: Do NOT sort by ID. Firestore stores the array in order.
                // Sorting by ID would undo any 'Jumble' operation visually.
                setItems(data.items);

                checkWin(data.items);
                setIsLocked(data.isLocked || false);
            } else {
                initializeBoard();
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const checkWin = (currentItems: BingoItem[]) => {
        const wins = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Cols
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
        ];

        // Check using Indices (Position), not IDs.
        const completedPositions = new Set(currentItems.map((item, index) => item.isCompleted ? index : -1));

        let isBingo = false;
        for (let combination of wins) {
            if (combination.every(idx => completedPositions.has(idx))) {
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

    const initializeBoard = async () => {
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
        const newItems = items.map(item => ({ ...item }));
        const item = newItems[index];

        if (item.isFreeSpace) return;

        item.isCompleted = !item.isCompleted;
        if (item.isCompleted) {
            item.completedBy = user?.displayName || user?.email || 'Unknown';
            item.completedAt = Timestamp.now();
            triggerConfetti(0.5);
        } else {
            item.completedBy = null as any;
            item.completedAt = null as any;
        }

        setItems(newItems);
        checkWin(newItems);

        try {
            await updateDoc(doc(db, 'years', YEAR_DOC_ID), {
                items: newItems,
                lastUpdated: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating bingo board:", error);
        }
    };

    const updateItem = async (index: number, updates: { text?: string, style?: BingoItem['style'] }) => {
        const newItems = items.map(item => ({ ...item }));
        // We use the 'items' from closure. Optimistic update.
        // NOTE: If multiple rapid updates happen, this might need functional state set, 
        // but for a text editor it's okay (last save wins).

        if (updates.text !== undefined) newItems[index].text = updates.text;
        if (updates.style !== undefined) newItems[index].style = updates.style;
        setItems(newItems);

        try {
            await updateDoc(doc(db, 'years', YEAR_DOC_ID), {
                items: newItems,
                lastUpdated: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating item:", error);
        }
    };

    const jumbleAndLock = async () => {
        const currentItems = [...items];

        const center = currentItems[12];
        const others = [...currentItems.slice(0, 12), ...currentItems.slice(13)];

        for (let i = others.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [others[i], others[j]] = [others[j], others[i]];
        }

        const newItems = [
            ...others.slice(0, 12),
            center,
            ...others.slice(12)
        ];

        // Optimistic
        setItems(newItems);
        setIsLocked(true);

        await setDoc(doc(db, 'years', '2026'), {
            isLocked: true,
            items: newItems,
            itemsBackup: currentItems,
            lastUpdated: Timestamp.now()
        }, { merge: true });
    };

    const unlockBoard = async () => {
        try {
            const docRef = doc(db, 'years', '2026');
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data();
                if (data.itemsBackup) {
                    await updateDoc(docRef, {
                        items: data.itemsBackup,
                        itemsBackup: deleteField(),
                        isLocked: false,
                        lastUpdated: Timestamp.now()
                    });
                } else {
                    await updateDoc(docRef, { isLocked: false, lastUpdated: Timestamp.now() });
                }
            }
        } catch (error) {
            console.error("Error unlocking board:", error);
        }
    };

    const bingoCount = useMemo(() => {
        const wins = [
            [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24],
            [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24],
            [0, 6, 12, 18, 24], [4, 8, 12, 16, 20]
        ];
        // Check positions
        const completedPositions = new Set(items.map((item, index) => item.isCompleted ? index : -1));
        return wins.reduce((acc, line) => line.every(i => completedPositions.has(i)) ? acc + 1 : acc, 0);
    }, [items]);

    const saveBoard = async (newItems: BingoItem[]) => {
        setItems(newItems);
        try {
            await updateDoc(doc(db, 'years', YEAR_DOC_ID), {
                items: newItems,
                lastUpdated: Timestamp.now()
            });
        } catch (error) {
            console.error("Error saving board:", error);
        }
    };

    return { items, loading, toggleItem, updateItem, hasWon, bingoCount, isLocked, unlockBoard, jumbleAndLock, saveBoard };
};
