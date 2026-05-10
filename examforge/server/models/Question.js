const mongoose = require('mongoose');

const QuestionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true,
  },
  type: {
    type: String,
    enum: ['mcq', 'descriptive'],
    default: 'mcq',
    required: true,
  },
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true,
  },
  marks: {
    type: Number,
    default: 1,
    min: [0, 'Marks cannot be negative'],
  },
  // MCQ-only fields
  options: {
    type: [String],
    default: undefined, // not stored for descriptive
    validate: {
      validator: function (arr) {
        // Only validate if this is an MCQ question
        if (this.type === 'mcq') {
          return Array.isArray(arr) && arr.length === 4;
        }
        return true;
      },
      message: 'MCQ questions must have exactly 4 options',
    },
  },
  correctIndex: {
    type: Number,
    min: 0,
    max: 3,
    // Required only for MCQ; validated in route layer
  },
});

module.exports = mongoose.model('Question', QuestionSchema);
