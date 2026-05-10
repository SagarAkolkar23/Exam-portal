const router = require('express').Router();
const { body } = require('express-validator');
const { auth } = require('../middleware/auth');
const { teacherLogin, studentLogin, getMe } = require('../controllers/authController');

// POST /api/auth/teacher/login
router.post(
  '/teacher/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  teacherLogin
);

// POST /api/auth/student/login
router.post(
  '/student/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  studentLogin
);

// GET /api/auth/me
router.get('/me', auth, getMe);

module.exports = router;
