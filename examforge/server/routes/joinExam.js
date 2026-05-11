const joinExam = require('../controllers/joinExam');
const { requireStudent } = require('../middleware/auth');

const router = require('express').Router();

router.post('/join', requireStudent, joinExam);

module.exports = router;

