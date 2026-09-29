// Central API Configuration & Request Handler
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export async function fetchStudents() {
  const response = await fetch(`${API_BASE_URL}/students`);
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Unable to load data. Please try again.');
  }
  return response.json();
}

export async function getStudentById(id) {
  const response = await fetch(`${API_BASE_URL}/students/${id}`);
  if (response.status === 404) {
    throw new Error('Student not found');
  }
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Unable to load data. Please try again.');
  }
  return response.json();
}

export async function createStudent(studentData) {
  const response = await fetch(`${API_BASE_URL}/students`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 400) {
    const detailMsg = data.details ? data.details.join(' | ') : data.message;
    throw new Error(detailMsg || 'Validation failed. Please check your input.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Server error while creating student.');
  }

  return data;
}

export async function updateStudent(id, studentData) {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(studentData)
  });

  const data = await response.json().catch(() => ({}));

  if (response.status === 404) {
    throw new Error('Student not found');
  }

  if (response.status === 400) {
    const detailMsg = data.details ? data.details.join(' | ') : data.message;
    throw new Error(detailMsg || 'Validation failed. Please check your input.');
  }

  if (!response.ok) {
    throw new Error(data.message || 'Server error while updating student.');
  }

  return data;
}

export async function deleteStudent(id) {
  const response = await fetch(`${API_BASE_URL}/students/${id}`, {
    method: 'DELETE'
  });

  if (response.status === 404) {
    throw new Error('Student not found');
  }

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.message || 'Server error while deleting student.');
  }

  return response.json().catch(() => ({ success: true }));
}

export { API_BASE_URL };
