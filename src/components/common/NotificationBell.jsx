import { useState, useRef, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { useAuth } from '../../contexts/auth-context';
import { useNotifications } from '../../contexts/notification-context';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';

const NotificationBell = () => {
    const { currentUser } = useAuth();
    const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotifications();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    if (!currentUser) return null;

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 text-gray-500 hover:text-primary-600 hover:bg-gray-100 rounded-lg transition-colors"
                title="Thông báo"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white px-1">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 md:w-96 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-scale-in origin-top-right">
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">Thông báo</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={() => markAllAsRead()}
                                className="text-xs text-primary-600 hover:text-primary-700 font-medium hover:underline"
                            >
                                Đánh dấu đã đọc
                            </button>
                        )}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-gray-500">
                                <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                                <p className="text-xs">Đang tải...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                                <p className="text-sm">Không có thông báo mới</p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {notifications.map(item => (
                                    <div
                                        key={item.id}
                                        className={`p-4 hover:bg-gray-50 transition-colors flex gap-3 ${item.isRead ? 'opacity-60' : 'bg-blue-50/30'}`}
                                    >
                                        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${item.isRead ? 'bg-transparent' : 'bg-blue-500'}`}></div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{item.title}</p>
                                            <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{item.message}</p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {item.createdAt?.toDate ? formatDistanceToNow(item.createdAt.toDate(), { addSuffix: true, locale: vi }) : 'Vừa xong'}
                                            </p>
                                        </div>
                                        {!item.isRead && (
                                            <button
                                                onClick={() => markAsRead(item.id)}
                                                className="self-start text-gray-400 hover:text-primary-600 transition-colors"
                                                title="Đánh dấu đã đọc"
                                            >
                                                <Check size={16} />
                                            </button>
                                        )}
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

export default NotificationBell;
