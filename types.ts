export enum AppView {
  LANDING = 'LANDING',
  AUTH = 'AUTH',
  DASHBOARD = 'DASHBOARD',
}

export enum DashboardTab {
  HOME = 'HOME',
  UPLOAD = 'UPLOAD',
  NOTES = 'NOTES',
  QUIZ = 'QUIZ',
  PERFORMANCE = 'PERFORMANCE',
  RESULTS = 'RESULTS',
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS',
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface QuizResult {
  score: number;
  totalQuestions: number;
  userAnswers: number[]; // Array of indices selected by user
  questions: QuizQuestion[];
  feedback: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface UploadedFile {
  name: string;
  type: string;
  data: string; // Base64 string
}

export interface GeneratedContent {
  notes: string; // Markdown formatted string
  quiz: QuizQuestion[];
}

export interface StudyProject {
  id: string;
  file: UploadedFile;
  content: GeneratedContent | null;
  quizResult: QuizResult | null;
  timestamp: number;
}

export interface UserProfile {
  name: string;
  email: string;
  studyGoal: string;
}