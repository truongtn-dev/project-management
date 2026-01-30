import React from 'react';
import { User, Calendar, ArrowRight } from 'lucide-react';

const HighPriorityTasks = ({ tasks }) => {
    // Filter high priority tasks
    const highPriorityTasks = tasks
        .filter(t => t.priority === 'Cao' && t.status !== 'Hoàn thành')
        .sort((a, b) => (a.dueDate || 0) - (b.dueDate || 0)) // Sort by due date ascending
        .slice(0, 4);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Nhiệm vụ ưu tiên cao</h3>
                <button className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                    <ArrowRight size={20} />
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highPriorityTasks.length > 0 ? highPriorityTasks.map(task => {
                    // Mock progress based on status
                    let progress = 0;
                    if (task.status === 'Đang thực hiện') progress = 50;
                    if (task.status === 'Hoàn thành') progress = 100;

                    const dueDate = task.dueDate?.toDate ? task.dueDate.toDate() : new Date(task.dueDate);
                    const isOverdue = dueDate < new Date();

                    return (
                        <div key={task.id} className="p-4 rounded-xl border border-gray-100 bg-orange-50/30 hover:bg-white hover:shadow-md transition-all duration-200 group">
                            <div className="flex justify-between items-start mb-3">
                                <h4 className="font-bold text-gray-900 line-clamp-1 pr-2">{task.name}</h4>
                                {isOverdue && (
                                    <span className="text-[10px] font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full whitespace-nowrap">
                                        Quá hạn
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 mb-3">
                                <div className="p-1 rounded bg-indigo-100 text-indigo-600">
                                    <User size={12} />
                                </div>
                                <span className="text-xs font-medium text-gray-600 truncate">
                                    {task.assignedToName || 'Chưa giao'}
                                </span>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-3">
                                <div className="flex justify-between text-xs mb-1 text-gray-500 font-medium">
                                    <span>Tiến độ</span>
                                    <span>{progress}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                            </div>

                            <div className="flex items-center justify-end text-xs text-gray-500 font-medium pt-2 border-t border-gray-100 border-dashed">
                                <Calendar size={12} className="mr-1 text-gray-400" />
                                <span className={isOverdue ? "text-red-500" : ""}>
                                    {dueDate.toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        </div>
                    );
                }) : (
                    <div className="col-span-full py-12 flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-100 rounded-xl">
                        <p>Không có nhiệm vụ ưu tiên cao</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default HighPriorityTasks;
