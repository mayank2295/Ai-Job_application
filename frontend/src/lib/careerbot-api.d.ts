export function extractPdfText(file: File): Promise<string>;
export function runAgent(
  messages: any[],
  onStatus?: (msg: string) => void,
  onCourses?: (courses: any[]) => void,
  onProfiles?: (profiles: any[]) => void
): Promise<string>;
export function analyzeATS(resumeText: string, jobDesc?: string): Promise<any>;
export function findCoursesOnline(topic: string): Promise<any[]>;
export function webSearch(query: string): Promise<{ answer: string; results: any[] }>;
export function scrapeProfiles(query: string): Promise<any>;
export function optimizeLinkedin(resumeText: string, targetRole: string): Promise<any>;
export function callLLM(history: any[]): Promise<{ choices: [{ message: { content: string } }] }>;
export function loadSessions(userId: string, botType?: string): Promise<any[]>;
export function saveSession(userId: string, session: any, botType?: string): Promise<void>;
export function deleteSession(sessionId: string): Promise<void>;
export function createSession(title?: string): { id: string; title: string; messages: any[]; createdAt: string; updatedAt: string };
export function renderMarkdown(text: string): string;
