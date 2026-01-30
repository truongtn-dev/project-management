import { useState, useEffect } from 'react';
import { taskService, projectService } from '../services/firebase-services';
import { useStreamCollection } from '../hooks/use-firestore-stream';
import { orderBy, doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../contexts/auth-context';
import { useNotifications } from '../contexts/notification-context';
import { Plus, Search, Calendar, User, CheckCircle2, Circle, AlertCircle, Play, Send, XCircle, ExternalLink, Edit2, Trash2 } from 'lucide-react';
import TaskForm from '../components/tasks/TaskForm';
import ReviewModal from '../components/tasks/ReviewModal';
import ConfirmModal from '../components/common/ConfirmModal';

import Pagination from '../components/common/Pagination';

const TasksPage = () => {
    const { currentUser, userRole, userProfile } = useAuth();
    const { sendNotification } = useNotifications();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredTasks, setFilteredTasks] = useState([]);
    const [paginatedTasks, setPaginatedTasks] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Create/Edit Modal State
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTask, setEditingTask] = useState(null);

    // Review Modal State
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [selectedTaskForReview, setSelectedTaskForReview] = useState(null);
    const [processingId, setProcessingId] = useState(null);

    // Delete Modal State
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    const { data: tasks, loading: tasksLoading, error: tasksError } = useStreamCollection(
        'tasks',
        orderBy('createdAt', 'desc')
    );

    // We need projects to check permissions (if user is member of project)
    const { data: projects, loading: projectsLoading } = useStreamCollection('projects');

    const loading = tasksLoading || projectsLoading;
    const error = tasksError;

    useEffect(() => {
        if (!tasks || !currentUser) return;

        let filtered = tasks;

        // PERMISSION FILTER
        if (userRole !== 'Admin') {
            // 1. Tasks assigned directly to me
            // 2. Tasks in projects where I am a member or manager
            const myProjectIds = projects
                ?.filter(p => p.managerId === currentUser.uid || p.members?.includes(currentUser.uid))
                .map(p => p.id) || [];

            filtered = filtered.filter(t =>
                t.assignedTo === currentUser.uid ||
                myProjectIds.includes(t.projectId)
            );
        }

        // Filter by tab
        if (activeTab !== 'all') {
            const statusMap = {
                'todo': 'Chưa bắt đầu',
                'in-progress': 'Đang thực hiện',
                'review': 'Chờ duyệt',
                'completed': 'Hoàn thành'
            };
            if (statusMap[activeTab]) {
                filtered = filtered.filter(t => t.status === statusMap[activeTab]);
            }
        }

        // Filter by search
        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredTasks(filtered);
        setCurrentPage(1); // Reset page on filter/search change
    }, [tasks, projects, activeTab, searchQuery, currentUser, userRole]);

    // Pagination Logic
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setPaginatedTasks(filteredTasks.slice(startIndex, endIndex));
    }, [filteredTasks, currentPage]);

    const handleEdit = (task) => {
        setEditingTask(task);
        setShowCreateModal(true);
    };

    const handleDeleteClick = (task) => {
        setTaskToDelete(task);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!taskToDelete) return;
        setDeleteLoading(true);
        try {
            await deleteDoc(doc(db, 'tasks', taskToDelete.id));
            setShowDeleteModal(false);
            setTaskToDelete(null);
        } catch (err) {
            console.error('Error deleting task:', err);
            alert('Có lỗi xảy ra khi xóa nhiệm vụ');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handleTaskAction = async (task, action, payload = null) => {
        setProcessingId(task.id);
        try {
            const taskRef = doc(db, 'tasks', task.id);
            let newStatus = task.status;
            let notificationData = null;

            // 1. Get Project info for manager ID
            const projectRef = doc(db, 'projects', task.projectId);
            const projectSnap = await getDoc(projectRef);
            const projectData = projectSnap.exists() ? projectSnap.data() : null;
            const managerId = projectData?.managerId || projectData?.createdBy;

            const userName = userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'Thành viên';

            // Fallback: If no manager found, and user is Admin, assume they are acting manager. 
            // Or better, just log warning. 
            // If managerId is still null, notifications won't send, which is expected if data is bad.

            if (action === 'start') {
                newStatus = 'Đang thực hiện';
                await updateDoc(taskRef, { status: newStatus, progress: 10 });

                // Notify Manager
                if (managerId && managerId !== currentUser.uid) {
                    notificationData = {
                        recipientId: managerId,
                        title: 'Nhiệm vụ bắt đầu',
                        message: `${userName} đã bắt đầu: ${task.name}`,
                        type: 'info',
                        link: '/tasks'
                    };
                }
            } else if (action === 'submit_review') {
                newStatus = 'Chờ duyệt';
                await updateDoc(taskRef, {
                    status: newStatus,
                    progress: 90,
                    reviewLink: payload.link,
                    reviewNotes: payload.notes
                });

                // Notify Manager
                if (managerId && managerId !== currentUser.uid) {
                    notificationData = {
                        recipientId: managerId,
                        title: 'Yêu cầu duyệt nhiệm vụ',
                        message: `${userName} đã gửi yêu cầu duyệt: ${task.name}`,
                        type: 'info',
                        link: '/tasks'
                    };
                }
            } else if (action === 'approve') {
                newStatus = 'Hoàn thành';
                await updateDoc(taskRef, { status: newStatus, progress: 100 });

                // Notify Assignee
                if (task.assignedTo !== currentUser.uid) {
                    notificationData = {
                        recipientId: task.assignedTo,
                        title: 'Nhiệm vụ hoàn thành',
                        message: `Admin đã duyệt nhiệm vụ: ${task.name}`,
                        type: 'success',
                        link: '/tasks'
                    };
                }
            } else if (action === 'reject') {
                newStatus = 'Đang thực hiện'; // Back to in-progress
                await updateDoc(taskRef, { status: newStatus, progress: 50 }); // Reset progress partially

                // Notify Assignee
                if (task.assignedTo !== currentUser.uid) {
                    notificationData = {
                        recipientId: task.assignedTo,
                        title: 'Yêu cầu chỉnh sửa',
                        message: `Admin đã từ chối/yêu cầu sửa nhiệm vụ: ${task.name}`,
                        type: 'warning',
                        link: '/tasks'
                    };
                }
            }

            if (notificationData) {
                await sendNotification(notificationData);
            }

        } catch (err) {
            console.error("Action error:", err);
            alert("Có lỗi xảy ra: " + err.message);
        } finally {
            setProcessingId(null);
            setShowReviewModal(false);
            setSelectedTaskForReview(null);
        }
    };

    const tabs = [
        { id: 'all', label: 'Tất cả' },
        { id: 'todo', label: 'Cần làm' },
        { id: 'in-progress', label: 'Đang chạy' },
        { id: 'review', label: 'Chờ duyệt' },
        { id: 'completed', label: 'Hoàn thành' }
    ];

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'Cao': return 'text-red-600 bg-red-50 border-red-100';
            case 'Trung bình': return 'text-amber-600 bg-amber-50 border-amber-100';
            case 'Thấp': return 'text-green-600 bg-green-50 border-green-100';
            default: return 'text-gray-600 bg-gray-50 border-gray-100';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'Hoàn thành': return <CheckCircle2 size={16} className="text-green-500" />;
            case 'Đang thực hiện': return <AlertCircle size={16} className="text-blue-500" />;
            case 'Chờ duyệt': return <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />;
            default: return <Circle size={16} className="text-gray-400" />;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-card border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý nhiệm vụ</h1>
                    <p className="text-sm text-gray-500 mt-1">Theo dõi tiến độ và phê duyệt công việc</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500" size={18} />
                        <input
                            type="text"
                            className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 w-full sm:w-64 transition-all"
                            placeholder="Tìm kiếm nhiệm vụ..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {['Admin', 'Quản lý'].includes(userRole) && (
                        <button
                            onClick={() => {
                                setEditingTask(null);
                                setShowCreateModal(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-all shadow-primary-500/20"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Thêm mới</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Content with Tabs */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
                <div className="flex overflow-x-auto border-b border-gray-100 px-6 no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                py-4 px-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'}
                            `}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                            <p>Đang tải danh sách...</p>
                        </div>
                    ) : error ? (
                        <div className="p-8 text-center text-red-500 bg-red-50 m-6 rounded-lg">Lỗi: {error}</div>
                    ) : paginatedTasks.length > 0 ? (
                        <>
                            {/* Desktop Table View */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                        <tr>
                                            <th className="px-6 py-4">Nhiệm vụ</th>
                                            <th className="px-6 py-4">Trạng thái</th>
                                            <th className="px-6 py-4">Người thực hiện</th>
                                            <th className="px-6 py-4">Hạn chót</th>
                                            <th className="px-6 py-4 text-center">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {paginatedTasks.map(task => (
                                            <tr key={task.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-6 py-4 max-w-sm">
                                                    <div className="flex items-start gap-3">
                                                        <div className="mt-1">{getStatusIcon(task.status)}</div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900 line-clamp-1">{task.name}</p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{task.projectName || 'Chung'}</p>
                                                            {task.reviewLink && (
                                                                <a href={task.reviewLink} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-xs text-blue-600 hover:underline mt-1">
                                                                    <ExternalLink size={10} /> Link sản phẩm
                                                                </a>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex flex-col gap-1">
                                                        <span className={`inline-flex w-fit items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800`}>
                                                            {task.status || 'Chưa bắt đầu'}
                                                        </span>
                                                        <span className={`inline-flex w-fit items-center px-1.5 py-0.5 rounded border text-[10px] font-medium ${getPriorityColor(task.priority)}`}>
                                                            {task.priority || 'Thấp'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2" title={task.assignedToName}>
                                                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold ring-2 ring-white">
                                                            {task.assignedToName?.[0] || 'U'}
                                                        </div>
                                                        <span className="text-sm text-gray-600 truncate max-w-[100px]">{task.assignedToName || 'Chưa giao'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Calendar size={14} />
                                                        {task.dueDate?.toDate?.()?.toLocaleDateString('vi-VN') || 'N/A'}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <div className="flex items-center justify-center gap-2">
                                                        {/* Actions for Assignee */}
                                                        {task.assignedTo === currentUser?.uid && (
                                                            <>
                                                                {task.status === 'Chưa bắt đầu' && (
                                                                    <button
                                                                        onClick={() => handleTaskAction(task, 'start')}
                                                                        disabled={processingId === task.id}
                                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-blue-200"
                                                                        title="Bắt đầu"
                                                                    >
                                                                        <Play size={16} />
                                                                    </button>
                                                                )}
                                                                {task.status === 'Đang thực hiện' && (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedTaskForReview(task);
                                                                            setShowReviewModal(true);
                                                                        }}
                                                                        disabled={processingId === task.id}
                                                                        className="p-1.5 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors border border-orange-200"
                                                                        title="Gửi duyệt"
                                                                    >
                                                                        <Send size={16} />
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Workflow Actions for Admin/Manager */}
                                                        {['Admin', 'Quản lý'].includes(userRole) && task.status === 'Chờ duyệt' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleTaskAction(task, 'approve')}
                                                                    disabled={processingId === task.id}
                                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-200"
                                                                    title="Duyệt"
                                                                >
                                                                    <CheckCircle2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleTaskAction(task, 'reject')}
                                                                    disabled={processingId === task.id}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-red-200"
                                                                    title="Từ chối/Yêu cầu sửa lại"
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </>
                                                        )}

                                                        {/* Edit/Delete Actions for Admin */}
                                                        {['Admin', 'Quản lý'].includes(userRole) && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(task)}
                                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                    title="Chỉnh sửa"
                                                                >
                                                                    <Edit2 size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteClick(task)}
                                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                    title="Xóa"
                                                                >
                                                                    <Trash2 size={16} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 p-4 bg-gray-50/50">
                                {paginatedTasks.map(task => (
                                    <div key={task.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(task.status)}
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-800`}>
                                                    {task.status}
                                                </span>
                                            </div>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>
                                                {task.priority || 'Thấp'}
                                            </span>
                                        </div>

                                        <h3 className="text-sm font-bold text-gray-900 mb-1">{task.name}</h3>
                                        <p className="text-xs text-gray-500 mb-3">{task.projectName}</p>

                                        <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold">
                                                    {task.assignedToName?.[0] || 'U'}
                                                </div>
                                                <span className="truncate max-w-[80px]">{task.assignedToName}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                <span>{task.dueDate?.toDate?.()?.toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </div>

                                        {/* Mobile Actions */}
                                        <div className="flex justify-end gap-2 mt-3 pt-2 border-t border-gray-50">
                                            {/* Assignee Actions */}
                                            {task.assignedTo === currentUser?.uid && (
                                                <>
                                                    {task.status === 'Chưa bắt đầu' && (
                                                        <button onClick={() => handleTaskAction(task, 'start')} className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                            <Play size={16} />
                                                        </button>
                                                    )}
                                                    {task.status === 'Đang thực hiện' && (
                                                        <button onClick={() => { setSelectedTaskForReview(task); setShowReviewModal(true); }} className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                                                            <Send size={16} />
                                                        </button>
                                                    )}
                                                </>
                                            )}

                                            {/* Admin Actions */}
                                            {['Admin', 'Quản lý'].includes(userRole) && (
                                                <>
                                                    {task.status === 'Chờ duyệt' && (
                                                        <>
                                                            <button onClick={() => handleTaskAction(task, 'approve')} className="p-2 bg-green-50 text-green-600 rounded-lg">
                                                                <CheckCircle2 size={16} />
                                                            </button>
                                                            <button onClick={() => handleTaskAction(task, 'reject')} className="p-2 bg-red-50 text-red-600 rounded-lg">
                                                                <XCircle size={16} />
                                                            </button>
                                                        </>
                                                    )}
                                                    <button onClick={() => handleEdit(task)} className="p-2 bg-gray-50 text-gray-600 rounded-lg">
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button onClick={() => handleDeleteClick(task)} className="p-2 bg-red-50 text-red-600 rounded-lg">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(filteredTasks.length / ITEMS_PER_PAGE)}
                                onPageChange={setCurrentPage}
                            />
                        </>
                    ) : (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                <CheckCircle2 size={32} />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900">Không tìm thấy nhiệm vụ</h3>
                            <p className="text-gray-500 mt-1">Bạn chưa có nhiệm vụ nào trong mục này</p>
                        </div>
                    )}
                </div>
            </div>
            {showCreateModal && (
                <TaskForm
                    initialData={editingTask}
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { }} // Stream updates automatically
                />
            )}

            <ReviewModal
                isOpen={showReviewModal}
                onClose={() => setShowReviewModal(false)}
                onSubmit={(data) => handleTaskAction(selectedTaskForReview, 'submit_review', data)}
                loading={processingId === selectedTaskForReview?.id}
            />

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                title="Xóa nhiệm vụ"
                message="Bạn có chắc chắn muốn xóa nhiệm vụ này? Hành động này không thể hoàn tác."
                confirmText="Xóa bỏ"
                type="danger"
                loading={deleteLoading}
            />
        </div>
    );
};

export default TasksPage;
