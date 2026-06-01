import axios from 'axios';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401 && error.response?.data?.expired) {
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const { data } = await axios.post('/api/auth/refresh', { refreshToken });
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          error.config.headers.Authorization = `Bearer ${data.accessToken}`;
          return axios(error.config);
        } catch {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    const msg = error.response?.data?.error || error.message || 'Something went wrong';
    if (error.config?.showToast !== false) toast.error(msg);
    return Promise.reject(error);
  }
);

export const auth = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  updateProfile: (data) => api.put('/auth/me', data),
  changePassword: (data) => api.put('/auth/change-password', data),
};

export const users = {
  list: (params) => api.get('/users', { params }),
  get: (id) => api.get(`/users/${id}`),
  update: (id, data) => api.put(`/users/${id}`, data),
  deactivate: (id) => api.delete(`/users/${id}`),
  enroll: (id, courseId) => api.post(`/users/${id}/enroll`, { courseId }),
  removeCourse: (id, courseId) => api.post(`/users/${id}/remove-course`, { courseId }),
};

export const courses = {
  list: (params) => api.get('/courses', { params }),
  get: (id) => api.get(`/courses/${id}`),
  create: (data) => api.post('/courses', data),
  update: (id, data) => api.put(`/courses/${id}`, data),
  delete: (id) => api.delete(`/courses/${id}`),
  enroll: (code) => api.post('/courses/enroll', { code }),
  enrollStudents: (id, studentIds) => api.post(`/courses/${id}/enroll-students`, { studentIds }),
};

export const assignments = {
  list: (params) => api.get('/assignments', { params }),
  get: (id) => api.get(`/assignments/${id}`),
  create: (data) => api.post('/assignments', data),
  update: (id, data) => api.put(`/assignments/${id}`, data),
  delete: (id) => api.delete(`/assignments/${id}`),
  submissions: (id) => api.get(`/assignments/${id}/submissions`),
};

export const submissions = {
  submit: (formData) => api.post('/submissions/submit', formData, { headers: { 'Content-Type': 'multipart/form-data' }, showToast: false }),
  list: (params) => api.get('/submissions', { params }),
  get: (id) => api.get(`/submissions/${id}`),
  grade: (id, data) => api.put(`/submissions/${id}/grade`, data),
  feedback: (id, formData) => api.put(`/submissions/${id}/feedback`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/submissions/${id}`),
  runPlagiarism: (id) => api.post(`/submissions/${id}/run-plagiarism`),
};

export const plagiarism = {
  reports: (params) => api.get('/plagiarism/reports', { params }),
  getReport: (id) => api.get(`/plagiarism/reports/${id}`),
  analyze: (submissionId) => api.post('/plagiarism/analyze', { submissionId }),
  analytics: (params) => api.get('/plagiarism/analytics', { params }),
};

export const admin = {
  stats: () => api.get('/admin/stats'),
  departments: () => api.get('/admin/departments'),
  createDepartment: (data) => api.post('/admin/departments', data),
  updateDepartment: (id, data) => api.put(`/admin/departments/${id}`, data),
  deleteDepartment: (id) => api.delete(`/admin/departments/${id}`),
  logs: (params) => api.get('/admin/logs', { params }),
  exportReport: (params) => api.get('/admin/reports/export', { params, responseType: 'blob' }),
};

export const notifications = {
  list: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`),
};

export default api;
