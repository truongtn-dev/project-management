import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { meetingService } from '../../services/meeting-service';
import { Bell, Check, Trash2, Calendar, Info, Clock } from 'lucide-react';
import { format } from 'date-fns';

const NotificationList = () => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        if (!currentUser) return;

        const unsubscribe = meetingService.subscribeToNotifications(currentUser.uid, (data) => {
            setNotifications(data);
        });

        return () => unsubscribe();
    }, [currentUser]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    const handleMarkAsRead = async (id) => {
        await meetingService.markAsRead(id);
    };

    const handleMarkAllAsRead = async () => {
        await meetingService.markAllAsRead(currentUser.uid);
    };

    const getIcon = (type) => {
        switch (type) {
            case 'meeting_invite':
            case 'meeting_update':
                return <Calendar className="w-5 h-5 text-indigo-500" />;
            default:
                return <Info className="w-5 h-5 text-gray-500" />;
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors rounded-full"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-white">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white border border-gray-200 rounded-xl shadow-2xl z-50 overflow-hidden ring-1 ring-black/5 animate-fade-in">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/80 backdrop-blur-sm">
                        <h3 className="font-bold text-gray-800">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium transition-colors hover:underline"
                            >
                                Đánh dấu đã đọc tất cả
                            </button>
                        )}
                    </div>

                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 flex flex-col items-center gap-2">
                                <Bell className="w-10 h-10 opacity-20" />
                                <p className="text-sm font-medium">Không có thông báo nào</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100">
                                {notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors ${!notification.isRead ? 'bg-indigo-50/50' : 'bg-white'}`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="mt-1 flex-shrink-0">
                                                {getIcon(notification.type)}
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start gap-2">
                                                    <p className={`text-sm ${!notification.isRead ? 'text-gray-900 font-bold' : 'text-gray-600 font-medium'}`}>
                                                        {notification.title}
                                                    </p>
                                                    {!notification.isRead && (
                                                        <span className="w-2 h-2 bg-indigo-600 rounded-full flex-shrink-0 mt-1.5 shadow-sm" />
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500 leading-relaxed">
                                                    {notification.message}
                                                </p>
                                                <p className="text-[10px] text-gray-400 pt-1 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    {notification.createdAt?.toDate ? format(notification.createdAt.toDate(), 'PPp') : 'Vừa xong'}
                                                </p>
                                            </div>
                                            {!notification.isRead && (
                                                <button
                                                    onClick={() => handleMarkAsRead(notification.id)}
                                                    className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-full transition-all self-start"
                                                    title="Đánh dấu đã đọc"
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationList;
