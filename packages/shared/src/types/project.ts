export interface Project {
  id: string;
  name: string;
  description?: string;
  owner_id: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectMember {
  id: string;
  project_id: string;
  user_id: string;
  role: 'viewer' | 'editor' | 'admin';
  createdAt: Date;
}