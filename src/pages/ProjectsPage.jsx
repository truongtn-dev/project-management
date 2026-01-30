import React, { useState, useEffect, useMemo } from 'react';
import { useStreamCollection } from '../hooks/use-firestore-stream';
import { orderBy, collection, query, where, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Plus, Search, Calendar, Users, Briefcase, Edit2, Trash2, Eye, List, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import ProjectForm from '../components/projects/ProjectForm';
import { useAuth } from '../contexts/auth-context';
import ConfirmModal from '../components/common/ConfirmModal';
import Pagination from '../components/common/Pagination';



const ProjectsPage = () => {
    const { userRole, currentUser } = useAuth();
    const [activeTab, setActiveTab] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [paginatedProjects, setPaginatedProjects] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9;

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingProject, setEditingProject] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [projectToDelete, setProjectToDelete] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Real-time projects
    const { data: projects, loading, error } = useStreamCollection(
        'projects',
        orderBy('createdAt', 'desc')
    );

    const handleEdit = (project) => {
        setEditingProject(project);
        setShowCreateModal(true);
    };

    const handleDeleteClick = (project) => {
        setProjectToDelete(project);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!projectToDelete) return;
        setDeleteLoading(true);
        try {
            // Delete all tasks associated with this project
            const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectToDelete.id));
            const tasksSnapshot = await getDocs(tasksQuery);

            const batch = writeBatch(db);
            tasksSnapshot.forEach((doc) => {
                batch.delete(doc.ref);
            });

            // Delete project
            const projectRef = doc(db, 'projects', projectToDelete.id);
            batch.delete(projectRef);

            await batch.commit();

            setShowDeleteModal(false);
            setProjectToDelete(null);
        } catch (err) {
            console.error('Error deleting project and tasks:', err);
            alert('Có lỗi xảy ra khi xóa dự án');
        } finally {
            setDeleteLoading(false);
        }
    };

    // Derived Stats
    const stats = useMemo(() => {
        if (!projects) return { total: 0, pending: 0, progress: 0, completed: 0, paused: 0, cancelled: 0 };
        return {
            total: projects.length,
            pending: projects.filter(p => p.status === 'Chưa bắt đầu').length,
            progress: projects.filter(p => p.status === 'Đang thực hiện').length,
            completed: projects.filter(p => p.status === 'Hoàn thành').length,
            paused: projects.filter(p => p.status === 'Tạm dừng').length,
            cancelled: projects.filter(p => p.status === 'Hủy bỏ').length,
        };
    }, [projects]);


    // Filter projects based on active tab, search, and PERMISSIONS
    useEffect(() => {
        if (!projects || !currentUser) return;

        let filtered = projects;

        // PERMISSION FILTER: Only Admin sees all. Others see only their projects.
        if (userRole !== 'Admin') {
            filtered = filtered.filter(p =>
                p.managerId === currentUser.uid ||
                p.members?.includes(currentUser.uid)
            );
        }

        // Filter by status tab (Only if we want tabs to filter grid, but design implies "Tất cả" dropdown)
        // Keeping tab logic if user wants it, but mostly relying on new dropdown
        if (activeTab !== 'all') {
            const statusMap = {
                'pending': 'Chưa bắt đầu',
                'progress': 'Đang thực hiện',
                'completed': 'Hoàn thành',
                'paused': 'Tạm dừng',
                'cancelled': 'Hủy bỏ'
            };
            filtered = filtered.filter(p => p.status === statusMap[activeTab]);
        }


        // Filter by search query
        if (searchQuery) {
            filtered = filtered.filter(p =>
                p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                p.description?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredProjects(filtered);
        setCurrentPage(1); // Reset to first page on filter change
    }, [projects, activeTab, searchQuery, userRole, currentUser]);

    // Pagination Logic
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setPaginatedProjects(filteredProjects.slice(startIndex, endIndex));
    }, [filteredProjects, currentPage]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Hoàn thành': return 'bg-emerald-100 text-emerald-600';
            case 'Đang thực hiện': return 'bg-blue-100 text-blue-600';
            case 'Chưa bắt đầu': return 'bg-gray-100 text-gray-600';
            case 'Tạm dừng': return 'bg-amber-100 text-amber-600';
            case 'Hủy bỏ': return 'bg-red-100 text-red-600';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    // Stats Cards Data
    const statCards = [
        { id: 'pending', label: 'CHƯA BẮT ĐẦU', count: stats.pending, color: 'text-gray-600', border: 'border-t-4 border-gray-400' },
        { id: 'progress', label: 'ĐANG THỰC HIỆN', count: stats.progress, color: 'text-blue-600', border: 'border-t-4 border-blue-500' },
        { id: 'completed', label: 'HOÀN THÀNH', count: stats.completed, color: 'text-emerald-600', border: 'border-t-4 border-emerald-500' },
        { id: 'paused', label: 'TẠM DỪNG', count: stats.paused, color: 'text-amber-600', border: 'border-t-4 border-amber-400' },
        { id: 'cancelled', label: 'HỦY BỎ', count: stats.cancelled, color: 'text-red-600', border: 'border-t-4 border-red-400' },
    ];

    return (
        <div className="space-y-8">
            {/* Header Card */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-card border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý dự án</h1>
                    <p className="text-sm text-gray-500 mt-1">Theo dõi tiến độ và quản lý danh sách dự án</p>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                    {/* Search Bar */}
                    <div className="relative group flex-grow sm:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500" size={18} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm dự án..."
                            className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 w-full sm:w-64 transition-all"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {/* Filter Dropdown (Simulated with Select) */}
                    <div className="relative">
                        <select
                            className="pl-4 pr-8 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 appearance-none cursor-pointer hover:bg-white transition-all"
                            value={activeTab}
                            onChange={(e) => setActiveTab(e.target.value)}
                        >
                            <option value="all">Tất cả trạng thái</option>
                            <option value="pending">Chưa bắt đầu</option>
                            <option value="progress">Đang thực hiện</option>
                            <option value="completed">Hoàn thành</option>
                            <option value="paused">Tạm dừng</option>
                            <option value="cancelled">Hủy bỏ</option>
                        </select>
                        <Filter className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                    </div>

                    {userRole === 'Admin' && (
                        <button
                            onClick={() => { setEditingProject(null); setShowCreateModal(true); }}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-all shadow-primary-500/20 whitespace-nowrap"
                        >
                            <Plus size={18} />
                            <span className="hidden sm:inline">Thêm mới</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {statCards.map(card => (
                    <div key={card.id} className={`bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center cursor-pointer transition-transform hover:-translate-y-1 ${activeTab === card.id ? 'ring-2 ring-primary-500' : ''}`} onClick={() => setActiveTab(card.id === activeTab ? 'all' : card.id)}>
                        <h3 className={`text-3xl font-bold mb-1 ${card.color}`}>{card.count}</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Projects Grid */}
            {loading ? (
                <div className="p-12 text-center text-gray-500">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p>Đang tải dự án...</p>
                </div>
            ) : error ? (
                <div className="p-8 text-center text-red-500 bg-red-50 rounded-lg">Lỗi: {error}</div>
            ) : paginatedProjects.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {paginatedProjects.map((project, index) => (
                            <div key={project.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 group flex flex-col relative overflow-hidden">
                                {/* Top Badge */}
                                <div className="p-6 pb-4">
                                    <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide mb-4 ${getStatusColor(project.status)}`}>
                                        {project.status}
                                    </span>

                                    <Link to={`/projects/${project.id}`} className="block">
                                        <h3 className="text-xl font-bold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
                                            {project.name}
                                        </h3>
                                    </Link>


                                    <p className="text-gray-500 text-sm mb-4 line-clamp-2 h-10">
                                        {project.description || 'Chưa có mô tả cho dự án này...'}
                                    </p>

                                    {/* Dates Grid */}
                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold mb-1">Bắt đầu:</p>
                                            <div className="flex items-center gap-1.5 text-sm font-medium text-gray-700">
                                                <Calendar size={14} className="text-emerald-500" />
                                                <span>{project.startDate?.toDate ? new Date(project.startDate.toDate()).toLocaleDateString('vi-VN') : new Date(project.startDate).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-gray-400 font-bold mb-1">Kết thúc:</p>
                                            <div className="flex items-center justify-end gap-1.5 text-sm font-medium text-gray-700">
                                                <Calendar size={14} className="text-red-500" />
                                                <span>{project.endDate?.toDate ? new Date(project.endDate.toDate()).toLocaleDateString('vi-VN') : new Date(project.endDate).toLocaleDateString('vi-VN')}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-px bg-gray-50 mx-6"></div>

                                {/* Footer */}
                                <div className="p-6 pt-4 mt-auto flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {project.managerAvatar ? (
                                            <img src={project.managerAvatar} alt={project.managerName} className="w-8 h-8 rounded-full object-cover border border-gray-100" />
                                        ) : (
                                            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xs">
                                                {project.managerName ? project.managerName.charAt(0).toUpperCase() : 'A'}
                                            </div>
                                        )}
                                        <div>
                                            <p className="text-[10px] text-gray-400 font-bold">Quản lý:</p>
                                            <p className="text-xs font-bold text-gray-700">{project.managerName || 'Admin'}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-1 text-gray-500 text-xs font-medium">
                                        <List size={14} />
                                        <span>{project.taskCount || Math.floor(Math.random() * 10) + 1} nhiệm vụ</span>
                                        {/* Fallback mock for tasks count if not in object yet */}
                                    </div>
                                </div>

                                {/* Hover Actions Overlay */}
                                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <Link to={`/projects/${project.id}`} className="p-2 bg-white text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg shadow-sm border border-gray-100 transition-colors" title="Xem chi tiết">
                                        <Eye size={16} />
                                    </Link>
                                    {userRole === 'Admin' && (
                                        <>
                                            <button
                                                onClick={() => handleEdit(project)}
                                                className="p-2 bg-white text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg shadow-sm border border-gray-100 transition-colors"
                                                title="Chỉnh sửa"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteClick(project)}
                                                className="p-2 bg-white text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg shadow-sm border border-gray-100 transition-colors"
                                                title="Xóa"
                                            >
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
                        totalPages={Math.ceil(filteredProjects.length / ITEMS_PER_PAGE)}
                        onPageChange={setCurrentPage}
                    />
                </>
            ) : (
                <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                        <Briefcase size={32} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Không tìm thấy dự án</h3>
                    <p className="text-gray-500 mt-1 max-w-sm mx-auto">
                        {searchQuery ? `Không có kết quả nào cho "${searchQuery}"` : 'Bắt đầu bằng cách tạo dự án mới'}
                    </p>
                    <button
                        onClick={() => { setSearchQuery(''); setActiveTab('all'); }}
                        className="mt-4 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                        Xóa bộ lọc
                    </button>
                </div>
            )}

            {showCreateModal && (
                <ProjectForm
                    initialData={editingProject}
                    onClose={() => setShowCreateModal(false)}
                    onStore={() => {
                        setShowCreateModal(false);
                    }}
                />
            )}

            <ConfirmModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleConfirmDelete}
                title="Xóa dự án"
                message="Bạn có chắc chắn muốn xóa dự án này? Tất cả nhiệm vụ liên quan sẽ bị xóa vĩnh viễn. Hành động này không thể hoàn tác."
                confirmText="Xóa dự án"
                type="danger"
                loading={deleteLoading}
            />
        </div>
    );
};

export default ProjectsPage;
