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

export interface SRSSection {
  title: string;
  content: string;
}

export interface SRS {
  title: string;
  overview: string;
  sections: SRSSection[];
  generatedAt: string;
}

export interface Meeting {
  title: string;
  date: string;
  duration: string;
  agenda: string[];
  attendees: string[];
  link: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: TaskStatus;
  resourcesNeeded: string[];
  missingResources?: string[]; // Flag for Agent 3
}

export interface Blocker {
  id: string;
  description: string;
  reportedBy: string;
  timestamp: string;
  aiSolution?: string;
  status: 'OPEN' | 'RESOLVED' | 'ESCALATED';
}

export interface ProjectState {
  rawRequirements: string;
  srs: SRS | null;
  meeting: Meeting | null;
  tasks: Task[];
  blockers: Blocker[];
  activeAgent: number; // 1, 2, 3, 4
  agentStatuses: {
    ba: AgentStatus;
    coordinator: AgentStatus;
    techLead: AgentStatus;
    scrumMaster: AgentStatus;
  };
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  role: string;
  photoURL?: string;
}

export interface Project {
  id: string;
  name: string;
  rawRequirements: string;
  activeAgent: number;
  agentStatuses: {
    ba: AgentStatus;
    coordinator: AgentStatus;
    techLead: AgentStatus;
    scrumMaster: AgentStatus;
  };
  teamMembers?: string[];
}