// Role types for Syncro
export type UserRole = 'superAdmin' | 'companyAdmin' | 'teamLead' | 'editor' | 'member';

// User interface
export interface User {
  uid: string;
  email: string;
  displayName: string;
  companyId: string;
  teamId?: string;
  role: UserRole;
  pending?: boolean;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Company interface
export interface Company {
  id: string;
  name: string;
  domain: string;
  plan: 'starter' | 'pro' | 'enterprise';
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attachment {
  name: string;
  url: string;
  path: string;
  type: string;
  size: number;
}

// Team interface
export interface Team {
  id: string;
  companyId: string;
  name: string;
  description?: string;
  leadId: string;
  editorIds: string[]; // Max 2 editors
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Task interface
export interface Task {
  id: string;
  companyId: string;
  teamId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  assigneeId?: string;
  dueDate?: string;
  priority: 'low' | 'medium' | 'high';
  attachments?: Attachment[];
  submissionText?: string;
  submissionAttachments?: Attachment[];
  submittedAt?: string;
  completedBy?: string;
  createdBy: string;
  updatedBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Attendance {
  id: string;
  companyId: string;
  teamId: string;
  userId: string;
  date: string;
  status: 'present';
  taskId: string;
  submittedAt: string;
  markedAt: string;
  shiftStart?: string;
  shiftEnd?: string;
}

// Daily work log interface
export interface WorkLog {
  id: string;
  companyId: string;
  teamId: string;
  userId: string;
  date: string; // YYYY-MM-DD format
  text: string; // Rich text content
  screenshotUrls: string[];
  attachments?: Attachment[];
  taskIds: string[];
  createdAt: string;
  updatedAt: string;
}

// Custom Firebase Auth claims
export interface CustomClaims {
  companyId: string;
  role: UserRole;
  teamId?: string;
}
