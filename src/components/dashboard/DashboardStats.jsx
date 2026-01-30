import React from 'react';
import { Folder, ListChecks, Activity, AlertCircle, CheckCircle2, PieChart, HelpCircle, PauseCircle } from 'lucide-react';

const DashboardStats = ({ projects, tasks }) => {
    const totalProjects = projects.length;
    const completedProjects = projects.filter(p => p.status === 'Hoàn thành').length;
    const projectRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0;

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Hoàn thành').length;
    const taskRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const activeTasks = tasks.filter(t => t.status === 'Đang thực hiện').length;
    const notStartedTasks = tasks.filter(t => t.status === 'Chưa bắt đầu').length;

    const overdueTasks = tasks.filter(t => {
        if (!t.dueDate || t.status === 'Hoàn thành') return false;
        // Check if due date is before today (ignoring time for simplicity or being precise)
        const due = t.dueDate.toDate ? t.dueDate.toDate() : new Date(t.dueDate);
        return due < new Date();
    }).length;
    const overdueRate = totalTasks > 0 ? Math.round((overdueTasks / totalTasks) * 100) : 0;

    const stats = [
        {
            label: 'Tổng dự án',
            value: totalProjects,
            // Row 1: Completed, Row 2: Rate
            rows: [
                { label: 'Hoàn thành', value: completedProjects, icon: CheckCircle2, valueColor: 'text-gray-900' },
                { label: 'Tỷ lệ', value: `${projectRate}%`, icon: PieChart, valueColor: 'text-gray-900' }
            ],
            icon: Folder,
            color: 'bg-blue-500',
            borderColor: 'border-blue-500',
            iconBg: 'bg-blue-50',
            iconColor: 'text-blue-600',
        },
        {
            label: 'Tổng nhiệm vụ',
            value: totalTasks,
            rows: [
                { label: 'Hoàn thành', value: completedTasks, icon: CheckCircle2, valueColor: 'text-gray-900' },
                { label: 'Tỷ lệ', value: `${taskRate}%`, icon: PieChart, valueColor: 'text-gray-900' }
            ],
            icon: ListChecks,
            color: 'bg-emerald-500',
            borderColor: 'border-emerald-500',
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
        },
        {
            label: 'Nhiệm vụ đang làm',
            value: activeTasks,
            rows: [
                { label: 'Chưa bắt đầu', value: notStartedTasks, icon: HelpCircle, valueColor: 'text-gray-900' },
                { label: 'Tạm dừng', value: 0, icon: PauseCircle, valueColor: 'text-gray-900' }
            ],
            icon: Activity,
            color: 'bg-amber-500',
            borderColor: 'border-amber-500',
            iconBg: 'bg-amber-50',
            iconColor: 'text-amber-600',
        },
        {
            label: 'Nhiệm vụ quá hạn',
            value: overdueTasks,
            rows: [
                { label: 'Tổng nhiệm vụ', value: totalTasks, icon: ListChecks, valueColor: 'text-gray-900' },
                { label: 'Tỷ lệ', value: `${overdueRate}%`, icon: PieChart, valueColor: 'text-blue-600 font-bold' } // Blue text for rate as in image
            ],
            icon: AlertCircle,
            color: 'bg-red-500',
            borderColor: 'border-red-500',
            iconBg: 'bg-red-50',
            iconColor: 'text-red-600',
        }
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
                <div key={index} className={`bg-white rounded-xl shadow-sm border border-gray-100 border-t-4 ${stat.borderColor} p-4 hover:shadow-md transition-shadow`}>
                    <div className="flex items-center gap-4 mb-4">
                        <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                            <stat.icon size={24} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-bold text-gray-900 leading-none">{stat.value}</h3>
                            <p className="text-[11px] font-bold text-gray-500 uppercase mt-1">{stat.label}</p>
                        </div>
                    </div>

                    <div className="space-y-2 pt-2">
                        {stat.rows.map((row, rIdx) => (
                            <div key={rIdx} className="flex items-center text-xs text-gray-500">
                                <row.icon size={14} className="mr-2 text-gray-400" />
                                <span className="mr-1">{row.label}:</span>
                                <span className={`font-medium ${row.valueColor}`}>{row.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default DashboardStats;
