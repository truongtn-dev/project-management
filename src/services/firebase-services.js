import {
    collection,
    query,
    where,
    orderBy,
    limit,
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    onSnapshot,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';

// ============================================
// PROJECT SERVICES
// ============================================

export const projectService = {
    // Get all projects
    getAll: async () => {
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get project by ID
    getById: async (id) => {
        const docRef = doc(db, 'projects', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    // Get projects by status
    getByStatus: async (status) => {
        const q = query(
            collection(db, 'projects'),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Create new project
    create: async (projectData) => {
        const docRef = await addDoc(collection(db, 'projects'), {
            ...projectData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });
        return { id: docRef.id, ...projectData };
    },

    // Update project
    update: async (id, updates) => {
        const docRef = doc(db, 'projects', id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });
        return { id, ...updates };
    },

    // Delete project
    delete: async (id) => {
        await deleteDoc(doc(db, 'projects', id));
        return id;
    },

    // Real-time listener
    subscribe: (callback) => {
        const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const projects = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(projects);
        });
    },

    // Update project progress based on tasks
    updateProgress: async (projectId) => {
        if (!projectId) return;
        try {
            const tasksQuery = query(collection(db, 'tasks'), where('projectId', '==', projectId));
            const snapshot = await getDocs(tasksQuery);
            const total = snapshot.docs.length;
            const completed = snapshot.docs.filter(doc => doc.data().status === 'Hoàn thành').length;
            const progress = total === 0 ? 0 : Math.round((completed / total) * 100);

            const projectRef = doc(db, 'projects', projectId);
            await updateDoc(projectRef, {
                progress,
                updatedAt: serverTimestamp()
            });
            console.log(`Updated project ${projectId} progress to ${progress}%`);
        } catch (error) {
            console.error("Error updating project progress:", error);
        }
    }
};

// ============================================
// TASK SERVICES
// ============================================

export const taskService = {
    // Get all tasks
    getAll: async () => {
        const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get tasks by project
    getByProject: async (projectId) => {
        const q = query(
            collection(db, 'tasks'),
            where('projectId', '==', projectId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get tasks by status
    getByStatus: async (status) => {
        const q = query(
            collection(db, 'tasks'),
            where('status', '==', status),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get tasks by assigned user
    getByUser: async (userId) => {
        const q = query(
            collection(db, 'tasks'),
            where('assignedTo', '==', userId),
            orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get high priority tasks
    getHighPriority: async () => {
        const q = query(
            collection(db, 'tasks'),
            where('priority', '==', 'Cao'),
            orderBy('dueDate', 'asc'),
            limit(10)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Create new task
    create: async (taskData) => {
        const docRef = await addDoc(collection(db, 'tasks'), {
            ...taskData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        // Auto-update project progress
        if (taskData.projectId) {
            // Run in background, don't await blocking return
            projectService.updateProgress(taskData.projectId).catch(console.error);
        }

        return { id: docRef.id, ...taskData };
    },

    // Update task
    update: async (id, updates) => {
        const docRef = doc(db, 'tasks', id);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        // Auto-update project progress if status changed
        if (updates.status) {
            // Need to fetch task to get projectId
            getDoc(docRef).then(snap => {
                if (snap.exists()) {
                    const task = snap.data();
                    if (task.projectId) {
                        projectService.updateProgress(task.projectId);
                    }
                }
            }).catch(console.error);
        }

        return { id, ...updates };
    },

    // Delete task
    delete: async (id) => {
        const docRef = doc(db, 'tasks', id);

        // Get task info first to know projectId
        const snap = await getDoc(docRef);
        const task = snap.exists() ? snap.data() : null;

        await deleteDoc(docRef);

        if (task && task.projectId) {
            projectService.updateProgress(task.projectId).catch(console.error);
        }

        return id;
    },

    // Real-time listener
    subscribe: (callback) => {
        const q = query(collection(db, 'tasks'), orderBy('createdAt', 'desc'));
        return onSnapshot(q, (snapshot) => {
            const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(tasks);
        });
    }
};

// ============================================
// USER SERVICES
// ============================================

export const userService = {
    // Get all users
    getAll: async () => {
        const snapshot = await getDocs(collection(db, 'users'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Get user by ID
    getById: async (id) => {
        const docRef = doc(db, 'users', id);
        const docSnap = await getDoc(docRef);
        return docSnap.exists() ? { id: docSnap.id, ...docSnap.data() } : null;
    },

    // Get users by role
    getByRole: async (role) => {
        const q = query(collection(db, 'users'), where('role', '==', role));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Update user
    update: async (id, updates) => {
        const docRef = doc(db, 'users', id);
        await updateDoc(docRef, updates);
        return { id, ...updates };
    },

    // Delete user
    delete: async (id) => {
        await deleteDoc(doc(db, 'users', id));
        return id;
    }
};

// ============================================
// ACTIVITY SERVICES
// ============================================

export const activityService = {
    // Get recent activities
    getRecent: async (limitCount = 10) => {
        const q = query(
            collection(db, 'activities'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    // Log activity
    log: async (activityData) => {
        const docRef = await addDoc(collection(db, 'activities'), {
            ...activityData,
            createdAt: serverTimestamp()
        });
        return { id: docRef.id, ...activityData };
    },

    // Real-time listener
    subscribe: (callback, limitCount = 10) => {
        const q = query(
            collection(db, 'activities'),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );
        return onSnapshot(q, (snapshot) => {
            const activities = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            callback(activities);
        });
    }
};

// ============================================
// STATISTICS SERVICES
// ============================================

export const statsService = {
    // Get dashboard statistics
    getDashboardStats: async () => {
        const [projects, tasks] = await Promise.all([
            projectService.getAll(),
            taskService.getAll()
        ]);

        const activeTasks = tasks.filter(t => t.status === 'Đang thực hiện');
        const completedTasks = tasks.filter(t => t.status === 'Hoàn thành');
        const completedProjects = projects.filter(p => p.status === 'Hoàn thành');

        return {
            totalProjects: projects.length,
            totalTasks: tasks.length,
            activeTasks: activeTasks.length,
            completedTasks: completedTasks.length,
            completedProjects: completedProjects.length,
            completionRate: tasks.length > 0
                ? Math.round((completedTasks.length / tasks.length) * 100)
                : 0
        };
    },

    // Get task distribution by status
    getTasksByStatus: async () => {
        const tasks = await taskService.getAll();
        const distribution = {
            'Chưa bắt đầu': 0,
            'Đang thực hiện': 0,
            'Hoàn thành': 0,
            'Tạm dừng': 0
        };

        tasks.forEach(task => {
            if (distribution.hasOwnProperty(task.status)) {
                distribution[task.status]++;
            }
        });

        return distribution;
    },

    // Get task distribution by priority
    getTasksByPriority: async () => {
        const tasks = await taskService.getAll();
        const distribution = {
            'Thấp': 0,
            'Trung bình': 0,
            'Cao': 0
        };

        tasks.forEach(task => {
            if (distribution.hasOwnProperty(task.priority)) {
                distribution[task.priority]++;
            }
        });

        return distribution;
    }
};
