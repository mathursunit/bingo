import { db } from '../firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { BADGES } from '../data/badges';
import { useAuth } from '../contexts/AuthContext';

export const useBadges = () => {
    const { user } = useAuth();

    const unlockBadge = async (badgeId: string) => {
        if (!user) return;

        try {
            const badgeRef = doc(db, `users/${user.uid}/badges/progress`);
            const badgeSnap = await getDoc(badgeRef);
            const currentData = badgeSnap.exists() ? badgeSnap.data() : {};
            const currentProgress = currentData[badgeId]?.progress || 0;

            const badgeDef = BADGES.find(b => b.id === badgeId);
            if (!badgeDef) return;

            // Using maxProgress to instantly unlock for 'binary' badges
            // Only update if not already unlocked or less than max
            if (currentProgress < badgeDef.maxProgress) {
                await setDoc(badgeRef, {
                    [badgeId]: {
                        progress: badgeDef.maxProgress,
                        unlockedAt: serverTimestamp()
                    }
                }, { merge: true });

                // Show toast
                // We use dialog.alert for now, but a toast would be better. 
                // To avoid disrupting flow, maybe just console log or simple toast if available.
                // Assuming dialog.alert is intrusive. 
                // Let's assume we want to silently unlock or use a subtle notification if we had one.
                // For now, logging.
                console.log(`🏆 Badge Unlocked: ${badgeDef.title}`);
            }
        } catch (e) {
            console.error("Error unlocking badge:", e);
        }
    };

    const incrementBadge = async (badgeId: string, amount = 1) => {
        if (!user) return;

        try {
            const badgeRef = doc(db, `users/${user.uid}/badges/progress`);
            const badgeSnap = await getDoc(badgeRef);
            const currentData = badgeSnap.exists() ? badgeSnap.data() : {};

            const badgeDef = BADGES.find(b => b.id === badgeId);
            if (!badgeDef) return;

            const currentProgress = currentData[badgeId]?.progress || 0;

            if (currentProgress < badgeDef.maxProgress) {
                const newProgress = Math.min(currentProgress + amount, badgeDef.maxProgress);
                const isUnlocked = newProgress >= badgeDef.maxProgress;

                await setDoc(badgeRef, {
                    [badgeId]: {
                        progress: newProgress,
                        ...(isUnlocked ? { unlockedAt: serverTimestamp() } : {})
                    }
                }, { merge: true });

                if (isUnlocked && currentProgress < badgeDef.maxProgress) {
                    console.log(`🏆 Badge Unlocked: ${badgeDef.title}`);
                }
            }
        } catch (e) {
            console.error("Error incrementing badge:", e);
        }
    };

    const setBadgeProgress = async (badgeId: string, value: number) => {
        if (!user) return;

        try {
            const badgeRef = doc(db, `users/${user.uid}/badges/progress`);
            const badgeSnap = await getDoc(badgeRef);
            const currentData = badgeSnap.exists() ? badgeSnap.data() : {};

            const badgeDef = BADGES.find(b => b.id === badgeId);
            if (!badgeDef) return;

            const currentProgress = currentData[badgeId]?.progress || 0;

            // Only update if value is higher (don't downgrade progress)
            if (value > currentProgress) {
                const newProgress = Math.min(value, badgeDef.maxProgress);
                const isUnlocked = newProgress >= badgeDef.maxProgress;

                await setDoc(badgeRef, {
                    [badgeId]: {
                        progress: newProgress,
                        ...(isUnlocked ? { unlockedAt: serverTimestamp() } : {})
                    }
                }, { merge: true });

                if (isUnlocked && currentProgress < badgeDef.maxProgress) {
                    console.log(`🏆 Badge Unlocked: ${badgeDef.title}`);
                }
            }
        } catch (e) {
            console.error("Error setting badge progress:", e);
        }
    }

    return { unlockBadge, incrementBadge, setBadgeProgress };
};
