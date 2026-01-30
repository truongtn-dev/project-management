import { useState, useEffect } from 'react';
import {
    projectService,
    taskService
} from '../services/firebase-services';
import { useFetchData } from '../hooks/use-firebase';
import { useAuth } from '../contexts/auth-context';
import DashboardStats from '../components/dashboard/DashboardStats';
import RecentActivity from '../components/dashboard/RecentActivity';
import HighPriorityTasks from '../components/dashboard/HighPriorityTasks';
import DashboardCharts from '../components/dashboard/DashboardCharts';

const DashboardPage = () => {
    // Fetch Projects and Tasks
    const { data: projects, loading: projectsLoading, error: projectsError } = useFetchData(
        () => projectService.getAll(),
        []
    );

    const { data: tasks, loading: tasksLoading, error: tasksError } = useFetchData(
        () => taskService.getAll(),
        []
    );

    const { currentUser, userRole } = useAuth();

    // Filtered Data based on permissions
    const [visibleProjects, setVisibleProjects] = useState([]);
    const [visibleTasks, setVisibleTasks] = useState([]);

    useEffect(() => {
        if (!projects || !tasks || !currentUser) return;

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

        setVisibleProjects(filteredP);
        setVisibleTasks(filteredT);
    }, [projects, tasks, currentUser, userRole]);

    const loading = projectsLoading || tasksLoading;
    const error = projectsError || tasksError;

    if (loading) return (
        <div className="flex items-center justify-center h-96">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
    );

    if (error) return <div className="p-4 text-red-500 bg-red-50 rounded-lg">Lỗi: {error}</div>;

    return (
        <div className="space-y-6 pb-10">
            {/* 1. Statistics Cards */}
            <DashboardStats projects={visibleProjects} tasks={visibleTasks} />

            {/* 2. Middle Section: Activity & High Priority */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left: Recent Activity (1 col) */}
                <div className="lg:col-span-1">
                    <RecentActivity tasks={visibleTasks} />
                </div>

                {/* Right: High Priority Tasks (2 cols) */}
                <div className="lg:col-span-2">
                    <HighPriorityTasks tasks={visibleTasks} />
                </div>
            </div>

            {/* 3. Bottom Section: Charts */}
            {/* 3. Bottom Section: Charts */}
            <DashboardCharts projects={visibleProjects} tasks={visibleTasks} userRole={userRole} />
        </div>
    );
};

export default DashboardPage;
