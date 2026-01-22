import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

export const backupDatabase = async () => {
    try {
        const collections = ['years', 'users', 'boards'];
        const data: Record<string, any> = {};

        for (const colName of collections) {
            const querySnapshot = await getDocs(collection(db, colName));
            data[colName] = {};
            querySnapshot.forEach((doc) => {
                data[colName][doc.id] = doc.data();
            });
        }

        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `bingo_backup_${new Date().toISOString().split('T')[0]}.json`;
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
