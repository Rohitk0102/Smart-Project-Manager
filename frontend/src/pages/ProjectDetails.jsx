import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import { DndContext, closestCenter, DragOverlay, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, arrayMove, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskCard = ({ task, onDelete, onUpdateStatus, style, innerRef, ...props }) => {
    return (
        <div
            ref={innerRef}
            style={style}
            {...props}
            className="group bg-dark-card p-4 rounded-xl border border-slate-700/50 mb-3 shadow-sm hover:shadow-lg hover:border-primary/50 cursor-grab active:cursor-grabbing transform transition-all hover:-translate-y-0.5 relative"
        >
            <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide ${(task.priority || 'low').toLowerCase() === 'high' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                    (task.priority || 'low').toLowerCase() === 'medium' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' :
                        'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                    {task.priority || 'Low'}
                </span>
                <button
                    type="button"
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={(e) => { e.stopPropagation(); onDelete(task._id); }}
                    className="text-slate-600 hover:text-red-500 transition-colors"
                    title="Abort Task"
                >
                    🗑️
                </button>
            </div>

            <h4 className="font-semibold text-white mb-1.5 leading-tight">{task.title}</h4>
            {task.description && (
                <p className="text-xs text-slate-400 mb-4 line-clamp-2">{task.description}</p>
            )}

            <div className="flex gap-2 mb-3">
                {task.status === 'todo' && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(task._id, 'in_progress'); }}
                        className="flex-1 py-1.5 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 text-xs font-semibold rounded border border-indigo-500/30 transition-colors"
                    >
                        ▶ Start
                    </button>
                )}
                {task.status !== 'done' && (
                    <button
                        onPointerDown={(e) => e.stopPropagation()}
                        onClick={(e) => { e.stopPropagation(); onUpdateStatus(task._id, 'done'); }}
                        className="flex-1 py-1.5 bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs font-semibold rounded border border-green-500/30 transition-colors"
                    >
                        ✓ Complete
                    </button>
                )}
            </div>

            <div className="flex justify-between items-center text-xs pt-3 border-t border-slate-800/50">
                <div className="flex items-center text-slate-500 gap-1">
                    <span>📅</span>
                    <span>
                        {task.dueDate
                            ? new Date(task.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : 'No Date'
                        }
                    </span>
                </div>
                {task.assignees && task.assignees.length > 0 && (
                    <div className="flex -space-x-1.5">
                        {task.assignees.map((a, i) => (
                            <div key={i} className="w-6 h-6 rounded-full bg-slate-700 border-2 border-dark-card flex items-center justify-center text-[9px] font-bold text-white shadow-sm" title={a.name}>
                                {a.name.charAt(0)}
                            </div>
                        ))}
                    </div>
                )}
                {(!task.assignees || task.assignees.length === 0) && (
                    <div className="w-6 h-6 rounded-full bg-slate-800 border-2 border-transparent border-dashed flex items-center justify-center text-slate-600 text-[10px]">
                        +
                    </div>
                )}
            </div>
        </div>
    );
};

const SortableTask = (props) => {
    const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: props.task._id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <TaskCard
            innerRef={setNodeRef}
            style={style}
            {...attributes}
            {...listeners}
            {...props}
        />
    );
};

