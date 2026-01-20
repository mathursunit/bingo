import { Timestamp } from "firebase/firestore";

export interface BingoItem {
    id: number;
    text: string;
    isCompleted: boolean;
    completedBy?: string; // email or name (most recent completion)
    completedAt?: Timestamp; // most recent completion time
    isFreeSpace?: boolean;
    proofPhotos?: string[]; // URLs to uploaded proof photos (max 5 total)
    targetCount?: number; // How many times to complete (1 or 2, default 1)
    currentCount?: number; // How many times completed so far (0, 1, or 2)
    style?: {
        color?: string;
        bold?: boolean;
        italic?: boolean;
        fontSize?: 'sm' | 'base' | 'lg' | 'xl';
    };
    dueDate?: Timestamp; // Optional due date for the task
}

export interface BingoYear {
    id: string;
    title?: string;
    gridSize?: number; // 3, 4, 5, or 6 (default: 5)
    isActive: boolean;
    isLocked?: boolean;
    items: BingoItem[];
    lastUpdated?: Timestamp;
    ownerId?: string;
    members?: Record<string, 'owner' | 'editor' | 'viewer'>;
}

export interface UserProfile {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
}
