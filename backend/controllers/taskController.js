const Task = require('../models/Task');
const Project = require('../models/Project');
const axios = require('axios');
const { getIO } = require('../socket');

// Helper to check authorization for Task mutations (Create/Update/Delete)
const canMutateTaskInProject = async (user, projectId) => {
    if (user.role === 'CTO') return true;
    const project = await Project.findById(projectId);
    if (!project) return false;
    
    const isOwner = project.ownerId && project.ownerId.toString() === user._id.toString();
    const isLead = project.assignedLeads && project.assignedLeads.some(id => id.toString() === user._id.toString());
    
    return isOwner || isLead;
};

// @desc    Analyze task description using AI Service
// @route   POST /api/tasks/analyze
// @access  Private
const analyzeTask = async (req, res) => {
    const { description } = req.body;
    try {
        const response = await axios.post('http://localhost:5001/api/analyze', { description });
        res.json(response.data);
    } catch (error) {
        console.error("AI Service Error:", error.message);
        res.status(503).json({ message: 'AI Service unavailable' });
    }
};

// Helper to check and update project completion status
const checkProjectCompletion = async (projectId) => {
    if (!projectId) return;

    try {
        const totalTasks = await Task.countDocuments({ project: projectId });
        const completedTasks = await Task.countDocuments({ project: projectId, status: 'completed' });
        const runningTasks = await Task.countDocuments({ project: projectId, status: 'running' });

        const project = await Project.findById(projectId);
        if (!project) return;

        let statusChanged = false;

        if (project.status === 'completed' && (totalTasks === 0 || totalTasks !== completedTasks)) {
            await Project.findByIdAndUpdate(projectId, { status: 'active' });
            statusChanged = true;
        }

        if (statusChanged) {
            const updatedProject = await Project.findById(projectId)
                .populate('ownerId', 'name email avatar')
                .populate('assignedLeads', 'name email avatar')
                .populate('assignedEmployees', 'name email avatar');

            const weightedProgress = completedTasks + (runningTasks * 0.5);
            const progress = totalTasks === 0 ? 0 : Math.round((weightedProgress / totalTasks) * 100);

            const projectData = {
                ...updatedProject.toObject(),
                progress,
                totalTasks,
                completedTasks,
                inProgressTasks: runningTasks
            };

            const io = getIO();
            io.to(projectId.toString()).emit("project_updated", projectData);
        }
    } catch (error) {
        console.error("Check Project Completion Error:", error);
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private (CTO, PM, TeamLead)
const createTask = async (req, res) => {
    const { title, description, status, priority, project, assignedTo, dueDate } = req.body;

    const isAuthorized = await canMutateTaskInProject(req.user, project);
    if (!isAuthorized) return res.status(403).json({ message: 'Forbidden: You are not authorized to create tasks in this project.' });

    const task = await Task.create({
        title,
        description,
        status: status || 'to-do',
        priority,
        project,
        assignedTo,
        dueDate,
    });

    const { addToGoogleCalendar } = require('../services/googleCalendarService');
    const populatedTask = await Task.findById(task._id).populate('assignedTo', 'name email avatar');

    if (dueDate) {
        await addToGoogleCalendar(req.user._id, task);
    }

    try {
        const io = getIO();
        io.to(project).emit("task_created", populatedTask);
    } catch (error) {
        console.error("Socket emit error:", error);
    }

    await checkProjectCompletion(project);

    res.status(201).json(populatedTask);
};

// @desc    Get tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = async (req, res) => {
    const tasks = await Task.find({ project: req.params.projectId })
        .populate('assignedTo', 'name email avatar');

    res.json(tasks);
};

// @desc    Update task (Full Update)
// @route   PUT /api/tasks/:id
// @access  Private (CTO, PM, TeamLead)
const updateTask = async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAuthorized = await canMutateTaskInProject(req.user, task.project);
    if (!isAuthorized) return res.status(403).json({ message: 'Forbidden: You are not authorized to edit tasks in this project.' });

    task.title = req.body.title || task.title;
    task.description = req.body.description !== undefined ? req.body.description : task.description;
    task.status = req.body.status || task.status;
    task.priority = req.body.priority || task.priority;
    task.assignedTo = req.body.assignedTo !== undefined ? req.body.assignedTo : task.assignedTo;
    task.dueDate = req.body.dueDate || task.dueDate;

    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id).populate('assignedTo', 'name email avatar');

    try {
        const io = getIO();
        io.to(task.project.toString()).emit("task_updated", populatedTask);
    } catch (error) {
        console.error("Socket emit error:", error);
    }

    await checkProjectCompletion(task.project);
    res.json(populatedTask);
};

