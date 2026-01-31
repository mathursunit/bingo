import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged, setPersistence, browserLocalPersistence, getRedirectResult } from 'firebase/auth'; // Removed signInWithRedirect for now as we want to stick to popup if possible
import { type UserProfile } from '../types';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signIn: () => Promise<void>;
    logout: () => Promise<void>;
    updateProfileName: (name: string) => Promise<void>;
    error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Ensure persistence is set to local (critical for mobile/PWA flows)
                await setPersistence(auth, browserLocalPersistence);

                // Check if we are returning from a redirect (fallback for some mobile browsers)
                try {
                    const result = await getRedirectResult(auth);
                    if (result?.user) {
                        console.log("Welcome back via redirect!", result.user.email);
                    }
                } catch (e: any) {
                    // "Missing initial state" error is often caught here if redirect failed
                    console.error("Redirect check error:", e);
                    if (e.message && e.message.includes('missing initial state')) {
                        // This is the specific error the user saw. 
                        // It often means the redirect flow was broken by privacy settings.
                        console.warn("Detected missing initial state error. This usually happens in in-app browsers.");
                    }
                }
            } catch (e) {
                console.error("Auth initialization error:", e);
            }

            const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
                if (firebaseUser) {
                    const updatedUser = {
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        displayName: firebaseUser.displayName,
                        photoURL: firebaseUser.photoURL,
                    };
                    setUser(updatedUser);
                    setError(null);

                    try {
                        const { doc, setDoc, Timestamp } = await import('firebase/firestore');
                        const { db } = await import('../firebase');
                        await setDoc(doc(db, 'users', firebaseUser.uid), {
                            ...updatedUser,
                            lastSeen: Timestamp.now()
                        }, { merge: true });
                    } catch (e) {
                        console.error("Error syncing user profile:", e);
                    }
                } else {
                    setUser(null);
                }
                setLoading(false);
            });
            return unsubscribe;
        };

        const cleanupPromise = initAuth();
        return () => {
            cleanupPromise.then(unsub => unsub && unsub());
        };
    }, []);

    const signIn = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            console.error("Sign in error:", err);
            // If popup is blocked or closed, providing a clear message helps
            if (err.code === 'auth/popup-blocked') {
                setError("Login popup was blocked. Please allow popups or try a different browser.");
            } else if (err.code === 'auth/popup-closed-by-user') {
                setError("Login cancelled.");
            } else {
                setError(err.message || "Failed to sign in. Please try opening in Chrome or Safari.");
            }
        }
    };

    const logout = async () => {
        await signOut(auth);
    };

    const updateProfileName = async (name: string) => {
        if (!auth.currentUser) return;
        try {
            const { updateProfile } = await import('firebase/auth');
            await updateProfile(auth.currentUser, { displayName: name });

            // Update local state
            setUser(prev => prev ? { ...prev, displayName: name } : null);

            // Update Firestore
            const { doc, updateDoc } = await import('firebase/firestore');
            const { db } = await import('../firebase');
            await updateDoc(doc(db, 'users', auth.currentUser.uid), { displayName: name });
        } catch (e: any) {
            console.error("Error updating profile:", e);
            throw e;
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, logout, updateProfileName, error }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
