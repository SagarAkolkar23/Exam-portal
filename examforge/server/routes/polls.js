const router = require('express').Router();
const { body } = require('express-validator');
const { requireTeacher, requireStudent, auth } = require('../middleware/auth');
const {
  createPoll,
  listPolls,
  getPoll,
  votePoll,
  closePoll,
  openPoll,
  deletePoll,
  getPollAnalytics,
} = require('../controllers/pollController');

// POST   /api/polls            — create a poll (teacher only)
router.post(
  '/',
  requireTeacher,
  [
    body('question').notEmpty().withMessage('Question is required').trim(),
    body('options').isArray({ min: 2, max: 6 }).withMessage('Poll must have 2–6 options'),
    body('options.*.text').notEmpty().withMessage('Each option must have text'),
  ],
  createPoll
);

// GET    /api/polls            — list teacher's polls
router.get('/', requireTeacher, listPolls);

// GET    /api/polls/:id/analytics — get poll analytics (teacher only)
router.get('/:id/analytics', requireTeacher, getPollAnalytics);

// GET    /api/polls/:id        — get poll with live vote counts (requires auth)
router.get('/:id', auth, getPoll);

// POST   /api/polls/:id/vote   — cast a vote (requires student auth)
router.post(
  '/:id/vote',
  requireStudent,
  [body('optionIndex').isInt({ min: 0 }).withMessage('Valid option index is required')],
  votePoll
);

// POST   /api/polls/:id/close  — close poll (teacher only)
router.post('/:id/close', requireTeacher, closePoll);

// POST   /api/polls/:id/open   — reopen poll (teacher only)
router.post('/:id/open', requireTeacher, openPoll);

// DELETE /api/polls/:id        — delete poll (teacher only)
router.delete('/:id', requireTeacher, deletePoll);

module.exports = router;
