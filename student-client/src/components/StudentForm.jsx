import React, { useState, useEffect } from 'react';

export default function StudentForm({ initialStudent, onSave, onCancel, submitting }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [course, setCourse] = useState('');
  const [semester, setSemester] = useState('');
  const [clientErrors, setClientErrors] = useState({});

  useEffect(() => {
    if (initialStudent) {
      setName(initialStudent.name || '');
      setEmail(initialStudent.email || '');
      setCourse(initialStudent.course || '');
      setSemester(initialStudent.semester || '');
    } else {
      setName('');
      setEmail('');
      setCourse('');
      setSemester('');
    }
    setClientErrors({});
  }, [initialStudent]);

  const validate = () => {
    const errs = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) errs.name = 'Full Name is required.';
    else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters.';

    if (!email.trim()) errs.email = 'Email Address is required.';
    else if (!emailRegex.test(email.trim())) errs.email = 'Please enter a valid email address.';

    if (!course.trim()) errs.course = 'Course / Major is required.';

    const semNum = Number(semester);
    if (!semester || !Number.isInteger(semNum) || semNum < 1 || semNum > 8) {
      errs.semester = 'Semester must be an integer between 1 and 8.';
    }

    setClientErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    onSave({
      name: name.trim(),
      email: email.trim(),
      course: course.trim(),
      semester: parseInt(semester, 10)
    });
  };

  const isEditing = !!initialStudent;

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <h3>{isEditing ? `✏️ Edit Student #${initialStudent.id}` : '➕ Register New Student'}</h3>
          <button className="btn-close" onClick={onCancel}>&times;</button>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              className={`form-control ${clientErrors.name ? 'is-invalid' : ''}`}
              placeholder="e.g. Aarav Patel"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            {clientErrors.name && <span className="error-text">{clientErrors.name}</span>}
          </div>

          <div className="form-group">
            <label>Email Address * (Must be Unique)</label>
            <input
              type="email"
              className={`form-control ${clientErrors.email ? 'is-invalid' : ''}`}
              placeholder="e.g. aarav@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {clientErrors.email && <span className="error-text">{clientErrors.email}</span>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Course / Major *</label>
              <input
                type="text"
                className={`form-control ${clientErrors.course ? 'is-invalid' : ''}`}
                placeholder="e.g. Computer Science"
                value={course}
                onChange={(e) => setCourse(e.target.value)}
              />
              {clientErrors.course && <span className="error-text">{clientErrors.course}</span>}
            </div>

            <div className="form-group">
              <label>Semester (1 - 8) *</label>
              <input
                type="number"
                min="1"
                max="8"
                className={`form-control ${clientErrors.semester ? 'is-invalid' : ''}`}
                placeholder="e.g. 5"
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
              />
              {clientErrors.semester && <span className="error-text">{clientErrors.semester}</span>}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onCancel} disabled={submitting}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Create Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
