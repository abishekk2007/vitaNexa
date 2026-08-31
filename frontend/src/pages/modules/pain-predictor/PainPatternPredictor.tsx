import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, PainData, QuestionStep, PainReport, ContextualQuestion, ReportAnalysis } from './types';
import { classifyPain, getCategoryAccent, getCategoryLabel, getCategoryIcon } from './PainCategoryEngine';
import PainChatBubble from './PainChatBubble';
import EntryProgressCard from './EntryProgressCard';
import PainDots from './PainDots';
import PainCompletionCard from './PainCompletionCard';
import TypingDots from './TypingDots';
import api from '../../../api/client';

const coreQuestions: Record<QuestionStep, string> = {
  0: "Good morning. How are you feeling today?",
  1: 'Where does it hurt? Describe the location of your pain.',
  2: 'When did the pain start? For example: "this morning", "2 days ago", "last week".',
  3: "What's today's date? (DD/MM/YYYY)",
  4: 'On a scale of 1–10, how bad is the pain? (1 = mild, 10 = worst)',
  5: 'Have you seen a doctor about this pain?',
  6: 'Are you taking any medication for it?',
  7: 'Would you like to upload a medical report? (PDF, PNG, JPG)',
  8: '',
  9: '',
  10: '',
};

const fieldMap: Record<number, keyof PainData | null> = {
  1: 'location',
  2: 'whenStarted',
  3: 'date',
  4: 'painLevel',
  5: 'doctorConsultation',
  6: 'medication',
  7: null,
  8: null,
  9: null,
  10: null,
};

const contextualQuestionsByCategory: Record<string, ContextualQuestion[]> = {
  head_migraine: [
    { key: 'fever', question: 'Do you have a fever?', buttons: ['Yes', 'No'] },
    { key: 'dizziness', question: 'Are you feeling dizzy or lightheaded?', buttons: ['Yes', 'No'] },
    { key: 'headache_type', question: 'Is the pain throbbing or constant?', buttons: ['Throbbing', 'Constant', 'Sharp'] },
  ],
  chest: [
    { key: 'breathing', question: 'Are you having any difficulty breathing?', buttons: ['Yes', 'No'] },
    { key: 'sweating', question: 'Are you sweating excessively?', buttons: ['Yes', 'No'] },
    { key: 'heart_history', question: 'Do you have any history of heart problems?', buttons: ['Yes', 'No'] },
  ],
  joint_muscle_back: [
    { key: 'injury', question: 'Did you have any recent injury?', buttons: ['Yes', 'No'] },
    { key: 'swelling', question: 'Is there any swelling?', buttons: ['Yes', 'No'] },
    { key: 'difficulty_moving', question: 'Do you have difficulty moving?', buttons: ['Yes', 'No'] },
  ],
  stomach_abdomen: [
    { key: 'nausea', question: 'Do you feel nauseous?', buttons: ['Yes', 'No'] },
    { key: 'appetite', question: 'Have you lost your appetite?', buttons: ['Yes', 'No'] },
    { key: 'stool_changes', question: 'Any changes in bowel movements?', buttons: ['Yes', 'No'] },
  ],
  general: [
    { key: 'trigger', question: 'Do you know what might have triggered it?', buttons: ['Stress', 'Food', 'Activity', 'Not sure'] },
    { key: 'duration', question: 'How long does the pain last?', buttons: ['Minutes', 'Hours', 'Days', 'Constant'] },
  ],
};

const casualGreetings: { patterns: string[]; response: string }[] = [
  { patterns: ['hi', 'hello', 'hey', 'hi there', 'hello there'], response: "Hi there! How are you feeling today? If you're experiencing any pain, I can help you log and track it." },
  { patterns: ['good morning', 'gm'], response: "Good morning. I hope you're feeling well today. If you're experiencing any pain, I can help you log and track it." },
  { patterns: ['good afternoon'], response: "Good afternoon. I hope your day is going well. If you need help tracking any symptoms, I'm here." },
  { patterns: ['good evening'], response: "Good evening. I hope you've had a good day. If you're experiencing any discomfort, I can help log it." },
  { patterns: ['how are you', 'how r u', 'how are u'], response: "I'm doing well, thank you for asking. More importantly, how are you feeling today?" },
  { patterns: ['thank you', 'thanks', 'thank u', 'thx'], response: "You're welcome. Let me know if you'd like help tracking any symptoms." },
  { patterns: ['had you lunch', 'had you dinner', 'had you breakfast', 'did you eat'], response: "I don't eat meals, but thank you for asking. How are you feeling today?" },
  { patterns: ['bye', 'goodbye', 'see you', 'take care'], response: "Take care! If you ever need to track pain or symptoms again, I'll be here. Stay well!" },
  { patterns: ['whats up', "what's up", 'sup'], response: "Just here to help you track any pain or symptoms. How can I assist?" },
];

const negativeFeelingPatterns = [
  'not good', 'not feeling good', 'not great', 'feeling bad', 'feeling worse',
  'terrible', 'horrible', 'awful', 'in pain', 'hurts', 'sad',
  'depressed', 'anxious', 'worried', 'scared', 'not okay', 'unwell',
];

const yesNoButtons = ['Yes', 'No'];
const severityButtons = ['Mild', 'Moderate', 'Severe'];
const dateButtons = ['Today', 'Yesterday', 'This week'];

