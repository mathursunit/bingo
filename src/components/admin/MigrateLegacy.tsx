import { useState } from 'react';
import { collection, query, where, getDocs, getDoc, doc, addDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeft, Play, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const MigrateLegacy = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState<'idle' | 'running' | 'success' | 'error'>('idle');
    const [logs, setLogs] = useState<string[]>([]);
    const [newBoardId, setNewBoardId] = useState<string | null>(null);

    const log = (msg: string) => setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);

    const runMigration = async () => {
        if (!user) return;
        setStatus('running');
        setLogs([]);
        log("Starting migration process...");

        try {
            // 1. Fetch Legacy Data
            log("Fetching legacy board 'years/2026'...");
            const legacyRef = doc(db, 'years', '2026');
            const legacySnap = await getDoc(legacyRef);

            if (!legacySnap.exists()) {
                throw new Error("Legacy document 'years/2026' not found!");
            }
            const legacyData = legacySnap.data();
            log(`Legacy data found: ${legacyData.items?.length || 0} items.`);

            // 2. Resolve Users
            const saraEmail = 'sarawbush@gmail.com';
            const sunitEmail = 'sunit.mathur@gmail.com';

            log(`Resolving user: ${saraEmail} (Owner)...`);
            const saraQuery = query(collection(db, 'users'), where('email', '==', saraEmail));
            const saraSnap = await getDocs(saraQuery);
            if (saraSnap.empty) throw new Error(`User ${saraEmail} not found in database.`);
            const saraUid = saraSnap.docs[0].id;
            log(`Found Sara: ${saraUid}`);

            log(`Resolving user: ${sunitEmail} (Editor)...`);
            const sunitQuery = query(collection(db, 'users'), where('email', '==', sunitEmail));
            const sunitSnap = await getDocs(sunitQuery);
            if (sunitSnap.empty) throw new Error(`User ${sunitEmail} not found in database.`);
            const sunitUid = sunitSnap.docs[0].id;
            log(`Found Sunit: ${sunitUid}`);

            // 3. Transform Data
            log("Transforming data structure...");

            // Legacy items handling
            const newItems = legacyData.items.map((item: any, index: number) => {
                const isFreeSpace = index === 12; // Standard 5x5 center
                const isDone = item.completed || item.isCompleted || false;

                const newItem: any = {
                    id: index,
                    text: item.text || item || "", // Handle object or string
                    isCompleted: isDone,
                    isFreeSpace: isFreeSpace,
                    targetCount: 1,
                    currentCount: isDone ? 1 : 0
                };

                if (isDone) {
                    newItem.completedBy = saraUid;
                }

                return newItem;
            });

            // 4. Create New Board
            log("Creating new board in 'boards' collection...");

            // SECURITY FIX: Must create board as current user to pass Firestore rules
            const creatorUid = user.uid;
            log(`Creating as current user: ${creatorUid} (to satisfy security rules)`);

            const newBoardData = {
                title: "2026 Bingo",
                gridSize: 5,
                createdAt: Timestamp.now(),
                ownerId: creatorUid, // The creator must be the owner record
                updatedAt: Timestamp.now(),
                members: {
                    [saraUid]: 'owner',     // Sara is explicitly made Owner
                    [sunitUid]: 'editor',   // Sunit is Editor (as requested)
                    [creatorUid]: 'owner'   // Ensure creator is owner (overrides Sunit's editor status if he is creator)
                },
                items: newItems,
                theme: 'dawn'
            };

            const docRef = await addDoc(collection(db, 'boards'), newBoardData);
            setNewBoardId(docRef.id);
            log(`SUCCESS! New Board Created. ID: ${docRef.id}`);

            setStatus('success');

        } catch (error: any) {
            console.error(error);
            log(`ERROR: ${error.message}`);
            setStatus('error');
        }
    };

    const runPermissionFix = async () => {
        if (!user) return;
        setStatus('running');
        setLogs([]);
        log("Starting permission fix...");

        try {
            // 1. Find the board
            log("Finding the '2026 Bingo' board...");
            // REPLACED: Relaxed query to find board even if current user is editor
            const boardsQuery = query(
                collection(db, 'boards'),
                where('title', '==', '2026 Bingo')
            );
            const snapshot = await getDocs(boardsQuery);

            const myBoard = snapshot.docs.find(doc => {
                const d = doc.data();
                return d.members?.[user.uid] !== undefined;
            });

            if (!myBoard) {
                throw new Error("Could not find a '2026 Bingo' board where you are a member.");
            }

            const boardId = myBoard.id;
            log(`Found board: ${boardId}`);

            // 2. Resolve Users Again
            const saraEmail = 'sarawbush@gmail.com';

            const saraQuery = query(collection(db, 'users'), where('email', '==', saraEmail));
            const saraSnap = await getDocs(saraQuery);
            const saraUid = saraSnap.docs[0]?.id;

            if (!saraUid) throw new Error("Could not find Sara's UID");

            // 3. Update Permissions
            log(`Downgrading ${user.email} to 'editor'...`);
            log(`Ensuring ${saraEmail} is 'owner'...`);
            log(`Transferring ownership to ${saraEmail}...`);

            const boardRef = doc(db, 'boards', boardId);

            await updateDoc(boardRef, {
                [`members.${user.uid}`]: 'editor',
                [`members.${saraUid}`]: 'owner',
                ownerId: saraUid // Attempt to fix "Shared by..." display
            });

            log("SUCCESS! Permissions updated.");
            setStatus('success');
            setNewBoardId(boardId);

        } catch (error: any) {
            console.error(error);
            log(`ERROR: ${error.message}`);
            setStatus('error');
        }
    };

    return (
        <div className="min-h-screen bg-bg-dark text-white p-6">
            <div className="max-w-2xl mx-auto">
                <button
                    onClick={() => navigate('/dashboard')}
                    className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft size={20} />
                    Back to Dashboard
                </button>

                <div className="bg-slate-900 border border-white/10 rounded-2xl p-8 shadow-xl">
                    <h1 className="text-3xl font-bold mb-2">Legacy Migration Tool</h1>
                    <p className="text-slate-400 mb-8">
                        Tools to manage the 2026 Board migration.
                    </p>

                    <div className="bg-black/30 rounded-xl p-4 mb-8 font-mono text-sm max-h-64 overflow-y-auto border border-white/5">
                        {logs.length === 0 ? (
                            <span className="text-slate-600">Waiting for command...</span>
                        ) : (
                            logs.map((L, i) => <div key={i} className="mb-1">{L}</div>)
                        )}
                        {status === 'running' && (
                            <div className="flex items-center gap-2 text-accent-primary mt-2">
                                <Loader2 className="animate-spin w-4 h-4" /> Processing...
                            </div>
                        )}
                    </div>

                    {status === 'success' ? (
                        <div className="space-y-4">
                            <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 flex flex-col gap-4 text-center">
                                <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-lg">
                                    <CheckCircle /> Operation Complete
                                </div>
                                <button
                                    onClick={() => navigate(`/board/${newBoardId}`)}
                                    className="bg-green-500 text-white font-bold py-3 px-6 rounded-xl hover:bg-green-400 transition-colors"
                                >
                                    Open Board
                                </button>
                            </div>
                            <button
                                onClick={() => setStatus('idle')}
                                className="w-full py-3 text-slate-400 hover:text-white"
                            >
                                Run functionality again
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <button
                                onClick={runMigration}
                                disabled={status === 'running'}
                                className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${status === 'running'
                                        ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                                        : 'bg-gradient-to-r from-accent-primary to-accent-secondary text-white hover:shadow-lg hover:shadow-accent-primary/20'
                                    }`}
                            >
                                {status === 'running' ? 'Migrating...' : 'Start New Migration'}
                                {!status && <Play size={20} />}
                            </button>

                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-white/10"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-slate-900 px-2 text-slate-500">Or Fix Existing</span>
                                </div>
                            </div>

                            <button
                                onClick={runPermissionFix}
                                disabled={status === 'running'}
                                className="w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all border border-amber-500/30 text-amber-500 hover:bg-amber-500/10"
                            >
                                Downgrade Me to Editor
                            </button>
                        </div>
                    )}

                    {status === 'error' && (
                        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-200 flex items-center gap-3">
                            <AlertTriangle size={20} />
                            Check logs for error details.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
