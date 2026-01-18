import { Timestamp } from "firebase/firestore";

export interface BingoItem {
    id: number;
    text: string;
    isCompleted: boolean;
    completedBy?: string; // email or name
    completedAt?: Timestamp;
    isFreeSpace?: boolean;
}

export interface BingoYear {
    id: string;
    isActive: boolean;
    isLocked?: boolean;
    items: BingoItem[];
    lastUpdated?: Timestamp;
}

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}
