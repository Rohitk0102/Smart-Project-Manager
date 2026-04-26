import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import socket from '../socket';
import { DndContext, closestCenter, DragOverlay, useDroppable, useSensor, useSensors, PointerSensor, TouchSensor } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FiArrowLeft, FiArrowRight, FiLayout, FiList, FiClock, FiX, FiCalendar, FiPieChart, FiPlus, FiBriefcase, FiInbox, FiPlay, FiCheckCircle, FiTrash2, FiRotateCcw, FiUser, FiUsers, FiAward, FiSettings, FiEdit, FiCheck, FiChevronRight, FiMoreVertical, FiAlertCircle } from 'react-icons/fi';
import ProjectAnalytics from '../components/ProjectAnalytics';
import { AnimatePresence, motion } from 'framer-motion';

const TaskCard = ({ task, user, onDelete, onUpdateStatus, onViewDetails, style, innerRef, ...props }) => {
    const getPriorityColor = (p) => {
        switch ((p || 'low').toLowerCase()) {
            case 'urgent': return 'bg-rose-500/20 text-rose-500 border-rose-500/30 font-black';
            case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
            case 'medium': return 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
        }
    };

    const isAssignee = task.assignedTo?._id === user?._id || task.assignedTo === user?._id;
    const canChangeStatus = user?.role !== 'Employee' || isAssignee;
    const canDelete = user?.role !== 'Employee';

    return (
        <motion.div
            ref={innerRef}
            style={style}
            {...props}
            onClick={() => onViewDetails && onViewDetails(task)}
            layoutId={task._id}
            className={`group bg-white dark:bg-[#111827] p-5 rounded-[1.5rem] border ${task.status === 'running' ? 'border-primary/40 shadow-lg shadow-primary/5' : 'border-slate-200 dark:border-white/5'} mb-4 shadow-sm hover:shadow-2xl hover:border-primary/50 cursor-pointer active:cursor-grabbing transform transition-all duration-300 hover:-translate-y-1 relative overflow-hidden`}
        >
            {task.status === 'running' && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-indigo-400 to-primary animate-shimmer"></div>
            )}

            <div className="flex justify-between items-start mb-4">
                <span className={`px-2.5 py-0.5 rounded-lg text-[10px] uppercase font-black tracking-widest border ${getPriorityColor(task.priority)} transition-colors`}>
                    {task.priority || 'Low'}
                </span>
                {canDelete && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
                        className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                        <FiTrash2 size={14} />
                    </button>
                )}
            </div>

            <h4 className="text-base font-bold text-slate-900 dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                {task.title}
            </h4>

            {task.description && (
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 line-clamp-2 leading-relaxed font-medium">
                    {task.description}
                </p>
            )}

            <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-white/5">
                <div className="flex items-center text-slate-400 text-[10px] font-black uppercase tracking-tighter gap-1.5">
                    <FiClock size={12} className="text-slate-500" />
                    <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No Deadline'}</span>
                </div>

                <div className="flex items-center gap-2">
                    {task.assignedTo ? (
                        <div className="w-7 h-7 rounded-full ring-2 ring-white dark:ring-[#111827] bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-black text-slate-700 dark:text-slate-300 shadow-sm" title={task.assignedTo.name}>
                            {task.assignedTo.avatar ? <img src={task.assignedTo.avatar} className="w-full h-full rounded-full" /> : task.assignedTo.name?.charAt(0)}
                        </div>
                    ) : (
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 text-[10px] ring-1 ring-slate-200 dark:ring-white/10 italic">?</div>
                    )}
                </div>
            </div>
        </motion.div>
    );
};

const SortableTask = (props) => {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.task._id });
    const style = { transform: CSS.Translate.toString(transform), transition, opacity: isDragging ? 0.3 : 1 };
    return <TaskCard innerRef={setNodeRef} style={style} {...attributes} {...listeners} {...props} />;
};

