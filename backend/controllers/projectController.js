const Project = require('../models/Project');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private
const createProject = async (req, res) => {
    const { name, description, deadline, members } = req.body;

    const project = await Project.create({
        name,
        description,
        deadline,
        members,
        owner: req.user._id,
    });

    res.status(201).json(project);
};

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    // Find projects where user is owner OR member
    const projects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
    }).populate('owner', 'name email').populate('members', 'name email avatar');

    res.json(projects);
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate('owner', 'name email')
        .populate('members', 'name email avatar');

    if (project) {
        res.json(project);
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
};

const Task = require('../models/Task');

// @desc    Get dashboard statistics
// @route   GET /api/projects/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const userId = req.user._id;

        // 1. Total Projects
        const totalProjects = await Project.countDocuments({
            $or: [{ owner: userId }, { members: userId }]
        });

        // Find all projects associated with the user to scope the tasks
        const userProjectsList = await Project.find({
            $or: [{ owner: userId }, { members: userId }]
        }).select('_id');

        const projectIds = userProjectsList.map(p => p._id);

        // 2. Active Tasks (all tasks in user's projects that are not done)
        // This gives a better overview of project workload than just assigned tasks
        const activeTasks = await Task.countDocuments({
            project: { $in: projectIds },
            status: { $ne: 'done' }
        });

        // 3. Completed Tasks (all tasks in user's projects that are done)
        const completedTasks = await Task.countDocuments({
            project: { $in: projectIds },
            status: 'done'
        });

        // 4. Team Members (unique members across all user's projects)
        // Find all projects user is in
        const userProjects = await Project.find({
            $or: [{ owner: userId }, { members: userId }]
        }).select('members owner');

        const uniqueMembers = new Set();
        userProjects.forEach(p => {
            uniqueMembers.add(p.owner.toString());
            p.members.forEach(m => uniqueMembers.add(m.toString()));
        });

        // Subtract self from team count if desired, but "Team Members" usually implies size including/excluding self.
        // We will include the user to show total team size involved.
        /* if (uniqueMembers.has(userId.toString())) {
            uniqueMembers.delete(userId.toString());
        } */

        res.json({
            totalProjects,
            activeTasks,
            completedTasks,
            teamMembers: uniqueMembers.size
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

module.exports = { createProject, getProjects, getProjectById, getDashboardStats };
