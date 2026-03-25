export type UserRole = "citizen" | "department" | "admin";
export type IssueStatus = "pending" | "ai-verified" | "in-progress" | "resolved";
export type IssueUrgency = "low" | "medium" | "high" | "critical";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  points: number;
  streak: number;
  createdAt: number;
  departmentName?: string;
}

export interface Issue {
  id: string;
  title: string;
  description: string;
  category: string;
  status: IssueStatus;
  urgency: IssueUrgency;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  reporterId: string;
  reporterName: string;
  createdAt: number;
  updatedAt: number;
  rewardPoints: number;
  mediaUrl: string;
  mediaType: "image" | "video";
  contactNumber: string;
  assignedDepartment?: string;
  masterTicketId?: string;
  fixedMediaUrl?: string;
  aiAnalysis?: {
    summary: string;
    suggestedDepartment: string;
    confidence?: number;
  };
}

export interface Department {
  id: string;
  name: string;
  category: string;
}
