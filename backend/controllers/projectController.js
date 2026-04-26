const Project = require('../models/Project');
const Task = require('../models/Task');
const User = require('../models/User');
const { getIO } = require('../socket');
const axios = require('axios');

// @desc    Create a new project
// @route   POST /api/projects
// @access  Private (CTO, PM)
const createProject = async (req, res) => {
    const { name, description, deadline, assignedLeads, assignedEmployees, status } = req.body;

    const project = await Project.create({
        name,
        description,
        deadline,
        assignedLeads: assignedLeads || [],
        assignedEmployees: assignedEmployees || [],
        status: status || 'active',
        ownerId: req.body.ownerId || req.user._id,
    });

    const populatedProject = await Project.findById(project._id)
        .populate('ownerId', 'name email')
        .populate('assignedLeads', 'name email avatar')
        .populate('assignedEmployees', 'name email avatar');

    try {
        const io = getIO();
        io.emit("project_created", { ...populatedProject.toObject(), progress: 0, totalTasks: 0, completedTasks: 0 });
    } catch (e) {
        console.error("Socket emit error", e);
    }

    res.status(201).json(project);
};

// @desc    Get all projects for user
// @route   GET /api/projects
// @access  Private
const getProjects = async (req, res) => {
    const projects = await Project.find({})
        .sort({ updatedAt: -1 })
        .populate('ownerId', 'name email avatar')
        .populate('assignedLeads', 'name email avatar')
        .populate('assignedEmployees', 'name email avatar');

    const projectsWithProgress = await Promise.all(projects.map(async (project) => {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const completedTasks = await Task.countDocuments({ project: project._id, status: 'completed' });
        const runningTasks = await Task.countDocuments({ project: project._id, status: 'running' });

        const weightedProgress = completedTasks + (runningTasks * 0.5);
        const autoProgress = totalTasks === 0 ? 0 : Math.round((weightedProgress / totalTasks) * 100);
        
        const actualProgress = project.progressMode === 'Manual' ? project.manualProgress : autoProgress;

        return {
            ...project.toObject(),
            progress: actualProgress,
            autoProgress,
            totalTasks,
            completedTasks,
            inProgressTasks: runningTasks
        };
    }));

    res.json(projectsWithProgress);
};

// @desc    Update project
// @route   PUT /api/projects/:id
// @access  Private (CTO, Owning PM)
const updateProject = async (req, res) => {
    try {
        const { name, description, deadline, status, assignedLeads, assignedEmployees } = req.body;
        
        const project = req.doc || await Project.findById(req.params.id);

        if (project) {
            const updatedDoc = await Project.findByIdAndUpdate(
                req.params.id,
                {
                    $set: {
                        ...(name && { name }),
                        ...(description !== undefined && { description }),
                        ...(deadline && { deadline }),
                        ...(status && { status }),
                        ...(assignedLeads && { assignedLeads }),
                        ...(assignedEmployees && { assignedEmployees })
                    }
                },
                { new: true, runValidators: true }
            );

            const populated = await Project.findById(updatedDoc._id)
                .populate('ownerId', 'name email avatar')
                .populate('assignedLeads', 'name email avatar')
                .populate('assignedEmployees', 'name email avatar');

            const totalTasks = await Task.countDocuments({ project: populated._id });
            const completedTasks = await Task.countDocuments({ project: populated._id, status: 'completed' });
            const runningTasks = await Task.countDocuments({ project: populated._id, status: 'running' });

            const weightedProgress = completedTasks + (runningTasks * 0.5);
            const autoProgress = totalTasks === 0 ? 0 : Math.round((weightedProgress / totalTasks) * 100);
            
            const actualProgress = populated.progressMode === 'Manual' ? populated.manualProgress : autoProgress;

            const finalProjectData = {
                ...populated.toObject(),
                progress: actualProgress,
                autoProgress,
                totalTasks,
                completedTasks,
                inProgressTasks: runningTasks
            };

            try {
                const io = getIO();
                io.emit("project_updated", finalProjectData);
            } catch (e) {
                console.error("Socket emit error", e);
            }

            res.json(finalProjectData);
        } else {
            res.status(404).json({ message: 'Project not found' });
        }
    } catch (error) {
        console.error("Update Project Error:", error);
        res.status(500).json({ message: `Server Error: ${error.message}` });
    }
};

// @desc    Get project by ID
// @route   GET /api/projects/:id
// @access  Private
const getProjectById = async (req, res) => {
    const project = await Project.findById(req.params.id)
        .populate('ownerId', 'name email avatar')
        .populate('assignedLeads', 'name email avatar')
        .populate('assignedEmployees', 'name email avatar')
        .populate('progressSuggestions.userId', 'name avatar');

    if (project) {
        const totalTasks = await Task.countDocuments({ project: project._id });
        const completedTasks = await Task.countDocuments({ project: project._id, status: 'completed' });
        const runningTasks = await Task.countDocuments({ project: project._id, status: 'running' });

        const weightedProgress = completedTasks + (runningTasks * 0.5);
        const autoProgress = totalTasks === 0 ? 0 : Math.round((weightedProgress / totalTasks) * 100);
        
        const actualProgress = project.progressMode === 'Manual' ? project.manualProgress : autoProgress;

        res.json({
            ...project.toObject(),
            progress: actualProgress,
            autoProgress,
            totalTasks,
            completedTasks
        });
    } else {
        res.status(404).json({ message: 'Project not found' });
    }
};

