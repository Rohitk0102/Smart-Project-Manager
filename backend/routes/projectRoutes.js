const express = require('express');
const router = express.Router();
const { createProject, getProjects, getProjectById, getDashboardStats } = require('../controllers/projectController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
    .post(protect, createProject)
    .get(protect, getProjects);

router.get('/stats', protect, getDashboardStats);

router.route('/:id')
    .get(protect, getProjectById);

module.exports = router;
