/// <reference types="vite/client" />
import { firebaseAuth } from './firebase';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

/**
 * Get the current user's Firebase ID token for API authentication.
 */
const getAuthToken = async (): Promise<string> => {
    const user = firebaseAuth.currentUser;
    if (!user) throw new Error('Not authenticated');
    return user.getIdToken();
};

/**
 * Make an authenticated API request.
 */
const apiRequest = async (path: string, options: RequestInit = {}): Promise<any> => {
    const token = await getAuthToken();

    const response = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
            ...options.headers,
        },
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.error || 'API request failed');
    }

    return data;
};

// ========================
// Health Check
// ========================
export const checkHealth = async () => {
    const res = await fetch(`${API_BASE}/api/health`);
    return res.json();
};

// ========================
// Projects
// ========================
export const createProject = (name: string) =>
    apiRequest('/api/projects', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });

export const listProjects = () =>
    apiRequest('/api/projects');

export const getProject = (projectId: string) =>
    apiRequest(`/api/projects/${projectId}`);

export const addProjectMember = (projectId: string, memberUid: string) =>
    apiRequest(`/api/projects/${projectId}/add-member`, {
        method: 'POST',
        body: JSON.stringify({ memberUid }),
    });

export const removeProjectMember = (projectId: string, memberUid: string) =>
    apiRequest(`/api/projects/${projectId}/remove-member`, {
        method: 'POST',
        body: JSON.stringify({ memberUid }),
    });

// ========================
// Agent 1: Business Analyst (SRS)
// ========================
export const generateSRS = (projectId: string, rawRequirements: string) =>
    apiRequest('/api/agent1/generate-srs', {
        method: 'POST',
        body: JSON.stringify({ projectId, rawRequirements }),
    });

export const approveSRS = (projectId: string, srsId: string) =>
    apiRequest('/api/agent1/approve-srs', {
        method: 'POST',
        body: JSON.stringify({ projectId, srsId }),
    });

// ========================
// Agent 2: Coordinator (Meeting)
// ========================
export const scheduleMeeting = (projectId: string) =>
    apiRequest('/api/agent2/schedule-meeting', {
        method: 'POST',
        body: JSON.stringify({ projectId }),
    });

export const confirmMeeting = (projectId: string, meetingId: string) =>
    apiRequest('/api/agent2/confirm-meeting', {
        method: 'POST',
        body: JSON.stringify({ projectId, meetingId }),
    });

// ========================
// Agent 3: Tech Lead (Tasks)
// ========================
export const generateTasks = (projectId: string) =>
    apiRequest('/api/agent3/generate-tasks', {
        method: 'POST',
        body: JSON.stringify({ projectId }),
    });



export const updateTaskStatus = (projectId: string, taskId: string, status: string) =>
    apiRequest(`/api/agent3/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ projectId, status }),
    });

// ========================
// Agent 4: Scrum Master (Blockers)
// ========================
export const reportBlocker = (projectId: string, description: string) =>
    apiRequest('/api/agent4/report-blocker', {
        method: 'POST',
        body: JSON.stringify({ projectId, description }),
    });

export const resolveBlocker = (projectId: string, blockerId: string) =>
    apiRequest('/api/agent4/resolve-blocker', {
        method: 'POST',
        body: JSON.stringify({ projectId, blockerId }),
    });

export const escalateBlocker = (projectId: string, blockerId: string) =>
    apiRequest('/api/agent4/escalate-blocker', {
        method: 'POST',
        body: JSON.stringify({ projectId, blockerId }),
    });

// ========================
// Project Management
// ========================
export const resetAgent = (projectId: string, agentKey: string) =>
    apiRequest(`/api/projects/${projectId}/reset-agent`, {
        method: 'PATCH',
        body: JSON.stringify({ agentKey }),
    });

// ========================
// Auth / Role
// ========================
export const setUserRole = (targetUid: string, role: string) =>
    apiRequest('/api/projects/auth/set-role', {
        method: 'POST',
        body: JSON.stringify({ targetUid, role }),
    });

export const getUsers = () =>
    apiRequest('/api/users');
