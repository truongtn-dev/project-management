import { useState, useEffect } from 'react';
import { userService } from '../services/firebase-services';
import { useFetchData } from '../hooks/use-firebase';
import { useAuth } from '../contexts/auth-context';
import { Search, Shield, Trash2, Edit, CheckCircle, XCircle, Mail, UserCheck, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import MemberForm from '../components/admin/MemberForm';
import RoleBadge from '../components/common/RoleBadge';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';



const UsersPage = () => {
    const { userRole } = useAuth();
    const [searchQuery, setSearchQuery] = useState('');
    const [showMemberForm, setShowMemberForm] = useState(false);
    const [activeTab, setActiveTab] = useState('active'); // 'active', 'pending', 'rejected'
    const [editingMember, setEditingMember] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;
    const [paginatedUsers, setPaginatedUsers] = useState([]);

    const { data: users, loading, error, refetch } = useFetchData(
        () => userService.getAll(),
        []
    );

    // Filter users by tab and search
    const filteredUsers = users?.filter(user => {
        const matchesSearch =
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.displayName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role?.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        const status = user.status || 'active';

        if (activeTab === 'active') return status === 'active';
        if (activeTab === 'pending') return status === 'pending';
        if (activeTab === 'rejected') return status === 'rejected';

        return true;
    }) || [];

    // Pagination Logic
    useEffect(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        setPaginatedUsers(filteredUsers.slice(startIndex, endIndex));
    }, [filteredUsers, currentPage]);

    // Reset page when tab or search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchQuery]);

    const handleApprove = (user) => {
        setEditingMember({ ...user, isApproving: true });
        setShowMemberForm(true);
    };

    const handleQuickReject = async (user) => {
        if (window.confirm(`Bạn có chắc muốn từ chối tài khoản ${user.email}? Họ sẽ không thể đăng nhập.`)) {
            try {
                await updateDoc(doc(db, 'users', user.uid), {
                    status: 'rejected'
                });
                refetch();
            } catch (err) {
                alert('Lỗi: ' + err.message);
            }
        }
    };

    const handleRestore = async (user) => {
        try {
            await updateDoc(doc(db, 'users', user.uid), {
                status: 'active'
            });
            refetch();
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    const handleEdit = (user) => {
        setEditingMember(user);
        setShowMemberForm(true);
    };

    const handleDelete = async (uid) => {
        if (window.confirm('Cảnh báo: Xóa user sẽ mất vĩnh viễn dữ liệu. Tiếp tục?')) {
            try {
                await userService.delete(uid);
                refetch();
            } catch (err) {
                alert('Lỗi xóa: ' + err.message);
            }
        }
    };

    const pendingCount = users?.filter(u => u.status === 'pending').length || 0;



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-card border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Quản trị hệ thống</h1>
                    <p className="text-sm text-gray-500 mt-1">Quản lý người dùng, phân quyền và phê duyệt</p>
                </div>

                <div className="relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500" size={18} />
                    <input
                        type="text"
                        className="pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-100 focus:border-primary-500 w-full sm:w-64 transition-all"
                        placeholder="Tìm kiếm user..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Content & Tabs */}
            <div className="bg-white rounded-xl shadow-card border border-gray-100 overflow-hidden">
                <div className="flex border-b border-gray-100 overflow-x-auto no-scrollbar">
                    {[
                        { id: 'active', label: 'Thành viên chính thức' },
                        { id: 'pending', label: 'Chờ duyệt', count: pendingCount },
                        { id: 'rejected', label: 'Đã từ chối' }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`
                                flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                                ${activeTab === tab.id
                                    ? 'border-primary-600 text-primary-600 bg-primary-50/10'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}
                            `}
                        >
                            {tab.label}
                            {tab.count > 0 && (
                                <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-600 text-xs font-bold">
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="p-0">
                    {loading ? (
                        <div className="p-12 text-center text-gray-500">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                            <p>Đang tải danh sách...</p>
                        </div>
                    ) : filteredUsers.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead className="bg-gray-50/50 text-xs uppercase text-gray-500 font-bold tracking-wider">
                                    <tr>
                                        <th className="px-6 py-4">User Info</th>
                                        <th className="px-6 py-4">Chuyên môn</th>
                                        <th className="px-6 py-4">Vai trò</th>
                                        <th className="px-6 py-4">Trạng thái</th>
                                        <th className="px-6 py-4 text-right">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedUsers.map(user => (
                                        <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-600 font-bold border-2 border-white shadow-sm flex-shrink-0 overflow-hidden">
                                                        {user.photoURL ? (
                                                            <img
                                                                src={user.photoURL}
                                                                alt={user.displayName}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => {
                                                                    e.target.onerror = null;
                                                                    e.target.src = '';
                                                                    e.target.parentElement.innerText = user.displayName?.[0] || '?';
                                                                }}
                                                            />
                                                        ) : (
                                                            user.displayName?.[0] || '?'
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-900">{user.displayName}</p>
                                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                                            <Mail size={10} /> {user.email}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">
                                                {user.expertise || <span className="text-gray-400 italic">Chưa cập nhật</span>}
                                            </td>
                                            <td className="px-6 py-4">
                                                <RoleBadge role={user.role} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium border
                                                    ${user.status === 'pending' ? 'bg-yellow-50 text-yellow-700 border-yellow-100' :
                                                        user.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                                                            'bg-green-50 text-green-700 border-green-100'}`}>
                                                    {user.status === 'pending' ? 'Chờ duyệt' :
                                                        user.status === 'rejected' ? 'Từ chối' : 'Hoạt động'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {userRole === 'Admin' && (
                                                    <div className="flex items-center justify-end gap-2 opacity-90">
                                                        {activeTab === 'pending' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleApprove(user)}
                                                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-transparent hover:border-green-100"
                                                                    title="Phê duyệt"
                                                                >
                                                                    <UserCheck size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleQuickReject(user)}
                                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors border border-transparent hover:border-red-100"
                                                                    title="Từ chối"
                                                                >
                                                                    <XCircle size={18} />
                                                                </button>
                                                            </>
                                                        )}

                                                        {activeTab === 'rejected' && (
                                                            <button
                                                                onClick={() => handleRestore(user)}
                                                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                                title="Khôi phục"
                                                            >
                                                                <CheckCircle size={18} />
                                                            </button>
                                                        )}

                                                        <button
                                                            onClick={() => handleEdit(user)}
                                                            className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Chỉnh sửa"
                                                        >
                                                            <Edit size={16} />
                                                        </button>

                                                        <a
                                                            href={`mailto:${user.email}`}
                                                            className="p-1.5 text-gray-500 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                                                            title="Gửi email"
                                                        >
                                                            <Mail size={16} />
                                                        </a>

                                                        <button
                                                            onClick={() => handleDelete(user.uid)}
                                                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xóa vĩnh viễn"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {/* Pagination Controls */}
                            {Math.ceil(filteredUsers.length / ITEMS_PER_PAGE) > 1 && (
                                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-gray-50/30">
                                    <div className="text-sm text-gray-500">
                                        Hiển thị {((currentPage - 1) * ITEMS_PER_PAGE) + 1} - {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} trong tổng số {filteredUsers.length} user
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
                                            Trang {currentPage} / {Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}
                                        </span>
                                        <button
                                            onClick={() => setCurrentPage(curr => Math.min(curr + 1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)))}
                                            disabled={currentPage === Math.ceil(filteredUsers.length / ITEMS_PER_PAGE)}
                                            className="p-2 border border-gray-200 rounded-lg hover:bg-white hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                                        >
                                            <ChevronRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="p-12 text-center bg-gray-50/50">
                            <p className="text-gray-500">Không tìm thấy user nào trong danh sách này</p>
                        </div>
                    )}
                </div>
            </div>

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

export default UsersPage;
