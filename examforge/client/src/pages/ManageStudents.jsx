import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/axios';
import {
  useGetStudents,
  useCreateStudent,
  useUpdateStudent,
  useDeleteStudent,
} from '../api/queries';
import { getErrorMessage } from '../utils/helpers';

export default function ManageStudents() {
  const queryClient = useQueryClient();
  const { data: students = [], isLoading, error: fetchError } = useGetStudents();

  const { mutateAsync: createStudent } = useCreateStudent();
  const { mutateAsync: updateStudent } = useUpdateStudent();
  const { mutateAsync: deleteStudent } = useDeleteStudent();

  // ── States ────────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSemester, setSelectedSemester] = useState('');
  const [selectedDivision, setSelectedDivision] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null); // null means adding a new student
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    rollNumber: '',
    department: '',
    year: 1,
    semester: 1,
    studentClass: '',
    division: '',
    password: '',
  });

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  // ── Unique Filter Values ──────────────────────────────────────────────────
  const filters = useMemo(() => {
    const depts = new Set();
    const classes = new Set();
    const semesters = new Set();
    const divisions = new Set();

    students.forEach((s) => {
      if (s.department) depts.add(s.department);
      if (s.studentClass) classes.add(s.studentClass);
      if (s.semester) semesters.add(s.semester.toString());
      if (s.division) divisions.add(s.division);
    });

    return {
      departments: Array.from(depts).sort(),
      classes: Array.from(classes).sort(),
      semesters: Array.from(semesters).sort((a, b) => Number(a) - Number(b)),
      divisions: Array.from(divisions).sort(),
    };
  }, [students]);

  // ── Filtered Students ─────────────────────────────────────────────────────
  const filteredStudents = useMemo(() => {
    return students.filter((s) => {
      const matchesSearch =
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rollNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.email.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesDept = !selectedDept || s.department === selectedDept;
      const matchesClass = !selectedClass || s.studentClass === selectedClass;
      const matchesSemester = !selectedSemester || s.semester?.toString() === selectedSemester;
      const matchesDivision = !selectedDivision || s.division === selectedDivision;

      return matchesSearch && matchesDept && matchesClass && matchesSemester && matchesDivision;
    });
  }, [students, searchTerm, selectedDept, selectedClass, selectedSemester, selectedDivision]);

  // ── Form Handlers ─────────────────────────────────────────────────────────
  const openAddModal = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      rollNumber: '',
      department: '',
      year: 1,
      semester: 1,
      studentClass: '',
      division: '',
      password: '',
    });
    setFormError('');
    setModalOpen(true);
  };

  const openEditModal = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || '',
      email: student.email || '',
      rollNumber: student.rollNumber || '',
      department: student.department || '',
      year: student.year || 1,
      semester: student.semester || 1,
      studentClass: student.studentClass || '',
      division: student.division || '',
      password: '', // blank by default, only updated if entered
    });
    setFormError('');
    setModalOpen(true);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'year' || name === 'semester' ? Number(value) : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError('');
    try {
      if (editingStudent) {
        // Edit student
        const payload = { ...formData };
        if (!payload.password) delete payload.password; // Do not send blank password
        await updateStudent({ id: editingStudent._id, data: payload });
        showToast('Student updated successfully!');
      } else {
        // Add student
        await createStudent(formData);
        showToast('Student added successfully!');
      }
      queryClient.invalidateQueries({ queryKey: ['students'] });
      setModalOpen(false);
    } catch (err) {
      setFormError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (studentId) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return;
    try {
      await deleteStudent(studentId);
      showToast('Student removed successfully!');
      queryClient.invalidateQueries({ queryKey: ['students'] });
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const showToast = (msg) => {
    setActionSuccess(msg);
    setTimeout(() => setActionSuccess(''), 4000);
  };

  return (
    <div className="animate-[fadeIn_0.3s_ease] space-y-6">
      
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between pb-2">
        <div>
          <h1 className="text-2xl font-extrabold text-ink tracking-tight">Manage Students</h1>
          <p className="text-sm text-ink-muted mt-1">
            Create, update, and manage student details, departments, classes, divisions, and batches.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="btn btn-primary flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add New Student
        </button>
      </div>

      {/* Success notification */}
      {actionSuccess && (
        <div className="alert alert-success shadow-sm border-emerald-200 bg-emerald-50 text-emerald-800 rounded-xl p-4 flex items-center gap-2 animate-[fadeInUp_0.2s_ease]">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="font-semibold">{actionSuccess}</span>
        </div>
      )}

      {/* ── Filters Section ────────────────────────────────────────────────── */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap gap-4 items-end">
          
          {/* Search Input */}
          <div className="flex flex-col gap-1.5 flex-1 min-w-[240px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Search Students</label>
            <div className="relative">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, roll no, or email..."
                className="form-input py-2 pl-9 pr-3"
              />
              <svg className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          <div className="h-9 w-px bg-slate-200 hidden md:block" />

          {/* Department Filter */}
          <div className="flex flex-col gap-1.5 min-w-[130px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Department</label>
            <select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="form-select py-2 cursor-pointer"
            >
              <option value="">All Departments</option>
              {filters.departments.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          {/* Semester Filter */}
          <div className="flex flex-col gap-1.5 min-w-[100px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Semester</label>
            <select
              value={selectedSemester}
              onChange={(e) => setSelectedSemester(e.target.value)}
              className="form-select py-2 cursor-pointer"
            >
              <option value="">All Semesters</option>
              {filters.semesters.map((s) => (
                <option key={s} value={s}>Sem {s}</option>
              ))}
            </select>
          </div>

          {/* Class Filter */}
          <div className="flex flex-col gap-1.5 min-w-[110px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="form-select py-2 cursor-pointer"
            >
              <option value="">All Classes</option>
              {filters.classes.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Division Filter */}
          <div className="flex flex-col gap-1.5 min-w-[110px]">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Division</label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="form-select py-2 cursor-pointer"
            >
              <option value="">All Divisions</option>
              {filters.divisions.map((d) => (
                <option key={d} value={d}>Division {d}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(searchTerm || selectedDept || selectedSemester || selectedClass || selectedDivision) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedDept('');
                setSelectedSemester('');
                setSelectedClass('');
                setSelectedDivision('');
              }}
              className="btn btn-ghost btn-sm text-primary font-bold hover:underline mb-1 px-3 py-1.5 shrink-0 self-end"
            >
              Clear Filters
            </button>
          )}

        </div>
      </div>

      {/* ── Students Table Card ───────────────────────────────────────────── */}
      <div className="card overflow-hidden">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center gap-3">
            <div className="spinner spinner-lg" />
            <p className="text-sm font-semibold text-slate-400">Loading student directory...</p>
          </div>
        ) : fetchError ? (
          <div className="p-10 text-center">
            <div className="alert alert-error max-w-md mx-auto">
              Failed to load students: {getErrorMessage(fetchError)}
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center text-3xl">👥</div>
            <div>
              <h3 className="font-bold text-slate-700 text-lg">No students found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-xs mx-auto">
                No students match your active filters or search terms. Try modifying your criteria.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-line text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Email</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Semester</th>
                  <th className="px-6 py-4">Class</th>
                  <th className="px-6 py-4">Division</th>
                  <th className="px-6 py-4">Batch (Year)</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredStudents.map((student) => (
                  <tr key={student._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-ink whitespace-nowrap">
                      <span className="bg-slate-100 px-2.5 py-1 rounded-md text-xs tracking-wider">
                        {student.rollNumber}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-ink whitespace-nowrap">
                      {student.name}
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      {student.email}
                    </td>
                    <td className="px-6 py-3.5 font-medium text-slate-700 whitespace-nowrap">
                      {student.department || '—'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="bg-indigo-50 text-primary text-xs font-bold px-2 py-0.5 rounded-md">
                        Sem {student.semester || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-semibold text-slate-700 whitespace-nowrap">
                      {student.studentClass || '—'}
                    </td>
                    <td className="px-6 py-3.5 whitespace-nowrap">
                      <span className="bg-amber-50 text-amber-700 border border-amber-200/50 text-xs font-semibold px-2 py-0.5 rounded">
                        Div {student.division || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500 whitespace-nowrap">
                      Year {student.year || '—'}
                    </td>
                    <td className="px-6 py-3.5 text-right whitespace-nowrap">
                      <div className="inline-flex gap-2">
                        <button
                          onClick={() => openEditModal(student)}
                          className="btn btn-secondary btn-sm flex items-center justify-center p-1.5"
                          title="Edit Student"
                        >
                          <svg className="w-4 h-4 text-slate-500 hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(student._id)}
                          className="btn btn-secondary btn-sm flex items-center justify-center p-1.5 hover:border-red-200 hover:bg-red-50"
                          title="Delete Student"
                        >
                          <svg className="w-4 h-4 text-slate-500 hover:text-danger transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal (Add / Edit Student) ────────────────────────────────────── */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-[fadeIn_0.15s_ease]">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-[fadeInUp_0.2s_ease] border border-line">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-line flex items-center justify-between">
              <h3 className="font-extrabold text-ink text-lg">
                {editingStudent ? 'Edit Student Details' : 'Add New Student'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {formError && (
                <div className="alert alert-error">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                
                {/* Name */}
                <div className="form-group col-span-2">
                  <label className="form-label">Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g. Rahul Sharma"
                    className="form-input"
                  />
                </div>

                {/* Email */}
                <div className="form-group">
                  <label className="form-label">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="e.g. rahul@student.edu"
                    className="form-input"
                  />
                </div>

                {/* Roll Number */}
                <div className="form-group">
                  <label className="form-label">Roll Number *</label>
                  <input
                    type="text"
                    name="rollNumber"
                    required
                    value={formData.rollNumber}
                    onChange={handleInputChange}
                    placeholder="e.g. CS23104"
                    className="form-input"
                  />
                </div>

                {/* Department */}
                <div className="form-group">
                  <label className="form-label">Department *</label>
                  <input
                    type="text"
                    name="department"
                    required
                    value={formData.department}
                    onChange={handleInputChange}
                    placeholder="e.g. Computer Science"
                    className="form-input"
                  />
                </div>

                {/* Year (Batch) */}
                <div className="form-group">
                  <label className="form-label">Batch (Year) *</label>
                  <input
                    type="number"
                    name="year"
                    required
                    min={1}
                    max={6}
                    value={formData.year}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                {/* Semester */}
                <div className="form-group">
                  <label className="form-label">Semester *</label>
                  <input
                    type="number"
                    name="semester"
                    required
                    min={1}
                    max={12}
                    value={formData.semester}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                {/* Class */}
                <div className="form-group">
                  <label className="form-label">Class (e.g. TY) *</label>
                  <input
                    type="text"
                    name="studentClass"
                    required
                    value={formData.studentClass}
                    onChange={handleInputChange}
                    placeholder="e.g. TY"
                    className="form-input"
                  />
                </div>

                {/* Division */}
                <div className="form-group">
                  <label className="form-label">Division *</label>
                  <input
                    type="text"
                    name="division"
                    required
                    value={formData.division}
                    onChange={handleInputChange}
                    placeholder="e.g. A"
                    className="form-input"
                  />
                </div>

                {/* Password */}
                <div className="form-group">
                  <label className="form-label">
                    Password {editingStudent && '(leave blank to keep current)'}
                  </label>
                  <input
                    type="text"
                    name="password"
                    required={!editingStudent}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="••••••••"
                    className="form-input"
                  />
                </div>

              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 -mx-6 -mb-6 bg-slate-50 border-t border-line flex items-center justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn btn-secondary"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn btn-primary min-w-[100px] justify-center"
                  disabled={saving}
                >
                  {saving ? (
                    <><span className="spinner spinner-sm border-white/30 border-t-white" /> Saving...</>
                  ) : (
                    'Save Details'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
