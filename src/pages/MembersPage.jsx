import { useState, useEffect } from 'react';
import { userService } from '../services/firebase-services';
import { useStreamCollection } from '../hooks/use-firestore-stream';
import { useAuth } from '../contexts/auth-context';
import MemberForm from '../components/admin/MemberForm';
import RoleBadge from '../components/common/RoleBadge';
import { UserPlus, Search, Edit2, Trash2, Phone, Mail, Filter, ChevronLeft, ChevronRight } from 'lucide-react';

const MembersPage = () => {
    const { userRole } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredMembers, setFilteredMembers] = useState([]);
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [editingMember, setEditingMember] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    // Real-time users
    const { data: members, loading, error } = useStreamCollection('users');

    // Filter members based on search
    useEffect(() => {
        if (!members) return;

        let filtered = members;

        if (searchQuery) {
            filtered = filtered.filter(member =>
                member.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                member.expertise?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        setFilteredMembers(filtered);
        setCurrentPage(1); // Reset to first page on new filter
    }, [members, searchQuery]);

    // Pagination logic
    const totalPages = Math.ceil(filteredMembers.length / itemsPerPage);
    const paginatedMembers = filteredMembers.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handleEdit = (member) => {
        setEditingMember(member);
        setShowMemberForm(true);
    };

    const handleDelete = async (memberId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa thành viên này? Hành động này không thể hoàn tác.')) {
            try {
                await userService.delete(memberId);
                refetch(); // Refresh list
            } catch (err) {
                console.error('Error deleting member:', err);
                alert('Có lỗi xảy ra khi xóa thành viên: ' + err.message);
            }
        }
    };

    const handleAddNew = () => {
        setEditingMember(null);
        setShowMemberForm(true);
    };

    // Role badges styling


    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-card border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản lý thành viên</h1>
                    <p className="text-sm text-gray-500 mt-1">Danh sách tất cả nhân sự trong hệ thống</p>
                </div>
                <div className="flex gap-3">
                    <button className="p-2.5 text-gray-500 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors">
                        <Filter size={18} />
                    </button>
                    {userRole === 'Admin' && (
                        <button
                            onClick={handleAddNew}
                            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-all shadow-primary-500/20"
                        >
                            <UserPlus size={18} />
                            <span className="hidden sm:inline">Thêm thành viên</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Stats & Content */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
                {/* Search & Filter Bar */}
                <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 transition-all"
                            placeholder="Tìm kiếm theo tên, email, vai trò..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="text-sm text-gray-500 hidden sm:block">
                        Hiển thị <span className="font-bold text-gray-900">{filteredMembers.length}</span> kết quả
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 text-center text-red-500 bg-red-50 m-6 rounded-lg">Lỗi: {error}</div>
                ) : filteredMembers.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50/50 border-b border-gray-200 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                    <th className="px-6 py-4">Thành viên</th>
                                    <th className="px-6 py-4">Vai trò</th>
                                    <th className="px-6 py-4">Chuyên môn</th>
                                    <th className="px-6 py-4">Liên hệ</th>
                                    {userRole === 'Admin' && <th className="px-6 py-4 text-right">Thao tác</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {paginatedMembers.map((member) => (
                                    <tr key={member.uid} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold border-2 border-white shadow-sm flex-shrink-0 overflow-hidden">
                                                    {member.photoURL ? (
                                                        <img
                                                            src={member.photoURL}
                                                            alt={member.displayName}
                                                            className="w-full h-full object-cover"
                                                            onError={(e) => {
                                                                e.target.onerror = null;
                                                                e.target.src = '';
                                                                e.target.parentElement.innerText = member.displayName?.[0] || '?';
                                                            }}
                                                        />
                                                    ) : (
                                                        member.displayName?.[0] || '?'
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{member.displayName}</p>
                                                    <p className="text-xs text-gray-500">ID: {member.uid?.slice(0, 6)}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <RoleBadge role={member.role} />
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-sm text-gray-700">{member.expertise || 'Chưa cập nhật'}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Mail size={12} /> {member.email}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                                    <Phone size={12} /> {member.phone || 'N/A'}
                                                </div>
                                            </div>
                                        </td>
                                        {userRole === 'Admin' && (
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEdit(member)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(member.uid)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* Pagination Controls */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                                <div className="text-sm text-gray-500">
                                    Hiển thị {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, filteredMembers.length)} trong tổng số {filteredMembers.length} thành viên
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(curr => Math.max(curr - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="text-sm font-medium text-gray-700">
                                        Trang {currentPage} / {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(curr => Math.min(curr + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                            <Search size={32} />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">Không tìm thấy thành viên</h3>
                        <p className="text-gray-500 mt-1">Thử thay đổi từ khóa tìm kiếm hoặc thêm thành viên mới</p>
                    </div>
                )}
            </div>

            {/* Modal Container will be handled by MemberForm component itself, just passing props */}
            {showMemberForm && (
                <MemberForm
                    initialData={editingMember}
                    onClose={() => setShowMemberForm(false)}
                    onSuccess={() => {
                        refetch();
                        setShowMemberForm(false);
                    }}
                />
            )}
        </div>
    );
};

export default MembersPage;
