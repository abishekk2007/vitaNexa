import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  icon: string;
  path: string;
  category: 'module' | 'action' | 'page' | 'setting';
  keywords: string[];
}

const STATIC_RESULTS: SearchResult[] = [
  { id: 'dash', title: 'Dashboard', description: 'Go to your health dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6', path: '/dashboard', category: 'module', keywords: ['home', 'overview', 'stats'] },
  { id: 'microbiome', title: 'Meal Planner', description: 'Track gut bacteria, get food recommendations', icon: 'M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4', path: '/microbiome', category: 'module', keywords: ['bacteria', 'food', 'gut', 'meal'] },
  { id: 'pain', title: 'Pain Pattern Predictor', description: 'Log pain, detect patterns, predict outlook', icon: 'M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z', path: '/pain-predictor', category: 'module', keywords: ['pain', 'pattern', 'predict', 'log'] },
  { id: 'nutrient', title: 'Nutrient Optimizer', description: 'Manage supplements, check interactions', icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z', path: '/nutrient', category: 'module', keywords: ['supplement', 'vitamin', 'mineral', 'nutrient'] },
  { id: 'energy', title: 'Energy Ledger', description: 'Spoon budgeting and activity tracking', icon: 'M13 10V3L4 14h7v7l9-11h-7z', path: '/energy', category: 'module', keywords: ['spoon', 'activity', 'fatigue'] },
  { id: 'petcare', title: 'Pet Care', description: 'Pet profiles, mood tracking, vets nearby', icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', path: '/petcare', category: 'module', keywords: ['pet', 'animal', 'vet'] },
  { id: 'emergency', title: 'Emergency Help', description: 'Hospitals, ambulances, volunteer drivers', icon: 'M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636', path: '/emergency', category: 'module', keywords: ['hospital', 'ambulance', 'help', 'urgent'] },
  { id: 'blood', title: 'Blood Bank', description: 'Donor registration and blood requests', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', path: '/bloodbank', category: 'module', keywords: ['donor', 'blood', 'donation'] },
  { id: 'budget', title: 'Budget Saver', description: 'Track savings and financial goals', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z', path: '/budget', category: 'module', keywords: ['money', 'saving', 'finance'] },
  { id: 'medora', title: 'Medora Insights', description: 'AI-powered health insights', icon: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z', path: '/medora', category: 'module', keywords: ['ai', 'insight', 'analysis'] },
  { id: 'mood', title: 'Mood Journal', description: 'Track your mood and daily reflections', icon: 'M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', path: '/mood-journal', category: 'module', keywords: ['mood', 'emotion', 'journal', 'reflection'] },
  { id: 'schedule', title: 'Daily Schedule', description: 'Plan your day with time blocking', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', path: '/daily-schedule', category: 'module', keywords: ['plan', 'schedule', 'agenda', 'calendar'] },
  { id: 'achievements', title: 'Achievements', description: 'View your unlocked achievements and streaks', icon: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z', path: '/achievements', category: 'module', keywords: ['badge', 'trophy', 'gamification', 'unlock'] },
  { id: 'notifications', title: 'Notifications', description: 'View all your notifications', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9', path: '/notifications', category: 'module', keywords: ['alert', 'bell', 'reminder'] },
  { id: 'reports', title: 'Reports', description: 'Generate health reports and export data', icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z', path: '/reports', category: 'module', keywords: ['export', 'pdf', 'csv', 'analytics'] },
  { id: 'settings', title: 'Settings', description: 'Manage your preferences', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z', path: '#', category: 'setting', keywords: ['preference', 'config', 'theme'] },
];

const ACTION_RESULTS: SearchResult[] = [
  { id: 'action_add_activity', title: 'Add Activity', description: 'Log a new activity in Energy Ledger', icon: 'M12 4v16m8-8H4', path: '/energy', category: 'action', keywords: ['log', 'activity', 'create', 'new'] },
  { id: 'action_add_meal', title: 'Log Meal', description: 'Log a new meal in Nutrient Optimizer', icon: 'M12 4v16m8-8H4', path: '/nutrient', category: 'action', keywords: ['food', 'meal', 'eat', 'log'] },
  { id: 'action_add_supplement', title: 'Add Supplement', description: 'Add a new supplement to track', icon: 'M12 4v16m8-8H4', path: '/nutrient', category: 'action', keywords: ['vitamin', 'supplement', 'add'] },
  { id: 'action_add_pain', title: 'Log Pain', description: 'Record a new pain entry', icon: 'M12 4v16m8-8H4', path: '/pain-predictor', category: 'action', keywords: ['pain', 'symptom', 'log'] },
  { id: 'action_add_mood', title: 'Log Mood', description: 'Record your current mood', icon: 'M12 4v16m8-8H4', path: '/mood-journal', category: 'action', keywords: ['mood', 'feeling', 'emotion'] },
  { id: 'action_scan', title: 'Scan Barcode', description: 'Scan a product barcode for nutrition info', icon: 'M12 4v16m8-8H4', path: '/nutrient', category: 'action', keywords: ['barcode', 'scan', 'product', 'food'] },
];

export function useSmartSearch() {
  const navigate = useNavigate();

  const search = useCallback((query: string): SearchResult[] => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const allResults = [...STATIC_RESULTS, ...ACTION_RESULTS];
    return allResults
      .filter((r) => {
        const searchable = [r.title, r.description, ...r.keywords].map((s) => s.toLowerCase()).join(' ');
        return searchable.includes(q);
      })
      .slice(0, 10);
  }, []);

  const navigateTo = useCallback((result: SearchResult) => {
    navigate(result.path);
  }, [navigate]);

  return { search, navigateTo, allModules: STATIC_RESULTS, allActions: ACTION_RESULTS };
}
