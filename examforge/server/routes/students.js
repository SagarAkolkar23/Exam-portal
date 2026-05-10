const router = require('express').Router();
const { requireTeacher } = require('../middleware/auth');
const { listStudents, seedStudents } = require('../controllers/studentController');

// GET  /api/students       — list all students (teacher only)
router.get('/', requireTeacher, listStudents);

// POST /api/students/seed  — bulk-insert students (dev only)
router.post('/seed', seedStudents);

module.exports = router;
