const { validationResult } = require('express-validator');
const ProctoringEvent = require('../models/ProctoringEvent');
const Attendance = require('../models/attendance');

const VALID_TYPES = [
  'tab_switch', 'fullscreen_exit', 'window_blur',
  'context_menu', 'devtools_open', 'copy_attempt',
  'exam_start', 'exam_submit',
];

/**
 * POST /api/proctor/event
 * Student records a proctoring event.
 */
const recordEvent = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { examId, type, metadata } = req.body;

    const event = await ProctoringEvent.create({
      examId,
      studentId: req.user.id,
      type,
      timestamp: new Date(),
      metadata: metadata || {},
    });

    res.status(201).json({ message: 'Event recorded.', event });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proctor/events/:examId/:studentId
 * Teacher views all proctoring events for a specific student in an exam.
 */
const getEvents = async (req, res, next) => {
  try {
    const { examId, studentId } = req.params;

    const events = await ProctoringEvent.find({ examId, studentId })
      .sort({ timestamp: 1 })
      .lean();

    // Group events by type for a quick summary
    const summary = {};
    events.forEach((e) => {
      summary[e.type] = (summary[e.type] || 0) + 1;
    });

    res.json({ events, summary });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/proctor/cheats/:examId/:studentId
 * Get the number of cheats for a student during an exam
 */
const getCheats = async (req, res, next) => {
  try {
    const { examId, studentId } = req.params;
    const attendance = await Attendance.findOne({ examId, studentId });
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
    res.json({ cheats: attendance.cheat || 0 });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/proctor/cheats/:examId/:studentId
 * Increase the number of cheats for a student during an exam
 */
const incrementCheats = async (req, res, next) => {
  try {
    const { examId, studentId } = req.params;
    const attendance = await Attendance.findOneAndUpdate(
      { examId, studentId },
      { $inc: { cheat: 1 } },
      { new: true }
    );
    if (!attendance) return res.status(404).json({ message: 'Attendance not found' });
    res.json({ cheats: attendance.cheat });
  } catch (err) {
    next(err);
  }
};

module.exports = { recordEvent, getEvents, getCheats, incrementCheats, VALID_TYPES };
