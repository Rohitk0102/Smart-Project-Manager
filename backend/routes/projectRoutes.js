const express = require('express');
const router = express.Router();
const multer = require('multer');
const { 
    createProject, getProjects, getProjectById, getDashboardStats, addProjectMember, 
    handleAICommand, updateProject, deleteProject, updateProgressConfig, 
    updateManualProgress, suggestProgress, handleProgressSuggestion 
} = require('../controllers/projectController');
const { protect, requireRole, requireOwnership } = require('../middleware/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

router.route('/')
    .post(protect, requireRole('CTO', 'PM'), createProject)
    .get(protect, getProjects);

const uploadMiddleware = (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            console.error("Multer Error:", err);
            return res.status(400).json({ reply: `File upload error: ${err.message}`, intent: 'chat' });
        } else if (err) {
            console.error("Unknown Upload Error:", err);
            return res.status(500).json({ reply: `Upload error: ${err.message}`, intent: 'chat' });
        }
        next();
    });
};

router.post('/ai/command', protect, uploadMiddleware, handleAICommand);
router.get('/stats', protect, getDashboardStats);

router.route('/:id')
    .get(protect, getProjectById)
    .put(protect, requireRole('CTO', 'PM'), requireOwnership('Project'), updateProject)
    .delete(protect, requireRole('CTO', 'PM'), requireOwnership('Project'), deleteProject);

router.post('/:id/members', protect, requireRole('CTO', 'PM'), requireOwnership('Project'), addProjectMember);

// Hybrid Progress Routes
router.patch('/:id/progress-config', protect, requireRole('CTO', 'PM'), updateProgressConfig);
router.patch('/:id/progress-manual', protect, requireRole('CTO', 'PM', 'TeamLead'), updateManualProgress);
router.post('/:id/suggest-progress', protect, suggestProgress);
router.patch('/:id/handle-suggestion', protect, requireRole('CTO', 'PM'), handleProgressSuggestion);

module.exports = router;