const knownMedications: Record<string, string> = {
  paracetamol: 'Paracetamol is commonly used for pain and fever relief. Has it reduced your symptoms?',
  'dolo 650': 'Dolo 650 is commonly used for fever and body pain. Are you feeling any improvement after taking it?',
  crocin: 'Crocin is commonly used for fever and pain relief. Are you noticing any improvement?',
  amoxicillin: 'Amoxicillin is an antibiotic used for bacterial infections. Are you experiencing any improvement in your symptoms?',
  ibuprofen: 'Ibuprofen is often used to reduce pain and inflammation. Has it helped with your discomfort?',
  cetirizine: 'Cetirizine is an antihistamine used for allergies. Are you finding relief from your symptoms?',
  pantoprazole: 'Pantoprazole is used to reduce stomach acid. Has it been helping with your discomfort?',
};

const defaultMedicationResponse = 'Thank you for sharing your medication. I have recorded it in your assessment.';

const knownDiagnoses: Record<string, string> = {
  migraine: 'Migraine can sometimes be associated with headaches, light sensitivity, and discomfort. I have added this information to your assessment.',
  sinusitis: 'Thank you. I have recorded sinusitis in your assessment.',
  gastritis: 'Gastritis information has been added to your report.',
  arthritis: 'Arthritis can involve joint inflammation and stiffness. I have recorded this in your assessment.',
  fibromyalgia: 'Fibromyalgia can be associated with widespread musculoskeletal pain. I have noted this in your assessment.',
  'cervical spondylosis': 'Cervical spondylosis can involve neck pain and stiffness. I have added this to your assessment.',
};

const defaultDiagnosisResponse = 'I have recorded the diagnosis information for future reference.';

const empathyPatterns = [
  { words: ['pain', 'hurts', 'suffering'], response: "I'm sorry you're experiencing that." },
  { words: ['not good', 'worried', 'anxious'], response: "That sounds uncomfortable." },
  { words: ['tired', "can't sleep", 'headache', 'severe'], response: "Thank you for sharing that." },
];

