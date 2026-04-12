const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Applications
  getApplications: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ applications: any[]; total: number }>(`/applications${query}`);
  },

  getApplication: (id: string) =>
    request<{ application: any; workflowLogs: any[]; followUps: any[] }>(`/applications/${id}`),

  createApplication: (data: any) =>
    request<{ application: any; message: string }>('/applications', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStatus: (id: string, status: string, notes?: string) =>
    request<{ application: any }>(`/applications/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status, notes }),
    }),

  deleteApplication: (id: string) =>
    request<{ message: string }>(`/applications/${id}`, { method: 'DELETE' }),

  getStats: () =>
    request<{ stats: any; recentActivity: any[]; workflowStats: any[] }>('/applications/stats'),

  // Resumes
  uploadResume: async (applicationId: string, file: File) => {
    const formData = new FormData();
    formData.append('resume', file);

    const response = await fetch(`${API_BASE}/resumes/upload/${applicationId}`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || 'Upload failed');
    }

    return response.json();
  },

  // Workflows
  getWorkflowLogs: () =>
    request<{ logs: any[]; stats: any[] }>('/webhooks/workflow-logs'),

  testTrigger: (flowType: string) =>
    request<any>('/webhooks/test-trigger', {
      method: 'POST',
      body: JSON.stringify({ flowType }),
    }),

  // Settings
  getSettings: () => request<Record<string, string>>('/settings'),

  updateSettings: (settings: Record<string, string>) =>
    request<{ message: string }>('/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    }),

  // Health
  checkHealth: () => request<any>('/health'),

  // AI
  chatWithAI: (messages: any[]) =>
    request<{ text: string }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ messages }),
    }),
};
