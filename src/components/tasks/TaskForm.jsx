import { useState, useEffect } from 'react';
import { taskService, projectService, userService } from '../../services/firebase-services';
import { notificationService } from '../../services/notification-service';
import { useAuth } from '../../contexts/auth-context';
import { X, AlertCircle, Calendar, Briefcase, FileText, Loader2, User, Flag } from 'lucide-react';

const TaskForm = ({ onClose, onSuccess, initialData = null }) => {
    const { currentUser } = useAuth();
    const isEditing = !!initialData;

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'Chưa bắt đầu',
        priority: 'Trung bình',
        projectId: '',
        projectName: '',
        assignedTo: '',
        assignedToName: '',
        dueDate: '',
        startDate: '',
        progress: 0
    });

    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [dataLoading, setDataLoading] = useState(true);
    const [error, setError] = useState('');

    // Fetch dependencies (Projects & Users)
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [projectsData, usersData] = await Promise.all([
                    projectService.getAll(),
                    userService.getAll()
                ]);
                setProjects(projectsData);
                setUsers(usersData);
            } catch (err) {
                console.error("Failed to fetch dependencies:", err);
                setError("Không thể tải danh sách dự án hoặc thành viên");
            } finally {
                setDataLoading(false);
            }
        };
        fetchData();
    }, []);

    useEffect(() => {
        if (initialData) {
            setFormData({
                name: initialData.name || '',
                description: initialData.description || '',
                status: initialData.status || 'Chưa bắt đầu',
                priority: initialData.priority || 'Trung bình',
                projectId: initialData.projectId || '',
                projectName: initialData.projectName || '',
                assignedTo: initialData.assignedTo || '',
                assignedToName: initialData.assignedToName || '',
                dueDate: initialData.dueDate?.toDate ? new Date(initialData.dueDate.toDate()).toISOString().split('T')[0] : (initialData.dueDate || ''),
                startDate: initialData.startDate?.toDate ? new Date(initialData.startDate.toDate()).toISOString().split('T')[0] : (initialData.startDate || ''),
                progress: initialData.progress || 0
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

    const handleProjectChange = (e) => {
        const projectId = e.target.value;
        const project = projects.find(p => p.id === projectId);
        setFormData(prev => ({
            ...prev,
            projectId,
            projectName: project ? project.name : '',
            assignedTo: '', // Reset assignee when project changes
            assignedToName: ''
        }));
    };

    const handleAssigneeChange = (e) => {
        const userId = e.target.value;
        const user = users.find(u => u.uid === userId || u.id === userId); // Handle inconsistency
        setFormData(prev => ({
            ...prev,
            assignedTo: userId,
            assignedToName: user ? user.displayName : ''
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!formData.name.trim()) throw new Error('Tên nhiệm vụ là bắt buộc');
            if (!formData.projectId) throw new Error('Vui lòng chọn dự án');
            if (!formData.assignedTo) throw new Error('Vui lòng chọn người thực hiện');
            if (!formData.startDate) throw new Error('Vui lòng chọn ngày bắt đầu');
            if (!formData.dueDate) throw new Error('Vui lòng chọn hạn chót');

            const start = new Date(formData.startDate);
            const due = new Date(formData.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            // 1. Check if start date is in the past (only for new tasks)
            if (!isEditing && start < today) {
                throw new Error('Ngày bắt đầu không được ở trong quá khứ');
            }

            // 2. Check if start date > due date
            if (start > due) {
                throw new Error('Ngày bắt đầu phải trước hạn chót');
            }

            // 3. Check against Project Start Date
            const selectedProject = projects.find(p => p.id === formData.projectId);
            if (selectedProject?.startDate) {
                const projectStart = new Date(selectedProject.startDate.toDate ? selectedProject.startDate.toDate() : selectedProject.startDate);
                projectStart.setHours(0, 0, 0, 0);

                if (start < projectStart) {
                    throw new Error(`Ngày bắt đầu nhiệm vụ không được trước ngày bắt đầu dự án (${projectStart.toLocaleDateString('vi-VN')})`);
                }
            }

            const taskData = {
                ...formData,
                startDate: new Date(formData.startDate),
                dueDate: new Date(formData.dueDate),
            };

            if (isEditing) {
                await taskService.update(initialData.id, taskData);
                // Notify if assignee changed
                if (initialData.assignedTo !== formData.assignedTo) {
                    await notificationService.send({
                        recipientId: formData.assignedTo,
                        senderId: currentUser?.uid || 'Admin',
                        title: 'Nhiệm vụ mới',
                        message: `Bạn được giao nhiệm vụ mới: ${formData.name}`,
                        type: 'info',
                        link: '/tasks'
                    });
                }
            } else {
                await taskService.create({
                    ...taskData,
                });

                // Notify assignee
                await notificationService.send({
                    recipientId: formData.assignedTo,
                    senderId: currentUser?.uid || 'Admin',
                    title: 'Nhiệm vụ mới',
                    message: `Bạn được giao nhiệm vụ mới: ${formData.name}`,
                    type: 'info',
                    link: '/tasks'
                });
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

    if (dataLoading) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <Loader2 className="animate-spin text-white" size={32} />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden border border-gray-100 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-lg font-bold text-gray-900">
                        {isEditing ? 'Chỉnh sửa nhiệm vụ' : 'Thêm nhiệm vụ mới'}
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
                                    <FileText size={16} />
                                    Tên nhiệm vụ <span className="text-red-500">*</span>
                                </div>
                            </label>
                            <input
                                type="text"
                                name="name"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                placeholder="Nhập tên nhiệm vụ..."
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <div className="flex items-center gap-2">
                                        <Briefcase size={16} />
                                        Dự án <span className="text-red-500">*</span>
                                    </div>
                                </label>
                                <select
                                    name="projectId"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                    value={formData.projectId}
                                    onChange={handleProjectChange}
                                    required
                                >
                                    <option value="">-- Chọn dự án --</option>
                                    {projects.map(p => (
                                        <option key={p.id} value={p.id}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    <div className="flex items-center gap-2">
                                        <User size={16} />
                                        Người thực hiện <span className="text-red-500">*</span>
                                    </div>
                                </label>
                                <select
                                    name="assignedTo"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                    value={formData.assignedTo}
                                    onChange={handleAssigneeChange}
                                    required
                                >
                                    <option value="">-- Chọn thành viên --</option>
                                    {users
                                        .filter(u => {
                                            if (!formData.projectId) return false;
                                            const project = projects.find(p => p.id === formData.projectId);
                                            // Show all if project has no members field (legacy) or empty members, otherwise filter
                                            if (!project?.members || project.members.length === 0) return true;
                                            return project.members.includes(u.uid || u.id);
                                        })
                                        .map(u => (
                                            <option key={u.id || u.uid} value={u.uid || u.id}>{u.displayName} ({u.role})</option>
                                        ))}
                                </select>
                            </div>
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
                                        Hạn chót <span className="text-red-500">*</span>
                                    </div>
                                </label>
                                <input
                                    type="date"
                                    name="dueDate"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                    value={formData.dueDate}
                                    onChange={handleChange}
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <div className="flex items-center gap-2">
                                    <Flag size={16} />
                                    Mức độ ưu tiên
                                </div>
                            </label>
                            <select
                                name="priority"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm"
                                value={formData.priority}
                                onChange={handleChange}
                            >
                                <option value="Thấp">Thấp</option>
                                <option value="Trung bình">Trung bình</option>
                                <option value="Cao">Cao</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả</label>
                            <textarea
                                name="description"
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all text-sm resize-none"
                                placeholder="Chi tiết nhiệm vụ..."
                                rows={3}
                                value={formData.description}
                                onChange={handleChange}
                            />
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
                                {loading ? 'Đang xử lý...' : (isEditing ? 'Lưu thay đổi' : 'Tạo nhiệm vụ')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default TaskForm;