function generateId(): string {
  return `msg-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
}

function getCasualResponse(input: string): string | null {
  const normalized = input.toLowerCase().trim().replace(/[.!?]+$/, '');
  for (const greeting of casualGreetings) {
    if (greeting.patterns.some(p => normalized === p || normalized.startsWith(p + ' ') || normalized.startsWith(p + '!') || normalized.startsWith(p + '?'))) {
      return greeting.response;
    }
  }
  return null;
}

function assessRisk(cat: string, painLevel: number, cAnswers: Record<string, string>): string {
  const val = (key: string) => cAnswers[key]?.toLowerCase() || '';
  const yes = (key: string) => val(key) === 'yes' || val(key) === 'y';
  if (cat === 'chest') {
    if (yes('breathing') || yes('sweating') || yes('heart_history')) return 'High';
  }
  if (painLevel >= 8) return 'High';
  if (cat === 'head_migraine' && painLevel >= 7) {
    if (yes('fever') || yes('dizziness')) return 'Moderate';
  }
  if (painLevel >= 5) return 'Moderate';
  return 'Low';
}

function mockReportAnalysis(fileName: string): ReportAnalysis {
  const name = fileName.toLowerCase();
  if (name.includes('migraine') || name.includes('head')) {
    return { diagnosis: 'Migraine', medications: 'Paracetamol / Triptan', doctorName: 'Dr. Kumar', hospital: 'City Hospital', notes: 'Patient reports recurring headaches with aura.' };
  }
  if (name.includes('chest') || name.includes('heart')) {
    return { diagnosis: 'Chest pain evaluation', medications: 'Aspirin / Nitroglycerin', doctorName: 'Dr. Sharma', hospital: 'Heart Care Center', notes: 'ECG recommended.' };
  }
  if (name.includes('report') || name.includes('lab')) {
    return { diagnosis: 'General checkup', medications: 'As prescribed', doctorName: 'Dr. Patel', hospital: 'General Hospital', notes: 'Routine analysis.' };
  }
  return { diagnosis: 'Not specified (file-based estimate)', medications: 'See attached report', doctorName: '—', hospital: '—', notes: 'Upload full report for detailed analysis.' };
}

function loadReports(): PainReport[] {
  try {
    const stored = localStorage.getItem('painReports');
    return stored ? JSON.parse(stored) : [];
  } catch { return []; }
}

function saveReportToStorage(report: PainReport): PainReport[] {
  const existing = loadReports();
  const idx = existing.findIndex(r => r.id === report.id);
  if (idx >= 0) {
    existing[idx] = report;
  } else {
    existing.unshift(report);
  }
  localStorage.setItem('painReports', JSON.stringify(existing));
  return existing;
}

function deleteReportFromStorage(id: string): PainReport[] {
  return loadReports().filter(r => r.id !== id);
}

function formatConversation(messages: ChatMessage[]): ChatMessage[] {
  return messages.map(m => ({ ...m, timestamp: new Date(m.timestamp) }));
}

export default function PainPatternPredictor() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<QuestionStep>(0);
  const [painData, setPainData] = useState<PainData>({
    location: '', whenStarted: '', date: '', painLevel: 0,
    doctorConsultation: '', medication: '',
  });
  const [category, setCategory] = useState<string>('general');
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [showCompletion, setShowCompletion] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [history, setHistory] = useState<PainReport[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [contextualAnswers, setContextualAnswers] = useState<Record<string, string>>({});
  const [contextualIdx, setContextualIdx] = useState(0);
  const [isAskingContextual, setIsAskingContextual] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [reportAnalysis, setReportAnalysis] = useState<ReportAnalysis | null>(null);
  const [riskLevel, setRiskLevel] = useState<string>('');
  const [diagnosis, setDiagnosis] = useState('');
  const [medicationName, setMedicationName] = useState('');
  const [empathyUsed, setEmpathyUsed] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const recognitionRef = useRef<any>(null);
  const [editModal, setEditModal] = useState<string | null>(null);
  const [viewModal, setViewModal] = useState<string | null>(null);
  const [editValues, setEditValues] = useState({ painLevel: 0, doctorConsultation: '', medication: '', notes: '' });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const painDataRef = useRef(painData);
  painDataRef.current = painData;
  const categoryRef = useRef(category);
  categoryRef.current = category;
  const messagesRef = useRef<ChatMessage[]>([]);
  messagesRef.current = messages;
  const contextualAnswersRef = useRef(contextualAnswers);
  contextualAnswersRef.current = contextualAnswers;
  const diagnosisRef = useRef(diagnosis);
  diagnosisRef.current = diagnosis;
  const medicationNameRef = useRef(medicationName);
  medicationNameRef.current = medicationName;

  const addAssistantMessage = useCallback((text: string, delay = 600) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: generateId(), text, sender: 'assistant', timestamp: new Date() },
      ]);
      setIsTyping(false);
    }, delay);
  }, []);

  const addUserMessage = useCallback((text: string) => {
    setMessages((prev) => [
      ...prev,
      { id: generateId(), text, sender: 'user', timestamp: new Date() },
    ]);
  }, []);

  const storeAnswer = useCallback((step: QuestionStep, answer: string) => {
    const field = fieldMap[step];
    if (!field) return;
    if (field === 'painLevel') {
      const level = Math.min(10, Math.max(1, parseInt(answer, 10) || 1));
      setPainData((prev) => ({ ...prev, painLevel: level }));
    } else {
      setPainData((prev) => {
        const updated = { ...prev, [field]: answer };
        if (step === 1) {
          const { category: cat } = classifyPain(answer);
          setCategory(cat);
        }
        return updated;
      });
    }
  }, []);

  const finalizeAssessment = useCallback(() => {
    setIsFinalizing(true);
    const currentMessages = messagesRef.current;
    const currentPainData = painDataRef.current;
    const currentCat = categoryRef.current as any;
    const currentCA = contextualAnswersRef.current;
    const risk = assessRisk(currentCat, currentPainData.painLevel, currentCA);
    setRiskLevel(risk);
    const report: PainReport = {
      id: generateId(),
      location: currentPainData.location,
      date: currentPainData.date,
      whenStarted: currentPainData.whenStarted,
      painLevel: currentPainData.painLevel,
      doctorConsultation: currentPainData.doctorConsultation,
      medication: medicationNameRef.current || currentPainData.medication,
      category: currentCat,
      timestamp: Date.now(),
      riskLevel: risk,
      contextualAnswers: currentCA,
      diagnosis: diagnosisRef.current || undefined,
      conversation: formatConversation(currentMessages),
    };
    const updated = saveReportToStorage(report);
    setHistory(updated);
    setIsSaved(true);
    addAssistantMessage('Thank you for completing your pain assessment.', 300);
    setTimeout(() => {
      addAssistantMessage('Your responses have been saved successfully.', 500);
    }, 1500);
    setTimeout(() => {
      const summary = `Here is your summary:\nLocation: ${report.location}\nPain Level: ${report.painLevel}/10\nDoctor Consulted: ${report.doctorConsultation}${report.diagnosis ? `\nDiagnosis: ${report.diagnosis}` : ''}\nMedication: ${medicationNameRef.current || report.medication || 'None'}\nRisk Level: ${risk}\nAssessment Date: ${report.date || new Date().toLocaleDateString()}`;
      addAssistantMessage(summary, 500);
    }, 3500);
    setTimeout(() => {
      addAssistantMessage('If symptoms worsen or become severe, please consult a qualified healthcare professional.', 500);
    }, 5500);
    setTimeout(() => {
      addAssistantMessage('I hope you feel better soon. Take care.', 500);
      setShowCompletion(true);
    }, 7500);
    console.log('Saving assessment...');
    api.post('/pain-assessments', {
      location: report.location,
      whenStarted: report.whenStarted,
      assessmentDate: report.date,
      painLevel: report.painLevel,
      doctorConsulted: report.doctorConsultation,
      medication: medicationNameRef.current || report.medication,
      painCategory: report.category,
      riskLevel: report.riskLevel,
      conversation: JSON.stringify(report.conversation),
      notes: report.reportFileName ? `Report: ${report.reportFileName}` : undefined,
      reportAnalysis: report.reportAnalysis ? JSON.stringify(report.reportAnalysis) : undefined,
    }).then(res => {
      console.log('Assessment saved. Assessment ID:', res.data.id);
    }).catch(err => {
      console.error('Failed to save assessment:', err?.response?.data || err.message);
    });
  }, [addAssistantMessage]);

  const advanceStep = useCallback(() => {
    const next = (currentStep + 1) as QuestionStep;
    if (next > 10) {
      finalizeAssessment();
      return;
    }
    if (next === 7) {
      setShowUpload(true);
      addAssistantMessage(coreQuestions[7], 600);
      setCurrentStep(7);
      return;
    }
    if (next === 8) {
      setCurrentStep(8);
      addAssistantMessage('Let me summarize everything for you.', 500);
      setTimeout(() => finalizeAssessment(), 1500);
      return;
    }
    setCurrentStep(next);
    if (next >= 1 && next <= 6) {
      if (next === 5 || next === 6) {
        addAssistantMessage(coreQuestions[next], 700);
      } else {
        addAssistantMessage(coreQuestions[next], 700);
      }
    }
  }, [currentStep, addAssistantMessage, finalizeAssessment]);

  const startContextualQuestions = useCallback((cat: string) => {
    const questions = contextualQuestionsByCategory[cat] || contextualQuestionsByCategory.general;
    if (questions.length === 0) {
      advanceStep();
      return;
    }
    setIsAskingContextual(true);
    setContextualIdx(0);
    setContextualAnswers({});
    addAssistantMessage(questions[0].question, 700);
  }, [addAssistantMessage, advanceStep]);

  const answerContextual = useCallback((answer: string, key: string) => {
    setContextualAnswers(prev => ({ ...prev, [key]: answer }));
    const questions = contextualQuestionsByCategory[categoryRef.current] || contextualQuestionsByCategory.general;
    const nextIdx = contextualIdx + 1;
    if (nextIdx < questions.length) {
      setContextualIdx(nextIdx);
      addAssistantMessage(questions[nextIdx].question, 500);
    } else {
      setIsAskingContextual(false);
      setContextualIdx(0);
      advanceStep();
    }
  }, [contextualIdx, addAssistantMessage, advanceStep]);

  const handleDiagnosisInput = useCallback((answer: string) => {
    setDiagnosis(answer);
    const normalized = answer.toLowerCase().trim();
    const known = Object.entries(knownDiagnoses).find(([key]) => normalized.includes(key));
    const response = known ? `Thank you for sharing your diagnosis. ${known[1]}` : defaultDiagnosisResponse;
    addAssistantMessage(response, 400);
    setTimeout(() => {
      setCurrentStep(6);
      addAssistantMessage(coreQuestions[6], 700);
    }, 1200);
  }, [addAssistantMessage]);

  const handleMedicationInput = useCallback((answer: string) => {
    setMedicationName(answer);
    const normalized = answer.toLowerCase().trim();
    const known = Object.entries(knownMedications).find(([key]) => normalized.includes(key));
    const response = known ? known[1] : defaultMedicationResponse;
    addAssistantMessage(response, 400);
    setTimeout(() => {
      setCurrentStep(7);
      setShowUpload(true);
      addAssistantMessage(coreQuestions[7], 700);
    }, 1200);
  }, [addAssistantMessage]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    const answer = inputValue.trim();
    if (!answer || currentStep === 0) return;

    addUserMessage(answer);
    setInputValue('');

    if (isAskingContextual) {
      const questions = contextualQuestionsByCategory[categoryRef.current] || contextualQuestionsByCategory.general;
      const q = questions[contextualIdx];
      if (q) answerContextual(answer, q.key);
      return;
    }

    const casualResponse = getCasualResponse(answer);
    if (casualResponse && currentStep >= 1 && currentStep <= 6) {
      addAssistantMessage(casualResponse, 400);
      setTimeout(() => {
        if (isAskingContextual) {
          const questions = contextualQuestionsByCategory[categoryRef.current] || contextualQuestionsByCategory.general;
          const q = questions[contextualIdx];
          if (q) addAssistantMessage(q.question, 400);
        } else {
          addAssistantMessage(coreQuestions[currentStep], 1200);
        }
      }, 1800);
      return;
    }

    const isNegative = negativeFeelingPatterns.some(p => answer.toLowerCase().includes(p));
    if (isNegative && currentStep === 1) {
      addAssistantMessage("I'm sorry you're experiencing discomfort. Let's understand what's happening and see how we can track it.", 400);
      setTimeout(() => {
        addAssistantMessage(coreQuestions[1], 1400);
      }, 1800);
      return;
    }

    // Empathy Engine (Task 4)
    if (!empathyUsed) {
      const matched = empathyPatterns.find(p => p.words.some(w => answer.toLowerCase().includes(w)));
      if (matched) {
        addAssistantMessage(matched.response, 400);
        setEmpathyUsed(true);
        setTimeout(() => {
          if (currentStep === 1) {
            const { category: cat } = classifyPain(answer);
            setCategory(cat);
            storeAnswer(1, answer);
            setTimeout(() => startContextualQuestions(cat), 400);
          } else if (currentStep === 8) {
            handleDiagnosisInput(answer);
          } else if (currentStep === 9) {
            handleMedicationInput(answer);
          } else {
            storeAnswer(currentStep, answer);
            setTimeout(() => { advanceStep(); }, 600);
          }
        }, 1800);
        return;
      }
    }

    if (currentStep === 1) {
      const { category: cat } = classifyPain(answer);
      setCategory(cat);
      storeAnswer(1, answer);
      setTimeout(() => {
        startContextualQuestions(cat);
      }, 400);
      return;
    }

    if (currentStep === 8) {
      handleDiagnosisInput(answer);
      return;
    }

    if (currentStep === 9) {
      handleMedicationInput(answer);
      return;
    }

    storeAnswer(currentStep, answer);
    setTimeout(() => { advanceStep(); }, 500);
  }, [inputValue, currentStep, isAskingContextual, contextualIdx, empathyUsed, addUserMessage, addAssistantMessage, storeAnswer, startContextualQuestions, advanceStep, answerContextual, handleDiagnosisInput, handleMedicationInput]);

  const handleButtonClick = useCallback((text: string) => {
    if (currentStep === 0) return;
    addUserMessage(text);
    setInputValue('');

    if (isAskingContextual) {
      const questions = contextualQuestionsByCategory[categoryRef.current] || contextualQuestionsByCategory.general;
      const q = questions[contextualIdx];
      if (q) answerContextual(text, q.key);
      return;
    }

    if (currentStep === 5) {
      setPainData(prev => ({ ...prev, doctorConsultation: text }));
      if (text.toLowerCase() === 'yes') {
        addAssistantMessage("What did the doctor diagnose?", 500);
        setCurrentStep(8 as QuestionStep);
        return;
      }
      setTimeout(() => advanceStep(), 500);
      return;
    }

    if (currentStep === 6) {
      setPainData(prev => ({ ...prev, medication: text }));
      if (text.toLowerCase() === 'yes') {
        addAssistantMessage("What medication are you taking?", 500);
        setCurrentStep(9 as QuestionStep);
        return;
      }
      setTimeout(() => advanceStep(), 500);
      return;
    }

    storeAnswer(currentStep, text);
    setTimeout(() => { advanceStep(); }, 500);
  }, [currentStep, isAskingContextual, contextualIdx, addUserMessage, addAssistantMessage, storeAnswer, advanceStep, answerContextual]);

  const handleQuickLevel = useCallback((level: number) => {
    if (currentStep !== 4) return;
    addUserMessage(String(level));
    setPainData((prev) => ({ ...prev, painLevel: level }));
    setTimeout(() => { advanceStep(); }, 500);
  }, [currentStep, addUserMessage, advanceStep]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const analysis = mockReportAnalysis(file.name);
      setReportAnalysis(analysis);
      addAssistantMessage(`Report "${file.name}" received. Analyzing...`, 300);
      setTimeout(() => {
        addAssistantMessage(
          `Report Summary:\nDiagnosis: ${analysis.diagnosis}\nMedication: ${analysis.medications || 'N/A'}\nDoctor: ${analysis.doctorName || 'N/A'}${analysis.hospital ? `\nHospital: ${analysis.hospital}` : ''}`,
          600
        );
        setTimeout(() => {
          addAssistantMessage('This analysis is informational only and does not replace professional medical advice.', 400);
        }, 1500);
      }, 1800);
    };
    reader.readAsDataURL(file);
  }, [addAssistantMessage]);

  const handleFinishUpload = useCallback(() => {
    const currentPainData = painDataRef.current;
    const currentCat = categoryRef.current as any;
    const currentCA = contextualAnswersRef.current;
    const risk = assessRisk(currentCat, currentPainData.painLevel, currentCA);
    setRiskLevel(risk);
    const report: PainReport = {
      id: generateId(),
      location: currentPainData.location,
      date: currentPainData.date,
      whenStarted: currentPainData.whenStarted,
      painLevel: currentPainData.painLevel,
      doctorConsultation: currentPainData.doctorConsultation,
      medication: currentPainData.medication,
      category: currentCat,
      timestamp: Date.now(),
      riskLevel: risk,
      contextualAnswers: currentCA,
      reportFileName: uploadedFile?.name,
      reportAnalysis: reportAnalysis || undefined,
      conversation: formatConversation(messagesRef.current),
    };
    const updated = saveReportToStorage(report);
    setHistory(updated);
    setIsSaved(true);
    setShowCompletion(true);
    addAssistantMessage('Assessment complete! Here is your summary.', 500);
    console.log('Saving assessment...');
    api.post('/pain-assessments', {
      location: report.location,
      whenStarted: report.whenStarted,
      assessmentDate: report.date,
      painLevel: report.painLevel,
      doctorConsulted: report.doctorConsultation,
      medication: report.medication,
      painCategory: report.category,
      riskLevel: report.riskLevel,
      conversation: JSON.stringify(report.conversation),
      notes: report.reportFileName ? `Report: ${report.reportFileName}` : undefined,
      reportAnalysis: report.reportAnalysis ? JSON.stringify(report.reportAnalysis) : undefined,
    }).then(res => {
      console.log('Assessment saved. Assessment ID:', res.data.id);
    }).catch(err => {
      console.error('Failed to save assessment:', err?.response?.data || err.message);
    });
  }, [uploadedFile, reportAnalysis, addAssistantMessage]);

  const handleSkipUpload = useCallback(() => {
    finalizeAssessment();
  }, [finalizeAssessment]);

  const handleReset = useCallback(() => {
    setMessages([]);
    setCurrentStep(0);
    setHasError(false);
    setIsSaved(false);
    setPainData({ location: '', whenStarted: '', date: '', painLevel: 0, doctorConsultation: '', medication: '' });
    setCategory('general');
    setShowCompletion(false);
    setInputValue('');
    setContextualAnswers({});
    setContextualIdx(0);
    setIsAskingContextual(false);
    setShowUpload(false);
    setUploadedFile(null);
    setReportAnalysis(null);
    setRiskLevel('');
    setDiagnosis('');
    setMedicationName('');
    setEmpathyUsed(false);
    setIsFinalizing(false);
  }, []);

  const handleEditSave = useCallback(() => {
    if (!editModal) return;
    const reports = loadReports();
    const idx = reports.findIndex(r => r.id === editModal);
    if (idx >= 0) {
      reports[idx] = { ...reports[idx], ...editValues, timestamp: Date.now() };
      localStorage.setItem('painReports', JSON.stringify(reports));
      setHistory(reports);
    }
    setEditModal(null);
  }, [editModal, editValues]);

  const handleDeleteReport = useCallback((id: string) => {
    const updated = deleteReportFromStorage(id);
    localStorage.setItem('painReports', JSON.stringify(updated));
    setHistory(updated);
  }, []);

  useEffect(() => {
    if (messages.length === 0) {
      const timer = setTimeout(() => {
        addAssistantMessage(coreQuestions[0], 400);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [messages.length, addAssistantMessage]);

  useEffect(() => {
    if (messages.length === 1 && currentStep === 0) {
      const timer = setTimeout(() => {
        addAssistantMessage("I'm your pain tracking assistant. Let me help you log and understand your symptoms.", 500);
        setTimeout(() => {
          addAssistantMessage(coreQuestions[1], 1000);
          setCurrentStep(1);
        }, 1500);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [messages.length, currentStep, addAssistantMessage]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (messages.length === 0) setHasError(true);
    }, 10000);
    return () => clearTimeout(timer);
  }, [messages.length]);

  useEffect(() => {
    const loaded = loadReports();
    setHistory(loaded);
  }, []);

  useEffect(() => {
    const SpeechRecognitionAPI = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognitionAPI) {
      setVoiceSupported(true);
      const recognition = new SpeechRecognitionAPI();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputValue(transcript);
        setListening(false);
      };
      recognition.onerror = () => setListening(false);
      recognition.onend = () => setListening(false);
      recognitionRef.current = recognition;
    }
  }, []);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setListening(true);
      } catch { setListening(false); }
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      setListening(false);
    }
  }, []);

  const speakText = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const readLastResponse = useCallback(() => {
    const lastAssistant = [...messages].reverse().find(m => m.sender === 'assistant');
    if (lastAssistant) speakText(lastAssistant.text);
  }, [messages, speakText]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    inputRef.current?.focus();
  }, [currentStep, showCompletion, isAskingContextual]);

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const accentColor = category !== 'general'
    ? getCategoryAccent(category as any)
    : painData.location
      ? getCategoryAccent(classifyPain(painData.location).category)
      : '#14B8A6';

  const contextualQuestions = contextualQuestionsByCategory[category] || contextualQuestionsByCategory.general;
  const currentContextual = contextualQuestions[contextualIdx];

  if (hasError) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-900 font-fraunces mb-2">Pain assistant failed to start</h2>
          <p className="text-sm text-slate-500 mb-6">The chatbot could not initialize. Click Restart to try again.</p>
          <button onClick={handleReset} className="px-6 py-3 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:from-sky-400 hover:to-emerald-400 transition-all shadow-sm">Restart</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500 to-emerald-500 flex items-center justify-center text-lg">🩺</div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 font-fraunces">Pain Pattern Assistant</h1>
              <p className="text-sm text-slate-500 mt-0.5">Track pain symptoms and receive comfort guidance.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs text-emerald-600 font-medium">Live</span>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-6">
          <div className="xl:flex-[2] w-full min-w-0">
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col h-[560px] xl:h-[600px]">
              <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                {messages.map((msg) => (
                  <PainChatBubble key={msg.id} message={msg} />
                ))}
                {isTyping && !showCompletion && (
                  <div className="flex justify-start">
                    <div className="bg-slate-100 rounded-2xl rounded-bl-md px-4 py-2"><TypingDots /></div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {!showCompletion && (
                <div className="border-t border-slate-200 p-4 space-y-3">
                  {currentStep === 4 && !isAskingContextual && (
                    <div className="flex items-center gap-1.5 flex-wrap justify-center">
                      {Array.from({ length: 10 }, (_, i) => (
                        <button key={i} onClick={() => handleQuickLevel(i + 1)}
                          className="w-8 h-8 rounded-full text-xs font-bold transition-all duration-200 hover:scale-110"
                          style={{
                            backgroundColor: i < 3 ? '#22C55E20' : i < 6 ? '#F59E0B20' : '#EF444420',
                            color: i < 3 ? '#22C55E' : i < 6 ? '#F59E0B' : '#EF4444',
                            border: `1px solid ${i < 3 ? '#22C55E40' : i < 6 ? '#F59E0B40' : '#EF444440'}`,
                          }}
                        >{i + 1}</button>
                      ))}
                    </div>
                  )}

                  {(currentStep === 5 || currentStep === 6) && !isAskingContextual && (
                    <div className="flex items-center gap-2 justify-center">
                      {yesNoButtons.map(btn => (
                        <button key={btn} onClick={() => handleButtonClick(btn)}
                          className="px-6 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 transition-all shadow-sm"
                        >{btn}</button>
                      ))}
                    </div>
                  )}

                  {currentStep === 1 && !isAskingContextual && (
                    <div className="flex items-center gap-2 justify-center flex-wrap">
                      {severityButtons.map(btn => (
                        <button key={btn} onClick={() => handleButtonClick(btn.toLowerCase())}
                          className="px-4 py-1.5 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-sky-50 hover:border-sky-300 transition-all"
                        >{btn}</button>
                      ))}
                    </div>
                  )}

                  {currentStep === 2 && !isAskingContextual && (
                    <div className="flex items-center gap-2 justify-center">
                      {dateButtons.map(btn => (
                        <button key={btn} onClick={() => handleButtonClick(btn)}
                          className="px-4 py-1.5 rounded-xl text-xs font-medium border border-slate-200 text-slate-600 hover:bg-sky-50 hover:border-sky-300 transition-all"
                        >{btn}</button>
                      ))}
                    </div>
                  )}

                  {isAskingContextual && currentContextual?.buttons && (
                    <div className="flex items-center gap-2 justify-center">
                      {currentContextual.buttons.map(btn => (
                        <button key={btn} onClick={() => handleButtonClick(btn)}
                          className="px-6 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-700 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 transition-all shadow-sm"
                        >{btn}</button>
                      ))}
                    </div>
                  )}

                  {currentStep === 7 && showUpload && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex gap-2">
                        <button onClick={() => fileInputRef.current?.click()}
                          className="px-4 py-2 rounded-xl text-sm font-medium border border-slate-200 text-slate-600 hover:bg-sky-50 hover:border-sky-300 transition-all"
                        >Upload Report</button>
                        <button onClick={handleSkipUpload}
                          className="px-4 py-2 rounded-xl text-sm font-medium text-slate-500 hover:text-slate-700 transition-all"
                        >Skip</button>
                      </div>
                      {uploadedFile && (
                        <div className="text-xs text-slate-500">Uploaded: {uploadedFile.name}</div>
                      )}
                      {uploadedFile && reportAnalysis && (
                        <button onClick={handleFinishUpload}
                          className="px-6 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:from-sky-400 hover:to-emerald-400 transition-all shadow-sm"
                        >Finish Assessment</button>
                      )}
                      <input ref={fileInputRef} type="file" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileUpload} className="hidden" />
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                      ref={inputRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder={
                        currentStep === 0 ? 'Type something to start...'
                        : currentStep === 4 ? 'Or type a number (1–10)...'
                        : currentStep === 7 ? 'Upload a file or type skip...'
                        : currentStep === 8 ? 'Type your diagnosis...'
                        : currentStep === 9 ? 'Type your medication...'
                        : isAskingContextual ? 'Answer the question...'
                        : 'Type your answer...'
                      }
                      disabled={currentStep === 0 || isTyping || currentStep === 7 || isFinalizing}
                      className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500 transition-colors disabled:opacity-30"
                    />
                    <button
                      type="submit"
                      disabled={currentStep === 0 || !inputValue.trim() || isTyping || currentStep === 7 || isFinalizing}
                      className="px-5 py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:from-sky-400 hover:to-emerald-400 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-sm"
                    >Send</button>
                  </form>
                  {voiceSupported && !showCompletion && (
                    <div className="flex items-center gap-2 justify-center pt-2">
                      {!listening ? (
                        <button type="button" onClick={startListening}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 text-slate-500 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 transition-all"
                        >🎤 Start Listening</button>
                      ) : (
                        <button type="button" onClick={stopListening}
                          className="px-3 py-1.5 rounded-xl text-xs font-medium border border-red-200 text-red-500 bg-red-50 animate-pulse"
                        >⏹ Stop Listening</button>
                      )}
                      <button type="button" onClick={readLastResponse}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-200 text-slate-500 hover:bg-sky-50 hover:border-sky-300 hover:text-sky-600 transition-all"
                      >🔊 Read Response</button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="xl:flex-1 w-full xl:min-w-[320px] space-y-4">
            {!showCompletion && (
              <EntryProgressCard painData={painData} currentStep={currentStep} />
            )}

            {riskLevel && (
              <div className={`rounded-2xl border p-4 shadow-sm bg-white ${
                riskLevel === 'High' ? 'border-red-200' :
                riskLevel === 'Moderate' ? 'border-amber-200' :
                'border-emerald-200'
              }`}>
                <p className="text-[10px] text-slate-400 font-mono uppercase">Risk Assessment</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-lg text-sm font-bold ${
                  riskLevel === 'High' ? 'bg-red-50 text-red-600' :
                  riskLevel === 'Moderate' ? 'bg-amber-50 text-amber-600' :
                  'bg-emerald-50 text-emerald-600'
                }`}>{riskLevel} Risk</span>
              </div>
            )}

            {currentStep > 0 && painData.location && !showCompletion && (
              <div className="rounded-2xl bg-white border p-4 shadow-sm animate-fade-slide-up"
                style={{ borderColor: `${accentColor}30` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{getCategoryIcon(category as any) || '🩺'}</span>
                  <span className="text-xs font-mono text-slate-500 uppercase tracking-wider">
                    {getCategoryLabel(category as any) || 'Classifying...'}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Pain classified as{' '}
                  <span style={{ color: accentColor }}>
                    {getCategoryLabel(category as any) || 'general'}
                  </span>
                </p>
              </div>
            )}

            {showCompletion && (
              <PainCompletionCard
                painData={painData}
                category={(category as any) || 'general'}
                onSave={() => finalizeAssessment()}
                isSaved={isSaved}
                onNewAssessment={handleReset}
              />
            )}

            {history.length > 0 && (
              <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-4 animate-fade-slide-up">
                <h3 className="text-sm font-semibold text-slate-800 mb-3 font-mono uppercase tracking-wider">Pain Assessment History</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
                  {history.map((report) => (
                    <div key={report.id} className="rounded-xl bg-white border border-slate-200 p-3 text-xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-slate-400 font-mono">{new Date(report.timestamp).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: getCategoryAccent(report.category) }} />
                          <span className="text-slate-500">{getCategoryLabel(report.category)}</span>
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-700 truncate max-w-[100px]">{report.location}</span>
                        <span className="text-slate-500">{report.painLevel}/10</span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-slate-400">{report.whenStarted || 'N/A'}</span>
                        {report.riskLevel && (
                          <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-medium ${
                            report.riskLevel === 'High' ? 'bg-red-50 text-red-600' :
                            report.riskLevel === 'Moderate' ? 'bg-amber-50 text-amber-600' :
                            'bg-emerald-50 text-emerald-600'
                          }`}>{report.riskLevel}</span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2 pt-2 border-t border-slate-200">
                        <button onClick={() => setViewModal(report.id)}
                          className="text-sky-600/70 hover:text-sky-600 text-[10px] font-mono uppercase tracking-wider transition-colors">View</button>
                        <button onClick={() => { setEditModal(report.id); setEditValues({ painLevel: report.painLevel, doctorConsultation: report.doctorConsultation, medication: report.medication, notes: '' }); }}
                          className="text-amber-600/70 hover:text-amber-600 text-[10px] font-mono uppercase tracking-wider transition-colors">Edit</button>
                        <button onClick={() => handleDeleteReport(report.id)}
                          className="text-red-500/70 hover:text-red-500 text-[10px] font-mono uppercase tracking-wider transition-colors">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* View Modal */}
      {viewModal && (() => {
        const report = history.find(r => r.id === viewModal);
        if (!report) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setViewModal(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-lg w-full mx-4 max-h-[80vh] overflow-y-auto border border-slate-200 shadow-xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-slate-900 font-fraunces">Report Details</h3>
                <button onClick={() => setViewModal(null)} className="text-slate-400 hover:text-slate-600"><svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
              </div>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 font-mono">Location</p><p className="text-sm font-medium text-slate-800">{report.location}</p></div>
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 font-mono">Pain Level</p><p className="text-sm font-medium text-slate-800">{report.painLevel}/10</p></div>
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 font-mono">Category</p><p className="text-sm text-slate-700">{getCategoryLabel(report.category)}</p></div>
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 font-mono">Risk Level</p>
                    <span className={`inline-block px-2 py-0.5 rounded-lg text-xs font-medium ${
                      report.riskLevel === 'High' ? 'bg-red-50 text-red-600 border border-red-200' :
                      report.riskLevel === 'Moderate' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                      'bg-emerald-50 text-emerald-600 border border-emerald-200'
                    }`}>{report.riskLevel || 'N/A'}</span>
                  </div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 font-mono mb-1">When Started</p><p className="text-sm text-slate-700">{report.whenStarted}</p></div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 font-mono">Doctor</p><p className="text-sm text-slate-700">{report.doctorConsultation}</p></div>
                  <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 font-mono">Medication</p><p className="text-sm text-slate-700">{report.medication}</p></div>
                </div>
                <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 font-mono mb-1">Date</p><p className="text-sm text-slate-700">{report.date || new Date(report.timestamp).toLocaleDateString()}</p></div>
                {report.reportFileName && <div className="bg-slate-50 rounded-xl p-3"><p className="text-[10px] text-slate-400 font-mono">Uploaded Report</p><p className="text-sm text-slate-700">{report.reportFileName}</p></div>}
                {report.reportAnalysis && (
                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                    <p className="text-[10px] text-blue-500 font-mono mb-1">Report Analysis</p>
                    <p className="text-xs text-slate-600">Diagnosis: <span className="font-medium text-slate-800">{(report.reportAnalysis as any).diagnosis || 'N/A'}</span></p>
                    <p className="text-xs text-slate-600">Medication: <span className="font-medium text-slate-800">{(report.reportAnalysis as any).medications || 'N/A'}</span></p>
                    <p className="text-xs text-slate-600">Doctor: <span className="font-medium text-slate-800">{(report.reportAnalysis as any).doctorName || 'N/A'}</span></p>
                  </div>
                )}
                {report.conversation && report.conversation.length > 0 && (
                  <div className="bg-slate-50 rounded-xl p-3">
                    <p className="text-[10px] text-slate-400 font-mono mb-2">Conversation</p>
                    <div className="space-y-1 max-h-[150px] overflow-y-auto">
                      {report.conversation.slice(-10).map((msg: any, i: number) => (
                        <p key={i} className={`text-xs ${msg.sender === 'assistant' ? 'text-slate-500' : 'text-sky-600 font-medium'}`}>
                          <span className="text-[10px] text-slate-400">{msg.sender === 'assistant' ? 'Bot: ' : 'You: '}</span>
                          {typeof msg.text === 'string' ? (msg.text.substring(0, 100) + (msg.text.length > 100 ? '...' : '')) : ''}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setViewModal(null)} className="mt-4 w-full py-2.5 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:from-sky-400 hover:to-emerald-400 transition-all shadow-sm">Close</button>
            </div>
          </div>
        );
      })()}

      {/* Edit Modal */}
      {editModal && (() => {
        const report = history.find(r => r.id === editModal);
        if (!report) return null;
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setEditModal(null)}>
            <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 border border-slate-200 shadow-xl" onClick={e => e.stopPropagation()}>
              <h3 className="text-lg font-bold text-slate-900 font-fraunces mb-4">Edit Assessment</h3>
              <div className="space-y-3">
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Pain Level (1-10)</label>
                  <input type="number" min="1" max="10" value={editValues.painLevel} onChange={e => setEditValues(p => ({ ...p, painLevel: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500" /></div>
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Doctor Consulted</label>
                  <input value={editValues.doctorConsultation} onChange={e => setEditValues(p => ({ ...p, doctorConsultation: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500" /></div>
                <div><label className="block text-xs font-medium text-slate-500 mb-1">Medication</label>
                  <input value={editValues.medication} onChange={e => setEditValues(p => ({ ...p, medication: e.target.value }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500" /></div>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button onClick={() => setEditModal(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">Cancel</button>
                <button onClick={handleEditSave} className="px-4 py-2 rounded-xl text-sm font-medium bg-gradient-to-r from-sky-500 to-emerald-500 text-white hover:from-sky-400 hover:to-emerald-400 transition-all shadow-sm">Save</button>
              </div>
            </div>
          </div>
        );
      })()}

      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-slide-up { animation: fadeSlideUp 0.4s ease-out; }
        .scrollbar-thin::-webkit-scrollbar { width: 4px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.08); border-radius: 4px; }
      `}</style>
    </div>
  );
}
