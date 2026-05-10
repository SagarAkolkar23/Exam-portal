const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');
const Student = require('../models/Student');

/**
 * GET /api/students
 * List all students (teacher only).
 */
const listStudents = async (req, res, next) => {
  try {
    const students = await Student.find({})
      .select('name email rollNumber department year createdAt')
      .sort({ name: 1 })
      .lean();

    res.json(students);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/students/seed
 * Bulk-insert students for development/testing. Disabled in production.
 */
const seedStudents = async (req, res, next) => {
  try {
    if (process.env.NODE_ENV === 'production') {
      return res.status(403).json({ message: 'Seed endpoint disabled in production.' });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const studentsData = req.body;
    if (!Array.isArray(studentsData)) {
      return res.status(400).json({ message: 'Body must be an array of student objects.' });
    }

    const students = await Promise.all(
      studentsData.map(async (s) => {
        const passwordHash = await bcrypt.hash(s.password || 'student123', 12);
        return Student.findOneAndUpdate(
          { email: s.email },
          { ...s, passwordHash },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
      })
    );

    res.status(201).json({ message: `${students.length} students seeded.`, students });
  } catch (err) {
    next(err);
  }
};

module.exports = { listStudents, seedStudents };
