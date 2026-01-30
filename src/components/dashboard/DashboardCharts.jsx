import React from 'react';
import { Doughnut, Bar, Pie, Line } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    Tooltip,
    Legend,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { subDays, format } from 'date-fns';

ChartJS.register(
    ArcElement,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Filler,
    Tooltip,
    Legend
);

const DashboardCharts = ({ projects, tasks, userRole }) => {
    // Helper: Calculate Project Progress
    const getProjectProgress = (projectId) => {
        const pTasks = tasks.filter(t => t.projectId === projectId);
        if (pTasks.length === 0) return 0;
        const completed = pTasks.filter(t => t.status === 'Hoàn thành').length;
        return Math.round((completed / pTasks.length) * 100);
    };

    // --- Row 1 Charts ---

    // 1. Task Status (Doughnut) - Blue (Doing), Green (Done), Yellow (Not Started)
    const taskStatusData = {
        labels: ['Đang thực hiện', 'Hoàn thành', 'Chưa bắt đầu'],
        datasets: [{
            data: [
                tasks.filter(t => t.status === 'Đang thực hiện').length,
                tasks.filter(t => t.status === 'Hoàn thành').length,
                tasks.filter(t => t.status === 'Chưa bắt đầu').length,
            ],
            backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'],
            borderWidth: 0,
            hoverOffset: 4
        }]
    };

    // 2. Project Progress Distribution (Bar) - Red -> Green gradient logic
    const progressBins = { '0-25%': 0, '26-50%': 0, '51-75%': 0, '76-99%': 0, '100%': 0 };
    projects.forEach(p => {
        const prog = getProjectProgress(p.id);
        if (prog === 100) progressBins['100%']++;
        else if (prog >= 76) progressBins['76-99%']++;
        else if (prog >= 51) progressBins['51-75%']++;
        else if (prog >= 26) progressBins['26-50%']++;
        else progressBins['0-25%']++;
    });

    const projectDistributionData = {
        labels: Object.keys(progressBins),
        datasets: [{
            label: 'Số lượng dự án',
            data: Object.values(progressBins),
            backgroundColor: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#22c55e'],
            borderRadius: 4,
            barThickness: 40,
        }]
    };

    // 3. Task Priority (Pie) - Green (Low), Blue (Medium), Red (High)
    const taskPriorityData = {
        labels: ['Thấp', 'Trung bình', 'Cao'],
        datasets: [{
            data: [
                tasks.filter(t => t.priority === 'Thấp').length,
                tasks.filter(t => t.priority === 'Trung bình').length,
                tasks.filter(t => t.priority === 'Cao').length,
            ],
            backgroundColor: ['#10b981', '#3b82f6', '#ef4444'],
            borderWidth: 0,
        }]
    };

    // --- Row 2 Charts ---

    // 4. Employee Efficiency (Combo: Green Bar = Total, Blue Line = Rate)
    const userPerformance = {};
    if (userRole === 'Admin') {
        tasks.forEach(t => {
            const name = t.assignedToName || 'Unknown';
            if (!userPerformance[name]) userPerformance[name] = { total: 0, completed: 0 };
            userPerformance[name].total++;
            if (t.status === 'Hoàn thành') userPerformance[name].completed++;
        });
    }

    const topUsers = Object.entries(userPerformance)
        .sort((a, b) => b[1].total - a[1].total)
        .slice(0, 5);

    const employeeEfficiencyData = {
        labels: topUsers.map(u => u[0]),
        datasets: [
            {
                type: 'line',
                label: 'Tỷ lệ hoàn thành (%)',
                data: topUsers.map(u => Math.round((u[1].completed / u[1].total) * 100)),
                borderColor: '#2563eb', // Blue line
                borderWidth: 2,
                pointBackgroundColor: '#2563eb',
                yAxisID: 'y1',
                tension: 0.4
            },
            {
                type: 'bar',
                label: 'Tổng số nhiệm vụ',
                data: topUsers.map(u => u[1].total),
                backgroundColor: '#10b981', // Green bars
                borderRadius: 4,
                barThickness: 30,
                yAxisID: 'y',
            }
        ]
    };

    // 5. Completion Trend (Line) - Green Line
    const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = subDays(new Date(), 6 - i);
        return format(d, 'dd/MM');
    });

    const completionTrendData = {
        labels: last7Days,
        datasets: [{
            label: 'Nhiệm vụ hoàn thành',
            data: last7Days.map((dateStr) => {
                // Approximate matching by day
                return tasks.filter(t => {
                    if (t.status !== 'Hoàn thành' || !t.updatedAt) return false;
                    const d = t.updatedAt.toDate ? t.updatedAt.toDate() : new Date(t.updatedAt);
                    return format(d, 'dd/MM') === dateStr;
                }).length;
            }),
            borderColor: '#10b981',
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            fill: true,
            tension: 0.4,
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };

    // 6. Project Comparison (Combo: Blue Bar = Total, Red Line = Rate)
    const compareProjects = projects.slice(0, 5);
    const projectCompareData = {
        labels: compareProjects.map(p => p.name),
        datasets: [
            {
                type: 'line',
                label: 'Tỷ lệ hoàn thành (%)',
                data: compareProjects.map(p => getProjectProgress(p.id)),
                borderColor: '#ef4444', // Red Line
                borderWidth: 2,
                pointBackgroundColor: '#ef4444',
                yAxisID: 'y1',
                tension: 0.4
            },
            {
                type: 'bar',
                label: 'Tổng nhiệm vụ',
                data: compareProjects.map(p => tasks.filter(t => t.projectId === p.id).length),
                backgroundColor: '#3b82f6', // Blue Bars
                borderRadius: 4,
                barThickness: 30,
                yAxisID: 'y',
            }
        ]
    };

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom', labels: { usePointStyle: true, boxWidth: 8, padding: 15, font: { size: 11 } } },
        },
        scales: {
            x: { grid: { display: false } },
            y: { grid: { borderDash: [4, 4] }, beginAtZero: true }
        }
    };

    const comboOptions = {
        ...commonOptions,
        interaction: { mode: 'index', intersect: false },
        scales: {
            x: { grid: { display: false } },
            y: { type: 'linear', display: true, position: 'left', grid: { borderDash: [4, 4] }, beginAtZero: true },
            y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, min: 0, max: 100 }
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Row 1 - Common for all */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                <h3 className="text-gray-900 font-bold mb-4 text-sm">Trạng thái nhiệm vụ</h3>
                <div className="flex-1 flex items-center justify-center relative">
                    <Doughnut data={taskStatusData} options={commonOptions} />
                </div>
            </div>

            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                <h3 className="text-gray-900 font-bold mb-4 text-sm">Phân bổ ưu tiên nhiệm vụ</h3>
                <div className="flex-1 flex items-center justify-center">
                    <Pie data={taskPriorityData} options={commonOptions} />
                </div>
            </div>

            {/* Admin sees Project Distribution */}
            {userRole === 'Admin' && (
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                    <h3 className="text-gray-900 font-bold mb-4 text-sm">Phân bổ tiến độ dự án</h3>
                    <div className="flex-1">
                        <Bar data={projectDistributionData} options={commonOptions} />
                    </div>
                </div>
            )}


            {/* Row 2 - Completion Trend (Common) */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                <h3 className="text-gray-900 font-bold mb-4 text-sm">Xu hướng hoàn thành</h3>
                <div className="flex-1">
                    <Line data={completionTrendData} options={commonOptions} />
                </div>
            </div>

            {/* Admin Only Charts Row */}
            {userRole === 'Admin' && (
                <>
                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                        <h3 className="text-gray-900 font-bold mb-4 text-sm">Hiệu quả nhân viên</h3>
                        <div className="flex-1">
                            <Bar data={employeeEfficiencyData} options={comboOptions} />
                        </div>
                    </div>

                    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 h-80 flex flex-col">
                        <h3 className="text-gray-900 font-bold mb-4 text-sm">So sánh dự án</h3>
                        <div className="flex-1">
                            <Bar data={projectCompareData} options={comboOptions} />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default DashboardCharts;
