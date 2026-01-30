import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/auth-context';
import { meetingService } from '../../services/meeting-service';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import { X, Calendar, Clock, Link as LinkIcon, Users, FileText, Loader2, Mail, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

const MeetingForm = ({ isOpen, onClose, selectedDate, meetingToEdit = null, onSave }) => {
    const { currentUser, userRole } = useAuth();
    const [loading, setLoading] = useState(false);
    const [sendingEmail, setSendingEmail] = useState(false);
    const [users, setUsers] = useState([]);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        date: '',
        time: '',
        duration: 60,
        link: '',
        participantIds: []
    });

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                // Fetch all users for selection
                const snapshot = await getDocs(collection(db, 'users'));
                const usersData = snapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Filter out current user from selection list (optional, but usually you invite others)
                setUsers(usersData.filter(u => u.uid !== currentUser?.uid));
            } catch (error) {
                console.error('Error fetching users:', error);
            }
        };

        if (isOpen) {
            fetchUsers();
        }
    }, [isOpen, currentUser]);

    useEffect(() => {
        if (meetingToEdit) {
            setFormData({
                title: meetingToEdit.title,
                description: meetingToEdit.description || '',
                date: meetingToEdit.date ? format(meetingToEdit.date.toDate ? meetingToEdit.date.toDate() : new Date(meetingToEdit.date), 'yyyy-MM-dd') : '',
                time: meetingToEdit.date ? format(meetingToEdit.date.toDate ? meetingToEdit.date.toDate() : new Date(meetingToEdit.date), 'HH:mm') : '',
                duration: meetingToEdit.duration || 60,
                link: meetingToEdit.link || '',
                participantIds: meetingToEdit.participantIds || []
            });
        } else if (selectedDate) {
            setFormData(prev => ({
                ...prev,
                date: format(selectedDate, 'yyyy-MM-dd'),
                time: '09:00' // Default start time
            }));
        } else {
            // Reset form
            setFormData({
                title: '',
                description: '',
                date: format(new Date(), 'yyyy-MM-dd'),
                time: '09:00',
                duration: 60,
                link: '',
                participantIds: []
            });
        }
    }, [meetingToEdit, selectedDate, isOpen]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleParticipantToggle = (userId) => {
        setFormData(prev => {
            const currentIds = prev.participantIds;
            if (currentIds.includes(userId)) {
                return { ...prev, participantIds: currentIds.filter(id => id !== userId) };
            } else {
                return { ...prev, participantIds: [...currentIds, userId] };
            }
        });
    };

    const handleSendEmail = async () => {
        if (!meetingToEdit) return;

        setSendingEmail(true);
        try {
            await meetingService.sendMeetingEmailsManual(meetingToEdit.id, currentUser.uid);
            alert('Đã gửi email mời họp thành công đến các thành viên!');
            if (onSave) onSave();
        } catch (error) {
            console.error('Error sending emails:', error);
            alert('Gửi email thất bại: ' + error.message);
        } finally {
            setSendingEmail(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            // Combine date and time
            const startDateTime = new Date(`${formData.date}T${formData.time}`);

            // Validate future date
            if (startDateTime < new Date()) {
                alert('Không thể tạo cuộc họp trong quá khứ. Vui lòng chọn thời gian khác.');
                setLoading(false);
                return;
            }

            const meetingData = {
                title: formData.title,
                description: formData.description,
                date: startDateTime,
                duration: parseInt(formData.duration),
                link: formData.link,
                participantIds: [...formData.participantIds, currentUser.uid], // Include creator
                participants: [...formData.participantIds, currentUser.uid] // For simple notification logic (could be structured better)
            };

            if (meetingToEdit) {
                await meetingService.updateMeeting(meetingToEdit.id, meetingData, currentUser.uid);
            } else {
                await meetingService.createMeeting(meetingData, currentUser);
            }

            if (onSave) onSave();
            onClose();
        } catch (error) {
            console.error('Error saving meeting:', error);
            alert('Failed to save meeting');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <h2 className="text-xl font-bold text-gray-800">
                        {meetingToEdit ? 'Edit Meeting' : 'Schedule New Meeting'}
                    </h2>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-4">
                        {/* Title & Link */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Meeting Title</label>
                                <input
                                    type="text"
                                    name="title"
                                    required
                                    value={formData.title}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                    placeholder="e.g., Weekly Sync"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Meeting Link</label>
                                <div className="relative">
                                    <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="url"
                                        name="link"
                                        value={formData.link}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                        placeholder="https://meet.google.com/..."
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Date & Time */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Date</label>
                                <div className="relative">
                                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="date"
                                        name="date"
                                        required
                                        value={formData.date}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Time</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="time"
                                        name="time"
                                        required
                                        value={formData.time}
                                        onChange={handleChange}
                                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Duration (min)</label>
                                <input
                                    type="number"
                                    name="duration"
                                    required
                                    min="15"
                                    step="15"
                                    value={formData.duration}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none"
                                />
                            </div>
                        </div>

                        {/* Description */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Description</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all outline-none resize-none"
                                placeholder="Meeting agenda..."
                            />
                        </div>

                        {/* Participants */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700 flex justify-between">
                                <span>Participants</span>
                                <span className="text-xs text-gray-500">{formData.participantIds.length} selected</span>
                            </label>
                            <div className="border border-gray-200 rounded-lg p-4 max-h-48 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {users.map(user => (
                                        <label key={user.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-md cursor-pointer transition-colors">
                                            <input
                                                type="checkbox"
                                                checked={formData.participantIds.includes(user.uid)}
                                                onChange={() => handleParticipantToggle(user.uid)}
                                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                            />
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-bold">
                                                    {user.displayName?.[0] || 'U'}
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-700">{user.displayName}</span>
                                                    <span className="text-xs text-gray-400">{user.role}</span>
                                                </div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-between items-center bg-gray-50/30 p-4 -mx-6 -mb-6">
                        <div className="flex gap-2">
                            {meetingToEdit && (['admin', 'manager'].includes(userRole?.toLowerCase())) && (
                                <button
                                    type="button"
                                    onClick={handleSendEmail}
                                    disabled={sendingEmail || !meetingToEdit.participantIds?.length}
                                    className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all
                                        ${meetingToEdit.isEmailSent
                                            ? 'bg-green-50 text-green-700 border border-green-200'
                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100'}`}
                                >
                                    {sendingEmail ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : meetingToEdit.isEmailSent ? (
                                        <CheckCircle className="w-4 h-4" />
                                    ) : (
                                        <Mail className="w-4 h-4" />
                                    )}
                                    {meetingToEdit.isEmailSent ? 'Đã gửi Email' : 'Gửi Email Mời Họp'}
                                </button>
                            )}
                        </div>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                            >
                                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                                {meetingToEdit ? 'Update Meeting' : 'Schedule Meeting'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default MeetingForm;
