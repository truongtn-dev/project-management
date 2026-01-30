import { collection, addDoc, updateDoc, doc, serverTimestamp, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const notificationService = {
    // Send a notification
    send: async ({ recipientId, title, message, type, link = null, senderId = null }) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                recipientId,
                senderId,
                title,
                message,
                type, // 'info', 'success', 'warning', 'error'
                link,
                isRead: false,
                createdAt: serverTimestamp()
            });
        } catch (error) {
            console.error("Error sending notification:", error);
        }
    },

    // Mark as read
    markAsRead: async (notificationId) => {
        try {
            const ref = doc(db, 'notifications', notificationId);
            await updateDoc(ref, {
                isRead: true
            });
        } catch (error) {
            console.error("Error marking notification as read:", error);
        }
    },

    // Mark all as read for user
    markAllAsRead: async (userId) => {
        try {
            const q = query(
                collection(db, 'notifications'),
                where('recipientId', '==', userId),
                where('isRead', '==', false)
            );
            const snapshot = await getDocs(q);
            const batch = [];
            snapshot.forEach(doc => {
                updateDoc(doc.ref, { isRead: true });
            });
        } catch (error) {
            console.error("Error marking all notifications as read:", error);
        }
    }
};
