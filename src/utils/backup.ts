import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const downloadFullBackup = async (userId: string | undefined, currentBoardData: any) => {
    try {
        const backupData: Record<string, any> = {
            version: '2.0',
            exportedAt: new Date().toISOString(),
            user: userId || 'anonymous',
            boards: {},
            years: {},
            currentBoard: currentBoardData
        };

        if (userId) {
            // 1. Try to fetch ALL boards where user is a member
            try {
                const boardsRef = collection(db, 'boards');
                // Check for common roles
                const q = query(boardsRef, where(`members.${userId}`, 'in', ['owner', 'editor', 'viewer', 'admin']));
                const snapshot = await getDocs(q);

                snapshot.forEach(doc => {
                    backupData.boards[doc.id] = doc.data();
                });
                console.log(`Backup: Found ${snapshot.size} boards.`);
            } catch (e) {
                console.warn("Could not fetch all boards via query. Ensure Firestore indexes exist.", e);
                // Fallback: If query fails, we at least have the currentBoardData passed in.
                if (currentBoardData?.boardId) {
                    backupData.boards[currentBoardData.boardId] = currentBoardData;
                }
            }
        } else {
            // No user, just backup current
            if (currentBoardData?.boardId) {
                backupData.boards[currentBoardData.boardId] = currentBoardData;
            }
        }

        // 2. Try to fetch Years (Legacy collections usually readable)
        try {
            const yearsSnapshot = await getDocs(collection(db, 'years'));
            yearsSnapshot.forEach(doc => {
                backupData.years[doc.id] = doc.data();
            });
        } catch (e) {
            console.warn("Could not fetch years collection.", e);
        }

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        const filename = `bingo_full_backup_${new Date().toISOString().split('T')[0]}.json`;
        a.download = filename;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        return true;
    } catch (error) {
        console.error("Backup failed:", error);
        alert("Backup failed. See console for details.");
        return false;
    }
};
