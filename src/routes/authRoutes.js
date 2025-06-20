const express = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const { authenticateToken } = require('../middlewares/auth');

const router = express.Router();

// Registration validation
const registerValidation = [
  body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters long'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long')
];

// Login validation
const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

router.post('/register', registerValidation, AuthController.register);
router.post('/login', loginValidation, AuthController.login);
router.get('/profile', authenticateToken, AuthController.getProfile);

module.exports = router;