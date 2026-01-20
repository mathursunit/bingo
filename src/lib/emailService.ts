import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../firebase';

const functions = getFunctions(app);

interface SendInviteData {
    recipientEmail: string;
    senderName: string;
    boardName?: string;
}

interface SendInviteResult {
    success: boolean;
    message: string;
}

/**
 * Send an invitation email to a user who hasn't signed up yet.
 * Falls back to mailto: if the cloud function is not available.
 */
export const sendInviteEmail = async (data: SendInviteData): Promise<SendInviteResult> => {
    try {
        const sendInvite = httpsCallable<SendInviteData, SendInviteResult>(functions, 'sendInviteEmail');
        const result = await sendInvite(data);
        return result.data;
    } catch (error: any) {
        console.error('Cloud function call failed:', error);

        // If the function doesn't exist or fails, provide a helpful message
        if (error.code === 'functions/not-found' || error.code === 'functions/unavailable') {
            return {
                success: false,
                message: 'Email service is not configured. Using fallback email method.',
            };
        }

        throw error;
    }
};

/**
 * Fallback: Open mailto link for manual email sending
 */
export const openMailtoFallback = (recipientEmail: string, senderName: string) => {
    const subject = encodeURIComponent(`${senderName} invited you to SunSar Bingo!`);
    const body = encodeURIComponent(
        `Hey! Come join me on SunSar Bingo to track our 2026 goals together.\n\nSign up here: ${window.location.origin}`
    );
    window.open(`mailto:${recipientEmail}?subject=${subject}&body=${body}`);
};
