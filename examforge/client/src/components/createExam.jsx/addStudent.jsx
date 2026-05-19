import React, { useState } from "react";
import { useAddTestStudent } from "../../api/queries.js";
import { getErrorMessage } from "../../utils/helpers.js";

function AddStudentModal({ onClose }) {
  const { mutateAsync: addTestStudent } = useAddTestStudent();

  const [batchDetails, setBatchDetails] = useState({
    semester: 1,
    studentClass: "",
    division: "",
    department: "",
    year: 1,
  });

  const [studentsList, setStudentsList] = useState([
    { name: "", email: "", rollNumber: "", password: "" },
  ]);

  const handleAddTestStudent = async (e) => {
    e.preventDefault();
    try {
      const validStudents = studentsList.filter(
        (s) => s.name && s.email && s.rollNumber,
      );
      if (validStudents.length === 0) {
        return alert("Please add at least one valid student.");
      }
      const payload = validStudents.map((s) => ({ ...batchDetails, ...s }));
      await addTestStudent(payload);
      alert("Students added successfully!");
      onClose();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const updateStudent = (idx, field, value) => {
    const updated = [...studentsList];
    updated[idx][field] = value;
    setStudentsList(updated);
  };

  const removeStudent = (idx) =>
    setStudentsList(studentsList.filter((_, i) => i !== idx));

  const addRow = () =>
    setStudentsList([
      ...studentsList,
      { name: "", email: "", rollNumber: "", password: "" },
    ]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-[fadeIn_0.2s_ease]">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl p-6 flex flex-col max-h-[90vh] animate-[slideUp_0.2s_ease]">
        <h3 className="text-xl font-bold text-ink mb-4">Add Test Students</h3>

        <form
          onSubmit={handleAddTestStudent}
          className="flex flex-col flex-1 overflow-hidden"
        >
          {/* Batch details */}
          <div className="grid grid-cols-5 gap-4 mb-6 shrink-0">
            {[
              { label: "Semester", key: "semester", type: "number", min: 1 },
              {
                label: "Class",
                key: "studentClass",
                type: "text",
                placeholder: "e.g. SY",
              },
              {
                label: "Division",
                key: "division",
                type: "text",
                placeholder: "e.g. A",
              },
              {
                label: "Department",
                key: "department",
                type: "text",
                placeholder: "e.g. CS",
              },
              { label: "Year", key: "year", type: "number", min: 1 },
            ].map(({ label, key, type, min, placeholder }) => (
              <div key={key}>
                <label className="form-label text-slate-500">{label}</label>
                <input
                  required
                  type={type}
                  min={min}
                  placeholder={placeholder}
                  className="form-input py-1.5"
                  value={batchDetails[key]}
                  onChange={(e) =>
                    setBatchDetails({ ...batchDetails, [key]: e.target.value })
                  }
                />
              </div>
            ))}
          </div>

          {/* Students list */}
          <div className="flex-1 overflow-y-auto min-h-[200px] border border-slate-200 rounded-lg p-2 bg-slate-50">
            {studentsList.map((student, idx) => (
              <div key={idx} className="flex gap-2 items-center mb-2">
                {[
                  {
                    field: "name",
                    placeholder: "Name",
                    type: "text",
                    required: true,
                  },
                  {
                    field: "email",
                    placeholder: "Email",
                    type: "email",
                    required: true,
                  },
                  {
                    field: "rollNumber",
                    placeholder: "Roll No",
                    type: "text",
                    required: true,
                  },
                  {
                    field: "password",
                    placeholder: "Password (opt)",
                    type: "text",
                    required: false,
                  },
                ].map(({ field, placeholder, type, required }) => (
                  <input
                    key={field}
                    required={required}
                    type={type}
                    placeholder={placeholder}
                    className="form-input py-1.5 text-sm w-1/4"
                    value={student[field]}
                    onChange={(e) => updateStudent(idx, field, e.target.value)}
                  />
                ))}

                {studentsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeStudent(idx)}
                    className="text-danger hover:bg-red-50 p-1.5 rounded-md"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addRow}
              className="text-sm font-semibold text-primary hover:text-primary-focus mt-2 px-2"
            >
              + Add Row
            </button>
          </div>

          {/* Actions */}
          <div className="flex gap-3 justify-end mt-6 shrink-0">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              Save Students
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AddStudentModal;
