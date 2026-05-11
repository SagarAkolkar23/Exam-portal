const { autoUpdateStatus } = require('../helpers');
const Exam = require('../models/Exam');
const Submission = require('../models/Submission');
const { getShuffleMap } = require('../utils/shuffle');



const joinExam = async (req, res, next) => {
  try {
    const { accessCode } = req.body;
    const studentId = req.user.id;

    if (!accessCode) {
      return res.status(400).json({
        message: 'Access code is required.',
      });
    }

    const exam = await Exam.findOne({
      accessCode: accessCode.toUpperCase(),
    });

    if (!exam) {
      return res.status(404).json({
        message: 'Invalid access code. No exam found.',
      });
    }

    await autoUpdateStatus(exam);
    await exam.save();

    if (exam.status === 'draft') {
      return res.status(403).json({
        message: 'This exam is not yet published.',
      });
    }

    if (exam.status === 'scheduled') {
      return res.status(403).json({
        message: 'Exam has not started yet.',
        scheduledStart: exam.scheduledStart,
      });
    }

    if (exam.status === 'ended') {
      return res.status(403).json({
        message: 'This exam has ended.',
      });
    }

    if (
      exam.latestJoinTime &&
      new Date() > exam.latestJoinTime
    ) {
      return res.status(403).json({
        message: 'The joining window for this exam has closed.',
      });
    }

    const isAssigned = exam.assignedStudents.some(
      (s) => s.toString() === studentId
    );

    if (!isAssigned) {
      return res.status(403).json({
        message: 'You are not assigned to this exam.',
      });
    }

    const existingSubmission = await Submission.findOne({
      examId: exam._id,
      studentId,
    });

    if (existingSubmission?.submittedAt) {
      return res.status(400).json({
        message: 'You have already submitted this exam.',
      });
    }

    return res.json({
      exam: {
        _id: exam._id,
        title: exam.title,
        description: exam.description,
        duration: exam.duration,
        scheduledStart: exam.scheduledStart,
        scheduledEnd: exam.scheduledEnd,
        totalMarks: exam.totalMarks,
        rules: exam.rules,
        shuffleOptions: exam.shuffleOptions,
        showResultAfterSubmit: exam.showResultAfterSubmit,
      },
    });
  } catch (err) {
    next(err);
  }
};


module.exports = joinExam;