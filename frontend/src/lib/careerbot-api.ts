export * from './careerbot-api.js';
// Add explicit exports so TS knows they exist
export declare function extractPdfText(file: File): Promise<string>;
export declare function runAgent(messages: any[], onStatus?: any, onCourses?: any, onProfiles?: any): Promise<string>;
export declare function analyzeATS(resumeText: string, jobDesc?: string): Promise<any>;
export declare function findCoursesOnline(topic: string): Promise<any[]>;
export declare function webSearch(query: string): Promise<any>;
export declare function scrapeProfiles(query: string): Promise<any>;
export declare function callLLM(history: any[]): Promise<any>;
export declare function loadSessions(userId: string, botType?: string): Promise<any[]>;
export declare function saveSession(userId: string, session: any, botType?: string): Promise<void>;
export declare function deleteSession(sessionId: string): Promise<void>;
export declare function createSession(title: string): any;
export declare function renderMarkdown(text: string): string;
