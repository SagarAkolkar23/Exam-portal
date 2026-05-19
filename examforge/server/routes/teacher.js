const router = require('express').Router();
const { requireTeacher } = require('../middleware/auth');
const {
  getExamOverview,
  getScoreDistribution,
  getCheatReport,
  getQuestionAnalysis,
} = require('../controllers/teacherAnalytics');

// GET /api/teacher/analytics/exams
// All exams created by the teacher + class groups of assigned students
router.get('/analytics/exams', requireTeacher, getExamOverview);

// GET /api/teacher/analytics/exams/:examId/score-distribution
// ?semester=&studentClass=&division=  (all optional filters)
router.get('/analytics/exams/:examId/score-distribution', requireTeacher, getScoreDistribution);

// GET /api/teacher/analytics/exams/:examId/cheat-report
// Students sorted by cheat count desc
router.get('/analytics/exams/:examId/cheat-report', requireTeacher, getCheatReport);

// GET /api/teacher/analytics/exams/:examId/question-analysis
// Per-question correct / wrong / skipped student lists
router.get('/analytics/exams/:examId/question-analysis', requireTeacher, getQuestionAnalysis);

module.exports = router;
