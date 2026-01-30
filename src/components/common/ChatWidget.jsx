import { useState, useEffect, useRef } from 'react';
import {
    collection,
    addDoc,
    query,
    orderBy,
    limit,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import { useAuth } from '../../contexts/auth-context';
import { MessageCircle, X, Send, Minimize2, ArrowDown } from 'lucide-react';

const ChatWidget = () => {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isMinimized, setIsMinimized] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
        }
    }, [messages, isOpen, isMinimized]);

    useEffect(() => {
        if (!isOpen) return;

        const q = query(
            collection(db, 'public_chat'),
            orderBy('createdAt', 'asc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const msgs = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(msgs);
        });

        return () => unsubscribe();
    }, [isOpen]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !user) return;

        try {
            await addDoc(collection(db, 'public_chat'), {
                text: newMessage,
                senderId: user.uid,
                senderName: user.displayName || user.email.split('@')[0],
                senderAvatar: user.photoURL,
                createdAt: serverTimestamp()
            });
            setNewMessage('');
        } catch (error) {
            console.error("Error sending message:", error);
        }
    };

    if (!user) return null;

    return (
        <div className={`fixed z-50 transition-all duration-300 ${isMinimized ? 'bottom-0 right-6 w-72' : 'bottom-6 right-6'}`}>
            {/* Toggle Button */}
            {!isOpen && (
                <button
                    className="flex items-center gap-2 px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-full shadow-lg shadow-primary-500/30 transition-all hover:scale-105 active:scale-95 group"
                    onClick={() => setIsOpen(true)}
                >
                    <MessageCircle size={24} className="animate-pulse" />
                    <span className="font-semibold">Thảo luận</span>
                    <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                    </span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className={`bg-white rounded-t-xl shadow-2xl overflow-hidden border border-gray-200 transition-all duration-300 ${isMinimized ? 'h-14' : 'h-[500px] w-[350px] rounded-xl'}`}>

                    {/* Header */}
                    <div
                        className="bg-primary-600 p-3 flex items-center justify-between cursor-pointer hover:bg-primary-700 transition-colors"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        <div className="flex items-center gap-2 text-white">
                            <MessageCircle size={18} />
                            <span className="font-semibold text-sm">Cộng đồng chung</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsMinimized(!isMinimized);
                                }}
                            >
                                <Minimize2 size={16} />
                            </button>
                            <button
                                className="p-1 text-white/80 hover:text-white hover:bg-white/10 rounded transition-colors"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsOpen(false);
                                    setIsMinimized(false);
                                }}
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {!isMinimized && (
                        <div className="flex flex-col h-[calc(100%-48px)]">
                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50/50">
                                <div className="text-center py-4 text-xs text-gray-400">
                                    <p>👋 Kênh thảo luận chung cho thành viên dự án.</p>
                                </div>

                                {messages.map((msg) => {
                                    const isMe = msg.senderId === user.uid;
                                    return (
                                        <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            {!isMe && (
                                                <span className="text-[10px] text-gray-500 ml-1 mb-0.5 max-w-[80%] truncate">
                                                    {msg.senderName}
                                                </span>
                                            )}
                                            <div
                                                className={`max-w-[80%] px-3.5 py-2 rounded-2xl text-sm shadow-sm
                                                ${isMe
                                                        ? 'bg-primary-600 text-white rounded-tr-none'
                                                        : 'bg-white text-gray-800 border border-gray-200 rounded-tl-none'}`}
                                            >
                                                {msg.text}
                                            </div>
                                            <span className="text-[9px] text-gray-400 mt-0.5 mx-1">
                                                {msg.createdAt?.toDate ?
                                                    msg.createdAt.toDate().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) :
                                                    '•'}
                                            </span>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-gray-100 flex gap-2">
                                <input
                                    type="text"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    placeholder="Nhập tin nhắn..."
                                    className="flex-1 bg-gray-100 border-none rounded-full px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 focus:bg-white transition-all"
                                />
                                <button
                                    type="submit"
                                    className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                                    disabled={!newMessage.trim()}
                                >
                                    <Send size={16} className={newMessage.trim() ? "ml-0.5" : ""} />
                                </button>
                            </form>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default ChatWidget;
