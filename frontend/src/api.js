const API_BASE = 'http://localhost:8000/api';

function getToken() {
  return localStorage.getItem('token');
}

function authHeaders() {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(url, options = {}) {
  const res = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...authHeaders(),
      ...options.headers,
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.detail || 'Request failed');
  }
  return data;
}

// Auth
export const signup = (body) => request('/auth/signup', { method: 'POST', body: JSON.stringify(body) });
export const login = (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) });

// Questions
export const getQuestions = (difficulty) => request(`/questions${difficulty ? `?difficulty=${difficulty}` : ''}`);
export const getQuestion = (id) => request(`/questions/${id}`);
export const createQuestion = (body) => request('/questions', { method: 'POST', body: JSON.stringify(body) });
export const deleteQuestion = (id) => request(`/questions/${id}`, { method: 'DELETE' });

// Validation
export const validateSteps = (body) => request('/validate', { method: 'POST', body: JSON.stringify(body) });
export const getHint = (body) => request('/hint', { method: 'POST', body: JSON.stringify(body) });

// Submissions
export const getSubmissions = () => request('/submissions');

// Dashboard
export const getTeacherDashboard = () => request('/dashboard/teacher');
export const getStudentDashboard = () => request('/dashboard/student');
