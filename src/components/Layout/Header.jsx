import { useState } from 'react';
import { useAuth } from '../../contexts/auth-context';
import {
    Search,
    Menu,
    ChevronDown,
    Settings,
    LogOut,
    User
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import NotificationList from '../common/NotificationList';
import { getRoleSettings } from '../../utils/role-config';

const Header = ({ toggleSidebar }) => {
    const { currentUser, logout, userProfile, userRole } = useAuth();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const navigate = useNavigate();

    const roleSettings = getRoleSettings(userRole);
    const RoleIcon = roleSettings.icon;

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error('Failed to log out', error);
        }
    };

    const location = useLocation();

    const getPageTitle = (path) => {
        if (path === '/') return { title: 'Tổng quan', subtitle: `Chào mừng quay trở lại, ${userProfile?.displayName || currentUser?.displayName || 'User'}!` };
        if (path === '/gantt') return { title: 'Sơ đồ Gantt', subtitle: 'Theo dõi tiến độ dự án theo thời gian thực' };
        if (path === '/projects') return { title: 'Dự án', subtitle: 'Quản lý tất cả dự án của bạn' };
        if (path === '/tasks') return { title: 'Nhiệm vụ', subtitle: 'Quản lý công việc và tiến độ' };
        if (path === '/members') return { title: 'Thành viên', subtitle: 'Danh sách thành viên trong hệ thống' };
        if (path === '/meetings') return { title: 'Lịch trình', subtitle: 'Lịch họp và sự kiện sắp tới' };
        if (path === '/users') return { title: 'Quản lý (Admin)', subtitle: 'Quản trị hệ thống và người dùng' };
        if (path === '/profile') return { title: 'Hồ sơ cá nhân', subtitle: 'Quản lý thông tin tài khoản' };

        // Sub-routes logic
        if (path.startsWith('/projects/')) return { title: 'Chi tiết dự án', subtitle: 'Thông tin chi tiết và tiến độ dự án' };
        if (path.startsWith('/tasks/')) return { title: 'Chi tiết nhiệm vụ', subtitle: 'Thông tin chi tiết công việc' };

        // Default
        return { title: 'Tổng quan', subtitle: `Chào mừng quay trở lại, ${userProfile?.displayName || currentUser?.displayName || 'User'}!` };
    };

    const { title, subtitle } = getPageTitle(location.pathname);

    return (
        <header className="sticky top-0 z-20 flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-white/80 backdrop-blur-xl border-b border-gray-100 transition-all duration-200">
            {/* Left: Mobile Toggle & Title/Breadcrumbs */}
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <button
                    className="p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-lg lg:hidden transition-colors"
                    onClick={toggleSidebar}
                >
                    <Menu size={24} />
                </button>

                <div className="flex flex-col">
                    <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                    <p className="text-sm text-gray-500 hidden sm:block">{subtitle}</p>
                </div>
            </div>

            {/* Right: Search, Notifications, Profile */}
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto justify-end">
                {/* Search Bar */}
                <div className="relative hidden md:block group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" size={18} />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        className="pl-10 pr-4 py-2 w-64 bg-gray-50 border-none rounded-lg text-sm focus:ring-2 focus:ring-primary-100 focus:bg-white transition-all duration-200"
                    />
                </div>

                {/* Notifications */}
                <NotificationList />

                {/* Profile Dropdown */}
                <div className="relative">
                    <button
                        className="flex items-center gap-3 p-1.5 pr-4 hover:bg-gray-50 rounded-full border border-gray-200 transition-all duration-200 group"
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        onBlur={() => setTimeout(() => setShowProfileMenu(false), 200)}
                    >
                        <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center text-white shadow-md shadow-primary-500/20 overflow-hidden ring-2 ring-white">
                            {userProfile?.photoURL ? (
                                <img src={userProfile.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                            ) : (
                                userProfile?.displayName?.[0] || currentUser?.displayName?.[0] || 'U'
                            )}
                        </div>
                        <div className="hidden text-left md:block min-w-[100px] max-w-[300px]">
                            <p className="text-sm font-bold text-gray-800 truncate leading-tight group-hover:text-primary-700 transition-colors">
                                {userProfile?.displayName || currentUser?.displayName || 'User'}
                            </p>
                            <div className={`flex items-center gap-1 mt-0.5 ${roleSettings.color}`}>
                                <RoleIcon size={10} className="stroke-[2.5px]" />
                                <p className="text-[10px] uppercase font-bold tracking-wide truncate">
                                    {userRole || 'NHÂN VIÊN'}
                                </p>
                            </div>
                        </div>
                    </button>

                    {/* Dropdown Menu */}
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-100 py-2 animate-fade-in origin-top-right">
                            <div className="px-4 py-3 border-b border-gray-50">
                                <p className="text-sm font-medium text-gray-900">Đang đăng nhập là</p>
                                <p className="text-xs text-gray-500 truncate">{currentUser?.email}</p>
                            </div>

                            <div className="py-1">
                                <button
                                    onMouseDown={() => navigate('/profile')}
                                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <User size={16} /> Hồ sơ cá nhân
                                </button>
                                <button className="flex items-center gap-3 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                                    <Settings size={16} /> Cài đặt
                                </button>
                            </div>

                            <div className="border-t border-gray-50 pt-1">
                                <button
                                    onMouseDown={handleLogout}
                                    className="flex items-center gap-3 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                >
                                    <LogOut size={16} /> Đăng xuất
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