// @desc    Update task status only
// @route   PATCH /api/tasks/:id/status
// @access  Private (All Roles, Employee checked against assignee)
const updateTaskStatus = async (req, res) => {
    const { status } = req.body;
    if (!['to-do', 'running', 'completed'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    if (req.user.role === 'Employee') {
        if (!task.assignedTo || task.assignedTo.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Forbidden: Employees can only update status of their assigned tasks.' });
        }
    } else {
        // CTO, PM, TeamLead must still pass the project authorization
        const isAuthorized = await canMutateTaskInProject(req.user, task.project);
        if (!isAuthorized) return res.status(403).json({ message: 'Forbidden: Not authorized.' });
    }

    task.status = status;
    const updatedTask = await task.save();
    const populatedTask = await Task.findById(updatedTask._id).populate('assignedTo', 'name email avatar');

    try {
        const io = getIO();
        io.to(task.project.toString()).emit("task_updated", populatedTask);
    } catch (error) {
        console.error("Socket emit error:", error);
    }

    await checkProjectCompletion(task.project);
    res.json(populatedTask);
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private (CTO, PM, TeamLead)
const deleteTask = async (req, res) => {
    const task = await Task.findById(req.params.id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const isAuthorized = await canMutateTaskInProject(req.user, task.project);
    if (!isAuthorized) return res.status(403).json({ message: 'Forbidden: You are not authorized to delete tasks in this project.' });

    const projectId = task.project.toString();
    await task.deleteOne();

    try {
        const io = getIO();
        io.to(projectId).emit("task_deleted", req.params.id);
    } catch (error) {
        console.error("Socket emit error:", error);
    }

    await checkProjectCompletion(projectId);
    res.json({ message: 'Task removed' });
};

// @desc    Reorder tasks
// @route   PUT /api/tasks/reorder
// @access  Private (CTO, PM, TeamLead)
const reorderTasks = async (req, res) => {
    const { tasks, projectId } = req.body; 

    if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    const isAuthorized = await canMutateTaskInProject(req.user, projectId);
    if (!isAuthorized) return res.status(403).json({ message: 'Forbidden: Not authorized.' });

    try {
        const bulkOps = tasks.map(task => ({
            updateOne: {
                filter: { _id: task._id },
                update: { $set: { order: task.order, status: task.status } }
            }
        }));

        await Task.bulkWrite(bulkOps);

        if (projectId) {
            try {
                const io = getIO();
                io.to(projectId).emit("tasks_reordered", tasks);
                await checkProjectCompletion(projectId);
            } catch (error) {
                console.error("Socket emit error:", error);
            }
        }

        res.json({ message: 'Tasks reordered' });
    } catch (error) {
        console.error("Reorder failed", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Get all tasks for the logged in user across all projects
// @route   GET /api/tasks/my-tasks
// @access  Private
const getMyTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ assignedTo: req.user._id })
            .populate('project', 'name description status') 
            .populate('assignedTo', 'name email avatar')
            .sort({ dueDate: 1 }); 
        res.json(tasks);
    } catch (error) {
        console.error("Failed to fetch user tasks", error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = {
    createTask,
    getTasksByProject,
    getMyTasks,
    updateTask,
    updateTaskStatus,
    analyzeTask,
    deleteTask,
    reorderTasks
};