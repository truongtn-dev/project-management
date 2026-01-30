import { useState, useEffect } from 'react';
import { projectService, userService } from '../../services/firebase-services';
import { notificationService } from '../../services/notification-service';
import { useAuth } from '../../contexts/auth-context';
import { X, AlertCircle, Calendar, Briefcase, FileText, Loader2, Users } from 'lucide-react';

const ProjectForm = ({ onClose, onSuccess, initialData = null }) => {
    const { currentUser } = useAuth();
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Chưa bắt đầu',
        startDate: '',
        endDate: '',
        progress: 0,
        members: []
    });

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await userService.getAll();
                setUsers(data);
            } catch (err) {
                console.error("Failed to fetch users:", err);
            }
        };
        fetchUsers();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                status: initialData.status || 'Chưa bắt đầu',
                startDate: initialData.startDate?.toDate ? new Date(initialData.startDate.toDate()).toISOString().split('T')[0] : (initialData.startDate || ''),
                endDate: initialData.endDate?.toDate ? new Date(initialData.endDate.toDate()).toISOString().split('T')[0] : (initialData.endDate || ''),
                progress: initialData.progress || 0,
                members: initialData.members || []
            });
        }
    }, [initialData]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'progress' ? parseInt(value) || 0 : value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!formData.name.trim()) throw new Error('Tên dự án là bắt buộc');
            if (!formData.startDate) throw new Error('Vui lòng chọn ngày bắt đầu');
            if (!formData.endDate) throw new Error('Vui lòng chọn ngày kết thúc');

            const start = new Date(formData.startDate);
            const end = new Date(formData.endDate);

            // Validate start date (must be today or future for new projects)
            if (!isEditing) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                // Reset start date hours for comparison
                const checkStart = new Date(start);
                checkStart.setHours(0, 0, 0, 0);

                if (checkStart < today) {
                    throw new Error('Ngày bắt đầu không được ở trong quá khứ');
                }
            }

            if (start > end) {
                throw new Error('Ngày kết thúc phải sau ngày bắt đầu');
            }

            const projectData = {
                ...formData,
                startDate: start,
                endDate: end,
                members: formData.members,
                memberCount: formData.members.length,
                managerId: currentUser?.uid, // Save current user as manager
                managerName: currentUser?.displayName || 'Admin',
                managerAvatar: currentUser?.photoURL || null,
                createdBy: currentUser?.uid
            };

            if (isEditing) {
                // Don't overwrite manager/createdBy on edit unless empty (optional logic, but safer to keep original)
                // For now, just update the editable fields. actually projectData has current user as manager which might override.
                // Better to exclude managerId/createdBy from update payload if it shouldn't change.
                // BUT, if we want to fix missing managerId, we could include it if it's currently missing.
                // Let's just update common fields for now, preserving original manager if exists.

                // Fetch original to check? No, initialData has it.
                const updatePayload = { ...projectData };
                if (initialData.managerId) updatePayload.managerId = initialData.managerId;
                if (initialData.createdBy) updatePayload.createdBy = initialData.createdBy;

                await projectService.update(initialData.id, updatePayload);

                // Notify NEW members only
                const oldMembers = initialData.members || [];
                const newMembers = formData.members.filter(m => !oldMembers.includes(m));

                for (const memberId of newMembers) {
                    await notificationService.send({
                        recipientId: memberId,
                        senderId: currentUser?.uid || 'Admin',
                        title: 'Tham gia dự án mới',
                        message: `Bạn đã được thêm vào dự án: ${formData.name}`,
                        type: 'info',
                        link: `/projects/${initialData.id}`
                    });
                }

            } else {
                const docRef = await projectService.create(projectData);
                // Notify ALL members
                for (const memberId of formData.members) {
                    await notificationService.send({
                        recipientId: memberId,
                        senderId: currentUser?.uid || 'Admin',
                        title: 'Dự án mới',
                        message: `Bạn đã được thêm vào dự án: ${formData.name}`,
                        type: 'info',
                        link: `/projects/${docRef.id}`
                    });
                }
            }

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
            setError(err.message || 'Có lỗi xảy ra');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">
                        {isEditing ? 'Chỉnh sửa dự án' : 'Tạo dự án mới'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-100 rounded-lg flex items-start gap-2 text-sm">
                            <AlertCircle size={18} className="flex-shrink-0 mt-0.5" />
                            <span>{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center gap-2">
                                    <Briefcase size={16} />
                                    Tên dự án <span className="text-red-500">*</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                name="name"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                placeholder="Nhập tên dự án..."
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center gap-2">
                                    <FileText size={16} />
                                    Mô tả
                                </div>
                            </label>
                            <textarea
                                name="description"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm resize-none"
                                placeholder="Mô tả phạm vi và mục tiêu dự án..."
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Trạng thái</label>
                                <select
                                    name="status"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="Chưa bắt đầu">Chưa bắt đầu</option>
                                    <option value="Đang thực hiện">Đang thực hiện</option>
                                    <option value="Tạm dừng">Tạm dừng</option>
                                    <option value="Hoàn thành">Hoàn thành</option>
                                    <option value="Hủy bỏ">Hủy bỏ</option>
                                </select>
                            </div>

                            {isEditing && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tiến độ (%) <span className="text-xs text-blue-500 font-normal">(Tự động)</span></label>
                                    <input
                                        type="number"
                                        name="progress"
                                        min="0"
                                        max="100"
                                        disabled
                                        className="w-full px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg focus:outline-none text-gray-500 cursor-not-allowed text-sm"
                                        value={formData.progress}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        Ngày bắt đầu <span className="text-red-500">*</span>
                                    </div>
                                </label>
                                <input
                                    type="date"
                                    name="startDate"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} />
                                        Ngày kết thúc <span className="text-red-500">*</span>
                                    </div>
                                </label>
                                <input
                                    type="date"
                                    name="endDate"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        {/* Members Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    Thành viên tham gia ({formData.members.length})
                                </div>
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border border-gray-200 rounded-lg bg-gray-50">
                                {users.map(user => (
                                    <div key={user.id} className="flex items-center gap-2 p-2 hover:bg-white rounded-md transition-colors cursor-pointer">
                                        <input
                                            type="checkbox"
                                            id={`member-${user.id}`}
                                            checked={formData.members.includes(user.uid || user.id)}
                                            onChange={(e) => {
                                                const memberId = user.uid || user.id;
                                                setFormData(prev => ({
                                                    ...prev,
                                                    members: e.target.checked
                                                        ? [...prev.members, memberId]
                                                        : prev.members.filter(id => id !== memberId)
                                                }));
                                            }}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <label htmlFor={`member-${user.id}`} className="text-sm text-gray-700 cursor-pointer flex-1">
                                            {user.displayName || user.email}
                                            <span className="text-xs text-gray-400 ml-1">({user.role})</span>
                                        </label>
                                    </div>
                                ))}
                                {users.length === 0 && (
                                    <div className="text-sm text-gray-400 p-2 col-span-2 text-center">
                                        Chưa có thành viên nào
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="pt-4 flex items-center justify-end gap-3">
                            <button
                                type="button"
                                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors"
                                onClick={onClose}
                                disabled={loading}
                            >
                                Hủy
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium text-sm shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed flex items-center gap-2"
                                disabled={loading}
                            >
                                {loading && <Loader2 className="animate-spin" size={16} />}
                                {loading ? 'Đang xử lý...' : (isEditing ? 'Lưu thay đổi' : 'Tạo dự án')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProjectForm;
