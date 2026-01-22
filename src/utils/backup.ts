export const downloadBoardBackup = (data: any) => {
    try {
        const backupData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            content: data
        };

        const jsonString = JSON.stringify(backupData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        // Sanitize title for filename
        const safeTitle = (data.title || 'board').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        a.download = `bingo_backup_${safeTitle}_${new Date().toISOString().split('T')[0]}.json`;

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
