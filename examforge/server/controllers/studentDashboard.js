const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const Result = require('../models/result');
const Poll = require('../models/Poll');

/**
 * GET /api/student/dashboard
 *
 * Returns for the authenticated student:
 *  - liveExams      : status === 'live' and student has not submitted
 *  - scheduledExams : status === 'scheduled' and student has not submitted
 *  - endedExams     : status === 'ended' and student has not submitted
 *  - completedExams : student has submitted (status submitted/auto_submitted)
 *  - draft exams are excluded entirely
 */
const getDashboard = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    // All non-draft exams this student is assigned to
    const allExams = await Exam.find({
      assignedStudents: studentId,
      status: { $in: ['live', 'scheduled', 'ended'] },
    })
      .select('title description duration scheduledStart scheduledEnd latestJoinTime status totalMarks showResultAfterSubmit')
      .sort({ scheduledStart: 1 })
      .lean();

    // All submissions by this student
    const submissions = await Submission.find({ studentId })
      .select('examId status startedAt submittedAt')
      .lean();

    const submissionMap = {};
    for (const s of submissions) {
      submissionMap[s.examId.toString()] = s;
    }

    // All results for this student
    const results = await Result.find({ studentId })
      .select('examId score totalMarks percentage correctAnswers wrongAnswers unanswered status submittedAt')
      .lean();

    const resultMap = {};
    for (const r of results) {
      resultMap[r.examId.toString()] = r;
    }

    const liveExams      = [];
    const scheduledExams = [];
    const endedExams     = [];
    const completedExams = [];

    for (const exam of allExams) {
      const eid = exam._id.toString();
      const sub = submissionMap[eid];
      const result = resultMap[eid];

      const isDone =
        sub?.status === 'submitted' || sub?.status === 'auto_submitted';

      if (isDone) {
        completedExams.push({
          exam,
          submission: {
            status:      sub.status,
            startedAt:   sub.startedAt,
            submittedAt: sub.submittedAt,
          },
          // Only include result numbers if the exam is configured to show them
          result: exam.showResultAfterSubmit && result
            ? {
                score:          result.score,
                totalMarks:     result.totalMarks,
                percentage:     result.percentage,
                correctAnswers: result.correctAnswers,
                wrongAnswers:   result.wrongAnswers,
                unanswered:     result.unanswered,
                status:         result.status,
              }
            : null,
        });
      } else if (exam.status === 'live') {
        liveExams.push({ exam });
      } else if (exam.status === 'scheduled') {
        scheduledExams.push({ exam });
      } else if (exam.status === 'ended') {
        endedExams.push({ exam });
      }
    }

    // All polls assigned to this student (or public polls)
    const allPolls = await Poll.find({
      $or: [
        { isPublic: true },
        { sharedWith: studentId }
      ]
    })
      .populate('createdBy', 'name')
      .populate('responses.student', 'name email rollNumber')
      .sort({ createdAt: -1 })
      .lean();

    const activePolls = [];
    const completedPolls = [];

    for (const poll of allPolls) {
      const hasVoted = poll.responses.some(
        (r) => r.student.toString() === studentId
      );

      const pollData = {
        ...poll,
        hasVoted,
        totalVotes: poll.options.reduce((sum, o) => sum + o.votes, 0),
      };

      if (poll.isOpen && !hasVoted) {
        activePolls.push(pollData);
      } else {
        completedPolls.push(pollData);
      }
    }

    return res.json({
      liveExams,
      scheduledExams,
      endedExams,
      completedExams,
      activePolls,
      completedPolls,
      counts: {
        live:      liveExams.length,
        scheduled: scheduledExams.length,
        ended:     endedExams.length,
        completed: completedExams.length,
        polls:     activePolls.length,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
