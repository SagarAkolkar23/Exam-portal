'use strict';

const mongoose = require('mongoose');
const Exam       = require('../models/Exam');
const Question   = require('../models/Question');
const Submission = require('../models/Submission');
const Student    = require('../models/Student');
const { getShuffleMap, unshuffleIndex } = require('../utils/shuffle');

// ─── helpers ──────────────────────────────────────────────────────────────────

/** Ensure the exam belongs to the requesting teacher */
async function ownerExam(examId, teacherId) {
  return Exam.findOne({ _id: examId, createdBy: teacherId });
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. GET /api/teacher/analytics/exams
//    Returns every exam the teacher has created together with the unique
//    semester / studentClass / division combos of the assigned students.
// ─────────────────────────────────────────────────────────────────────────────
const getExamOverview = async (req, res, next) => {
  try {
    const teacherId = req.user.id;

    const exams = await Exam.find({ createdBy: teacherId })
      .select('title description status totalMarks duration scheduledStart scheduledEnd accessCode createdAt assignedStudents')
      .sort({ createdAt: -1 })
      .lean();

    // For each exam populate the distinct class groups of its students
    const result = await Promise.all(
      exams.map(async (exam) => {
        const students = await Student.find(
          { _id: { $in: exam.assignedStudents } },
          'semester studentClass division department year'
        ).lean();

        // Unique combos
        const groupSet = new Map();
        for (const s of students) {
          const key = `${s.semester ?? ''}|${s.studentClass ?? ''}|${s.division ?? ''}`;
          if (!groupSet.has(key)) {
            groupSet.set(key, {
              semester:     s.semester     ?? null,
              studentClass: s.studentClass ?? null,
              division:     s.division     ?? null,
              department:   s.department   ?? null,
              year:         s.year         ?? null,
            });
          }
        }

        // Submission count (students who actually submitted)
        const submittedCount = await Submission.countDocuments({
          examId:      exam._id,
          submittedAt: { $exists: true, $ne: null },
        });

        return {
          ...exam,
          assignedCount:  exam.assignedStudents.length,
          submittedCount,
          groups: [...groupSet.values()],
        };
      })
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 2. GET /api/teacher/analytics/exams/:examId/score-distribution
//    Query params (all optional):
//      semester, studentClass, division
//    Splits totalMarks into 5 equal bands and returns the count + student list
//    for each band.
// ─────────────────────────────────────────────────────────────────────────────
const getScoreDistribution = async (req, res, next) => {
  try {
    const { examId } = req.params;
    const { semester, studentClass, division } = req.query;

    const exam = await ownerExam(examId, req.user.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found.' });

    const totalMarks = exam.totalMarks || 100;
    const bandSize   = totalMarks / 5;

    // Build filter for student group if query params provided
    const studentFilter = { _id: { $in: exam.assignedStudents } };
    if (semester)     studentFilter.semester     = Number(semester);
    if (studentClass) studentFilter.studentClass = studentClass;
    if (division)     studentFilter.division     = division;

    const eligibleStudents = await Student.find(studentFilter, '_id name rollNumber email department year semester studentClass division').lean();
    const eligibleIds = eligibleStudents.map((s) => s._id);

    // All finished submissions for those students in this exam
    const submissions = await Submission.find({
      examId,
      studentId:   { $in: eligibleIds },
      submittedAt: { $exists: true, $ne: null },
    }, 'studentId score percentage').lean();

    const subMap = {};
    for (const s of submissions) subMap[s.studentId.toString()] = s;

    // 5 bands: [0,band1), [band1,band2), …, [band4,totalMarks]
    const bands = Array.from({ length: 5 }, (_, i) => ({
      label: `${Math.round(i * bandSize)}–${Math.round((i + 1) * bandSize)} marks`,
      min:   i * bandSize,
      max:   (i + 1) * bandSize,
      count: 0,
      students: [],
    }));

    for (const student of eligibleStudents) {
      const sub = subMap[student._id.toString()];
      if (!sub) continue; // not attempted

      const score = sub.score ?? 0;
      for (let i = 0; i < 5; i++) {
        const isLast = i === 4;
        if (score >= bands[i].min && (isLast ? score <= bands[i].max : score < bands[i].max)) {
          bands[i].count++;
          bands[i].students.push({
            ...student,
            score:      sub.score,
            percentage: sub.percentage,
          });
          break;
        }
      }
    }

    res.json({
      exam: {
        _id:         exam._id,
        title:       exam.title,
        totalMarks:  exam.totalMarks,
        status:      exam.status,
      },
      totalEligible:  eligibleStudents.length,
      totalAttempted: submissions.length,
      bandSize,
      distribution: bands,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 3. GET /api/teacher/analytics/exams/:examId/cheat-report
//    Returns the list of students who attempted the exam, sorted descending
//    by their cheat count (taken from Submission.cheat).
// ─────────────────────────────────────────────────────────────────────────────
const getCheatReport = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await ownerExam(examId, req.user.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found.' });

    const submissions = await Submission.find(
      {
        examId,
        submittedAt: { $exists: true, $ne: null },
      },
      'studentId score percentage cheat status submittedAt'
    )
      .sort({ cheat: -1 })
      .lean();

    // Populate student info
    const studentIds = submissions.map((s) => s.studentId);
    const students   = await Student.find(
      { _id: { $in: studentIds } },
      'name rollNumber email department year semester studentClass division'
    ).lean();
    const studentMap = {};
    for (const s of students) studentMap[s._id.toString()] = s;

    const report = submissions.map((sub, rank) => ({
      rank:       rank + 1,
      student:    studentMap[sub.studentId.toString()] ?? null,
      score:      sub.score,
      percentage: sub.percentage,
      cheats:     sub.cheat ?? 0,
      status:     sub.status,
      submittedAt: sub.submittedAt,
    }));

    res.json({
      exam: {
        _id:   exam._id,
        title: exam.title,
      },
      totalAttempted: report.length,
      report,
    });
  } catch (err) {
    next(err);
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// 4. GET /api/teacher/analytics/exams/:examId/question-analysis
//    For every MCQ question in the exam returns:
//      - question text, marks, correct answer
//      - students who got it right (list)
//      - students who got it wrong (list)
//      - students who skipped it (list)
//      - correctRate %
// ─────────────────────────────────────────────────────────────────────────────
const getQuestionAnalysis = async (req, res, next) => {
  try {
    const { examId } = req.params;

    const exam = await ownerExam(examId, req.user.id);
    if (!exam) return res.status(404).json({ message: 'Exam not found.' });

    const questions = await Question.find({ examId }).lean();

    // All finished submissions
    const submissions = await Submission.find(
      {
        examId,
        submittedAt: { $exists: true, $ne: null },
      },
      'studentId answers paperSet'
    ).lean();

    const totalAttempted = submissions.length;
    if (totalAttempted === 0) {
      return res.json({
        exam: { _id: exam._id, title: exam.title, totalMarks: exam.totalMarks },
        totalAttempted: 0,
        questions: questions.map((q) => ({
          _id:          q._id,
          text:         q.text,
          type:         q.type,
          marks:        q.marks,
          correctOption: q.correctOption,
          correct:  [],
          wrong:    [],
          skipped:  [],
          correctRate: 0,
        })),
      });
    }

    // Populate student lookup
    const studentIds = submissions.map((s) => s.studentId);
    const students   = await Student.find(
      { _id: { $in: studentIds } },
      'name rollNumber email department year'
    ).lean();
    const studentMap = {};
    for (const s of students) studentMap[s._id.toString()] = s;

    // Build question-level buckets
    const analysis = questions.map((q, qIdx) => {
      const bucket = { correct: [], wrong: [], skipped: [] };

      for (const sub of submissions) {
        const studentInfo = studentMap[sub.studentId.toString()] ?? { _id: sub.studentId };
        const answer      = sub.answers.find(
          (a) => a.questionId.toString() === q._id.toString()
        );

        if (q.type === 'mcq') {
          const selectedIndices = answer && Array.isArray(answer.selectedIndices) && answer.selectedIndices.length > 0
            ? answer.selectedIndices
            : (answer && answer.selectedIndex !== -1 && answer.selectedIndex != null ? [answer.selectedIndex] : []);

          if (selectedIndices.length === 0) {
            bucket.skipped.push(studentInfo);
            continue;
          }

          const shuffleMap = exam.shuffleOptions
            ? getShuffleMap(sub.paperSet, qIdx)
            : [0, 1, 2, 3];

          let isCorrect = false;
          if (q.correctOptions && q.correctOptions.length > 0) {
            const originalIndices = selectedIndices.map(shIdx => shIdx >= 0 ? unshuffleIndex(shIdx, shuffleMap) : -1).filter(idx => idx >= 0);
            const selectedOptions = originalIndices.map(origIdx => q.options?.[origIdx]).filter(Boolean);

            if (selectedOptions.length === q.correctOptions.length) {
              isCorrect = q.correctOptions.every(opt => selectedOptions.includes(opt)) &&
                          selectedOptions.every(opt => q.correctOptions.includes(opt));
            }
          } else {
            const originalIdx  = unshuffleIndex(selectedIndices[0], shuffleMap);
            const chosenOption = q.options?.[originalIdx] ?? null;
            isCorrect = chosenOption === q.correctOption;
          }

          if (isCorrect) bucket.correct.push(studentInfo);
          else           bucket.wrong.push(studentInfo);
        } else {
          // Descriptive — mark as attempted if non-empty text
          if (!answer || !answer.textAnswer?.trim()) {
            bucket.skipped.push(studentInfo);
          } else {
            // descriptive grading is manual; put in 'wrong' bucket until teacher grades
            bucket.wrong.push({ ...studentInfo, textAnswer: answer.textAnswer });
          }
        }
      }

      const correctRate = totalAttempted > 0
        ? Math.round((bucket.correct.length / totalAttempted) * 100)
        : 0;

      return {
        _id:          q._id,
        text:         q.text,
        type:         q.type,
        marks:        q.marks,
        correctOption: q.correctOption ?? null,
        correctOptions: q.correctOptions ?? [],
        isMultiSelect: q.isMultiSelect ?? false,
        correct:      bucket.correct,
        wrong:        bucket.wrong,
        skipped:      bucket.skipped,
        correctCount: bucket.correct.length,
        wrongCount:   bucket.wrong.length,
        skippedCount: bucket.skipped.length,
        correctRate,
      };
    });

    res.json({
      exam: {
        _id:         exam._id,
        title:       exam.title,
        totalMarks:  exam.totalMarks,
        status:      exam.status,
      },
      totalAttempted,
      questions: analysis,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getExamOverview,
  getScoreDistribution,
  getCheatReport,
  getQuestionAnalysis,
};