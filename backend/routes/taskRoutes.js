const express = require('express');
const router = express.Router();
const { createTask, getTasksByProject, updateTask, analyzeTask, deleteTask, reorderTasks, updateTaskStatus } = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').post(protect, createTask);
router.post('/analyze', protect, analyzeTask);
router.get('/project/:projectId', protect, getTasksByProject);
router.put('/reorder', protect, reorderTasks);
router.put('/:id', protect, updateTaskStatus);
router.delete('/:id', protect, deleteTask);

module.exports = router;
