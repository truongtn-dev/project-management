import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/auth-context';
import {
    LayoutDashboard,
    Folders,
    CheckSquare,
    Users,
    LogOut,
    GanttChartSquare,
    Briefcase,
    Calendar
} from 'lucide-react';
import { getRoleSettings } from '../../utils/role-config';

const Sidebar = ({ isOpen, toggleSidebar }) => {
    const { currentUser, logout, userRole, userProfile } = useAuth();
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

    const navItems = [
        { path: '/', label: 'Tổng quan', icon: LayoutDashboard },
        { path: '/gantt', label: 'Sơ đồ Gantt', icon: GanttChartSquare },
        { path: '/projects', label: 'Dự án', icon: Folders },
        { path: '/tasks', label: 'Nhiệm vụ', icon: CheckSquare },
        { path: '/members', label: 'Thành viên', icon: Users },
        { path: '/meetings', label: 'Lịch trình', icon: Calendar },
    ];

    if (userRole === 'Admin') {
        navItems.push({
            path: '/users',
            label: 'Quản lý (Admin)',
            icon: Users
        });
    }

    return (
        <aside
            className={`
                fixed top-0 left-0 z-30 h-screen w-64 bg-white border-r border-gray-200 transition-transform duration-300 ease-in-out shadow-lg lg:shadow-none
                ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
        >
            <div className="flex flex-col h-full p-4">
                {/* Logo Area */}
                <div className="flex items-center gap-3 px-2 py-4 mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600 text-white shadow-lg shadow-primary-500/30">
                        <Briefcase size={22} className="stroke-[2.5px]" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900 leading-tight">Quản Lý Dự Án</h1>
                        <p className="text-xs text-gray-500 font-medium">Quản lý thông minh</p>
                    </div>
                </div>

                {/* User Info Card */}
                <div className="flex items-center gap-3 p-3 mb-6 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-sm ring-2 ring-white">
                        {userProfile?.photoURL ? (
                            <img
                                src={userProfile.photoURL}
                                alt="Avatar"
                                className="w-full h-full rounded-full object-cover"
                            />
                        ) : (
                            userProfile?.displayName?.[0] || currentUser?.displayName?.[0] || 'U'
                        )}
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">
                            {userProfile?.displayName || currentUser?.displayName || 'User'}
                        </p>
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold mt-1 ${roleSettings.bgColor} ${roleSettings.color} border ${roleSettings.borderColor}`}>
                            <RoleIcon size={10} className="stroke-[2.5px]" />
                            {userRole || 'NHÂN VIÊN'}
                        </span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Đăng xuất"
                    >
                        <LogOut size={18} />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 space-y-1.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            className={({ isActive }) => `
                                flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
                                ${isActive
                                    ? 'bg-primary-600 text-white shadow-md shadow-primary-500/20'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                }
                            `}
                            onClick={() => window.innerWidth < 1024 && toggleSidebar()}
                        >
                            {({ isActive }) => (
                                <>
                                    <item.icon
                                        size={20}
                                        className={`transition-colors duration-200 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}`}
                                    />
                                    <span>{item.label}</span>
                                </>
                            )}
                        </NavLink>
                    ))}
                </nav>

                {/* Footer */}
                <div className="pt-4 mt-auto border-t border-gray-100">
                    <p className="text-xs text-center text-gray-400 font-medium">
                        © 2026 ProjectManager <br /> Version 5.0
                    </p>
                </div>
            </div>
        </aside >
    );
};

export default Sidebar;
