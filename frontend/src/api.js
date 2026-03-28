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
export const getQuestions = (difficulty, topic) => {
  const params = new URLSearchParams();
  if (difficulty) params.append('difficulty', difficulty);
  if (topic && topic !== 'All') params.append('topic', topic);
  const qStr = params.toString();
  return request(`/questions${qStr ? `?${qStr}` : ''}`);
};
export const getQuestion = (id) => request(`/questions/${id}`);
export const createQuestion = (body) => request('/questions', { method: 'POST', body: JSON.stringify(body) });
export const deleteQuestion = (id) => request(`/questions/${id}`, { method: 'DELETE' });
export const getQuestionAnswer = (id) => request(`/questions/${id}/answer`);
export const analyzeQuestion = (body) => request('/questions/analyze', { method: 'POST', body: JSON.stringify(body) });
export const getSyllabusMeta = () => request('/questions/meta/syllabus');

// Validation
export const validateSteps = (body) => request('/validate', { method: 'POST', body: JSON.stringify(body) });
export const getHint = (body) => request('/hint', { method: 'POST', body: JSON.stringify(body) });
export const visionParse = (body) => request('/vision-parse', { method: 'POST', body: JSON.stringify(body) });

// Submissions
export const getSubmissions = () => request('/submissions');
export const getSubmission = (id) => request(`/submissions/${id}`);
export const deleteSubmission = (id) => request(`/submissions/${id}`, { method: 'DELETE' });
// Dashboard
export const getTeacherDashboard = () => request('/dashboard/teacher');
export const getStudentDashboard = () => request('/dashboard/student');

export const downloadTeacherReport = () => {
  const token = getToken();
  return fetch(`${API_BASE}/dashboard/teacher/report`, {
    headers: { Authorization: `Bearer ${token}` }
  }).then(res => {
    if (!res.ok) throw new Error("Failed to download report");
    return res.blob();
  }).then(blob => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'student_performance_report.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
  });
};