const DroppableColumn = ({ column, tasks, onUpdateStatus, onDelete, onAddTask }) => {
    const { setNodeRef } = useDroppable({
        id: `col-${column.id}`,
    });

    const columnTasks = tasks.filter(t => t.status === column.id);

    return (
        <div ref={setNodeRef} className="w-80 flex flex-col h-full group/col">
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.id === 'todo' ? 'bg-slate-400' :
                        column.id === 'in_progress' ? 'bg-indigo-400' : 'bg-green-400'
                        }`}></div>
                    <h3 className="font-bold text-slate-300 uppercase text-xs tracking-wider">{column.label}</h3>
                    <span className="bg-slate-800 text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {columnTasks.length}
                    </span>
                </div>
                <div className="text-slate-600 hover:text-slate-400 cursor-pointer text-lg">...</div>
            </div>

            <div className="flex-1 bg-slate-900/30 rounded-2xl border-2 border-dashed border-slate-800/50 p-3 overflow-y-auto hover:bg-slate-900/50 hover:border-slate-700/50 transition-colors">
                <SortableContext
                    items={columnTasks.map(t => t._id)}
                    strategy={verticalListSortingStrategy}
                >
                    {columnTasks.map(task => (
                        <SortableTask
                            key={task._id}
                            task={task}
                            onUpdateStatus={onUpdateStatus}
                            onDelete={onDelete}
                        />
                    ))}
                </SortableContext>

                {columnTasks.length === 0 && (
                    <div className="h-24 flex items-center justify-center text-slate-600 text-sm italic opacity-50">
                        No tasks in {column.label}
                    </div>
                )}

                <button
                    onClick={onAddTask}
                    className="w-full py-2 mt-2 text-slate-500 hover:text-primary hover:bg-slate-800 rounded-lg text-sm transition-colors flex items-center justify-center opacity-0 group-hover/col:opacity-100"
                >
                    + New Task
                </button>
            </div>
        </div>
    );
};

const ProjectDetails = () => {
    const { id } = useParams();
    const [project, setProject] = useState(null);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showTaskModal, setShowTaskModal] = useState(false);
    const [activeId, setActiveId] = useState(null);

    // New Task State
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDesc, setNewTaskDesc] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('medium');
    const [newTaskDueDate, setNewTaskDueDate] = useState('');
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const fetchProjectData = async () => {
        try {
            const [projRes, tasksRes] = await Promise.all([
                api.get(`/projects/${id}`),
                api.get(`/tasks/project/${id}`)
            ]);
            setProject(projRes.data);
            // Sort tasks by order
            const sortedTasks = tasksRes.data.sort((a, b) => (a.order || 0) - (b.order || 0));
            setTasks(sortedTasks);
        } catch (error) {
            console.error("Failed to load project data", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProjectData();
    }, [id]);

    const handleUpdateStatus = async (taskId, newStatus) => {
        // Optimistic UI Update
        setTasks(prevTasks => prevTasks.map(t =>
            t._id === taskId ? { ...t, status: newStatus } : t
        ));

        try {
            await api.put(`/tasks/${taskId}`, { status: newStatus });
        } catch (error) {
            console.error("Failed to update status", error);
            // Revert on error could be implemented here
        }
    };

    const handleDeleteTask = (taskId) => {
        setTaskToDelete(taskId);
        setShowDeleteModal(true);
    };

    const confirmDeleteTask = async () => {
        if (!taskToDelete) return;
        const taskId = taskToDelete;
        setShowDeleteModal(false);
        setTaskToDelete(null);

        // Optimistic UI Update
        setTasks(prevTasks => prevTasks.filter(t => t._id !== taskId));

        try {
            await api.delete(`/tasks/${taskId}`);
        } catch (error) {
            console.error("Failed to delete task", error);
        }
    };

    const { user } = useAuth();
    const handleCreateTask = async (e) => {
        e.preventDefault();
        try {
            const newTask = {
                title: newTaskTitle,
                description: newTaskDesc,
                priority: newTaskPriority,
                status: 'todo',
                project: id,
                order: tasks.filter(t => t.status === 'todo').length,
                assignees: [user?._id],
                dueDate: newTaskDueDate
            };
            const { data } = await api.post('/tasks', newTask);
            setTasks(prevTasks => [...prevTasks, data]);
            setShowTaskModal(false);
            setNewTaskTitle('');
            setNewTaskDesc('');
            setNewTaskPriority('Medium');
            setNewTaskDueDate('');
        } catch (error) {
            console.error("Failed to create task", error);
        }
    };

    const handleAIAnalyze = async () => {
        if (!newTaskDesc) return;
        try {
            const { data } = await api.post('/tasks/analyze', { description: newTaskDesc });
            if (data.insight) {
                setNewTaskDesc(newTaskDesc + '\n\n✨ AI Insight:\n' + data.insight);
            }
        } catch (error) {
            console.error("AI Analysis Failed", error);
            alert("Failed to get AI insight. Is the AI Service running?");
        }
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragOver = (event) => {
        const { active, over } = event;
        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        if (activeId === overId) return;

        const activeTask = tasks.find(t => t._id === activeId);
        const overTask = tasks.find(t => t._id === overId);

        if (!activeTask) return;

        // Dropping over a column
        if (overId.startsWith('col-')) {
            const statusMap = {
                'col-todo': 'todo',
                'col-in_progress': 'in_progress',
                'col-done': 'done'
            };
            const newStatus = statusMap[overId];

            if (activeTask.status !== newStatus) {
                setTasks((items) => {
                    const activeIndex = items.findIndex((t) => t._id === activeId);
                    const newItems = [...items];
                    newItems[activeIndex] = { ...items[activeIndex], status: newStatus };
                    return newItems;
                });
            }
            return;
        }

        // Dropping over another task
        if (overTask && activeTask.status !== overTask.status) {
            setTasks((items) => {
                const activeIndex = items.findIndex((t) => t._id === activeId);
                const overIndex = items.findIndex((t) => t._id === overId);

                // Only if different status
                if (items[activeIndex].status !== items[overIndex].status) {
                    const newItems = [...items];
                    newItems[activeIndex] = { ...items[activeIndex], status: items[overIndex].status };
                    return arrayMove(newItems, activeIndex, overIndex - 1);
                }
                return items;
            });
        }
    };

    const handleDragEnd = async (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const activeId = active.id;
        const overId = over.id;

        const activeTask = tasks.find(t => t._id === activeId);
        if (!activeTask) return;

        let newStatus = activeTask.status;

        // Calculate new Tasks array
        let newTasks = [...tasks];

        if (overId.startsWith('col-')) {
            const statusMap = {
                'col-todo': 'todo',
                'col-in_progress': 'in_progress',
                'col-done': 'done'
            };
            newStatus = statusMap[overId];
            if (activeTask.status !== newStatus) {
                newTasks = newTasks.map(t => t._id === activeId ? { ...t, status: newStatus } : t);
            }
        } else {
            const overTask = tasks.find(t => t._id === overId);
            if (overTask) {
                newStatus = overTask.status;
                const oldIndex = tasks.findIndex(t => t._id === activeId);
                const newIndexRaw = tasks.findIndex(t => t._id === overId);
                newTasks = arrayMove(tasks, oldIndex, newIndexRaw);
                newTasks = newTasks.map(t => t._id === activeId ? { ...t, status: newStatus } : t);
            }
        }

        const reorderedTasks = newTasks.map((t, index) => ({
            ...t,
            order: index
        }));

        setTasks(reorderedTasks);

        const updates = reorderedTasks.map(t => ({
            _id: t._id,
            status: t.status,
            order: t.order
        }));

        try {
            await api.put('/tasks/reorder', { tasks: updates });
        } catch (error) {
            console.error("Failed to save order", error);
        }
    };

    if (loading) return <div className="p-10 text-center text-white">Loading Project...</div>;
    if (!project) return <div className="p-10 text-center text-white">Project not found</div>;

    const columns = [
        { id: 'todo', label: 'To Do' },
        { id: 'in_progress', label: 'In Progress' },
        { id: 'done', label: 'Done' }
    ];

    const activeTask = activeId ? tasks.find(t => t._id === activeId) : null;

    return (
        <div className="flex h-screen bg-dark-bg text-white overflow-hidden">
            {/* Sidebar (Collapsed style for focus) */}
            <aside className="w-20 bg-dark-card border-r border-slate-800 flex flex-col items-center py-6 z-20">
                <Link to="/" className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center mb-8 hover:bg-slate-700 hover:text-white text-slate-400 transition-all border border-slate-700 hover:border-slate-600 shadow-sm">
                    <span className="text-xl">←</span>
                </Link>
                <div className="space-y-4 w-full flex flex-col items-center">
                    {['Board', 'List', 'Timeline'].map((item, i) => (
                        <div key={item} className={`p-2 rounded-lg cursor-pointer transition-all ${i === 0 ? 'bg-primary/20 text-primary' : 'text-slate-500 hover:text-slate-300'}`} title={item}>
                            <div className="w-6 h-6 rounded bg-current opacity-50"></div>
                        </div>
                    ))}
                </div>
            </aside>

            <div className="flex-1 flex flex-col overflow-hidden">
                <main className="flex-1 flex flex-col overflow-hidden bg-[#0a0f1c] relative">
                    {/* Background decoration */}
                    <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-slate-900 to-transparent pointer-events-none"></div>

                    <header className="h-20 border-b border-slate-800/50 flex items-center justify-between px-8 bg-dark-bg/80 backdrop-blur-md z-10">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-2xl shadow-lg shadow-blue-500/20">
                                📝
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{project.name}</h2>
                                <p className="text-xs text-slate-400 max-w-md truncate">{project.description}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="flex -space-x-2 mr-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-slate-700 border-2 border-dark-card"></div>
                                ))}
                            </div>
                            <button
                                onClick={() => setShowTaskModal(true)}
                                className="px-5 py-2.5 bg-primary hover:bg-indigo-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                            >
                                <span>+</span> Add Task
                            </button>
                        </div>
                    </header>

                    <DndContext collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                        <div className="flex-1 p-8 overflow-x-auto">
                            <div className="flex space-x-8 h-full min-w-max">
                                {columns.map(col => (
                                    <DroppableColumn
                                        key={col.id}
                                        column={col}
                                        tasks={tasks}
                                        onUpdateStatus={handleUpdateStatus}
                                        onDelete={handleDeleteTask}
                                        onAddTask={() => setShowTaskModal(true)}
                                    />
                                ))}
                            </div>
                        </div>
                        <DragOverlay>
                            {activeTask ? (
                                <TaskCard
                                    task={activeTask}
                                    onDelete={handleDeleteTask}
                                    onUpdateStatus={handleUpdateStatus}
                                    style={{ transform: 'rotate(2deg) scale(1.02)' }}
                                />
                            ) : null}
                        </DragOverlay>
                    </DndContext>
                </main>

                {/* Delete Confirmation Modal */}
                {showDeleteModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-dark-card p-6 rounded-xl border border-slate-700 w-full max-w-sm">
                            <h3 className="text-lg font-bold mb-2 text-white">Delete Task?</h3>
                            <p className="text-slate-400 mb-6 text-sm">Are you sure you want to delete this task? This action cannot be undone.</p>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowDeleteModal(false)}
                                    className="px-4 py-2 text-slate-400 hover:text-white text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={confirmDeleteTask}
                                    className="px-4 py-2 bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 rounded text-sm font-semibold transition-colors"
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Add Task Modal */}
                {showTaskModal && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
                        <div className="bg-dark-card p-6 rounded-xl border border-slate-700 w-full max-w-md">
                            <h3 className="text-xl font-bold mb-4">Add New Task</h3>
                            <form onSubmit={handleCreateTask} className="space-y-4">
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Task Title</label>
                                    <input
                                        type="text"
                                        value={newTaskTitle}
                                        onChange={e => setNewTaskTitle(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Description</label>
                                    <div className="relative">
                                        <textarea
                                            value={newTaskDesc}
                                            onChange={e => setNewTaskDesc(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none h-24 resize-none"
                                        />
                                        <button
                                            type="button"
                                            onClick={handleAIAnalyze}
                                            className="absolute bottom-2 right-2 bg-indigo-500/20 text-indigo-300 text-xs px-2 py-1 rounded hover:bg-indigo-500/30 border border-indigo-500/30 flex items-center gap-1"
                                        >
                                            ✨ AI Analyze
                                        </button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Due Date</label>
                                    <div className="relative">
                                        <input
                                            type="datetime-local"
                                            value={newTaskDueDate}
                                            onChange={e => setNewTaskDueDate(e.target.value)}
                                            className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm text-slate-400 mb-1">Priority</label>
                                    <select
                                        value={newTaskPriority}
                                        onChange={e => setNewTaskPriority(e.target.value)}
                                        className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:border-primary focus:outline-none"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setShowTaskModal(false)}
                                        className="px-4 py-2 text-slate-400 hover:text-white"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-primary rounded hover:bg-indigo-600 font-semibold"
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProjectDetails;
