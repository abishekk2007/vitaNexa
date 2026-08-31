import { PainCategory, PainLocation } from './types';

const locationMap: Record<string, PainLocation> = {
  joint: 'joint', joints: 'joint', knee: 'knee', knees: 'knee',
  elbow: 'elbow', elbows: 'elbow', wrist: 'wrist', wrists: 'wrist',
  ankle: 'ankle', ankles: 'ankle', hip: 'hip', hips: 'hip',
  shoulder: 'shoulder', shoulders: 'shoulder',
  muscle: 'muscle', muscles: 'muscle',
  back: 'back',
  neck: 'neck',
  head: 'head', migraine: 'migraine', temple: 'temple', forehead: 'forehead', skull: 'skull',
  stomach: 'stomach', abdomen: 'abdomen', belly: 'belly', gut: 'gut',
  nausea: 'nausea', bowel: 'bowel',
  chest: 'chest', heart: 'heart', lung: 'lung',
};

const categoryMap: Record<PainLocation, PainCategory> = {
  joint: 'joint_muscle_back', muscle: 'joint_muscle_back', back: 'joint_muscle_back',
  neck: 'joint_muscle_back', shoulder: 'joint_muscle_back',
  hip: 'joint_muscle_back', knee: 'joint_muscle_back', elbow: 'joint_muscle_back',
  wrist: 'joint_muscle_back', ankle: 'joint_muscle_back',
  head: 'head_migraine', migraine: 'head_migraine', temple: 'head_migraine',
  forehead: 'head_migraine', skull: 'head_migraine',
  stomach: 'stomach_abdomen', abdomen: 'stomach_abdomen', belly: 'stomach_abdomen',
  gut: 'stomach_abdomen', nausea: 'stomach_abdomen', bowel: 'stomach_abdomen',
  chest: 'chest', heart: 'chest', lung: 'chest',
  general: 'general',
};

export function classifyPain(input: string): { category: PainCategory; location: PainLocation } {
  const lower = input.toLowerCase().trim();
  for (const [keyword, location] of Object.entries(locationMap)) {
    if (lower.includes(keyword)) {
      return { category: categoryMap[location] || 'general', location };
    }
  }
  return { category: 'general', location: 'general' };
}

export function getCategoryLabel(category: PainCategory): string {
  const labels: Record<PainCategory, string> = {
    joint_muscle_back: 'Joint, Muscle & Back',
    head_migraine: 'Head & Migraine',
    stomach_abdomen: 'Stomach & Abdomen',
    chest: 'Chest',
    general: 'General Pain',
  };
  return labels[category];
}

export function getCategoryIcon(category: PainCategory): string {
  const icons: Record<PainCategory, string> = {
    joint_muscle_back: '🦴',
    head_migraine: '🧠',
    stomach_abdomen: '🫁',
    chest: '❤️',
    general: '🩺',
  };
  return icons[category];
}

export function getCategoryAccent(category: PainCategory): string {
  const accents: Record<PainCategory, string> = {
    joint_muscle_back: '#14B8A6',
    head_migraine: '#8B5CF6',
    stomach_abdomen: '#F59E0B',
    chest: '#EF4444',
    general: '#06B6D4',
  };
  return accents[category];
}
