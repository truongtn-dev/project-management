import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './auth-context';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';
import { notificationService } from '../services/notification-service';

const NotificationContext = createContext({});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
            return;
        }

        setLoading(true);
        const q = query(
            collection(db, 'notifications'),
            where('recipientId', '==', currentUser.uid),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const items = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            // Client-side sorting to avoid Firestore Index requirement
            items.sort((a, b) => {
                const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
                const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
                return dateB - dateA; // Descending
            });

            setNotifications(items);
            setUnreadCount(items.filter(n => !n.isRead).length);
            setLoading(false);
        }, (error) => {
            console.error("Error streaming notifications:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [currentUser]);

    const markAsRead = async (id) => {
        await notificationService.markAsRead(id);
    };

    const markAllAsRead = async () => {
        if (currentUser) {
            await notificationService.markAllAsRead(currentUser.uid);
        }
    };

    const sendNotification = async (data) => {
        await notificationService.send(data);
    };

    const value = {
        notifications,
        unreadCount,
        loading,
        markAsRead,
        markAllAsRead,
        sendNotification
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};
