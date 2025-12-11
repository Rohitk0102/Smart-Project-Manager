import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const MyTasks = () => {
    const { user } = useAuth();
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchMyTasks = async () => {
            try {
                const { data } = await api.get('/tasks/my-tasks');
                setTasks(data);
            } catch (error) {
                console.error("Failed to fetch my tasks", error);
            } finally {
                setLoading(false);
            }
        };

        fetchMyTasks();
    }, []);

    if (loading) return <div className="p-10 text-center text-white">Loading Tasks...</div>;

    const getStatusColor = (status) => {
        switch (status) {
            case 'todo': return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
            case 'in_progress': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
            case 'done': return 'bg-green-500/10 text-green-400 border-green-500/20';
            default: return 'bg-slate-500/10 text-slate-400';
        }
    };

    const getPriorityColor = (priority) => {
        switch ((priority || 'low').toLowerCase()) {
            case 'high': return 'text-red-400';
            case 'medium': return 'text-orange-400';
            default: return 'text-blue-400';
        }
    };

    const groupedTasks = tasks.reduce((acc, task) => {
        const projectId = task.project?._id || 'unknown';
        if (!acc[projectId]) {
            acc[projectId] = {
                project: task.project,
                tasks: []
            };
        }
        acc[projectId].tasks.push(task);
        return acc;
    }, {});

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <div className="flex-1 overflow-auto bg-[#0a0f1c] text-white p-8">
            <header className="mb-8">
                <motion.h1
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400"
                >
                    My Tasks
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-slate-400 mt-2"
                >
                    Overview of all your tasks across projects
                </motion.p>
            </header>

            <motion.div
                variants={container}
                initial="hidden"
                animate="show"
                className="space-y-8"
            >
                {Object.values(groupedTasks).map(({ project, tasks }) => (
                    <motion.div variants={item} key={project?._id || 'unknown'} className="bg-dark-card rounded-xl border border-slate-800 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-800 bg-slate-800/20 flex justify-between items-center">
                            <h2 className="font-bold text-lg text-white flex items-center gap-2">
                                <span className="text-xl">🚀</span>
                                {project?.name || 'Unknown Project'}
                                <span className="px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 text-xs font-normal border border-slate-700">{tasks.length} tasks</span>
                            </h2>
                            <Link
                                to={project?._id ? `/project/${project._id}` : '#'}
                                className="text-sm font-medium text-primary hover:text-indigo-400 transition-colors flex items-center gap-1"
                            >
                                Open Board <span>→</span>
                            </Link>
                        </div>

                        <div className="divide-y divide-slate-800/50">
                            {tasks.map(task => (
                                <div key={task._id} className="group p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-all cursor-default">
                                    {/* Status Indicator */}
                                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.status === 'done' ? 'bg-green-500' :
                                        task.status === 'in_progress' ? 'bg-indigo-500' : 'bg-slate-500'
                                        }`}></div>

                                    {/* Title & Description */}
                                    <div className="flex-1 min-w-0 pr-4">
                                        <div className="flex items-center gap-3 mb-0.5">
                                            <h3 className="text-sm font-semibold text-white truncate">{task.title}</h3>
                                            <div className={`px-2 py-0.5 rounded-[4px] text-[10px] uppercase font-bold tracking-wider border ${getStatusColor(task.status)}`}>
                                                {task.status.replace('_', ' ')}
                                            </div>
                                        </div>
                                        <p className="text-xs text-slate-500 truncate max-w-xl">{task.description || 'No description'}</p>
                                    </div>

                                    {/* Meta Info Rows */}
                                    <div className="flex items-center gap-8 text-xs text-slate-400 shrink-0">
                                        {/* Due Date */}
                                        <div className="flex items-center gap-2 w-32">
                                            <span className="text-slate-600 font-medium uppercase tracking-wider text-[10px]">Due</span>
                                            <span className={task.dueDate ? 'text-slate-300' : 'text-slate-600 italic'}>
                                                {task.dueDate
                                                    ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                                                    : 'No Date'
                                                }
                                            </span>
                                        </div>

                                        {/* Priority */}
                                        <div className="flex items-center gap-2 w-24">
                                            <span className="text-slate-600 font-medium uppercase tracking-wider text-[10px]">Priority</span>
                                            <div className={`flex items-center gap-1 font-semibold ${getPriorityColor(task.priority)}`}>
                                                <span className="capitalize">{task.priority || 'Low'}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}

                {tasks.length === 0 && (
                    <motion.div variants={item} className="py-20 text-center text-slate-500 border-2 border-dashed border-slate-800 rounded-xl bg-slate-900/20">
                        <div className="text-4xl mb-3 opacity-20">📝</div>
                        <h3 className="text-lg font-medium text-white mb-1">No tasks assigned to you</h3>
                        <p className="text-sm mb-4 max-w-xs mx-auto text-slate-400">Tasks assigned to you will appear here, grouped by project.</p>
                        <Link to="/" className="text-primary hover:text-indigo-400 text-sm font-medium">Go to Dashboard &rarr;</Link>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default MyTasks;
