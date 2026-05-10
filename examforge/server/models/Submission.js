const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    // For MCQ questions
    selectedIndex: {
      type: Number,
      min: -1, // -1 means unanswered
      max: 3,
      default: -1,
    },
    // For descriptive questions
    textAnswer: {
      type: String,
      default: '',
      trim: true,
    },
    // Marks awarded by teacher (for descriptive) or auto-graded (MCQ)
    marksAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  { _id: false }
);

const SubmissionSchema = new mongoose.Schema(
  {
    examId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Exam',
      required: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
    },
    answers: [AnswerSchema],
    seed: {
      type: Number,
      required: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
    },
    isAutoSubmitted: {
      type: Boolean,
      default: false,
    },
    ipAddress: {
      type: String,
      default: '',
    },
    userAgent: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Ensure one submission per student per exam
SubmissionSchema.index({ examId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model('Submission', SubmissionSchema);
