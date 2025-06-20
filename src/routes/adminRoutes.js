const express = require('express');
const AdminController = require('../controllers/AdminController');
const { authenticateToken, requireRole } = require('../middlewares/auth');

const router = express.Router();

// All admin routes require admin role
router.use(authenticateToken);
router.use(requireRole(['admin']));

router.get('/dashboard', AdminController.getDashboard);
router.get('/users', AdminController.getAllUsers);

module.exports = router;
