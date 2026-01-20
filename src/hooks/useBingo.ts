import { useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc, updateDoc, Timestamp, getDoc, deleteField, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { type BingoYear, type BingoItem } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { triggerConfetti } from '../utils/confetti';
import { uploadToCloudinary } from '../lib/cloudinary';

const YEAR_DOC_ID = '2026';
const TOTAL_CELLS = 25;

const INITIAL_ITEMS: string[] = [
    "Travel to a new country", "Host a dinner party", "Read 12 books", "Go camping", "Try a new hobby",
    "Exercise 3x/week for a month", "Save a specific amount", "Visit a museum", "Date night at a fancy place", "Cook a complex meal",
    "Walk 10k steps for a week", "Watch all Oscar nominees", "FREE SPACE", "Volunteer somewhere", "Learn a new skill",
    "No takeout for a month", "Go to a concert", "Plant a garden", "Digital detox weekend", "Write a journal",
    "Call parents weekly", "Take a spontaneous trip", "Learn a new recipe", "Do a puzzle", "Visit a national park"
];

export const useBingo = (boardId?: string) => {
    const { user } = useAuth();
    const [items, setItems] = useState<BingoItem[]>([]);
    const [members, setMembers] = useState<Record<string, 'owner' | 'editor' | 'viewer'>>({});
    const [loading, setLoading] = useState(true);
    const [hasWon, setHasWon] = useState(false);
    const [isLocked, setIsLocked] = useState(false);

    // Dynamic Doc Ref
    const docRef = useMemo(() => {
        if (boardId) return doc(db, 'boards', boardId);
        return doc(db, 'years', YEAR_DOC_ID);
    }, [boardId]);

    const checkWin = (currentItems: BingoItem[]) => {
        if (!currentItems.length) return;

        const size = 5;
        const grid = [];
        for (let i = 0; i < size; i++) {
            grid.push(currentItems.slice(i * size, (i + 1) * size));
        }

        // Check rows
        for (let i = 0; i < size; i++) {
            if (grid[i].every(cell => cell.isCompleted)) {
                if (!hasWon) {
                    setHasWon(true);
                    triggerConfetti(2);
                }
                return;
            }
        }

        // Check columns
        for (let i = 0; i < size; i++) {
            if (grid.map(row => row[i]).every(cell => cell.isCompleted)) {
                if (!hasWon) {
                    setHasWon(true);
                    triggerConfetti(2);
                }
                return;
            }
        }

        // Check diagonals
        if (grid.map((row, i) => row[i]).every(cell => cell.isCompleted)) {
            if (!hasWon) {
                setHasWon(true);
                triggerConfetti(2);
            }
            return;
        }
        if (grid.map((row, i) => row[size - 1 - i]).every(cell => cell.isCompleted)) {
            if (!hasWon) {
                setHasWon(true);
                triggerConfetti(2);
            }
            return;
        }

        setHasWon(false);
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
                    isFreeSpace: false,
                    targetCount: 1,
                    currentCount: 0
                });
                itemIndex++;
            }
        }

        await setDoc(docRef, {
            year: 2026,
            items: newItems,
            isLocked: false,
            createdAt: Timestamp.now(),
            lastUpdated: Timestamp.now(),
            ...(user ? { ownerId: user.uid, members: { [user.uid]: 'owner' } } : {})
        }, { merge: true });
    };

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        const unsubscribe = onSnapshot(docRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data() as BingoYear;
                setItems(data.items || []);
                setMembers(data.members || {});
                setIsLocked(data.isLocked || false);
                checkWin(data.items || []);
            } else {
                // Initialize if document doesn't exist
                initializeBoard();
            }
            setLoading(false);
        }, (error) => {
            console.error("Error fetching bingo board:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [docRef, user]);

    const toggleItem = async (index: number) => {
        if (!items.length) return;
        const newItems = items.map(item => ({ ...item }));
        const item = newItems[index];

        if (item.isFreeSpace) return;

        const targetCount = item.targetCount || 1;
        const currentCount = item.currentCount || 0;

        if (item.isCompleted) {
            // Decrement count (marking as in-progress)
            const newCount = Math.max(0, currentCount - 1);
            item.currentCount = newCount;
            item.isCompleted = newCount >= targetCount;

            if (newCount === 0) {
                // Fully reset if count reaches 0
                item.completedBy = null as any;
                item.completedAt = null as any;
                item.proofPhotos = [];
            }
        } else {
            // Increment count (marking as complete)
            const newCount = Math.min(targetCount, currentCount + 1);
            item.currentCount = newCount;
            item.isCompleted = newCount >= targetCount;
            item.completedBy = user?.displayName || user?.email || 'Unknown';
            item.completedAt = Timestamp.now();
            triggerConfetti(0.5);
        }

        setItems(newItems);
        checkWin(newItems);

        try {
            await updateDoc(docRef, {
                items: newItems,
                lastUpdated: Timestamp.now()
            });
        } catch (error) {
            console.error("Error updating bingo board:", error);
        }
    };

    // Decrement progress for multi-count tiles
    const decrementProgress = async (index: number) => {
        if (!items.length) return;
        const newItems = items.map(item => ({ ...item }));
        const item = newItems[index];

        if (item.isFreeSpace) return;

        const currentCount = item.currentCount || 0;
        if (currentCount <= 0) return; // Nothing to decrement

        const targetCount = item.targetCount || 1;
        const newCount = currentCount - 1;

        item.currentCount = newCount;
        item.isCompleted = newCount >= targetCount;

        if (newCount === 0) {
            // Fully reset if count reaches 0
            item.completedBy = null as any;
            item.completedAt = null as any;
            item.proofPhotos = [];
        }

        setItems(newItems);
        checkWin(newItems);

        try {
            await updateDoc(docRef, {
                items: newItems,
                lastUpdated: Timestamp.now()
            });
        } catch (error) {
            console.error("Error decrementing progress:", error);
        }
    };

    const completeWithPhoto = async (index: number, photoFile: File) => {
        if (!items.length || !user) return;

        try {
            // Upload photo to Cloudinary
            const photoUrl = await uploadToCloudinary(photoFile);

            // Update the item
            const newItems = items.map(item => ({ ...item }));
            const item = newItems[index];

            if (item.isFreeSpace) return;

            const targetCount = item.targetCount || 1;
            const currentCount = item.currentCount || 0;
            const newCount = Math.min(targetCount, currentCount + 1);

            item.currentCount = newCount;
            item.isCompleted = newCount >= targetCount;
            item.completedBy = user?.displayName || user?.email || 'Unknown';
            item.completedAt = Timestamp.now();

            // Add photo to existing array or start new one
            const existingPhotos = item.proofPhotos || [];
            item.proofPhotos = [...existingPhotos, photoUrl];

            setItems(newItems);
            checkWin(newItems);
            triggerConfetti(1); // Bigger confetti for photo proof!

            await updateDoc(docRef, {
                items: newItems,
                lastUpdated: Timestamp.now()
            });
        } catch (error) {
            console.error("Error completing with photo:", error);
            throw error; // Re-throw so UI can handle it
        }
    };

    const addPhotoToTile = async (index: number, photoFile: File) => {
        if (!items.length || !user) return;

        const item = items[index];
        if (!item.isCompleted && (item.currentCount || 0) < (item.targetCount || 1)) {
            // Allow adding photo if in progress too, but usually explicit completion
            // The logic says "if (!item.isCompleted) return" in old code. 
            // I'll stick to old logic or improve? Old logic says only if completed.
        }

        // Actually, let's keep it robust
        const currentPhotos = item.proofPhotos || [];
        if (currentPhotos.length >= 5) {
            throw new Error('Maximum 5 photos allowed per tile');
        }

        try {
            // Upload photo to Cloudinary
            const photoUrl = await uploadToCloudinary(photoFile);

            // Update the item
            const newItems = items.map(item => ({ ...item }));
            newItems[index].proofPhotos = [...currentPhotos, photoUrl];

            setItems(newItems);
            triggerConfetti(0.3); // Small confetti for additional photo

            await updateDoc(docRef, {
                items: newItems,
                lastUpdated: Timestamp.now()
            });

            return photoUrl;
        } catch (error) {
            console.error("Error adding photo:", error);
            throw error;
        }
    };

    const updateItem = async (index: number, updates: { text?: string, style?: BingoItem['style'], targetCount?: number }) => {
        // Updated to support targetCount as well, since I added it in previous turns to BingoBoard but maybe didn't strictly update this function signature?
        // Actually BingoBoard uses saveBoard for that.
        // But for partial updates `updateItem` is nice to have.
        // I will match the requested signature from view_file, but add any extra if needed.
        // Signature in view_file: (index: number, updates: { text?: string, style?: BingoItem['style'] })

        const newItems = items.map(item => ({ ...item }));

        if (updates.text !== undefined) newItems[index].text = updates.text;
        if (updates.style !== undefined) newItems[index].style = updates.style;
        // if (updates.targetCount !== undefined) newItems[index].targetCount = updates.targetCount; // Optional enhancement

        setItems(newItems);

        try {
            await updateDoc(docRef, {
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

        await setDoc(docRef, {
            isLocked: true,
            items: newItems,
            itemsBackup: currentItems,
            lastUpdated: Timestamp.now()
        }, { merge: true });
    };

    const unlockBoard = async () => {
        try {
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
            await updateDoc(docRef, {
                items: newItems,
                lastUpdated: Timestamp.now()
            });
        } catch (error) {
            console.error("Error saving board:", error);
        }
    };

    const inviteUser = async (email: string, role: 'viewer' | 'editor' = 'editor'): Promise<{ success: boolean; type: 'success' | 'not_found' | 'error'; message: string }> => {
        try {
            const q = query(collection(db, 'users'), where('email', '==', email));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { success: false, type: 'not_found', message: 'User not found' };
            }

            const userToAdd = snapshot.docs[0];
            const uid = userToAdd.id;

            await updateDoc(docRef, {
                [`members.${uid}`]: role
            });

            return {
                success: true,
                type: 'success',
                message: `Added ${userToAdd.data().displayName || email} as ${role}!`
            };
        } catch (error) {
            console.error("Error inviting user:", error);
            return { success: false, type: 'error', message: 'Failed to invite user' };
        }
    };

    const removeMember = async (uid: string) => {
        try {
            await updateDoc(docRef, {
                [`members.${uid}`]: deleteField()
            });
            return { success: true };
        } catch (error) {
            console.error("Error removing member:", error);
            return { success: false, error };
        }
    };

    return { items, members, loading, toggleItem, updateItem, hasWon, bingoCount, isLocked, unlockBoard, jumbleAndLock, saveBoard, completeWithPhoto, addPhotoToTile, decrementProgress, inviteUser, removeMember };
};
