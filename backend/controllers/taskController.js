const Task = require('../models/Task');
const axios = require('axios');

// @desc    Analyze task description using AI Service
// @route   POST /api/tasks/analyze
// @access  Private
const analyzeTask = async (req, res) => {
    const { description } = req.body;

    try {
        // Call Python AI Service
        const response = await axios.post('http://localhost:5001/api/analyze', {
            description
        });

        res.json(response.data);
    } catch (error) {
        console.error("AI Service Error:", error.message);
        res.status(503).json({ message: 'AI Service unavailable' });
    }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
    const { title, description, status, priority, project, assignees, dueDate } = req.body;

    const task = await Task.create({
        title,
        description,
        status,
        priority,
        project,
        assignees,
        dueDate,
    });

    const { addToGoogleCalendar } = require('../services/googleCalendarService');

    const populatedTask = await Task.findById(task._id).populate('assignees', 'name email avatar');

    // Add to Google Calendar if due date exists and user is connected
    if (dueDate) {
        await addToGoogleCalendar(req.user._id, task);
    }

    res.status(201).json(populatedTask);
};

// @desc    Get tasks for a project
// @route   GET /api/tasks/project/:projectId
// @access  Private
const getTasksByProject = async (req, res) => {
    const tasks = await Task.find({ project: req.params.projectId })
        .populate('assignees', 'name email avatar');

    res.json(tasks);
};

// @desc    Update task status (drag and drop)
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (task) {
        task.status = req.body.status || task.status;
        task.priority = req.body.priority || task.priority;
        task.assignees = req.body.assignees || task.assignees;

        const updatedTask = await task.save();
        res.json(updatedTask);
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
    const task = await Task.findById(req.params.id);

    if (task) {
        await task.deleteOne();
        res.json({ message: 'Task removed' });
    } else {
        res.status(404).json({ message: 'Task not found' });
    }
};

const reorderTasks = async (req, res) => {
    const { tasks } = req.body; // Array of { _id, order, status }

    if (!tasks || !Array.isArray(tasks)) {
        return res.status(400).json({ message: 'Invalid data' });
    }

    try {
        const bulkOps = tasks.map(task => ({
            updateOne: {
                filter: { _id: task._id },
                update: { $set: { order: task.order, status: task.status } }
            }
        }));

        await Task.bulkWrite(bulkOps);
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
        const tasks = await Task.find({ assignees: req.user._id })
            .populate('project', 'name description') // Populate project details
            .populate('assignees', 'name email avatar')
            .sort({ dueDate: 1 }); // Sort by due date ascending
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
    updateTaskStatus: updateTask,
    analyzeTask,
    deleteTask,
    reorderTasks
};
