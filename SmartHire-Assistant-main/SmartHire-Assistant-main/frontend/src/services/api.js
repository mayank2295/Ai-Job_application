import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

// Auth
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
}

// Job Descriptions
export const jdApi = {
  getActive: () => api.get('/jds'),
  getAll: () => api.get('/jds/all'),
  getById: (id) => api.get(`/jds/${id}`),
  create: (data) => api.post('/jds', data),
  update: (id, data) => api.put(`/jds/${id}`, data),
  deactivate: (id) => api.delete(`/jds/${id}`),
}

// Chat
export const chatApi = {
  send: (data) => api.post('/chat', data),
  getHistory: (sessionId) => api.get(`/chat/history/${sessionId}`),
}

// Candidates
export const candidateApi = {
  registerInterest: (data) => api.post('/candidates/interest', data),
  getAll: () => api.get('/candidates'),
  getByJd: (jdId) => api.get(`/candidates/jd/${jdId}`),
  getById: (id) => api.get(`/candidates/${id}`),
  checkInterest: (email, jdId) => api.get('/candidates/check', { params: { email, jdId } }),
}

// Resume
export const resumeApi = {
  upload: (file, candidateId, jdId) => {
    const form = new FormData()
    form.append('file', file)
    form.append('candidateId', candidateId)
    form.append('jdId', jdId)
    return api.post('/resume/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

// Analytics
export const analyticsApi = {
  getSummary: () => api.get('/analytics/summary'),
}

export default api
