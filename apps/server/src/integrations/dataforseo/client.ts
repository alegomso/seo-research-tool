import axios, { AxiosInstance, AxiosResponse } from 'axios';
import getEnvConfig from '../../config/env.js';

const env = getEnvConfig();

export interface DataForSEOCredentials {
  login: string;
  password: string;
  baseUrl: string;
}

export interface TaskPostResponse {
  version: string;
  status_code: number;
  status_message: string;
  time: string;
  cost: number;
  tasks_count: number;
  tasks_error: number;
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: any;
    result: any[] | null;
  }>;
}

export interface TaskGetResponse extends TaskPostResponse {
  tasks: Array<{
    id: string;
    status_code: number;
    status_message: string;
    time: string;
    cost: number;
    result_count: number;
    path: string[];
    data: any;
    result: any[] | null;
  }>;
}

export class DataForSEOClient {
  private client: AxiosInstance;
  private credentials: DataForSEOCredentials;

  constructor(credentials?: Partial<DataForSEOCredentials>) {
    this.credentials = {
      login: credentials?.login || env.DATAFORSEO_LOGIN,
      password: credentials?.password || env.DATAFORSEO_PASSWORD,
      baseUrl: credentials?.baseUrl || env.DATAFORSEO_BASE_URL,
    };

    this.client = axios.create({
      baseURL: this.credentials.baseUrl,
      auth: {
        username: this.credentials.login,
        password: this.credentials.password,
      },
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'SEO-Portal/1.0',
      },
      timeout: 30000, // 30 seconds
    });

    // Add request/response interceptors for logging and error handling
    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🔵 DataForSEO API Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('🔴 DataForSEO API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(
          `🟢 DataForSEO API Response: ${response.status} ${response.config.method?.toUpperCase()} ${
            response.config.url
          }`
        );
        return response;
      },
      (error) => {
        console.error('🔴 DataForSEO API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          method: error.config?.method,
        });
        return Promise.reject(error);
      }
    );
  }

  // Generic method to post tasks
  async postTask(endpoint: string, data: any[]): Promise<TaskPostResponse> {
    try {
      const response: AxiosResponse<TaskPostResponse> = await this.client.post(endpoint, data);
      return response.data;
    } catch (error) {
      console.error(`Error posting task to ${endpoint}:`, error);
      throw error;
    }
  }

  // Generic method to get task results
  async getTaskResult(taskId: string, endpoint: string): Promise<TaskGetResponse> {
    try {
      const response: AxiosResponse<TaskGetResponse> = await this.client.get(
        `${endpoint}/${taskId}`
      );
      return response.data;
    } catch (error) {
      console.error(`Error getting task result ${taskId} from ${endpoint}:`, error);
      throw error;
    }
  }

  // Generic method to get tasks ready
  async getTasksReady(endpoint: string): Promise<TaskGetResponse> {
    try {
      const response: AxiosResponse<TaskGetResponse> = await this.client.get(endpoint);
      return response.data;
    } catch (error) {
      console.error(`Error getting tasks ready from ${endpoint}:`, error);
      throw error;
    }
  }

  // Utility method to check if tasks are completed
  isTaskCompleted(task: any): boolean {
    return task.status_code === 20000; // 20000 means success
  }

  // Utility method to check if task has error
  hasTaskError(task: any): boolean {
    return task.status_code >= 40000; // 40000+ means error
  }

  // Get account information and remaining credits
  async getAccountInfo(): Promise<any> {
    try {
      const response = await this.client.get('/v3/user_data/info');
      return response.data;
    } catch (error) {
      console.error('Error getting account info:', error);
      throw error;
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/v3/user_data/info');
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}