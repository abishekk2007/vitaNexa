import { ComfortGuidance, PainCategory } from './types';

const guidanceMap: Record<PainCategory, ComfortGuidance> = {
  joint_muscle_back: {
    icon: '🦴',
    accentColor: '#14B8A6',
    title: 'Joint, Muscle & Back Comfort',
    tips: [
      'Apply a warm compress for 15–20 minutes to relax tight muscles.',
      'Gentle stretching can help — try cat-cow or child\'s pose.',
      'Stay hydrated — dehydration can worsen joint and muscle pain.',
      'Consider an Epsom salt bath to reduce inflammation.',
      'Rest the area for 24–48 hours if movement worsens the pain.',
    ],
    warnings: [
      'Sudden severe swelling around a joint.',
      'Unable to bear weight on the affected area.',
      'Spreading numbness or tingling down a limb.',
      'Fever accompanied by joint pain.',
    ],
  },
  head_migraine: {
    icon: '🧠',
    accentColor: '#8B5CF6',
    title: 'Headache & Migraine Relief',
    tips: [
      'Find a dark, quiet room to rest in.',
      'Place a cold compress on your forehead or temples.',
      'Stay hydrated — dehydration is a common headache trigger.',
      'Avoid bright screens and loud noises.',
      'Try gentle pressure on your temples with your fingertips.',
    ],
    warnings: [
      'Worst headache of your life — seek emergency care.',
      'Sudden vision changes, blurred or double vision.',
      'Stiff neck accompanied by fever and headache.',
      'Headache after a head injury.',
      'Slurred speech or confusion.',
    ],
  },
  stomach_abdomen: {
    icon: '🫁',
    accentColor: '#F59E0B',
    title: 'Stomach & Abdomen Relief',
    tips: [
      'Sip clear fluids like water or herbal tea slowly.',
      'Avoid heavy, greasy, or spicy foods for now.',
      'Try the BRAT diet — bananas, rice, applesauce, toast.',
      'Apply a warm compress to your abdomen.',
      'Rest and avoid strenuous activity.',
    ],
    warnings: [
      'Vomiting blood or material that looks like coffee grounds.',
      'Blood in your stool or black, tarry stools.',
      'Unable to keep fluids down for more than 24 hours.',
      'Severe abdominal pain with fever.',
      'Swelling or tenderness when touching your abdomen.',
    ],
  },
  chest: {
    icon: '❤️',
    accentColor: '#EF4444',
    title: 'Chest Comfort Guidance',
    tips: [
      'Sit upright and try to stay calm — anxiety can worsen chest tightness.',
      'Take slow, deep breaths — inhale for 4 counts, exhale for 4 counts.',
      'If pain is linked to eating, avoid lying down for 2–3 hours.',
      'Keep a record of when chest discomfort occurs.',
    ],
    warnings: [
      'Crushing or squeezing chest pain — call emergency services immediately.',
      'Pain spreading to your jaw, neck, shoulder, or left arm.',
      'Shortness of breath with or without chest pain.',
      'Sudden onset of cold sweats, nausea, or lightheadedness with chest pain.',
      'Racing or irregular heartbeat.',
    ],
  },
  general: {
    icon: '🩺',
    accentColor: '#06B6D4',
    title: 'General Pain Guidance',
    tips: [
      'Rest the affected area and avoid overexertion.',
      'Apply ice for 15 minutes if there is swelling.',
      'Over-the-counter pain relief may help — follow recommended dosage.',
      'Stay hydrated and eat nourishing foods to support recovery.',
      'Get adequate sleep — rest is essential for healing.',
    ],
    warnings: [
      'Pain that persists for more than a week without improvement.',
      'Pain accompanied by fever, chills, or unexplained weight loss.',
      'Severe pain that interferes with daily activities.',
      'Numbness, tingling, or loss of function in any body part.',
    ],
  },
};

export function getComfortGuidance(category: PainCategory): ComfortGuidance {
  return guidanceMap[category] || guidanceMap.general;
}

export const generalTips = [
  'Take slow, deep breaths to help manage pain naturally.',
  'Distract yourself with calming music, a podcast, or light reading.',
  'A warm bath or shower can help relax tense muscles.',
  'Keep a pain diary to track triggers and patterns over time.',
  'Reach out to a trusted friend or family member for support.',
];

export const healthReminder = {
  title: 'Listen to Your Body',
  message: 'Pain is your body\'s way of telling you something. If pain persists, worsens, or interferes with your daily life, please consult a healthcare professional.',
};
