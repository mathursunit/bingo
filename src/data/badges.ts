export interface Badge {
    id: string;
    category: 'Speed' | 'Creativity' | 'Social';
    title: string;
    description: string;
    icon: string; // Emoji character
    isHidden?: boolean;
    maxProgress: number; // For progress bars (1 if binary)
}

export const BADGES: Badge[] = [
    // 🏆 Speed & Momentum
    { id: 'early_bird', category: 'Speed', title: 'Early Bird', description: 'Complete your first tile in January.', icon: '🚀', maxProgress: 1 },
    { id: 'sprint_start', category: 'Speed', title: 'Sprint Start', description: 'Complete 3 tiles within 24h of starting a board.', icon: '⚡', maxProgress: 1 },
    { id: 'on_fire', category: 'Speed', title: 'On Fire', description: 'Maintain a 7-day streak.', icon: '🔥', maxProgress: 7 },
    { id: 'slow_steady', category: 'Speed', title: 'Slow & Steady', description: 'Complete a tile >6 months after starting.', icon: '🐢', maxProgress: 1 },
    { id: 'weekend_warrior', category: 'Speed', title: 'Weekend Warrior', description: 'Complete 5 tasks on Sat/Sun.', icon: '📅', maxProgress: 5 },

    // 📸 Creativity & Memories
    { id: 'shutterbug', category: 'Creativity', title: 'Shutterbug', description: 'Upload your first 10 proof photos.', icon: '📸', maxProgress: 10 },
    { id: 'curator', category: 'Creativity', title: 'Curator', description: 'Have a board fully completed with photos.', icon: '🎨', maxProgress: 1 },
    { id: 'selfie_star', category: 'Creativity', title: 'Selfie Star', description: 'Upload 50 photos total.', icon: '🤳', maxProgress: 50 },
    { id: 'memory_lane', category: 'Creativity', title: 'Memory Lane', description: 'Open "Memories" view 5 times.', icon: '🎞️', maxProgress: 5 },

    // 🤝 Social & Community
    { id: 'social_butterfly', category: 'Social', title: 'Social Butterfly', description: 'Add your first 5 friends.', icon: '🦋', maxProgress: 5 },
    { id: 'got_mail', category: 'Social', title: 'You\'ve Got Mail', description: 'Accept a friend request.', icon: '💌', maxProgress: 1 },
    { id: 'town_crier', category: 'Social', title: 'Town Crier', description: 'Share a board.', icon: '📢', maxProgress: 1 },
    { id: 'better_together', category: 'Social', title: 'Better Together', description: 'Join a shared board.', icon: '👯‍♀️', maxProgress: 1 },
    { id: 'peculiar_peeper', category: 'Social', title: 'Peculiar Peeper', description: 'View a friend\'s profile 10 times.', icon: '👀', maxProgress: 10, isHidden: true },
];

export interface UserBadgeProgress {
    badgeId: string;
    progress: number;
    unlockedAt?: any; // Timestamp
}
