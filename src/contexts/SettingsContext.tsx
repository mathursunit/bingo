
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { SettingsModal } from '../components/SettingsModal';

export interface Settings {
    theme: string; // 'dawn' (default), 'midnight', 'forest', 'ocean', 'sunset'
    font: string; // 'outfit' (default), 'inter', 'playfair', 'mono', 'comic'
    enableAnimation: boolean;
}

const defaultSettings: Settings = {
    theme: 'dawn',
    font: 'outfit',
    enableAnimation: true
};

interface SettingsContextType {
    settings: Settings;
    updateSettings: (newSettings: Partial<Settings>) => Promise<void>;
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
    const [settings, setSettings] = useState<Settings>(defaultSettings);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);

    // Load settings from Firestore
    useEffect(() => {
        const loadSettings = async () => {
            if (!user) {
                setSettings(defaultSettings);
                return;
            }

            try {
                const docRef = doc(db, 'users', user.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists() && docSnap.data().settings) {
                    setSettings({ ...defaultSettings, ...docSnap.data().settings });
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

    const updateSettings = async (newSettings: Partial<Settings>) => {
        const updated = { ...settings, ...newSettings };
        setSettings(updated);

        if (user) {
            try {
                await setDoc(doc(db, 'users', user.uid), { settings: updated }, { merge: true });
            } catch (error) {
                console.error("Error saving settings:", error);
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
