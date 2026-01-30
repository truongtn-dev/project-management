import React, { useState, useEffect, useMemo } from 'react';
import { projectService, taskService } from '../services/firebase-services';
import { useFetchData } from '../hooks/use-firebase';
import { useAuth } from '../contexts/auth-context';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, ChevronDown, ChevronRight as ChevronRightIcon, Plus, Edit2, Trash2 } from 'lucide-react';
import TaskForm from '../components/tasks/TaskForm';

const GanttPage = () => {
    const { currentUser, userRole } = useAuth();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [expandedProjects, setExpandedProjects] = useState({});

    // CRUD State
    const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState(null);
    const [selectedProjectId, setSelectedProjectId] = useState(null);

    // Refresh Trigger
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    // Fetch Projects
    const { data: projects, loading: projectsLoading } = useFetchData(
        () => projectService.getAll(),
        [refreshTrigger]
    );

    // Fetch Tasks
    const { data: tasks, loading: tasksLoading } = useFetchData(
        () => taskService.getAll(),
        [refreshTrigger]
    );

    const loading = projectsLoading || tasksLoading;

    // Filter Data based on PERMISSIONS
    const { visibleProjects, visibleTasks } = useMemo(() => {
        if (!projects || !tasks || !currentUser) return { visibleProjects: [], visibleTasks: [] };

        let filteredP = projects;
        let filteredT = tasks;

        if (userRole !== 'Admin') {
            // Filter Projects: View only if Member or Manager
            filteredP = projects.filter(p =>
                p.managerId === currentUser.uid ||
                p.members?.includes(currentUser.uid)
            );

            // Filter Tasks: View only if Assigned OR (Member of Project)
            const myProjectIds = filteredP.map(p => p.id);
            filteredT = tasks.filter(t =>
                t.assignedTo === currentUser.uid ||
                myProjectIds.includes(t.projectId)
            );
        }

        return { visibleProjects: filteredP, visibleTasks: filteredT };
    }, [projects, tasks, currentUser, userRole]);

    // Group tasks by project
    const projectTasks = useMemo(() => {
        const grouped = {};
        visibleTasks.forEach(task => {
            if (!grouped[task.projectId]) grouped[task.projectId] = [];
            grouped[task.projectId].push(task);
        });
        return grouped;
    }, [visibleTasks]);

    // Toggle Project Expansion
    const toggleProject = (projectId) => {
        setExpandedProjects(prev => ({
            ...prev,
            [projectId]: !prev[projectId]
        }));
    };

    // Initialize all projects as expanded by default
    useEffect(() => {
        if (visibleProjects.length > 0) {
            setExpandedProjects(prev => {
                if (Object.keys(prev).length === 0) {
                    const initialExpanded = {};
                    visibleProjects.forEach(p => initialExpanded[p.id] = true);
                    return initialExpanded;
                }
                return prev;
            });
        }
    }, [visibleProjects]);


    // Generate timeline days
    const timelineDays = useMemo(() => {
        const days = [];
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        for (let i = 1; i <= daysInMonth; i++) {
            days.push(new Date(year, month, i));
        }
        return days;
    }, [currentDate]);

    // Navigate Months
    const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

    // CRUD Handlers
    const handleAddTask = (projectId) => {
        setSelectedProjectId(projectId);
        setEditingTask(null);
        setIsTaskModalOpen(true);
    };

    const handleEditTask = (task) => {
        setEditingTask(task);
        setIsTaskModalOpen(true);
    };

    const handleDeleteTask = async (taskId) => {
        if (window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) {
            try {
                await taskService.delete(taskId);
                setRefreshTrigger(prev => prev + 1);
            } catch (error) {
                console.error("Error deleting task:", error);
                alert('Có lỗi xảy ra khi xóa nhiệm vụ');
            }
        }
    };

    const handleTaskSuccess = () => {
        setRefreshTrigger(prev => prev + 1);
        setIsTaskModalOpen(false);
    };

    // Helper: Bar Styling
    const getBarComponent = (start, end, type = 'project', status, title = '') => {
        if (!start || !end) return null;

        const startDate = start.toDate ? start.toDate() : new Date(start);
        const endDate = end.toDate ? end.toDate() : new Date(end);
        const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        // Check if completely outside current month
        if (endDate < monthStart || startDate > monthEnd) {
            return null;
        }

        const effectiveStart = startDate < monthStart ? monthStart : startDate;
        const effectiveEnd = endDate > monthEnd ? monthEnd : endDate;

        const totalDays = timelineDays.length;
        const startDay = effectiveStart.getDate();
        // Calculate duration in days, inclusive
        const duration = Math.ceil((effectiveEnd - effectiveStart) / (1000 * 60 * 60 * 24)) + 1;

        const left = ((startDay - 1) / totalDays) * 100;
        const width = (duration / totalDays) * 100;

        let bgColor = 'bg-blue-500';
        if (type === 'project') {
            bgColor = 'bg-blue-600'; // Darker blue for projects
        } else {
            if (status === 'Hoàn thành') bgColor = 'bg-emerald-500';
            else if (status === 'Đang thực hiện') bgColor = 'bg-blue-500';
            else if (status === 'Chưa bắt đầu') bgColor = 'bg-gray-400';
            else if (status === 'Quá hạn') bgColor = 'bg-red-500';
            else bgColor = 'bg-amber-500';
        }

        // Format date string dd/mm
        const formatDate = (date) => `${date.getDate() < 10 ? '0' + date.getDate() : date.getDate()}/${date.getMonth() + 1 < 10 ? '0' + (date.getMonth() + 1) : date.getMonth() + 1}`;
        const dateRangeText = `${formatDate(startDate)} - ${formatDate(endDate)}`;
        const displayText = type === 'project' ? `${dateRangeText}: ${title}` : `${dateRangeText}: ${title}`;

        return (
            <div
                className={`absolute top-1/2 -translate-y-1/2 h-7 rounded-md shadow-sm text-xs text-white flex items-center px-3 overflow-hidden whitespace-nowrap transition-all hover:brightness-110 cursor-pointer ${bgColor} z-10`}
                style={{ left: `${left}%`, width: `${width}%` }}
                title={`${displayText}`}
            >
                <span className="font-medium truncate">{displayText}</span>
            </div>
        );
    };


    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl shadow-card border border-gray-100">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Sơ đồ Gantt</h1>
                    <p className="text-sm text-gray-500 mt-1">Theo dõi tiến độ và lịch trình dự án</p>
                </div>

                <div className="flex gap-3 items-center">
                    <div className="flex items-center gap-2 bg-gray-50 p-1 rounded-lg border border-gray-200">
                        <button className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-all shadow-sm" onClick={handlePrevMonth}>
                            <ChevronLeft size={18} />
                        </button>
                        <div className="flex items-center gap-2 px-3 font-bold text-gray-700 text-sm min-w-[140px] justify-center">
                            <CalendarIcon size={16} className="text-gray-500" />
                            <span>Tháng {currentDate.getMonth() + 1} {currentDate.getFullYear()}</span>
                        </div>
                        <button className="p-1.5 hover:bg-white rounded-md text-gray-600 transition-all shadow-sm" onClick={handleNextMonth}>
                            <ChevronRight size={18} />
                        </button>
                    </div>

                    <button
                        onClick={() => { setSelectedProjectId(null); setEditingTask(null); setIsTaskModalOpen(true); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-medium shadow-sm transition-all shadow-primary-500/20"
                    >
                        <Plus size={18} />
                        <span className="hidden sm:inline">Tạo mới</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                        <p>Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <div className="flex flex-col min-w-[1200px] overflow-x-auto">
                        {/* Table Header */}
                        <div className="flex border-b border-gray-200 bg-gray-50/50">
                            <div className="w-80 flex-shrink-0 p-4 font-bold text-gray-700 border-r border-gray-200 sticky left-0 z-30 bg-gray-50">
                                Tên
                            </div>
                            <div className="flex-1 flex">
                                {timelineDays.map(day => {
                                    const isToday = day.getDate() === new Date().getDate() && day.getMonth() === new Date().getMonth() && day.getFullYear() === new Date().getFullYear();
                                    return (
                                        <div key={day.toISOString()} className={`flex-1 min-w-[32px] text-center py-2 border-r border-gray-100 last:border-r-0 group transition-colors ${isToday ? 'bg-red-500' : 'hover:bg-gray-100'}`}>
                                            <div className={`text-[10px] font-bold uppercase mb-0.5 ${isToday ? 'text-white/80' : 'text-gray-400'}`}>
                                                {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][day.getDay()]}
                                            </div>
                                            <div className={`text-sm font-bold mx-auto flex items-center justify-center ${isToday ? 'text-white' : 'text-gray-700'}`}>
                                                {day.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Table Body */}
                        <div className="divide-y divide-gray-100">
                            {visibleProjects.map(project => (
                                <div key={project.id} className="group/project">
                                    {/* Project Row */}
                                    <div className="flex bg-gray-50/30 hover:bg-gray-50 transition-colors">
                                        <div className="w-80 flex-shrink-0 p-3 pl-4 border-r border-gray-200 flex items-center justify-between sticky left-0 z-20 bg-white group-hover/project:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-2 min-w-0">
                                                <button
                                                    onClick={() => toggleProject(project.id)}
                                                    className="p-1 hover:bg-gray-200 rounded text-gray-500 transition-colors"
                                                >
                                                    {expandedProjects[project.id] ? <ChevronDown size={16} /> : <ChevronRightIcon size={16} />}
                                                </button>
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <FolderIcon className="text-blue-500 fill-blue-500" size={16} />
                                                    <span className="font-bold text-gray-800 truncate text-sm">{project.name}</span>
                                                    <span className="bg-blue-100 text-blue-700 text-[10px] px-1.5 py-0.5 rounded-full font-medium">{projectTasks[project.id]?.length || 0}</span>
                                                </div>
                                            </div>

                                            {/* Project Actions - Always visible on hover */}
                                            <div className="opacity-0 group-hover/project:opacity-100 flex items-center gap-1 transition-opacity">
                                                <button
                                                    onClick={() => handleAddTask(project.id)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Thêm nhiệm vụ"
                                                >
                                                    <Plus size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="flex-1 relative h-12">
                                            {/* Grid Lines */}
                                            <div className="absolute inset-0 flex pointer-events-none">
                                                {timelineDays.map(day => (
                                                    <div key={day.toISOString()} className="flex-1 border-r border-gray-100/60 last:border-r-0"></div>
                                                ))}
                                            </div>
                                            {/* Bar */}
                                            {getBarComponent(project.startDate, project.endDate, 'project', project.status, project.name)}
                                        </div>
                                    </div>

                                    {/* Task Rows */}
                                    {expandedProjects[project.id] && projectTasks[project.id]?.map(task => (
                                        <div key={task.id} className="flex hover:bg-white transition-colors border-t border-gray-50 group/task">
                                            <div className="w-80 flex-shrink-0 p-3 pl-12 border-r border-gray-200 flex items-center justify-between sticky left-0 z-20 bg-white transition-colors">
                                                <div className="min-w-0 pr-2">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <div className={`w-2 h-2 rounded-full ${task.status === 'Hoàn thành' ? 'bg-emerald-500' :
                                                            task.status === 'Đang thực hiện' ? 'bg-blue-500' :
                                                                task.priority === 'Cao' ? 'bg-red-400' : 'bg-gray-300'
                                                            }`}></div>
                                                        <span className="font-medium text-gray-700 text-sm truncate">{task.name}</span>
                                                    </div>
                                                    <div className="text-[10px] text-gray-400 truncate flex items-center gap-1">
                                                        <span>{task.assignedToName || 'Chưa giao'}</span>
                                                        <span>•</span>
                                                        <span>{task.status}</span>
                                                    </div>
                                                </div>

                                                {/* Task Actions */}
                                                <div className="flex gap-1 opacity-0 group-hover/task:opacity-100 transition-opacity">
                                                    <button
                                                        onClick={() => handleEditTask(task)}
                                                        className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Chỉnh sửa"
                                                    >
                                                        <Edit2 size={13} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDeleteTask(task.id)}
                                                        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded"
                                                        title="Xóa"
                                                    >
                                                        <Trash2 size={13} />
                                                    </button>
                                                </div>
                                            </div>

                                            <div className="flex-1 relative h-12">
                                                {/* Grid Lines */}
                                                <div className="absolute inset-0 flex pointer-events-none">
                                                    {timelineDays.map(day => (
                                                        <div key={day.toISOString()} className="flex-1 border-r border-gray-100/60 last:border-r-0"></div>
                                                    ))}
                                                </div>
                                                {/* Bar */}
                                                {getBarComponent(task.startDate || task.createdAt, task.dueDate, 'task', task.status, task.name)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Task Form Modal */}
            {isTaskModalOpen && (
                <TaskForm
                    onClose={() => setIsTaskModalOpen(false)}
                    onSuccess={handleTaskSuccess}
                    initialData={editingTask ? {
                        ...editingTask,
                        projectId: editingTask.projectId // Ensure projectId is passed
                    } : {
                        projectId: selectedProjectId // Pre-fill project if selected
                    }}
                />
            )}
        </div>
    );
};

// Simple Folder Icon Component to avoid extra import if not available, or use Lucide
const FolderIcon = ({ className, size }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z" />
    </svg>
);

export default GanttPage;
