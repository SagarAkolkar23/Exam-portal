const router = require('express').Router();
const { body } = require('express-validator');
const { requireTeacher, requireStudent } = require('../middleware/auth');
const { recordEvent, getEvents, VALID_TYPES } = require('../controllers/proctorController');

// POST /api/proctor/event                          — student records a proctoring event
router.post(
  '/event',
  requireStudent,
  [
    body('examId').notEmpty().withMessage('examId is required'),
    body('type').isIn(VALID_TYPES).withMessage(`type must be one of: ${VALID_TYPES.join(', ')}`),
  ],
  recordEvent
);

// GET /api/proctor/events/:examId/:studentId        — teacher views events for a student
router.get('/events/:examId/:studentId', requireTeacher, getEvents);

module.exports = router;
