import { create } from 'zustand';
import api from '../api/client';

export interface HealthScores {
  nutrientDeficiencyRisk: number;
  foodDiversity: number;
  absorptionEfficiency: number;
  supplementCompliance: number;
  consistency: number;
  healthMomentum: number;
  wellnessTrend: number;
  overallHealthScore: number;
}

export interface NutrientCoverage {
  nutrient: string;
  current: number;
  target: number;
  status: 'on_track' | 'borderline' | 'likely_gap';
}

export interface DeficiencyForecast {
  nutrient: string;
  risk: 'critical' | 'high' | 'moderate' | 'low';
  daysToDeficiency: number | null;
}

export interface AnalyticsResult {
  scores: HealthScores;
  nutrientCoverage: NutrientCoverage[];
  deficiencyForecasts: DeficiencyForecast[];
}

export interface CoachResponse {
  response: string;
  memoryUsed: boolean;
}

interface EnterpriseState {
  analytics: AnalyticsResult | null;
  analyticsLoading: boolean;
  analyticsError: string | null;
  coachResponse: CoachResponse | null;
  coachLoading: boolean;
  coachError: string | null;
  exports: { entity: string; format: string; date: string }[];
  fetchAnalytics: (userId: string) => Promise<void>;
  fetchCoach: (userId: string, question: string) => Promise<void>;
  addExport: (entity: string, format: string) => void;
}

export const useEnterpriseStore = create<EnterpriseState>((set, get) => ({
  analytics: null,
  analyticsLoading: false,
  analyticsError: null,
  coachResponse: null,
  coachLoading: false,
  coachError: null,
  exports: JSON.parse(localStorage.getItem('enterpriseExports') || '[]'),

  fetchAnalytics: async (userId: string) => {
    set({ analyticsLoading: true, analyticsError: null });
    try {
      const { data } = await api.get<AnalyticsResult>('/enterprise/analytics', { params: { userId } });
      set({ analytics: data, analyticsLoading: false });
    } catch (err: any) {
      set({ analyticsError: err?.message || 'Failed to fetch analytics', analyticsLoading: false });
    }
  },

  fetchCoach: async (userId: string, question: string) => {
    set({ coachLoading: true, coachError: null });
    try {
      const { data } = await api.get<CoachResponse>('/enterprise/coach', { params: { userId, question } });
      set({ coachResponse: data, coachLoading: false });
    } catch (err: any) {
      set({ coachError: err?.message || 'Failed to get coach response', coachLoading: false });
    }
  },

  addExport: (entity: string, format: string) => {
    const newExport = { entity, format, date: new Date().toISOString() };
    const exports = [newExport, ...get().exports].slice(0, 50);
    localStorage.setItem('enterpriseExports', JSON.stringify(exports));
    set({ exports });
  },
}));
