// Shared types between client and server

export enum AgentStatus {
    IDLE = 'IDLE',
    PROCESSING = 'PROCESSING',
    WAITING_APPROVAL = 'WAITING_APPROVAL',
    COMPLETED = 'COMPLETED',
    FAILED = 'FAILED'
}

export enum TaskStatus {
    TODO = 'TODO',
    IN_PROGRESS = 'IN_PROGRESS',
    DONE = 'DONE'
}

export enum UserRole {
    TEAM_LEAD = 'team_lead',
    DEVELOPER = 'developer',
    TESTER = 'tester'
}

export interface UserProfile {
    uid: string;
    email: string;
    displayName: string;
    role: UserRole;
    slackId?: string;
}

export interface SRSSection {
    title: string;
    content: string;
}

export interface SRS {
    id?: string;
    title: string;
    overview: string;
    sections: SRSSection[];
    generatedAt: string;
    approvedAt?: string;
    approvedBy?: string;
    status: 'draft' | 'approved';
}

export interface Meeting {
    id?: string;
    title: string;
    date: string;
    duration: string;
    agenda: string[];
    attendees: string[];
    meetLink: string;
    calendarEventId?: string;
    status: 'tentative' | 'confirmed';
}

export interface Task {
    id: string;
    title: string;
    description: string;
    assignee: string;
    assigneeUid?: string;
    status: TaskStatus;
    resourcesNeeded: string[];
    missingResources?: string[];
    createdAt?: string;
}

export interface Blocker {
    id: string;
    description: string;
    reportedBy: string;
    reportedByUid?: string;
    timestamp: string;
    aiSolution?: string;
    status: 'OPEN' | 'RESOLVED' | 'ESCALATED';
    resolvedAt?: string;
}

export interface AgentStatuses {
    ba: AgentStatus;
    coordinator: AgentStatus;
    techLead: AgentStatus;
    scrumMaster: AgentStatus;
}

export interface Project {
    id?: string;
    name: string;
    createdBy: string;
    createdAt: string;
    status: 'active' | 'completed';
    rawRequirements: string;
    activeAgent: number;
    agentStatuses: AgentStatuses;
    teamMembers: string[];
}
