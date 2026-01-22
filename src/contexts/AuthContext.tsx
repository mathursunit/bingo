import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';
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

    // ... (useEffect for auth state change - kept as is)

    // Re-declare useEffect since replace_file_content needs context, but I can't easily skip blocks. 
    // I will use replace logic just for the `return` and added function if possible, but the interface needs update too at the top.
    // So I am replacing the interface and adding the function before return.

    useEffect(() => {
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
        return () => unsubscribe();
    }, []);

    const signIn = async () => {
        setError(null);
        try {
            await signInWithPopup(auth, googleProvider);
        } catch (err: any) {
            setError(err.message || "Failed to sign in");
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
