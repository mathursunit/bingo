import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import {
    collection,
    query,
    where,
    onSnapshot,
    addDoc,
    deleteDoc,
    doc,
    getDocs,
    serverTimestamp,
    writeBatch
} from 'firebase/firestore';

export interface FriendRequest {
    id: string;
    fromUserId: string;
    fromUserEmail: string;
    fromUserName: string;
    fromUserPhoto: string | null;
    toUserId: string;
    toUserEmail: string;
    status: 'pending' | 'accepted' | 'rejected';
    createdAt: any;
}

export interface Friend {
    uid: string;
    email: string;
    displayName: string;
    photoURL: string | null;
    since: any;
}

export const useFriends = () => {
    const { user } = useAuth();
    const [friends, setFriends] = useState<Friend[]>([]);
    const [incomingRequests, setIncomingRequests] = useState<FriendRequest[]>([]);
    const [outgoingRequests, setOutgoingRequests] = useState<FriendRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // 1. Listen for Friends
    useEffect(() => {
        if (!user) {
            setFriends([]);
            setLoading(false);
            return;
        }

        const friendsRef = collection(db, `users/${user.uid}/friends`);
        const unsubscribe = onSnapshot(friendsRef, (snapshot) => {
            const friendsList: Friend[] = [];
            snapshot.forEach((doc) => {
                friendsList.push(doc.data() as Friend);
            });
            setFriends(friendsList);
        });

        return () => unsubscribe();
    }, [user]);

    // 2. Listen for Incoming Requests
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'friend_requests'),
            where('toUserEmail', '==', user.email),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs: FriendRequest[] = [];
            snapshot.forEach((doc) => {
                reqs.push({ id: doc.id, ...doc.data() } as FriendRequest);
            });
            setIncomingRequests(reqs);
            setLoading(false); // At least requests loaded
        });

        return () => unsubscribe();
    }, [user]);

    // 3. Listen for Outgoing Requests (to show "Pending")
    useEffect(() => {
        if (!user) return;

        const q = query(
            collection(db, 'friend_requests'),
            where('fromUserId', '==', user.uid),
            where('status', '==', 'pending')
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const reqs: FriendRequest[] = [];
            snapshot.forEach((doc) => {
                reqs.push({ id: doc.id, ...doc.data() } as FriendRequest);
            });
            setOutgoingRequests(reqs);
        });

        return () => unsubscribe();
    }, [user]);

    // Action: Send Request
    const sendFriendRequest = async (email: string) => {
        if (!user) throw new Error("Not authenticated");
        if (email.toLowerCase() === user.email?.toLowerCase()) throw new Error("You cannot add yourself.");

        // Check if user exists (by email query on users collection)
        // NOTE: This usually requires an index or public readability of users.
        // Assuming we have a 'users' collection where email is queryable.
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase()));
        const userSnapshot = await getDocs(q);

        if (userSnapshot.empty) {
            return { success: false, message: "User not found." };
        }

        const targetUser = userSnapshot.docs[0].data();
        const targetUserId = userSnapshot.docs[0].id; // document ID is usually UID

        // Check if already friends
        if (friends.some(f => f.email.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: "Use is already your friend." };
        }

        // Check if request already pending from ME
        if (outgoingRequests.some(r => r.toUserEmail.toLowerCase() === email.toLowerCase())) {
            return { success: false, message: "Request already sent." };
        }

        // Create Request
        await addDoc(collection(db, 'friend_requests'), {
            fromUserId: user.uid,
            fromUserEmail: user.email,
            fromUserName: user.displayName || 'Unknown',
            fromUserPhoto: user.photoURL,
            toUserId: targetUserId,
            toUserEmail: targetUser.email,
            status: 'pending',
            createdAt: serverTimestamp()
        });

        return { success: true, message: "Friend request sent!" };
    };

    // Action: Accept Request
    const acceptFriendRequest = async (request: FriendRequest) => {
        if (!user) return;

        const batch = writeBatch(db);

        // 1. Update Request Status
        const requestRef = doc(db, 'friend_requests', request.id);
        batch.update(requestRef, { status: 'accepted' });

        // 2. Add to MY friends
        const myFriendRef = doc(db, `users/${user.uid}/friends/${request.fromUserId}`);
        batch.set(myFriendRef, {
            uid: request.fromUserId,
            email: request.fromUserEmail,
            displayName: request.fromUserName,
            photoURL: request.fromUserPhoto,
            since: serverTimestamp()
        });

        // 3. Add to THEIR friends
        // NOTE: This typically requires backend rules allowing user A to write to user B's subcollection
        // If rules block this, we need a Cloud Function trigger. 
        // For MVP, we'll try client-side writing assuming permissive rules or 'request.auth.uid exists' logic.
        const theirFriendRef = doc(db, `users/${request.fromUserId}/friends/${user.uid}`);
        batch.set(theirFriendRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || 'Unknown',
            photoURL: user.photoURL,
            since: serverTimestamp()
        });

        await batch.commit();
    };

    // Action: Reject Request
    const rejectFriendRequest = async (requestId: string) => {
        // Option A: Delete it
        await deleteDoc(doc(db, 'friend_requests', requestId));
        // Option B: Set status rejected (keeps history)
        // await updateDoc(doc(db, 'friend_requests', requestId), { status: 'rejected' });
    };

    // Action: Remove Friend
    const removeFriend = async (friendId: string) => {
        if (!user) return;

        const batch = writeBatch(db);
        const myRef = doc(db, `users/${user.uid}/friends/${friendId}`);
        const theirRef = doc(db, `users/${friendId}/friends/${user.uid}`);

        batch.delete(myRef);
        batch.delete(theirRef);

        await batch.commit();
    };

    // Helper: Find friends not yet added to a board
    const getFriendsNotInBoard = (boardMembers: any[]) => {
        // boardMembers is array of objects { id, ... }
        const memberIds = new Set(boardMembers.map(m => m.id));
        return friends.filter(f => !memberIds.has(f.uid));
    };

    return {
        friends,
        incomingRequests,
        outgoingRequests,
        loading,
        sendFriendRequest,
        acceptFriendRequest,
        rejectFriendRequest,
        removeFriend,
        getFriendsNotInBoard
    };
};
