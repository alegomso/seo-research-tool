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
export declare class DataForSEOClient {
    private client;
    private credentials;
    constructor(credentials?: Partial<DataForSEOCredentials>);
    private setupInterceptors;
    postTask(endpoint: string, data: any[]): Promise<TaskPostResponse>;
    getTaskResult(taskId: string, endpoint: string): Promise<TaskGetResponse>;
    getTasksReady(endpoint: string): Promise<TaskGetResponse>;
    isTaskCompleted(task: any): boolean;
    hasTaskError(task: any): boolean;
    getAccountInfo(): Promise<any>;
    healthCheck(): Promise<boolean>;
}
//# sourceMappingURL=client.d.ts.map