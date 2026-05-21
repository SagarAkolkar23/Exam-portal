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
      .select('name email rollNumber department year semester studentClass division createdAt')
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

/**
 * POST /api/students
 * Create a new student (teacher only).
 */
const createStudent = async (req, res, next) => {
  try {
    const { name, email, rollNumber, department, year, semester, studentClass, division, password } = req.body;

    const existingEmail = await Student.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ message: 'A student with this email already exists.' });
    }

    const existingRoll = await Student.findOne({ rollNumber });
    if (existingRoll) {
      return res.status(400).json({ message: 'A student with this roll number already exists.' });
    }

    const student = await Student.create({
      name,
      email,
      rollNumber,
      department,
      year,
      semester,
      studentClass,
      division,
      passwordHash: password || 'student123',
    });

    res.status(201).json({ message: 'Student created successfully.', student });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/students/:id
 * Update a student's details (teacher only).
 */
const updateStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email, rollNumber, department, year, semester, studentClass, division, password } = req.body;

    const student = await Student.findById(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }

    if (email && email.toLowerCase() !== student.email.toLowerCase()) {
      const existingEmail = await Student.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ message: 'A student with this email already exists.' });
      }
      student.email = email;
    }

    if (rollNumber && rollNumber.toUpperCase() !== student.rollNumber.toUpperCase()) {
      const existingRoll = await Student.findOne({ rollNumber });
      if (existingRoll) {
        return res.status(400).json({ message: 'A student with this roll number already exists.' });
      }
      student.rollNumber = rollNumber;
    }

    if (name) student.name = name;
    if (department) student.department = department;
    if (year !== undefined) student.year = Number(year);
    if (semester !== undefined) student.semester = Number(semester);
    if (studentClass !== undefined) student.studentClass = studentClass;
    if (division !== undefined) student.division = division;

    if (password) {
      student.passwordHash = password;
    }

    await student.save();
    res.json({ message: 'Student updated successfully.', student });
  } catch (err) {
    next(err);
  }
};

/**
 * DELETE /api/students/:id
 * Delete a student (teacher only).
 */
const deleteStudent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const student = await Student.findByIdAndDelete(id);
    if (!student) {
      return res.status(404).json({ message: 'Student not found.' });
    }
    res.json({ message: 'Student deleted successfully.' });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  listStudents,
  seedStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};

