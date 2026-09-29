import React, { useState, useEffect } from 'react';
import { fetchStudents, createStudent, updateStudent, deleteStudent, API_BASE_URL } from './api';
import StudentList from './components/StudentList';
import StudentForm from './components/StudentForm';
import './App.css';

export default function App() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStudents();
      setStudents(data);
    } catch (err) {
      setError(err.message || 'Unable to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveStudent = async (formData) => {
    setSubmitting(true);
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
        showToast(`Student "${formData.name}" updated successfully!`, 'success');
      } else {
        await createStudent(formData);
        showToast(`Student "${formData.name}" added successfully!`, 'success');
      }
      setShowForm(false);
      setEditingStudent(null);
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteStudent = async (id) => {
    const student = students.find(s => s.id === id);
    const confirmMsg = `Are you sure you want to delete ${student ? `"${student.name}"` : 'this student'}?`;
    if (!window.confirm(confirmMsg)) return;

    try {
      await deleteStudent(id);
      showToast('Student deleted successfully.', 'success');
      await loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  const handleOpenAdd = () => {
    setEditingStudent(null);
    setShowForm(true);
  };

  const handleOpenEdit = (student) => {
    setEditingStudent(student);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingStudent(null);
  };

  return (
    <div className="app-container">
      {/* Toast Notification */}
      {toast && (
        <div className={`toast-notification toast-${toast.type}`}>
          <span>{toast.type === 'success' ? '✅' : '⚠️'} {toast.message}</span>
          <button onClick={() => setToast(null)} className="toast-close">&times;</button>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <div className="header-inner">
          <div className="brand">
            <span className="brand-logo">🎓</span>
            <div>
              <h1>CampusConnect</h1>
              <p className="subtitle">Lab 4: Full-Stack React Client (MongoDB Atlas + REST API)</p>
            </div>
          </div>
          <div className="header-meta">
            <span className="api-badge">API: {API_BASE_URL}</span>
            <button className="btn btn-primary" onClick={handleOpenAdd}>
              ➕ Add New Student
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Banner */}
        <div className="dashboard-stats">
          <div className="stat-pill">
            <span className="stat-num">{students.length}</span>
            <span className="stat-txt">Enrolled Students</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">5</span>
            <span className="stat-txt">Active REST Endpoints</span>
          </div>
          <div className="stat-pill">
            <span className="stat-num">MongoDB</span>
            <span className="stat-txt">Atlas Persistence</span>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="error-banner">
            <div className="error-content">
              <strong>Connection Notice:</strong> {error}
              <br />
              <small>Ensure the Express REST API backend is running at <code>{API_BASE_URL}</code>.</small>
            </div>
            <button className="btn btn-sm btn-outline" onClick={loadData}>Try Again</button>
          </div>
        )}

        {/* Loading State */}
        {loading && !error && (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading students from MongoDB...</p>
          </div>
        )}

        {/* Student Table / List */}
        {!loading && !error && (
          <StudentList
            students={students}
            onEdit={handleOpenEdit}
            onDelete={handleDeleteStudent}
            onRefresh={loadData}
            loading={loading}
          />
        )}
      </main>

      {/* Modal Form */}
      {showForm && (
        <StudentForm
          initialStudent={editingStudent}
          onSave={handleSaveStudent}
          onCancel={handleCloseForm}
          submitting={submitting}
        />
      )}

      <footer className="app-footer">
        <p>© 2026 CampusConnect · Web Services & SOA Laboratory Lab 4</p>
      </footer>
    </div>
  );
}
