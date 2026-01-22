
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SettingsModal } from '../components/SettingsModal';

export interface Settings {
    theme: string; // 'dawn' (default), 'midnight', 'forest', 'ocean', 'sunset'
    font: string; // 'outfit' (default), 'inter', 'playfair', 'mono', 'comic'
    enableAnimation: boolean;
    enableSound: boolean;
}

const defaultSettings: Settings = {
    theme: 'dawn',
    font: 'outfit',
    enableAnimation: true,
    enableSound: true
};

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>, persist?: boolean) => Promise<void>;
    isSettingsOpen: boolean;
    openSettings: () => void;
    closeSettings: () => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user } = useAuth();

    // Initialize from LocalStorage to avoid FOUC (Flash of Unstyled Content) / Reset
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const local = localStorage.getItem('bingo_settings');
            return local ? { ...defaultSettings, ...JSON.parse(local) } : defaultSettings;
        } catch (e) {
            console.error("Error parsing local settings", e);
            return defaultSettings;
        }
    });

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Load settings from Firestore when user logs in
    useEffect(() => {
        const loadSettings = async () => {
            if (!user) {
                // If logged out, keep local settings or reset? 
                // Usually keeping local settings is better UX, so we don't force reset unless explicit logout.
                // But the previous logic enforced defaultSettings. Let's stick to local persistence dominating if user is null.
                return;
            }

            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().settings) {
                    const serverSettings = { ...defaultSettings, ...docSnap.data().settings };
                    setSettings(serverSettings);
                    // Sync server settings to local
                    localStorage.setItem('bingo_settings', JSON.stringify(serverSettings));
                }
            } catch (error) {
                console.error("Error loading settings:", error);
            }
        };

        loadSettings();
    }, [user]);

    // Apply settings to DOM
    useEffect(() => {
        const body = document.body;

        // Theme
        body.classList.remove('theme-midnight', 'theme-forest', 'theme-ocean', 'theme-sunset');
        if (settings.theme !== 'dawn') {
            body.classList.add(`theme-${settings.theme}`);
        }

        // Font
        body.classList.remove('font-inter', 'font-playfair', 'font-mono', 'font-comic');
        if (settings.font !== 'outfit') {
            body.classList.add(`font-${settings.font}`);
        }

        // Animation
        if (!settings.enableAnimation) {
            body.classList.add('reduce-motion');
        } else {
            body.classList.remove('reduce-motion');
        }
    }, [settings]);

    const updateSettings = async (newSettings: Partial<Settings>, persist = true) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        // Persist to LocalStorage
        try {
            localStorage.setItem('bingo_settings', JSON.stringify(updated));
        } catch (e) {
            console.error("Failed to save settings locally", e);
        }

        // Persist to Firestore
        if (user && persist) {
            try {
                await setDoc(doc(db, 'users', user.uid), { settings: updated }, { merge: true });
            } catch (error) {
                console.error("Error saving settings to DB:", error);
            }
        }
    };

    const openSettings = () => setIsSettingsOpen(true);
    const closeSettings = () => setIsSettingsOpen(false);

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, isSettingsOpen, openSettings, closeSettings }}>
            {children}
            <SettingsModal />
        </SettingsContext.Provider>
    );
};