// @desc    Get dashboard statistics
// @route   GET /api/projects/stats
// @access  Private
const getDashboardStats = async (req, res) => {
    try {
        const totalProjects = await Project.countDocuments({});
        const activeTasks = await Task.countDocuments({ status: { $ne: 'completed' } });
        const completedTasks = await Task.countDocuments({ status: 'completed' });

        const allProjects = await Project.find({}).select('assignedLeads assignedEmployees ownerId');
        const uniqueMembers = new Set();
        allProjects.forEach(p => {
            if (p.ownerId) uniqueMembers.add(p.ownerId.toString());
            p.assignedLeads.forEach(m => uniqueMembers.add(m.toString()));
            p.assignedEmployees.forEach(m => uniqueMembers.add(m.toString()));
        });

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

// @desc    Toggle Progress Mode (Auto/Manual)
// @route   PATCH /api/projects/:id/progress-config
// @access  Private (CTO, PM)
const updateProgressConfig = async (req, res) => {
    try {
        const { progressMode } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.progressMode = progressMode;
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Set Manual Progress
// @route   PATCH /api/projects/:id/progress-manual
// @access  Private (CTO, PM, Lead)
const updateManualProgress = async (req, res) => {
    try {
        const { progress } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.manualProgress = progress;
        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Suggest Progress Update
// @route   POST /api/projects/:id/suggest-progress
// @access  Private (Employee)
const suggestProgress = async (req, res) => {
    try {
        const { suggestedPercent } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        project.progressSuggestions.push({
            userId: req.user._id,
            suggestedPercent,
            status: 'pending'
        });

        await project.save();
        res.json({ message: 'Suggestion sent' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Handle Progress Suggestion (Approve/Reject)
// @route   PATCH /api/projects/:id/handle-suggestion
// @access  Private (CTO, PM)
const handleProgressSuggestion = async (req, res) => {
    try {
        const { suggestionId, status } = req.body;
        const project = await Project.findById(req.params.id);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const suggestion = project.progressSuggestions.id(suggestionId);
        if (!suggestion) return res.status(404).json({ message: 'Suggestion not found' });

        suggestion.status = status;
        if (status === 'approved') {
            project.manualProgress = suggestion.suggestedPercent;
        }

        await project.save();
        res.json(project);
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Add member(s) to project
// @route   POST /api/projects/:id/members
// @access  Private
const addProjectMember = async (req, res) => {
    const { email, roleType } = req.body;
    const projectId = req.params.id;

    try {
        const project = req.doc || await Project.findById(projectId);
        if (!project) return res.status(404).json({ message: 'Project not found' });

        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ message: 'User not found' });
        
        if (roleType === 'Lead' && !project.assignedLeads.includes(user._id)) {
            project.assignedLeads.push(user._id);
        } else if (roleType === 'Employee' && !project.assignedEmployees.includes(user._id)) {
            project.assignedEmployees.push(user._id);
        } else {
             if (!project.assignedEmployees.includes(user._id)) {
                 project.assignedEmployees.push(user._id);
             }
        }
        
        await project.save();

        const updatedProject = await Project.findById(projectId)
            .populate('ownerId', 'name email avatar')
            .populate('assignedLeads', 'name email avatar')
            .populate('assignedEmployees', 'name email avatar');

        try {
            const io = getIO();
            io.emit("project_updated", updatedProject);
        } catch (e) {
            console.error("Socket emit error", e);
        }

        res.json(updatedProject);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Delete project
// @route   DELETE /api/projects/:id
// @access  Private (CTO, Owning PM)
const deleteProject = async (req, res) => {
    try {
        const project = req.doc || await Project.findById(req.params.id);

        if (!project) {
            return res.status(404).json({ message: 'Project not found' });
        }

        await Task.deleteMany({ project: req.params.id });
        await project.deleteOne();

        try {
            const io = getIO();
            io.emit("project_deleted", req.params.id);
        } catch (e) {
            console.error("Socket emit error", e);
        }

        res.json({ message: 'Project removed' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
};

// @desc    Handle AI Command
// @route   POST /api/projects/ai/command
// @access  Private
const handleAICommand = async (req, res) => {
    const { message, projectId } = req.body;
    const history = req.body.history ? JSON.parse(req.body.history) : [];
    const file = req.file;
    const userId = req.user._id;

    if (!message && !file) {
        return res.status(400).json({ message: 'Message or file is required' });
    }

    try {
        let fileContent = "";
        if (file) {
            if (file.mimetype === 'text/plain' || file.mimetype === 'application/json' || file.mimetype === 'text/markdown') {
                fileContent = file.buffer.toString('utf8');
            } else {
                 return res.status(400).json({ reply: 'File type not supported.', intent: 'chat' });
            }
        }

        const aiPayload = { message, file_content: fileContent, history };
        const aiServiceUrl = 'http://127.0.0.1:5001';
        const aiResponse = await axios.post(`${aiServiceUrl}/api/chat`, aiPayload);
        const { task_data, project_data, reply, status, intent, message: errorMessage } = aiResponse.data;

        if (status === 'error') {
            return res.status(500).json({ reply: `AI Error: ${errorMessage}`, intent: 'chat' });
        }
        
        if (intent === 'chat') {
            return res.json({ reply, intent: 'chat' });
        }

        if (intent === 'project' && project_data) {
            const newProject = await Project.create({
                name: project_data.name || "AI Created Project",
                description: project_data.description || "Created by AI Assistant",
                ownerId: userId,
            });
            return res.json({ reply: `I've created the project "${newProject.name}" for you!`, project: newProject, intent: 'project' });
        }

        return res.json({ reply: "Task intent triggered, but moved to new implementation.", intent: 'chat' });

    } catch (error) {
        res.status(500).json({ reply: `Error: ${error.message}`, intent: 'chat' });
    }
};

module.exports = { 
    createProject, getProjects, getProjectById, getDashboardStats, addProjectMember, 
    handleAICommand, updateProject, deleteProject, updateProgressConfig, 
    updateManualProgress, suggestProgress, handleProgressSuggestion 
};