require('dotenv').config();
const mongoose = require('mongoose');

const Teacher = require('./models/Teacher');
const Student = require('./models/Student');
const Exam = require('./models/Exam');
const Question = require('./models/Question');
const Submission = require('./models/Submission');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/examforge';

async function seedSubmissions() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // 1. Find the Teacher
    const teacher = await Teacher.findOne({ email: 'sharma@college.edu' });
    if (!teacher) {
      console.log('❌ Teacher not found. Please run seed.js first.');
      process.exit(1);
    }

    // 2. Find or Create Exam
    let exam = await Exam.findOne({ title: 'Introduction to Data Structures' });
    if (!exam) {
      console.log('❌ Exam not found. Please run seed.js first.');
      process.exit(1);
    }

    exam.status = 'ended';
    exam.totalMarks = 30; // 3 questions of 10 marks each
    await exam.save();
    console.log(`📝 Updated Exam: "${exam.title}" to totalMarks: ${exam.totalMarks}, status: ${exam.status}`);

    // 3. Clear and insert Questions in the Question collection
    await Question.deleteMany({ examId: exam._id });
    
    const questionsData = [
      {
        examId: exam._id,
        type: 'mcq',
        text: 'What is the time complexity of binary search on a sorted array?',
        options: ['O(n)', 'O(log n)', 'O(n²)', 'O(1)'],
        correctOption: 'O(log n)',
        marks: 10,
      },
      {
        examId: exam._id,
        type: 'mcq',
        text: 'Which data structure uses LIFO (Last In, First Out) order?',
        options: ['Queue', 'Stack', 'Linked List', 'Tree'],
        correctOption: 'Stack',
        marks: 10,
      },
      {
        examId: exam._id,
        type: 'mcq',
        text: 'What is the worst-case time complexity of Bubble Sort?',
        options: ['O(n log n)', 'O(n)', 'O(n²)', 'O(log n)'],
        correctOption: 'O(n²)',
        marks: 10,
      }
    ];

    const questions = await Question.insertMany(questionsData);
    console.log(`🙋 Seeded ${questions.length} questions for the exam in Question collection.`);

    // 4. Find and Update Students to have class "TY" and year 3
    const students = await Student.find({ year: 3 });
    if (students.length === 0) {
      console.log('❌ No Year 3 students found.');
      process.exit(1);
    }

    for (const student of students) {
      student.studentClass = 'TY';
      student.division = 'A';
      await student.save();
    }
    console.log(`🎓 Updated ${students.length} students to Class: "TY", Division: "A"`);

    // 5. Delete any existing submissions for this exam to start fresh
    await Submission.deleteMany({ examId: exam._id });

    // 6. Create Submissions with varied scores (some >= 15 threshold, some < 15)
    // CS2101: 30 marks (perfect)
    // CS2102: 20 marks (above)
    // CS2103: 10 marks (below)
    // CS2104: 0 marks (below)
    // CS2105: (Not attempted - no submission)
    const scores = {
      'CS2101': 30,
      'CS2102': 20,
      'CS2103': 10,
      'CS2104': 0,
    };

    for (const student of students) {
      const score = scores[student.rollNumber];
      if (score === undefined) {
        console.log(`💨 Skipping submission for student: ${student.name} (Not Attempted test case)`);
        continue;
      }

      await Submission.create({
        examId: exam._id,
        studentId: student._id,
        status: 'submitted',
        startedAt: new Date(),
        submittedAt: new Date(),
        paperSet: 0,
        score,
        totalQuestions: 3,
        percentage: Math.round((score / exam.totalMarks) * 100),
        answers: questions.map((q, idx) => ({
          questionId: q._id,
          selectedIndex: idx === 1 ? 1 : 0, // pick some indices
          marksAwarded: idx * 10 < score ? 10 : 0,
        })),
        cheat: student.rollNumber === 'CS2103' ? 2 : 0,
      });

      console.log(`🚀 Created submission for student: ${student.name} (${student.rollNumber}) with score: ${score}`);
    }

    console.log('✅ Seed submissions complete.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ Failed:', err.message);
    process.exit(1);
  }
}

seedSubmissions();
