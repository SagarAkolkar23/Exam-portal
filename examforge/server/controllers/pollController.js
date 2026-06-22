const { validationResult } = require('express-validator');
const Poll = require('../models/Poll');
const Student = require('../models/Student');
const { sendPollNotifications } = require('../utils/mailer');
const { generateAccessCode } = require('../utils/shuffle');


const createPoll = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { title, question, options, isPublic, sharedWith } = req.body;

    const poll = await Poll.create({
      title: title || '',
      question,
      options: options.map((opt) => ({
        text: typeof opt === 'string' ? opt : opt.text,
        votes: 0,
      })),
      createdBy: req.user.id,
      isPublic: isPublic !== undefined ? isPublic : true,
      accessCode: generateAccessCode(),
      sharedWith: sharedWith || [],
    });

    // Send email notifications to students asynchronously if shared
    if (Array.isArray(sharedWith) && sharedWith.length > 0) {
      Student.find({ _id: { $in: sharedWith } }, 'name email')
        .lean()
        .then((students) => {
          if (students && students.length > 0) {
            sendPollNotifications({
              poll,
              students,
              teacherName: req.user.name || 'Your Teacher',
            }).catch((emailErr) => {
              console.error('[mailer] Error sending poll notifications in background:', emailErr);
            });
          }
        })
        .catch((dbErr) => {
          console.error('[db] Error fetching students for poll email dispatch:', dbErr);
        });
    }

    res.status(201).json(poll);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/polls
 * List all polls created by the authenticated teacher.
 */
const listPolls = async (req, res, next) => {
  try {
    const polls = await Poll.find({ createdBy: req.user.id })
      .populate('sharedWith', 'name email rollNumber semester studentClass division')
      .populate('responses.student', 'name email rollNumber semester studentClass division')
      .sort({ createdAt: -1 });
    res.json(polls);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/polls/:id
 * Get a single poll with live vote counts (public).
 */
const getPoll = async (req, res, next) => {
  try {
    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });

    // Enforce role-based visibility checks
    if (req.user.role === 'teacher') {
      if (poll.createdBy.toString() !== req.user.id) {
        return res.status(403).json({ message: 'Access denied. You do not own this poll.' });
      }
    } else if (req.user.role === 'student') {
      if (!poll.isPublic && !poll.sharedWith.some((id) => id.toString() === req.user.id)) {
        return res.status(403).json({ message: 'Access denied. You are not assigned to this poll.' });
      }
    }

    res.json(poll);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/polls/:id/vote
 * Cast a vote on a poll option (no auth required).
 */
const votePoll = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const poll = await Poll.findById(req.params.id);
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });
    if (!poll.isOpen) return res.status(400).json({ message: 'This poll is closed.' });

    // Validate that student has not voted yet
    const hasVoted = (poll.responses || []).some((r) => {
      if (!r || !r.student) return false;
      const sId = r.student._id ? r.student._id.toString() : r.student.toString();
      return sId === req.user.id.toString();
    });
    if (hasVoted) {
      return res.status(400).json({ message: 'You have already voted on this poll.' });
    }

    // Validate that student is assigned to this poll (if it is not public)
    if (!poll.isPublic && !poll.sharedWith.some((id) => id.toString() === req.user.id)) {
      return res.status(403).json({ message: 'Access denied. You are not assigned to this poll.' });
    }

    const { optionIndex } = req.body;
    if (optionIndex >= poll.options.length) {
      return res.status(400).json({ message: 'Invalid option index.' });
    }

    // Record the vote
    poll.options[optionIndex].votes += 1;
    if (!poll.responses) {
      poll.responses = [];
    }
    poll.responses.push({
      student: req.user.id,
      optionIndex,
    });

    poll.markModified('options');
    poll.markModified('responses');
    await poll.save();

    res.json({ message: 'Vote recorded.', poll });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/polls/:id/close
 * Close a poll (teacher only).
 */
const closePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });

    poll.isOpen = false;
    poll.closedAt = new Date();
    await poll.save();

    res.json({ message: 'Poll closed successfully.', poll });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/polls/:id/open
 * Reopen a closed poll (teacher only).
 */
const openPoll = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });

    poll.isOpen = true;
    poll.closedAt = undefined;
    await poll.save();

    res.json({ message: 'Poll reopened successfully.', poll });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/polls/:id
 * Delete a poll (teacher only).
 */
const deletePoll = async (req, res, next) => {
  try {
    const poll = await Poll.findOne({ _id: req.params.id, createdBy: req.user.id });
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });

    await poll.deleteOne();
    res.json({ message: 'Poll deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/polls/:id/analytics
 * Get poll response metrics and student vote list (teacher only).
 * Query parameters: studentClass, division
 */
const getPollAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { studentClass, division } = req.query;

    const poll = await Poll.findOne({ _id: id, createdBy: req.user.id });
    if (!poll) return res.status(404).json({ message: 'Poll not found.' });

    // Determine eligible student list based on whether poll is public or private
    let studentFilter = {};

    if (poll.isPublic) {
      if (studentClass) studentFilter.studentClass = studentClass;
      if (division) studentFilter.division = division;
    } else {
      studentFilter = { _id: { $in: poll.sharedWith || [] } };
      if (studentClass) studentFilter.studentClass = studentClass;
      if (division) studentFilter.division = division;
    }

    const eligibleStudents = await Student.find(
      studentFilter,
      '_id name rollNumber email semester studentClass division'
    )
      .sort({ name: 1 })
      .lean();

    const eligibleIdSet = new Set(eligibleStudents.map(s => s._id.toString()));

    // Filter responses to only include those from eligible students
    const responses = poll.responses || [];
    const filteredResponses = responses.filter(r => r.student && eligibleIdSet.has(r.student.toString()));

    // Map student ID to their response
    const studentResponseMap = {};
    for (const r of filteredResponses) {
      studentResponseMap[r.student.toString()] = {
        optionIndex: r.optionIndex,
        optionText: poll.options[r.optionIndex] ? poll.options[r.optionIndex].text : 'Unknown Option',
      };
    }

    // Build the list of student details
    const studentDetails = eligibleStudents.map(s => {
      const resp = studentResponseMap[s._id.toString()];
      return {
        _id: s._id,
        name: s.name,
        rollNumber: s.rollNumber,
        email: s.email,
        semester: s.semester,
        studentClass: s.studentClass,
        division: s.division,
        hasVoted: !!resp,
        optionIndex: resp ? resp.optionIndex : null,
        optionText: resp ? resp.optionText : null,
      };
    });

    // Count options responses for filtered student group
    const optionCounts = poll.options.map((opt, idx) => {
      const count = filteredResponses.filter(r => r.optionIndex === idx).length;
      return {
        text: opt.text,
        votes: count,
      };
    });

    res.json({
      poll: {
        _id: poll._id,
        title: poll.title,
        question: poll.question,
        options: poll.options,
        isPublic: poll.isPublic,
        isOpen: poll.isOpen,
      },
      totalStudents: eligibleStudents.length,
      votedCount: filteredResponses.length,
      optionCounts,
      studentDetails,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { createPoll, listPolls, getPoll, votePoll, closePoll, openPoll, deletePoll, getPollAnalytics };
