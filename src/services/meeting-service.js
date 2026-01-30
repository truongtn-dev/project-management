import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { emailService } from './email-service';

const MEETINGS_COLLECTION = 'meetings';
const NOTIFICATIONS_COLLECTION = 'notifications';

export const meetingService = {
    // Create a new meeting
    createMeeting: async (meetingData, createdBy) => {
        try {
            const docRef = await addDoc(collection(db, MEETINGS_COLLECTION), {
                ...meetingData,
                createdBy: createdBy.uid,
                createdByName: createdBy.displayName,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Send In-App Notifications only (defer email)
            if (meetingData.participants && meetingData.participants.length > 0) {
                const recipients = meetingData.participants.filter(uid => uid !== createdBy.uid);

                if (recipients.length > 0) {
                    await meetingService.sendNotifications(
                        recipients,
                        'New Meeting Invitation',
                        `You have been invited to: ${meetingData.title}`,
                        'meeting_invite',
                        docRef.id
                        // Note: Not passing meetingLink/Date here anymore to skip email in sendNotifications
                    );
                }
            }

            return docRef.id;
        } catch (error) {
            console.error('Error creating meeting:', error);
            throw error;
        }
    },

    // Update an existing meeting
    updateMeeting: async (meetingId, meetingData, userId) => {
        try {
            const meetingRef = doc(db, MEETINGS_COLLECTION, meetingId);

            await updateDoc(meetingRef, {
                ...meetingData,
                updatedAt: serverTimestamp()
            });

            // Notify participants of changes (In-App only)
            if (meetingData.participants && meetingData.participants.length > 0) {
                const recipients = meetingData.participants.filter(uid => uid !== userId);

                if (recipients.length > 0) {
                    await meetingService.sendNotifications(
                        recipients,
                        'Meeting Updated',
                        `The meeting "${meetingData.title}" has been updated.`,
                        'meeting_update',
                        meetingId
                    );
                }
            }
        } catch (error) {
            console.error('Error updating meeting:', error);
            throw error;
        }
    },

    // Delete a meeting
    deleteMeeting: async (meetingId) => {
        try {
            await deleteDoc(doc(db, MEETINGS_COLLECTION, meetingId));
        } catch (error) {
            console.error('Error deleting meeting:', error);
            throw error;
        }
    },

    // Subscribe to meetings (Fetch ALL meetings for shared calendar)
    subscribeToMeetings: (userId, callback) => {
        // Query all meetings ordered by date
        // Since firestore.rules now allow read for all authenticated users, we can show a shared calendar.
        const q = query(
            collection(db, MEETINGS_COLLECTION),
            orderBy('date', 'asc')
        );

        return onSnapshot(q, (snapshot) => {
            const meetings = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                date: doc.data().date?.toDate ? doc.data().date.toDate() : new Date(doc.data().date)
            }));
            callback(meetings);
        });
    },

    // Helper to send in-app notifications (Email is now manual)
    sendNotifications: async (recipientIds, title, message, type, relatedId) => {
        try {
            await Promise.all(recipientIds.map(async (uid) => {
                // Create In-App Notification
                await addDoc(collection(db, NOTIFICATIONS_COLLECTION), {
                    recipientId: uid,
                    title,
                    message,
                    type,
                    relatedId,
                    isRead: false,
                    createdAt: serverTimestamp()
                });
            }));
        } catch (error) {
            console.error('Error sending in-app notifications:', error);
        }
    },

    // NEW: Manual trigger to send emails for a meeting
    sendMeetingEmailsManual: async (meetingId, userId) => {
        try {
            // 1. Get Meeting Data
            const meetingDoc = await getDocs(query(collection(db, MEETINGS_COLLECTION), where('__name__', '==', meetingId)));
            if (meetingDoc.empty) throw new Error('Meeting not found');
            const meetingData = meetingDoc.docs[0].data();

            if (!meetingData.participants || meetingData.participants.length === 0) return;

            // 2. Filter recipients (exclude sender)
            const recipients = meetingData.participants.filter(uid => uid !== userId);

            // 3. Send emails to each recipient
            await Promise.all(recipients.map(async (uid) => {
                const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', uid)));

                if (!userDoc.empty) {
                    const userData = userDoc.docs[0].data();
                    if (userData.email) {
                        const linkToSend = meetingData.link || `${window.location.origin}/meetings`;

                        // Format date
                        let dateStr = new Date().toLocaleString();
                        if (meetingData.date) {
                            const dateObj = meetingData.date.toDate ? meetingData.date.toDate() : new Date(meetingData.date);
                            dateStr = dateObj.toLocaleString('vi-VN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                        }

                        await emailService.sendMeetingInvitation(
                            userData.email,
                            userData.displayName || 'Member',
                            'Lời mời tham gia cuộc họp',
                            `Bạn có một lời mời họp: ${meetingData.title}`,
                            linkToSend,
                            dateStr
                        );
                    }
                }
            }));

            // 4. Update meeting to mark as email sent
            await updateDoc(doc(db, MEETINGS_COLLECTION, meetingId), {
                isEmailSent: true,
                emailSentAt: serverTimestamp()
            });

            return true;
        } catch (error) {
            console.error('Error sending manual meeting emails:', error);
            throw error;
        }
    },

    // Subscribe to notifications
    subscribeToNotifications: (userId, callback) => {
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('recipientId', '==', userId), // Standardized to recipientId
            orderBy('createdAt', 'desc')
        );

        return onSnapshot(q, (snapshot) => {
            const notifications = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            callback(notifications);
        });
    },

    // Mark notification as read
    markAsRead: async (notificationId) => {
        await updateDoc(doc(db, NOTIFICATIONS_COLLECTION, notificationId), {
            isRead: true // Standardized to isRead
        });
    },

    // Mark all as read
    markAllAsRead: async (userId) => {
        const q = query(
            collection(db, NOTIFICATIONS_COLLECTION),
            where('recipientId', '==', userId), // Standardized to recipientId
            where('isRead', '==', false) // Standardized to isRead
        );
        const snapshot = await getDocs(q);
        const updates = snapshot.docs.map(doc =>
            updateDoc(doc.ref, { isRead: true })
        );
        await Promise.all(updates);
    }
};
