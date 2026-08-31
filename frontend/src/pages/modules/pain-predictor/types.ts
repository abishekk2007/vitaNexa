export type PainLocation =
  | 'joint' | 'muscle' | 'back' | 'neck' | 'shoulder'
  | 'hip' | 'knee' | 'elbow' | 'wrist' | 'ankle'
  | 'head' | 'migraine' | 'temple' | 'forehead' | 'skull'
  | 'stomach' | 'abdomen' | 'belly' | 'gut' | 'nausea' | 'bowel'
  | 'chest' | 'heart' | 'lung'
  | 'general';

export type PainCategory = 'joint_muscle_back' | 'head_migraine' | 'stomach_abdomen' | 'chest' | 'general';

export interface PainData {
  location: string;
  whenStarted: string;
  date: string;
  painLevel: number;
  doctorConsultation: string;
  medication: string;
  diagnosis?: string;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
}

export interface ComfortGuidance {
  icon: string;
  accentColor: string;
  title: string;
  tips: string[];
  warnings: string[];
}

export type QuestionStep = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

export interface ContextualQuestion {
  key: string;
  question: string;
  buttons?: string[];
}

export interface PainReport {
  id: string;
  location: string;
  date: string;
  whenStarted: string;
  painLevel: number;
  doctorConsultation: string;
  medication: string;
  category: PainCategory;
  timestamp: number;
  riskLevel?: string;
  contextualAnswers?: Record<string, string>;
  reportFileName?: string;
  reportFileData?: string;
  reportAnalysis?: ReportAnalysis;
  conversation?: ChatMessage[];
  diagnosis?: string;
}

export interface ReportAnalysis {
  doctorName?: string;
  hospital?: string;
  diagnosis?: string;
  medications?: string;
  notes?: string;
}
