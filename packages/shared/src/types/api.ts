// API Response Types

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
    requestId: string;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface FilterParams {
  search?: string;
  status?: string;
  type?: string;
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
  projectId?: string;
}

// Brief Types
export interface Brief {
  id: string;
  project_id: string;
  title: string;
  sections_json: BriefSection[];
  source_dataset_id?: string;
  version: number;
  created_by: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface BriefSection {
  id: string;
  type: 'heading' | 'paragraph' | 'list' | 'table' | 'chart';
  title?: string;
  content: any;
  order: number;
}

export interface BriefExport {
  id: string;
  brief_id: string;
  format: 'pdf' | 'docx' | 'notion' | 'markdown';
  url: string;
  expires_at: Date;
  created_by: string;
  createdAt: Date;
}