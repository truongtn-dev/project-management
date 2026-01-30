import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Clock, CheckCircle2, AlertCircle, PlayCircle } from 'lucide-react';

const RecentActivity = ({ tasks }) => {
    // Sort tasks by last update or creation
    const activities = tasks
        .sort((a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt))
        .slice(0, 5)
        .map(task => {
            const date = task.updatedAt ? (task.updatedAt.toDate ? task.updatedAt.toDate() : new Date(task.updatedAt)) : (task.createdAt?.toDate ? task.createdAt.toDate() : new Date());

            let action = 'đã cập nhật';
            let icon = Clock;
            let color = 'text-blue-500 bg-blue-50';

            if (task.status === 'Hoàn thành') {
                action = 'đã hoàn thành';
                icon = CheckCircle2;
                color = 'text-green-500 bg-green-50';
            } else if (task.status === 'Đang thực hiện') {
                action = 'đang thực hiện';
                icon = PlayCircle;
                color = 'text-amber-500 bg-amber-50';
            }

            return {
                id: task.id,
                user: task.assignedToName || 'Admin', // In real app, this should be 'updatedBy' user
                action,
                taskName: task.name,
                time: date,
                Icon: icon,
                color
            };
        });

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Hoạt động gần đây</h3>
                <button className="text-sm text-primary-600 hover:text-primary-700 font-medium">Xem tất cả</button>
            </div>

            <div className="space-y-6">
                {activities.length > 0 ? activities.map((item, idx) => (
                    <div key={idx} className="flex gap-4 relative">
                        {/* Timeline line */}
                        {idx !== activities.length - 1 && (
                            <div className="absolute left-[19px] top-10 bottom-[-24px] w-[2px] bg-gray-100"></div>
                        )}

                        <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${item.color}`}>
                            <item.Icon size={18} />
                        </div>
                        <div>
                            <p className="text-sm text-gray-800">
                                <span className="font-bold">{item.user}</span> {item.action} nhiệm vụ
                            </p>
                            <p className="text-sm font-medium text-primary-600 mt-0.5 mb-1 line-clamp-1">
                                {item.taskName}
                            </p>
                            <p className="text-xs text-gray-400">
                                {formatDistanceToNow(item.time, { addSuffix: true, locale: vi })}
                            </p>
                        </div>
                    </div>
                )) : (
                    <div className="text-center py-8 text-gray-500">Chưa có hoạt động nào</div>
                )}
            </div>
        </div>
    );
};

export default RecentActivity;
