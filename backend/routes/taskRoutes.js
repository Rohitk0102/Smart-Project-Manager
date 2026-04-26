const express = require('express');
const router = express.Router();
const { createTask, getTasksByProject, updateTask, analyzeTask, deleteTask, reorderTasks, updateTaskStatus, getMyTasks } = require('../controllers/taskController');
const { protect, requireRole } = require('../middleware/authMiddleware');

router.post('/', protect, requireRole('CTO', 'PM', 'TeamLead'), createTask);
router.get('/my-tasks', protect, getMyTasks);
router.post('/analyze', protect, analyzeTask);
router.get('/project/:projectId', protect, getTasksByProject);

// Reordering could involve status changes, so we restrict it to Leads+ unless we want Employees to reorder their own tasks.
// Given strict rules: Employees only change status via PATCH.
router.put('/reorder', protect, requireRole('CTO', 'PM', 'TeamLead'), reorderTasks);

// Full update
router.put('/:id', protect, requireRole('CTO', 'PM', 'TeamLead'), updateTask);

// Status only update (Allowed for everyone, controller handles Employee validation)
router.patch('/:id/status', protect, updateTaskStatus);

router.delete('/:id', protect, requireRole('CTO', 'PM', 'TeamLead'), deleteTask);

module.exports = router;