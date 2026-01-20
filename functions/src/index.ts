import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Configure email transport
// You'll need to set these using: firebase functions:config:set email.user="xxx" email.pass="xxx"
// Or use environment variables in Firebase Functions v2
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER || functions.config().email?.user,
        pass: process.env.EMAIL_PASS || functions.config().email?.pass,
    },
});

interface SendInviteData {
    recipientEmail: string;
    senderName: string;
    boardName?: string;
}

/**
 * Send invitation email to a user who hasn't signed up yet
 */
export const sendInviteEmail = functions.https.onCall(
    async (data: SendInviteData, context) => {
        // Verify the request is authenticated
        if (!context.auth) {
            throw new functions.https.HttpsError(
                'unauthenticated',
                'You must be logged in to send invitations.'
            );
        }

        const { recipientEmail, senderName, boardName } = data;

        if (!recipientEmail || !recipientEmail.includes('@')) {
            throw new functions.https.HttpsError(
                'invalid-argument',
                'A valid email address is required.'
            );
        }

        const appUrl = 'https://bingo.mysunsar.com';

        const mailOptions = {
            from: `"SunSar Bingo" <${process.env.EMAIL_USER || functions.config().email?.user}>`,
            to: recipientEmail,
            subject: `${senderName} invited you to SunSar Bingo!`,
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <style>
                        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f172a; color: #e2e8f0; }
                        .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
                        .card { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 20px; padding: 40px; border: 1px solid rgba(255,255,255,0.1); }
                        h1 { color: #a78bfa; margin: 0 0 20px; }
                        p { line-height: 1.6; color: #94a3b8; }
                        .button { display: inline-block; background: linear-gradient(135deg, #8b5cf6, #d946ef); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: bold; margin: 20px 0; }
                        .footer { margin-top: 30px; font-size: 12px; color: #64748b; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="card">
                            <h1>🎯 You're Invited!</h1>
                            <p>Hey there!</p>
                            <p><strong>${senderName}</strong> has invited you to join them on <strong>SunSar Bingo</strong>${boardName ? ` to collaborate on "${boardName}"` : ''}!</p>
                            <p>SunSar Bingo is a fun way to track and achieve your goals for 2026. Create bingo boards, compete with friends, and celebrate your wins!</p>
                            <a href="${appUrl}" class="button">Join SunSar Bingo</a>
                            <p class="footer">
                                If you didn't expect this email, you can safely ignore it.<br>
                                © 2026 SunSar Bingo
                            </p>
                        </div>
                    </div>
                </body>
                </html>
            `,
            text: `${senderName} invited you to SunSar Bingo!\n\nJoin them at ${appUrl} to track your 2026 goals together.\n\nSunSar Bingo - Make 2026 your year!`,
        };

        try {
            await transporter.sendMail(mailOptions);

            // Log the invitation in Firestore for tracking
            await admin.firestore().collection('invitations').add({
                recipientEmail,
                senderUid: context.auth.uid,
                senderName,
                boardName,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'sent',
            });

            return { success: true, message: 'Invitation sent successfully!' };
        } catch (error) {
            console.error('Error sending email:', error);
            throw new functions.https.HttpsError(
                'internal',
                'Failed to send email. Please try again later.'
            );
        }
    }
);
