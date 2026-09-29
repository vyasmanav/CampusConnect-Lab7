import React, { useState } from 'react';

export default function StudentList({ students, onEdit, onDelete, onRefresh, loading }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.course.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="student-list-card">
      <div className="list-toolbar">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name, email, or course..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <button className="btn btn-secondary" onClick={onRefresh} disabled={loading}>
          {loading ? 'Refreshing...' : '🔄 Refresh Data'}
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <p>No student records found.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="student-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Email Address</th>
                <th>Course</th>
                <th>Semester</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((student) => (
                <tr key={student.id}>
                  <td><span className="badge-id">#{student.id}</span></td>
                  <td><strong>{student.name}</strong></td>
                  <td><span className="email-text">{student.email}</span></td>
                  <td><span className="badge-course">{student.course}</span></td>
                  <td><span className="badge-sem">Sem {student.semester}</span></td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => onEdit(student)}
                        title="Edit Student"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => onDelete(student.id)}
                        title="Delete Student"
                      >
                        🗑️ Delete
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
  );
}