const DroppableColumn = ({ column, tasks, onUpdateStatus, onDelete, onAddTask, onViewDetails, user }) => {
    const { setNodeRef } = useDroppable({ id: `col-${column.id}` });
    const columnTasks = tasks.filter(t => t.status === column.id);
    const statusColor = column.id === 'to-do' ? 'bg-slate-400' : column.id === 'running' ? 'bg-primary' : 'bg-emerald-500';

    return (
        <div ref={setNodeRef} className="w-80 flex flex-col h-full bg-slate-100/40 dark:bg-[#0f172a]/40 backdrop-blur-sm rounded-[2rem] border border-slate-200/50 dark:border-white/5 overflow-hidden group/col transition-all">
            <div className="p-6 pb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${statusColor} ring-4 ring-white dark:ring-[#0a0f1c] opacity-90`}></div>
                    <h3 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-[0.2em]">{column.label}</h3>
                    <span className="bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-400 text-[9px] px-2.5 py-0.5 rounded-full font-black">{columnTasks.length}</span>
                </div>
                {user?.role !== 'Employee' && (
                    <button onClick={onAddTask} className="w-8 h-8 rounded-full hover:bg-white dark:hover:bg-white/10 flex items-center justify-center text-slate-400 transition-all"><FiPlus size={16} /></button>
                )}
            </div>

            <div className="flex-1 p-4 overflow-y-auto custom-scrollbar space-y-4">
                <SortableContext items={columnTasks.map(t => t._id)} strategy={verticalListSortingStrategy}>
                    {columnTasks.map(task => <SortableTask key={task._id} task={task} user={user} onUpdateStatus={onUpdateStatus} onDelete={onDelete} onViewDetails={onViewDetails} />)}
                </SortableContext>
                {columnTasks.length === 0 && (
                    <div className="h-48 flex flex-col items-center justify-center text-slate-400 dark:text-slate-600 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-3xl bg-white/50 dark:bg-white/[0.01] m-2">
                        <FiInbox size={32} strokeWidth={1} className="mb-3 opacity-20" />
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-50">Empty Lane</p>
                    </div>
                )}
            </div>

            {user?.role !== 'Employee' && (
                <div className="p-4 pt-0">
                    <button onClick={onAddTask} className="w-full py-4 rounded-2xl border border-dashed border-slate-300 dark:border-white/10 text-slate-500 hover:text-primary hover:border-primary/40 hover:bg-white dark:hover:bg-white/5 text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 group/btn">
                        <FiPlus className="group-hover/btn:rotate-90 transition-transform" /> Add Task
                    </button>
                </div>
            )}
        </div>
    );
};

const TaskDetailsModal = ({ task, onClose }) => {
    if (!task) return null;
    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-[100] p-6" onClick={onClose}>
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white dark:bg-[#111827] w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-2xl p-10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <span className="px-3 py-1 rounded-lg text-[10px] uppercase font-black tracking-widest bg-primary/10 text-primary border border-primary/20">{task.priority}</span>
                            <span className="text-slate-400 text-xs font-medium">#{task._id.slice(-6).toUpperCase()}</span>
                        </div>
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white leading-tight">{task.title}</h2>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><FiX size={24} /></button>
                </div>

                <div className="space-y-10">
                    <section>
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Task Definition</h3>
                        <div className="bg-slate-50 dark:bg-black/20 rounded-3xl p-6 text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-white/5 whitespace-pre-wrap">{task.description || "No formal description provided."}</div>
                    </section>

                    <div className="grid grid-cols-2 gap-10">
                        <section>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Primary Assignee</h3>
                            {task.assignedTo ? (
                                <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                    <div className="w-10 h-10 rounded-xl bg-primary text-white flex items-center justify-center font-black">{task.assignedTo.name?.charAt(0)}</div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{task.assignedTo.name}</p>
                                        <p className="text-[10px] text-slate-500 font-medium truncate">{task.assignedTo.email}</p>
                                    </div>
                                </div>
                            ) : <p className="text-sm text-slate-500 italic">Unassigned</p>}
                        </section>

                        <section>
                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Timeline</h3>
                            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center"><FiCalendar size={20} /></div>
                                <div>
                                    <p className="text-sm font-bold text-slate-900 dark:text-white">{task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {month:'long', day:'numeric'}) : 'No Deadline'}</p>
                                    <p className="text-[10px] text-slate-500 font-medium">Due Date</p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-slate-100 dark:border-white/5 flex justify-end">
                    <button onClick={onClose} className="px-10 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-black uppercase text-xs tracking-widest hover:scale-105 transition-all shadow-xl">Close Task</button>
                </div>
            </motion.div>
        </motion.div>
    );
};

const ProjectDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [activeId, setActiveId] = useState(null);
    const [selectedTask, setSelectedTask] = useState(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');
    const [newTaskDate, setNewTaskDate] = useState('');
    const [newTaskTime, setNewTaskTime] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [viewMode, setViewMode] = useState('board');
    const [selectedAssignees, setSelectedAssignees] = useState([]);
    const [showProjectDeleteModal, setShowProjectDeleteModal] = useState(false);
    const [showProjectInfo, setShowProjectInfo] = useState(false);
    const [showAnalytics, setShowAnalytics] = useState(false);
    const [aiInsight, setAiInsight] = useState('');
    const [aiLoading, setAiLoading] = useState(false);
    const [showAIModal, setShowAIModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [manualProgress, setManualProgress] = useState(0);
    const [isSavingProgress, setIsSavingProgress] = useState(false);
    const [suggestedProgress, setSuggestedProgress] = useState(0);

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }), useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }));

    const fetchProjectData = async () => {
        try {
            const [projRes, tasksRes] = await Promise.all([api.get(`/projects/${id}`), api.get(`/tasks/project/${id}`)]);
            setProject(projRes.data);
            setManualProgress(projRes.data.manualProgress || 0);
            setTasks(tasksRes.data.sort((a, b) => (a.order || 0) - (b.order || 0)));
        } catch (error) { console.error(error); } finally { setLoading(false); }
    };

    useEffect(() => {
        fetchProjectData();
        socket.connect();
        socket.emit("join_project", id);
        socket.on("project_updated", (updated) => { if (updated._id === id) { setProject(updated); setManualProgress(updated.manualProgress || 0); } });
        socket.on("task_created", (newTask) => { if (newTask.project === id) setTasks(prev => prev.some(t => t._id === newTask._id) ? prev : [...prev, newTask].sort((a, b) => (a.order || 0) - (b.order || 0))); });
        socket.on("task_updated", (updated) => setTasks(prev => prev.map(t => t._id === updated._id ? updated : t)));
        socket.on("task_deleted", (taskId) => setTasks(prev => prev.filter(t => t._id !== taskId)));
        socket.on("tasks_reordered", (updates) => {
            setTasks(prev => {
                const newTasks = prev.map(t => {
                    const update = updates.find(u => u._id === t._id);
                    return update ? { ...t, order: update.order, status: update.status } : t;
                });
                return newTasks.sort((a, b) => (a.order || 0) - (b.order || 0));
            });
        });
        return () => { socket.disconnect(); };
    }, [id]);

    const handleUpdateStatus = async (taskId, newStatus) => {
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: newStatus } : t));
        try { await api.patch(`/tasks/${taskId}/status`, { status: newStatus }); } catch (error) { console.error(error); }
    };

    const handleDeleteTask = (taskId) => { setTaskToDelete(taskId); setShowDeleteModal(true); };
    const confirmDeleteTask = async () => {
        if (!taskToDelete) return;
        const tid = taskToDelete;
        setShowDeleteModal(false);
        setTaskToDelete(null);
        setTasks(prev => prev.filter(t => t._id !== tid));
        try { await api.delete(`/tasks/${tid}`); } catch (e) { console.error(e); }
    };

    const handleCreateTask = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            let combinedDate = undefined;
            if (newTaskDate) combinedDate = new Date(`${newTaskDate}T${newTaskTime || '09:00'}`);
            const payload = {
                title: newTaskTitle, description: newTaskDesc, priority: newTaskPriority,
                status: 'to-do', project: id, order: tasks.filter(t => t.status === 'to-do').length,
                assignedTo: selectedAssignees[0] || (user?._id || null), dueDate: combinedDate
            };
            const { data } = await api.post('/tasks', payload);
            setTasks(prev => prev.some(t => t._id === data._id) ? prev : [...prev, data]);
            setShowTaskModal(false);
            setNewTaskTitle(''); setNewTaskDesc(''); setNewTaskDate(''); setSelectedAssignees([]);
        } catch (error) { alert(error.response?.data?.message || "Check inputs"); } finally { setIsSubmitting(false); }
    };

    const handleAIAnalyze = async () => {
        if (!newTaskDesc) return;
        setAiLoading(true);
        try {
            const { data } = await api.post('/ai/chat', { 
                messages: [{ sender: 'user', text: `Optimize this task description to be clear and professional: ${newTaskDesc}` }],
                projectContext: { name: project.name, description: project.description }
            });
            if (data.reply) { setAiInsight(data.reply); setShowAIModal(true); }
        } catch (e) { console.error(e); } finally { setAiLoading(false); }
    };

    const handleAcceptAI = () => {
        const cleanInsight = aiInsight.replace(/\*\*/g, '');
        setNewTaskDesc(cleanInsight);
        setShowAIModal(false);
    };

    const handleUpdateProjectStatus = async (newStatus) => {
        try {
            const { data } = await api.put(`/projects/${id}`, { status: newStatus });
            setProject(data);
        } catch (e) { console.error(e); }
    };

    const handleDeleteProject = async () => {
        try { await api.delete(`/projects/${id}`); navigate('/'); } catch (e) { console.error(e); }
    };

    const toggleProgressMode = async () => {
        const newMode = project.progressMode === 'Auto' ? 'Manual' : 'Auto';
        try {
            const { data } = await api.patch(`/projects/${id}/progress-config`, { progressMode: newMode });
            setProject(data);
        } catch (err) { console.error(err); }
    };

    const saveManualProgress = async () => {
        setIsSavingProgress(true);
        try {
            const { data } = await api.patch(`/projects/${id}/progress-manual`, { progress: manualProgress });
            setProject(data);
        } catch (err) { console.error(err); } finally { setIsSavingProgress(false); }
    };

    const submitProgressSuggestion = async () => {
        try {
            await api.post(`/projects/${id}/suggest-progress`, { suggestedPercent: suggestedProgress });
            alert("Progress suggestion sent to PM!");
        } catch (err) { console.error(err); }
    };

    const handleSuggestion = async (suggestionId, status) => {
        try {
            const { data } = await api.patch(`/projects/${id}/handle-suggestion`, { suggestionId, status });
            setProject(data);
            setManualProgress(data.manualProgress);
        } catch (err) { console.error(err); }
    };

    const handleDragStart = (event) => setActiveId(event.active.id);
    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);
        if (!over) return;
        const activeTask = tasks.find(t => t._id === active.id);
        if (!activeTask) return;

        let newStatus = activeTask.status;
        let newTasks = [...tasks];
        if (over.id.startsWith('col-')) {
            const statusMap = { 'col-to-do': 'to-do', 'col-running': 'running', 'col-completed': 'completed' };
            newStatus = statusMap[over.id];
            newTasks = newTasks.map(t => t._id === active.id ? { ...t, status: newStatus } : t);
        } else {
            const overTask = tasks.find(t => t._id === over.id);
            if (overTask) {
                newStatus = overTask.status;
                newTasks = arrayMove(tasks, tasks.findIndex(t => t._id === active.id), tasks.findIndex(t => t._id === over.id));
                newTasks = newTasks.map(t => t._id === active.id ? { ...t, status: newStatus } : t);
            }
        }
        const updates = newTasks.map((t, i) => ({ ...t, order: i }));
        setTasks(updates);
        try { await api.put('/tasks/reorder', { tasks: updates.map(u => ({ _id: u._id, status: u.status, order: u.order })), projectId: id }); } catch (e) {}
    };

    if (loading) return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Accessing Secure Workspace...</p>
            </div>
        </div>
    );
    
    if (!project) return <div className="p-10 text-center text-white bg-[#050505] h-screen flex items-center justify-center">Project not found</div>;

    const columns = [{ id: 'to-do', label: 'To Do' }, { id: 'running', label: 'In Progress' }, { id: 'completed', label: 'Done' }];
    const totalTasksCount = tasks.length;
    const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
    const progressPercentage = project.progressMode === 'Manual' ? project.manualProgress : (totalTasksCount === 0 ? 0 : Math.round((completedTasksCount / totalTasksCount) * 100));

    return (
        <div className="flex h-screen bg-slate-50 dark:bg-[#050505] text-slate-900 dark:text-white overflow-hidden transition-colors duration-500 relative font-sans">
            
            <aside className="w-24 bg-white/50 dark:bg-[#0f172a]/40 backdrop-blur-xl border-r border-slate-200 dark:border-white/5 flex flex-col items-center py-10 z-20">
                <Link to="/" className="w-12 h-12 bg-white dark:bg-[#1e293b] rounded-2xl flex items-center justify-center mb-12 hover:bg-primary hover:text-white text-slate-500 dark:text-slate-400 transition-all shadow-xl shadow-black/10 hover:shadow-primary/30 group">
                    <FiArrowLeft size={20} />
                </Link>
                <div className="space-y-10 w-full flex flex-col items-center">
                    <div onClick={() => { setViewMode('board'); setShowAnalytics(false); }} className={`p-4 rounded-2xl cursor-pointer transition-all relative group ${viewMode === 'board' && !showAnalytics ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                        <FiLayout size={24} />
                    </div>
                    <div onClick={() => { setViewMode('list'); setShowAnalytics(false); }} className={`p-4 rounded-2xl cursor-pointer transition-all relative group ${viewMode === 'list' && !showAnalytics ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                        <FiList size={24} />
                    </div>
                    <div onClick={() => setShowAnalytics(true)} className={`p-4 rounded-2xl cursor-pointer transition-all relative group ${showAnalytics ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10'}`}>
                        <FiPieChart size={24} />
                    </div>
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden relative">
                
                <AnimatePresence>
                    {(user?.role === 'CTO' || user?.role === 'PM') && project.progressSuggestions?.filter(s => s.status === 'pending').map(s => (
                        <motion.div initial={{ y: -50 }} animate={{ y: 0 }} exit={{ y: -50 }} key={s._id} className="bg-primary text-white px-10 py-4 flex items-center justify-between z-50 shadow-2xl">
                            <div className="flex items-center gap-4">
                                <FiAlertCircle size={20} className="animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-widest">Update Request: <b>{s.userId?.name}</b> proposed <b>{s.suggestedPercent}%</b> completion</span>
                            </div>
                            <div className="flex gap-4">
                                <button onClick={() => handleSuggestion(s._id, 'approved')} className="px-6 py-2 bg-white text-primary rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-500 hover:text-white transition-all shadow-lg">Approve</button>
                                <button onClick={() => handleSuggestion(s._id, 'rejected')} className="px-6 py-2 bg-black/20 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-rose-500 transition-all">Dismiss</button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                <header className="px-12 py-8 bg-white/50 dark:bg-[#050505]/60 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 z-10">
                    <div className="max-w-screen-2xl mx-auto flex flex-col xl:flex-row justify-between items-start xl:items-center gap-10">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-3">
                                <Link to="/" className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-primary transition-colors">Workspace</Link>
                                <FiChevronRight className="text-slate-600" />
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary truncate">{project.name}</span>
                            </div>
                            <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter flex items-center gap-6">
                                {project.name}
                                <span className={`text-[9px] font-black uppercase tracking-[0.3em] px-4 py-1.5 rounded-full border ${project.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 animate-pulse'}`}>
                                    {project.status}
                                </span>
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-10">
                             <div className="flex items-center gap-10 px-8 py-4 bg-white dark:bg-[#0f172a]/60 border border-slate-200 dark:border-white/5 rounded-[2rem] shadow-xl shadow-black/5">
                                <div className="flex flex-col items-center gap-2">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">Lifecycle</p>
                                    <div className="flex items-center gap-4">
                                        <p className={`text-2xl font-black ${project.progressMode === 'Manual' ? 'text-primary' : 'text-emerald-500'}`}>{progressPercentage}%</p>
                                        {(user?.role === 'CTO' || user?.role === 'PM') && (
                                            <button onClick={toggleProgressMode} className="text-slate-400 hover:text-primary transition-colors flex items-center gap-1.5 bg-slate-100 dark:bg-white/5 px-2 py-0.5 rounded-full"><span className="text-[8px] font-black uppercase">{project.progressMode}</span><FiSettings size={10} /></button>
                                        )}
                                    </div>
                                </div>
                                
                                {project.progressMode === 'Manual' && (
                                    <div className="flex items-center gap-6">
                                        <div className="w-[1px] h-10 bg-slate-200 dark:bg-white/10"></div>
                                        {(user?.role === 'CTO' || user?.role === 'PM' || user?.role === 'TeamLead') ? (
                                            <div className="flex items-center gap-4 group">
                                                <input type="range" min="0" max="100" value={manualProgress} onChange={(e) => setManualProgress(parseInt(e.target.value))} className="w-40 accent-primary cursor-ew-resize" />
                                                <button onClick={saveManualProgress} disabled={isSavingProgress} className="w-10 h-10 bg-primary text-white rounded-xl hover:scale-110 active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-primary/20">
                                                    {isSavingProgress ? <FiLoader className="animate-spin" /> : <FiCheck />}
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-4">
                                                <input type="range" min="0" max="100" value={suggestedProgress} onChange={(e) => setSuggestedProgress(parseInt(e.target.value))} className="w-32 accent-indigo-500" />
                                                <button onClick={submitProgressSuggestion} className="px-5 py-2 bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest rounded-xl hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-500/20">Propose</button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-4">
                                {(user?.role === 'CTO' || user?.role === 'PM') && (
                                    <button onClick={() => setShowProjectDeleteModal(true)} className="w-12 h-12 rounded-2xl border border-rose-500/20 text-rose-500 hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center shadow-lg shadow-rose-500/5"><FiTrash2 size={20} /></button>
                                )}
                                {user?.role !== 'Employee' && (
                                    <button onClick={() => setShowTaskModal(true)} className="px-8 py-4 bg-primary hover:bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/30 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"><FiPlus size={18} /> New Task</button>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-hidden relative bg-slate-50 dark:bg-[#0a0f1c]">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_40%)] pointer-events-none"></div>
                    
                    {showAnalytics ? (
                        <ProjectAnalytics tasks={tasks} project={project} />
                    ) : viewMode === 'board' ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                            <div className="flex h-full p-10 gap-10 overflow-x-auto custom-scrollbar relative z-10">
                                {columns.map(col => <DroppableColumn key={col.id} column={col} tasks={tasks} user={user} onUpdateStatus={handleUpdateStatus} onDelete={handleDeleteTask} onAddTask={() => setShowTaskModal(true)} onViewDetails={setSelectedTask} />)}
                            </div>
                            <DragOverlay dropAnimation={null}>
                                {activeId ? <TaskCard task={tasks.find(t => t._id === activeId)} user={user} /> : null}
                            </DragOverlay>
                        </DndContext>
                    ) : (
                        <div className="p-12 overflow-y-auto h-full custom-scrollbar relative z-10">
                            <div className="max-w-6xl mx-auto space-y-4">
                                {tasks.map((task, i) => (
                                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} key={task._id} onClick={() => setSelectedTask(task)} className="bg-white dark:bg-[#111827] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 flex items-center gap-8 hover:shadow-2xl transition-all cursor-pointer group hover:border-primary/40 hover:-translate-x-1">
                                        <div className={`w-3 h-3 rounded-full ${task.status === 'completed' ? 'bg-emerald-500' : task.status === 'running' ? 'bg-primary' : 'bg-slate-400'} shadow-lg`}></div>
                                        <div className="flex-1 min-w-0"><h4 className="font-black text-lg text-slate-900 dark:text-white group-hover:text-primary transition-colors tracking-tight">{task.title}</h4><p className="text-xs text-slate-500 font-medium truncate uppercase tracking-widest mt-1">Priority: {task.priority}</p></div>
                                        <FiArrowRight className="text-slate-300 group-hover:text-primary group-hover:translate-x-2 transition-all" size={24} />
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                </main>

                <AnimatePresence>
                    {showTaskModal && (
                        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[150] p-6" onClick={() => setShowTaskModal(false)}>
                            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white dark:bg-[#0f172a] p-12 rounded-[3rem] border border-slate-200 dark:border-white/10 w-full max-w-xl max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl relative" onClick={e => e.stopPropagation()}>
                                <h3 className="text-4xl font-black mb-10 text-slate-900 dark:text-white tracking-tighter">Draft Milestone</h3>
                                <form onSubmit={handleCreateTask} className="space-y-8">
                                    <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">Task Title</label><input type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none transition-all font-bold" required /></div>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">Technical Context</label><button type="button" onClick={handleAIAnalyze} disabled={aiLoading} className="text-[9px] px-4 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all font-black uppercase tracking-widest">{aiLoading ? 'Synthesizing...' : '✨ Intelligence'}</button></div>
                                        <textarea value={newTaskDesc} onChange={e => setNewTaskDesc(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-3xl p-5 text-slate-900 dark:text-white h-40 resize-none focus:ring-2 focus:ring-primary outline-none transition-all font-medium leading-relaxed" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">Urgency</label><select value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none"><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="urgent">Urgent</option></select></div>
                                        <div className="space-y-3"><label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">Due Date</label><input type="date" value={newTaskDate} onChange={e => setNewTaskDate(e.target.value)} className="w-full bg-slate-50 dark:bg-black/40 border border-slate-200 dark:border-white/5 rounded-2xl p-4 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary outline-none" /></div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] block">Owner Assignment</label>
                                        <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto custom-scrollbar p-1">
                                            {[project.ownerId, ...(project.assignedLeads || []), ...(project.assignedEmployees || [])].filter(Boolean).filter((v, i, a) => a.findIndex(t => (t._id || t) === (v._id || v)) === i).map(m => (
                                                <div key={m._id || m} onClick={() => setSelectedAssignees([m._id || m])} className={`p-4 rounded-[1.5rem] cursor-pointer transition-all flex items-center gap-3 border-2 ${selectedAssignees[0] === (m._id || m) ? 'bg-primary/5 border-primary text-primary scale-105' : 'bg-slate-50 dark:bg-white/[0.02] border-transparent text-slate-500'}`}><div className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-[10px] ${selectedAssignees[0] === (m._id || m) ? 'bg-primary text-white' : 'bg-slate-200 dark:bg-slate-800'}`}>{m.name?.charAt(0)}</div><span className="text-[10px] font-black uppercase tracking-tight truncate">{m.name}</span></div>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between gap-6 pt-10 border-t border-slate-100 dark:border-white/5"><button type="button" onClick={() => setShowTaskModal(false)} className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">Cancel</button><button type="submit" disabled={isSubmitting} className="px-12 py-5 bg-primary hover:bg-indigo-600 text-white rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.3em] shadow-2xl shadow-primary/40 transition-all active:scale-95">{isSubmitting ? 'Syncing...' : 'Deploy Task'}</button></div>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                <AnimatePresence>{selectedTask && <TaskDetailsModal task={selectedTask} onClose={() => setSelectedTask(null)} />}</AnimatePresence>
                <AnimatePresence>{showProjectDeleteModal && (
                    <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-[200] p-4" onClick={() => setShowProjectDeleteModal(false)}>
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white dark:bg-[#111827] p-12 rounded-[3rem] border border-rose-500/20 max-w-sm text-center shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-8 text-4xl">⚠️</div>
                            <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter mb-3">Terminate?</h3>
                            <p className="text-slate-500 text-sm font-medium mb-10 leading-relaxed">This project and all associated task history will be permanently wiped from the workspace.</p>
                            <div className="flex flex-col gap-4"><button onClick={handleDeleteProject} className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-rose-600/20 hover:bg-rose-700 transition-all">Destroy Data</button><button onClick={() => setShowProjectDeleteModal(false)} className="w-full py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Abort</button></div>
                        </motion.div>
                    </div>
                )}</AnimatePresence>
            </div>
        </div>
    );
};

export default ProjectDetails;