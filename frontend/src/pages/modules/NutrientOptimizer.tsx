import { useState, useEffect, useRef, useCallback } from 'react';
import { useToast } from '../../contexts/ToastContext';
import { SkeletonModule } from '../../components/ui/Skeleton';
import api from '../../api/client';
import { useReminders } from '../../hooks/useReminders';
import { startCamera, stopCamera, captureFrame, scanBarcodeFromVideo, scanBarcodeFromCanvas, lookUpOpenFoodFacts, performOCR } from '../../utils/scanner';
import type { ScanResult } from '../../utils/scanner';
import EnterpriseDashboard from '../../components/enterprise/EnterpriseDashboard';

interface Supplement {
  id: string; name: string; brand?: string; dosage?: string; dosageValue?: number; dosageUnit?: string; form?: string; frequency?: string; timeOfDay?: string; notes?: string; startDate: string;
}

interface AnalysisItem { interactsWith: string; description: string; citationUrl?: string | null; severity?: string; }
interface FoodItem { food: string; reason: string; }
interface SuppAnalysis {
  supplementId: string; supplementName: string;
  mayImproveAbsorption: AnalysisItem[]; mayReduceAbsorption: AnalysisItem[];
  bestTimeToTake: string; foodsToPair: FoodItem[]; foodsToAvoid: FoodItem[];
  reasoning: string; severity: string;
}
interface InteractionSummaryItem { supplementA: string; supplementB: string; effect: string; severity: string; description: string; timingFix: string; citationUrl?: string | null; }
interface MealAnalysisItem { mealId: string; foods: string; detectedNutrients: string[]; conflictsWithSupplements: { supplementName: string; issue: string }[]; boostsWithSupplements: { supplementName: string; reason: string }[]; }
interface NutrientCard { food: number; supplement: number; total: number; unit: string; rdi: number; percent: number; topSources: string[]; suggestions: string[]; status: 'on_track' | 'borderline' | 'likely_gap'; }
interface MealEntry { id: string; mealTime: string; foods: string; nutrientTags?: string; calories?: number; macros?: string; notes?: string; }
interface MealAnalytics { totalMeals: number; avgCalories: number; mostFrequentFoods: { food: string; count: number }[]; nutrientFrequency: { nutrient: string; count: number }[]; missedNutrients: { nutrient: string; loggedCount: number; rdiTarget: number; unit: string; status: string }[]; recentDays: number; }

const FOOD_NUTRIENT_MAP: Record<string, string[]> = {
  eggs: ['protein', 'vitamin_d', 'b12', 'fat'], milk: ['calcium', 'vitamin_d', 'protein', 'b12'], banana: ['potassium', 'vitamin_c', 'magnesium'],
  oatmeal: ['fiber', 'iron', 'magnesium'], oats: ['fiber', 'iron', 'magnesium'], spinach: ['iron', 'magnesium', 'calcium', 'vitamin_c'],
  almonds: ['magnesium', 'vitamin_e', 'calcium'], salmon: ['omega3', 'vitamin_d', 'protein', 'b12'], tuna: ['omega3', 'vitamin_d', 'protein', 'b12'],
  yogurt: ['calcium', 'protein', 'b12'], cheese: ['calcium', 'protein', 'fat'], broccoli: ['vitamin_c', 'calcium', 'fiber'],
  orange: ['vitamin_c', 'fiber'], lemon: ['vitamin_c'], strawberry: ['vitamin_c', 'fiber'], bell_pepper: ['vitamin_c', 'fiber'],
  tomato: ['vitamin_c', 'potassium'], sweet_potato: ['vitamin_a', 'fiber', 'potassium'], carrot: ['vitamin_a', 'fiber'],
  kale: ['vitamin_c', 'calcium', 'iron'], beef: ['iron', 'b12', 'zinc', 'protein'], chicken: ['protein', 'b12', 'zinc'],
  lentils: ['iron', 'fiber', 'protein', 'magnesium'], beans: ['iron', 'fiber', 'protein', 'magnesium'], chickpeas: ['iron', 'fiber', 'protein', 'magnesium'],
  tofu: ['calcium', 'iron', 'protein'], avocado: ['fat', 'potassium', 'vitamin_e'], nuts: ['magnesium', 'vitamin_e', 'zinc', 'fat'],
  seeds: ['magnesium', 'zinc', 'iron', 'omega3'], chia: ['omega3', 'fiber', 'calcium', 'magnesium'], flax: ['omega3', 'fiber'],
  olive_oil: ['fat', 'vitamin_e'], butter: ['fat', 'vitamin_a'], bread: ['fiber', 'iron', 'magnesium'], rice: ['magnesium', 'fiber'],
  quinoa: ['protein', 'iron', 'magnesium', 'fiber'], tea: ['caffeine'], coffee: ['caffeine'], dark_chocolate: ['iron', 'magnesium', 'zinc'],
  mushrooms: ['vitamin_d', 'b12'], cereal: ['iron', 'b12', 'vitamin_d', 'calcium'],
};

function getNutrientsFromFoods(foods: string): string[] {
  const set = new Set<string>();
  const parts = foods.toLowerCase().split(/[,;]/).map(p => p.trim().replace(/\s+/g, '_'));
  for (const p of parts) {
    if (FOOD_NUTRIENT_MAP[p]) FOOD_NUTRIENT_MAP[p].forEach(n => set.add(n));
  }
  return [...set];
}

type Tab = 'dashboard' | 'supplements' | 'meals' | 'timing' | 'scan' | 'coach' | 'history' | 'reminders' | 'enterprise';

export default function NutrientOptimizer() {
  const { addToast } = useToast();
  const { reminders, permission, requestPermission, addReminder, deleteReminder, toggleReminder } = useReminders();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);

  const [supplements, setSupplements] = useState<Supplement[]>([]);
  const [analyses, setAnalyses] = useState<SuppAnalysis[]>([]);
  const [interactionSummary, setInteractionSummary] = useState<InteractionSummaryItem[]>([]);
  const [mealAnalyses, setMealAnalyses] = useState<MealAnalysisItem[]>([]);
  const [meals, setMeals] = useState<MealEntry[]>([]);
  const [nutrientData, setNutrientData] = useState<Record<string, NutrientCard> | null>(null);
  const [dailyScore, setDailyScore] = useState(0);
  const [mealAnalytics, setMealAnalytics] = useState<MealAnalytics | null>(null);

  const [suppForm, setSuppForm] = useState({ name: '', brand: '', dosage: '', dosageValue: '', dosageUnit: '', form: '', frequency: '', timeOfDay: '', notes: '' });
  const [mealForm, setMealForm] = useState({ foods: '', nutrientTags: '', calories: '', macros: '', notes: '' });
  const [detectedNutrients, setDetectedNutrients] = useState<string[]>([]);

  const [coachQuestion, setCoachQuestion] = useState('');
  const [coachAnswer, setCoachAnswer] = useState('');
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachHistory, setCoachHistory] = useState<{ q: string; a: string }[]>(() => {
    try { return JSON.parse(localStorage.getItem('coach_history') || '[]'); } catch { return []; }
  });

  const [scanMode, setScanMode] = useState<'idle' | 'camera' | 'captured' | 'result'>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [ocrText, setOcrText] = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanIntervalRef = useRef<number>(0);

  const [reminderForm, setReminderForm] = useState({ type: 'supplement' as 'supplement' | 'meal', title: '', time: '', days: [] as string[] });

  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [s, d, m, a] = await Promise.all([
        api.get('/supplements').catch(() => ({ data: [] })),
        api.get('/nutrients/dashboard').catch(() => ({ data: { nutrientEstimates: {}, dailyScore: 0 } })),
        api.get('/supplements/detailed-analysis').catch(() => ({ data: { analyses: [], interactionSummary: [], mealAnalyses: [] } })),
        api.get('/supplements/meal-analytics').catch(() => ({ data: null })),
      ]);
      const mealsRes = await api.get('/meals').catch(() => ({ data: { data: [] } }));

      setSupplements(Array.isArray(s.data?.data) ? s.data.data : Array.isArray(s.data) ? s.data : []);
      setNutrientData(d.data?.nutrientEstimates ?? null);
      setDailyScore(d.data?.dailyScore ?? 0);
      setAnalyses(a.data?.analyses ?? []);
      setInteractionSummary(a.data?.interactionSummary ?? []);
      setMealAnalyses(a.data?.mealAnalyses ?? []);
      setMeals(Array.isArray(mealsRes.data?.data) ? mealsRes.data.data : Array.isArray(mealsRes.data) ? mealsRes.data : []);
      setMealAnalytics(a.data ?? null);
    } catch { addToast('Failed to load some data', 'error'); }
    finally { setLoading(false); }
  }, [addToast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  useEffect(() => { localStorage.setItem('coach_history', JSON.stringify(coachHistory.slice(-50))); }, [coachHistory]);

  const addSupplement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { name: suppForm.name };
      if (suppForm.brand) payload.brand = suppForm.brand;
      if (suppForm.dosage) payload.dosage = suppForm.dosage;
      if (suppForm.dosageValue) payload.dosageValue = parseFloat(suppForm.dosageValue);
      if (suppForm.dosageUnit) payload.dosageUnit = suppForm.dosageUnit;
      if (suppForm.form) payload.form = suppForm.form;
      if (suppForm.frequency) payload.frequency = suppForm.frequency;
      if (suppForm.timeOfDay) payload.timeOfDay = suppForm.timeOfDay;
      if (suppForm.notes) payload.notes = suppForm.notes;
      await api.post('/supplements', payload);
      setSuppForm({ name: '', brand: '', dosage: '', dosageValue: '', dosageUnit: '', form: '', frequency: '', timeOfDay: '', notes: '' });
      addToast('Supplement added', 'success');
      loadAll();
    } catch (e: any) { addToast(e.response?.data?.error || 'Failed to add supplement', 'error'); }
  };

  const removeSupplement = async (id: string) => {
    try { await api.delete(`/supplements/${id}`); addToast('Supplement removed', 'success'); loadAll(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const addMeal = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload: any = { foods: mealForm.foods };
      const detected = getNutrientsFromFoods(mealForm.foods);
      const existingTags = mealForm.nutrientTags ? mealForm.nutrientTags.split(',').map(t => t.trim()).filter(Boolean) : [];
      const allTags = [...new Set([...detected, ...existingTags])];
      payload.nutrientTags = JSON.stringify(allTags);
      if (mealForm.calories) payload.calories = parseFloat(mealForm.calories);
      if (mealForm.macros) payload.macros = mealForm.macros;
      if (mealForm.notes) payload.notes = mealForm.notes;
      await api.post('/meals', payload);
      setMealForm({ foods: '', nutrientTags: '', calories: '', macros: '', notes: '' });
      setDetectedNutrients([]);
      addToast('Meal logged', 'success');
      loadAll();
    } catch (e: any) { addToast(e.response?.data?.error || 'Failed to log meal', 'error'); }
  };

  const removeMeal = async (id: string) => {
    try { await api.delete(`/meals/${id}`); addToast('Meal removed', 'success'); loadAll(); }
    catch { addToast('Delete failed', 'error'); }
  };

  const handleFoodChange = (val: string) => {
    setMealForm({ ...mealForm, foods: val });
    setDetectedNutrients(getNutrientsFromFoods(val));
  };

  const askCoach = async () => {
    if (!coachQuestion.trim()) return;
    setCoachLoading(true);
    setCoachAnswer('');
    try {
      const { data } = await api.get('/supplements/coach', { params: { question: coachQuestion } });
      const answer = data.answer + '\n\n' + data.disclaimer;
      setCoachAnswer(answer);
      setCoachHistory(prev => [{ q: coachQuestion, a: answer }, ...prev]);
      setCoachQuestion('');
    } catch { addToast('Failed to get answer', 'error'); }
    finally { setCoachLoading(false); }
  };

  const startScanning = async () => {
    if (!videoRef.current) return;
    setScanMode('camera');
    setCameraActive(true);
    setScanResult(null);
    setOcrText('');
    try {
      await startCamera(videoRef.current);
      scanIntervalRef.current = window.setInterval(async () => {
        if (!videoRef.current || !canvasRef.current) return;
        const barcode = await scanBarcodeFromVideo(videoRef.current);
        if (barcode) {
          clearInterval(scanIntervalRef.current);
          stopCamera();
          setCameraActive(false);
          await processBarcode(barcode);
        }
      }, 1000);
    } catch { addToast('Camera access denied or not available', 'error'); setScanMode('idle'); setCameraActive(false); }
  };

  const captureAndOCR = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    const canvas = captureFrame(videoRef.current);
    const ctx = canvas.getContext('2d')!;
    canvasRef.current.width = canvas.width;
    canvasRef.current.height = canvas.height;
    ctx.drawImage(canvas, 0, 0);

    const barcode = await scanBarcodeFromCanvas(canvas);
    if (barcode) {
      clearInterval(scanIntervalRef.current);
      stopCamera();
      setCameraActive(false);
      await processBarcode(barcode);
      return;
    }

    setOcrLoading(true);
    const text = await performOCR(canvas);
    setOcrText(text);
    setOcrLoading(false);
    setScanMode('captured');
  };

  const processBarcode = async (barcode: string) => {
    setScanMode('result');
    setScanResult({
      barcode, productName: 'Looking up...', brand: '', ingredients: '', confidence: 0, nutrition: {},
    });
    const result = await lookUpOpenFoodFacts(barcode);
    if (result) {
      setScanResult(result);
      addToast('Product found!', 'success');
    } else {
      setScanResult({ barcode, productName: 'Product not found', brand: '', ingredients: '', confidence: 0.3, nutrition: {} });
      addToast('Product not found in database', 'warning');
    }
  };

  const applyScanToForm = () => {
    if (!scanResult) return;
    const name = scanResult.productName.replace(/supplement|tablet|capsule|caplet/gi, '').trim();
    setSuppForm(prev => ({
      ...prev, name: name || scanResult.productName,
      brand: scanResult.brand || prev.brand,
    }));
    setScanMode('idle');
    setScanResult(null);
    setTab('supplements');
    addToast('Product data applied to form', 'success');
  };

  const handleManualBarcode = async () => {
    const barcode = prompt('Enter barcode number:');
    if (barcode && barcode.trim()) {
      await processBarcode(barcode.trim());
    }
  };

  const stopScanning = () => {
    clearInterval(scanIntervalRef.current);
    stopCamera();
    setCameraActive(false);
    setScanMode('idle');
  };

  const addReminderHandler = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderForm.title || !reminderForm.time || reminderForm.days.length === 0) {
      addToast('Please fill all fields', 'error'); return;
    }
    addReminder({ type: reminderForm.type, title: reminderForm.title, time: reminderForm.time, days: reminderForm.days, enabled: true });
    setReminderForm({ type: 'supplement', title: '', time: '', days: [] });
    addToast('Reminder added', 'success');
  };

  const toggleDay = (day: string) => {
    setReminderForm(prev => ({
      ...prev,
      days: prev.days.includes(day) ? prev.days.filter(d => d !== day) : [...prev.days, day],
    }));
  };

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { key: 'supplements', label: 'Supplements', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4' },
    { key: 'meals', label: 'Meals', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'timing', label: 'Timing', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
    { key: 'scan', label: 'Scan', icon: 'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01' },
    { key: 'coach', label: 'AI Coach', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
    { key: 'history', label: 'History', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    { key: 'reminders', label: 'Reminders', icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
    { key: 'enterprise', label: 'Enterprise', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
  ];

  if (loading) return <SkeletonModule />;

  const StatusBadge = ({ status }: { status: string }) => {
    const colors: Record<string, string> = { on_track: 'bg-emerald-100 text-emerald-700', borderline: 'bg-amber-100 text-amber-700', likely_gap: 'bg-red-100 text-red-700' };
    const labels: Record<string, string> = { on_track: 'On Track', borderline: 'Borderline', likely_gap: 'Likely Gap' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[status] || 'bg-slate-100 text-slate-600'}`}>{labels[status] || status}</span>;
  };

  const SeverityBadge = ({ severity }: { severity: string }) => {
    const colors: Record<string, string> = { LOW: 'bg-emerald-100 text-emerald-700', MEDIUM: 'bg-amber-100 text-amber-700', HIGH: 'bg-red-100 text-red-700' };
    return <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[severity] || 'bg-slate-100 text-slate-600'}`}>{severity}</span>;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 font-fraunces">Nutrient Absorber Optimizer</h1>
          <p className="text-slate-500 mt-1">Manage supplements, log meals, scan products, and track nutrient intake</p>
        </div>
        {dailyScore > 0 && (
          <div className="hidden md:flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-5 py-3 shadow-sm">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold text-white ${dailyScore >= 80 ? 'bg-emerald-500' : dailyScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>{dailyScore}</div>
            <div><div className="text-xs text-slate-500">Daily Health Score</div><div className="text-sm font-semibold text-slate-800">{dailyScore >= 80 ? 'Great' : dailyScore >= 50 ? 'Fair' : 'Needs Work'}</div></div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors whitespace-nowrap ${tab === t.key ? 'bg-white text-sky-600 border-b-2 border-sky-500 shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={t.icon} /></svg>
            {t.label}
          </button>
        ))}
      </div>

      {/* === DASHBOARD TAB === */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md">
              <div className="text-slate-500 text-sm">Daily Health Score</div>
              <div className="flex items-center gap-3 mt-1">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white ${dailyScore >= 80 ? 'bg-emerald-500' : dailyScore >= 50 ? 'bg-amber-500' : 'bg-red-500'}`}>{dailyScore}</div>
                <div className="text-sm text-slate-600">{dailyScore >= 80 ? 'On track!' : dailyScore >= 50 ? 'Improving' : 'Start tracking'}</div>
              </div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md">
              <div className="text-slate-500 text-sm">Supplements</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">{supplements.length}</div>
              <div className="text-xs text-slate-400 mt-1">Tracked</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md">
              <div className="text-slate-500 text-sm">Meals Logged</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">{meals.length}</div>
              <div className="text-xs text-slate-400 mt-1">{mealAnalytics?.avgCalories ? `Avg ${mealAnalytics.avgCalories} cal` : ''}</div>
            </div>
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5 hover:shadow-md">
              <div className="text-slate-500 text-sm">Interactions</div>
              <div className="text-3xl font-bold text-slate-900 mt-1">{interactionSummary.length}</div>
              <div className="text-xs text-slate-400 mt-1">Detected</div>
            </div>
          </div>

          {interactionSummary.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Interaction Summary</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {interactionSummary.map((is, i) => (
                  <div key={i} className={`border rounded-xl p-3 shadow-sm ${is.effect === 'IMPROVES_ABSORPTION' ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-slate-700">{is.supplementA} + {is.supplementB}</span>
                      <SeverityBadge severity={is.severity} />
                    </div>
                    <div className="text-xs text-slate-500">{is.effect === 'IMPROVES_ABSORPTION' ? 'May improve absorption' : 'May reduce absorption'}</div>
                    <div className="text-xs text-slate-400 mt-1">{is.timingFix}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {nutrientData && Object.keys(nutrientData).filter(k => nutrientData[k].rdi > 0).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Nutrient Gap Dashboard</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(nutrientData).filter(([, v]) => v.rdi > 0).map(([key, val]) => (
                  <div key={key} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-slate-700 capitalize">{key.replace(/_/g, ' ')}</span>
                      <StatusBadge status={val.status} />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="text-2xl font-bold" style={{ color: val.status === 'on_track' ? '#059669' : val.status === 'borderline' ? '#d97706' : '#dc2626' }}>{val.percent}%</div>
                      <div className="text-xs text-slate-500 mb-1">of RDI ({val.rdi}{val.unit})</div>
                    </div>
                    <div className="mt-2 bg-slate-100 rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(val.percent, 100)}%`, backgroundColor: val.status === 'on_track' ? '#059669' : val.status === 'borderline' ? '#d97706' : '#dc2626' }} />
                    </div>
                    <div className="text-xs text-slate-400 mt-2">Est. intake: {val.total}{val.unit}</div>
                    {val.topSources.length > 0 && <div className="text-xs text-slate-400">Top sources: {val.topSources.join(', ')}</div>}
                    {val.suggestions.length > 0 && (
                      <div className="mt-2 text-xs text-slate-500 bg-slate-50 rounded-lg p-2">
                        <span className="font-medium text-slate-600">Tips: </span>{val.suggestions.slice(0, 2).join(' • ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-amber-600 text-xs mt-4 text-center">Estimate based on logged food and supplements. Not a medical diagnosis.</p>
            </div>
          )}

          {(!nutrientData || Object.values(nutrientData).every(v => v.rdi === 0)) && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
              <p className="text-slate-500">Log meals with nutrient tags and add supplements to see your nutrient gap dashboard.</p>
            </div>
          )}

          {analyses.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 hover:shadow-md">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Smart Suggestions</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {analyses.map((a, i) => (
                  <div key={i} className="bg-gradient-to-r from-sky-50 to-white border border-sky-100 rounded-xl p-4 shadow-sm">
                    <div className="font-medium text-slate-800">{a.supplementName}</div>
                    <div className="text-xs text-slate-500 mt-1">{a.bestTimeToTake}</div>
                    {a.foodsToPair.length > 0 && <div className="text-xs text-emerald-600 mt-1">Pair with: {a.foodsToPair.slice(0, 3).map(f => f.food).join(', ')}</div>}
                    {a.foodsToAvoid.length > 0 && <div className="text-xs text-red-500 mt-1">Avoid near: {a.foodsToAvoid.slice(0, 3).map(f => f.food).join(', ')}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* === SUPPLEMENTS TAB === */}
      {tab === 'supplements' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Add Supplement</h2>
              <form onSubmit={addSupplement} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input type="text" value={suppForm.name} onChange={(e) => setSuppForm({ ...suppForm, name: e.target.value })} placeholder="Supplement name *" required className="input-field" />
                  <input type="text" value={suppForm.brand} onChange={(e) => setSuppForm({ ...suppForm, brand: e.target.value })} placeholder="Brand" className="input-field" />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <input type="text" value={suppForm.dosage} onChange={(e) => setSuppForm({ ...suppForm, dosage: e.target.value })} placeholder="Dosage text" className="input-field" />
                  <input type="number" value={suppForm.dosageValue} onChange={(e) => setSuppForm({ ...suppForm, dosageValue: e.target.value })} placeholder="Value" className="input-field" />
                  <select value={suppForm.dosageUnit} onChange={(e) => setSuppForm({ ...suppForm, dosageUnit: e.target.value })} className="input-field"><option value="">Unit</option><option value="mg">mg</option><option value="g">g</option><option value="ug">μg</option><option value="IU">IU</option><option value="ml">ml</option></select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <select value={suppForm.form} onChange={(e) => setSuppForm({ ...suppForm, form: e.target.value })} className="input-field"><option value="">Form</option><option value="tablet">Tablet</option><option value="capsule">Capsule</option><option value="liquid">Liquid</option><option value="powder">Powder</option></select>
                  <input type="text" value={suppForm.frequency} onChange={(e) => setSuppForm({ ...suppForm, frequency: e.target.value })} placeholder="Frequency" className="input-field" />
                </div>
                <input type="text" value={suppForm.timeOfDay} onChange={(e) => setSuppForm({ ...suppForm, timeOfDay: e.target.value })} placeholder="Time of day (e.g., Morning with food)" className="input-field" />
                <textarea value={suppForm.notes} onChange={(e) => setSuppForm({ ...suppForm, notes: e.target.value })} placeholder="Notes" rows={2} className="input-field" />
                <button type="submit" className="btn-primary">Add Supplement</button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Your Supplements</h2>
              {supplements.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No supplements added yet.</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                  {supplements.map((s) => {
                    const analysis = analyses.find(a => a.supplementId === s.id);
                    return (
                      <div key={s.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-slate-800 font-medium">{s.name}{s.brand ? <span className="text-slate-400 text-xs ml-2">{s.brand}</span> : null}</div>
                            <div className="text-xs text-slate-500 mt-1">
                              {s.dosage && <span>{s.dosage} </span>}{s.dosageValue && <span>{s.dosageValue}{s.dosageUnit} </span>}
                              {s.form && <span className="capitalize">• {s.form} </span>}{s.frequency && <span>• {s.frequency}</span>}
                              {s.timeOfDay && <span> • {s.timeOfDay}</span>}
                            </div>
                          </div>
                          <button onClick={() => removeSupplement(s.id)} className="text-red-600 hover:text-red-700 text-sm">Delete</button>
                        </div>
                        {analysis && (
                          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2">
                            <div className="text-xs text-slate-500"><span className="font-medium">Best time:</span> {analysis.bestTimeToTake}</div>
                            {analysis.mayImproveAbsorption.length > 0 && (
                              <div className="text-xs text-emerald-600"><span className="font-medium">May improve with:</span> {analysis.mayImproveAbsorption.map(i => i.interactsWith).join(', ')}</div>
                            )}
                            {analysis.mayReduceAbsorption.length > 0 && (
                              <div className="text-xs text-red-500"><span className="font-medium">May reduce with:</span> {analysis.mayReduceAbsorption.map(i => i.interactsWith).join(', ')}</div>
                            )}
                            {analysis.foodsToPair.length > 0 && (
                              <div className="text-xs text-emerald-600"><span className="font-medium">Pair with:</span> {analysis.foodsToPair.slice(0, 4).map(f => f.food).join(', ')}</div>
                            )}
                            {analysis.foodsToAvoid.length > 0 && (
                              <div className="text-xs text-red-500"><span className="font-medium">Avoid near:</span> {analysis.foodsToAvoid.slice(0, 4).map(f => f.food).join(', ')}</div>
                            )}
                            <div className="text-xs text-slate-400 italic">{analysis.reasoning}</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {analyses.length > 0 && (
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Supplement Timeline</h2>
                <div className="space-y-3">
                  {analyses.map((a, i) => (
                    <div key={i} className="flex items-center gap-3 border-l-4 border-sky-400 pl-3 py-2">
                      <div className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
                      <div>
                        <div className="text-sm font-medium text-slate-700">{a.supplementName}</div>
                        <div className="text-xs text-slate-400">{a.bestTimeToTake}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {interactionSummary.length > 0 && (
            <div className="lg:col-span-2">
              <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Interaction Risk Engine</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {interactionSummary.map((is, i) => (
                    <div key={i} className={`border rounded-xl p-4 shadow-sm ${is.effect === 'IMPROVES_ABSORPTION' ? 'border-emerald-200 bg-emerald-50/50' : 'border-red-200 bg-red-50/50'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-700">{is.supplementA}</span>
                        <span className="text-xs text-slate-400">+</span>
                        <span className="text-sm font-semibold text-slate-700">{is.supplementB}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <SeverityBadge severity={is.severity} />
                        <span className={`text-xs font-medium ${is.effect === 'IMPROVES_ABSORPTION' ? 'text-emerald-600' : 'text-red-600'}`}>
                          {is.effect === 'IMPROVES_ABSORPTION' ? 'Positive' : 'Caution'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">{is.description}</div>
                      <div className="text-xs text-sky-600 mt-2 font-medium">Timing: {is.timingFix}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === MEALS TAB === */}
      {tab === 'meals' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Log a Meal</h2>
              <form onSubmit={addMeal} className="space-y-4">
                <textarea value={mealForm.foods} onChange={(e) => handleFoodChange(e.target.value)} placeholder="Foods eaten (e.g., Oatmeal, banana, milk, eggs)" required rows={2} className="input-field" />
                {detectedNutrients.length > 0 && (
                  <div className="bg-sky-50 border border-sky-100 rounded-xl p-3">
                    <div className="text-xs font-medium text-sky-700 mb-1">Auto-detected nutrients:</div>
                    <div className="flex flex-wrap gap-1">{detectedNutrients.map(n => <span key={n} className="px-2 py-0.5 bg-white rounded-full text-xs text-sky-600 border border-sky-200 capitalize">{n.replace(/_/g, ' ')}</span>)}</div>
                  </div>
                )}
                <input type="text" value={mealForm.nutrientTags} onChange={(e) => setMealForm({ ...mealForm, nutrientTags: e.target.value })} placeholder="Additional nutrient tags (optional)" className="input-field" />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={mealForm.calories} onChange={(e) => setMealForm({ ...mealForm, calories: e.target.value })} placeholder="Calories" className="input-field" />
                  <input type="text" value={mealForm.macros} onChange={(e) => setMealForm({ ...mealForm, macros: e.target.value })} placeholder="Macros (P:C:F)" className="input-field" />
                </div>
                <textarea value={mealForm.notes} onChange={(e) => setMealForm({ ...mealForm, notes: e.target.value })} placeholder="Notes" rows={2} className="input-field" />
                <button type="submit" className="btn-primary">Log Meal</button>
              </form>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Meal History</h2>
              {meals.length === 0 ? (
                <p className="text-slate-500 text-center py-8">No meals logged yet.</p>
              ) : (
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {meals.slice(0, 20).map((m) => {
                    const ma = mealAnalyses.find(a => a.mealId === m.id);
                    const nutrients = getNutrientsFromFoods(m.foods);
                    return (
                      <div key={m.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="text-slate-800 font-medium">{m.foods}</div>
                            <div className="text-xs text-slate-500 mt-1">{new Date(m.mealTime).toLocaleString()}{m.calories && <span> • {m.calories} cal</span>}</div>
                            {nutrients.length > 0 && <div className="flex flex-wrap gap-1 mt-2">{nutrients.map(n => <span key={n} className="px-2 py-0.5 bg-sky-50 rounded-full text-xs text-sky-600 border border-sky-100 capitalize">{n.replace(/_/g, ' ')}</span>)}</div>}
                          </div>
                          <button onClick={() => removeMeal(m.id)} className="text-red-600 hover:text-red-700 text-sm ml-3">Delete</button>
                        </div>
                        {ma?.conflictsWithSupplements.filter(c => c.issue).map((c, ci) => (
                          <div key={ci} className="mt-2 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">{c.issue}</div>
                        ))}
                        {ma?.boostsWithSupplements.filter(b => b.reason).map((b, bi) => (
                          <div key={bi} className="mt-1 bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-700">{b.reason}</div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* === TIMING TAB === */}
      {tab === 'timing' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Personalized Timing Optimizer</h2>
            {analyses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyses.map((a, i) => (
                  <div key={i} className={`border rounded-xl p-5 shadow-sm ${a.severity === 'MEDIUM' ? 'border-amber-200 bg-amber-50/30' : a.mayReduceAbsorption.length > 0 ? 'border-red-200 bg-red-50/30' : 'border-emerald-200 bg-emerald-50/30'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-slate-800">{a.supplementName}</h3>
                      <SeverityBadge severity={a.severity} />
                    </div>
                    <div className="space-y-2 text-sm">
                      <div><span className="font-medium text-slate-600">Best time:</span> <span className="text-slate-700">{a.bestTimeToTake}</span></div>
                      {a.mayImproveAbsorption.length > 0 && (
                        <div><span className="font-medium text-emerald-600">May improve:</span>
                          {a.mayImproveAbsorption.map((imp, ii) => (
                            <div key={ii} className="ml-2 text-xs text-slate-500">• {imp.interactsWith}: {imp.description}{imp.citationUrl && <a href={imp.citationUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 ml-1">Source</a>}</div>
                          ))}
                        </div>
                      )}
                      {a.mayReduceAbsorption.length > 0 && (
                        <div><span className="font-medium text-red-600">May reduce:</span>
                          {a.mayReduceAbsorption.map((red, ri) => (
                            <div key={ri} className="ml-2 text-xs text-slate-500">• {red.interactsWith}: {red.description}{red.citationUrl && <a href={red.citationUrl} target="_blank" rel="noopener noreferrer" className="text-sky-500 ml-1">Source</a>}</div>
                          ))}
                        </div>
                      )}
                      {a.foodsToPair.length > 0 && <div><span className="font-medium text-emerald-600">Pair with:</span> <span className="text-slate-600">{a.foodsToPair.map(f => f.food).join(', ')}</span></div>}
                      {a.foodsToAvoid.length > 0 && <div><span className="font-medium text-red-600">Avoid near:</span> <span className="text-slate-600">{a.foodsToAvoid.map(f => f.food).join(', ')}</span></div>}
                    </div>
                    {a.reasoning && <div className="mt-3 text-xs text-slate-400 italic">{a.reasoning}</div>}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8"><p className="text-slate-500">Add supplements to get personalized timing suggestions.</p></div>
            )}
          </div>

          {mealAnalyses.filter(ma => ma.conflictsWithSupplements.length > 0 || ma.boostsWithSupplements.length > 0).length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Meal-Based Recommendations</h2>
              <div className="space-y-3">
                {mealAnalyses.filter(ma => ma.conflictsWithSupplements.length > 0 || ma.boostsWithSupplements.length > 0).slice(0, 5).map((ma, i) => (
                  <div key={i} className="border border-slate-100 rounded-xl p-4 shadow-sm">
                    <div className="text-sm font-medium text-slate-700 mb-2">{ma.foods}</div>
                    {ma.conflictsWithSupplements.map((c, ci) => (
                      <div key={ci} className="bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700 mb-1">{c.issue}</div>
                    ))}
                    {ma.boostsWithSupplements.map((b, bi) => (
                      <div key={bi} className="bg-emerald-50 border border-emerald-200 rounded-lg p-2 text-xs text-emerald-700">{b.reason}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm">
            <p className="text-amber-600 text-sm">General educational guidance only. These suggestions may not apply to everyone. Consult your healthcare provider.</p>
          </div>
        </div>
      )}

      {/* === SCAN TAB === */}
      {tab === 'scan' && (
        <div className="space-y-6">
          {scanMode === 'idle' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
              <svg className="w-16 h-16 text-sky-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>
              <h2 className="text-xl font-semibold text-slate-700 mb-2">Barcode & Label Scanner</h2>
              <p className="text-slate-500 max-w-md mx-auto mb-6">Scan supplement barcodes to auto-fill details from Open Food Facts database, or capture a label for OCR text extraction.</p>
              <div className="flex justify-center gap-3">
                <button onClick={startScanning} className="btn-primary flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Scan with Camera
                </button>
                <button onClick={handleManualBarcode} className="btn-secondary">Enter Barcode</button>
              </div>
              <p className="text-xs text-slate-400 mt-4">Uses built-in BarcodeDetector API + Open Food Facts. Camera access required for live scanning.</p>
            </div>
          )}

          {scanMode === 'camera' && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Camera Scanner</h2>
                <button onClick={stopScanning} className="text-red-600 hover:text-red-700 text-sm">Stop Camera</button>
              </div>
              <div className="relative bg-black rounded-xl overflow-hidden max-w-lg mx-auto">
                <video ref={videoRef} className="w-full h-64 object-cover" playsInline />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 border-2 border-dashed border-white/30 rounded-xl pointer-events-none" />
                <div className="absolute bottom-3 left-0 right-0 text-center text-white text-xs bg-black/50 py-1">Point camera at barcode or QR code</div>
              </div>
              <div className="flex justify-center gap-3 mt-4">
                <button onClick={captureAndOCR} className="btn-secondary flex items-center gap-2">
                  {ocrLoading ? 'Processing...' : 'Capture & OCR Label'}
                </button>
                <button onClick={handleManualBarcode} className="btn-secondary">Enter Barcode Manually</button>
              </div>
              {ocrText && (
                <div className="mt-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <h3 className="text-sm font-medium text-slate-700 mb-2">OCR Result:</h3>
                  <pre className="text-xs text-slate-600 whitespace-pre-wrap max-h-32 overflow-y-auto">{ocrText}</pre>
                </div>
              )}
            </div>
          )}

          {scanMode === 'result' && scanResult && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-slate-800">Scan Result</h2>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${scanResult.confidence >= 0.7 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  Confidence: {Math.round(scanResult.confidence * 100)}%
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-slate-500">Product Name</label>
                    <input type="text" value={scanResult.productName} readOnly={false} onChange={(e) => setScanResult({ ...scanResult, productName: e.target.value })} className="input-field mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Brand</label>
                    <input type="text" value={scanResult.brand} onChange={(e) => setScanResult({ ...scanResult, brand: e.target.value })} className="input-field mt-1" />
                  </div>
                  <div>
                    <label className="text-xs text-slate-500">Barcode</label>
                    <div className="text-sm text-slate-700 mt-1 font-mono">{scanResult.barcode}</div>
                  </div>
                  {scanResult.ingredients && (
                    <div>
                      <label className="text-xs text-slate-500">Ingredients</label>
                      <div className="text-xs text-slate-600 mt-1 max-h-20 overflow-y-auto">{scanResult.ingredients}</div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-2 block">Nutrition (per 100g)</label>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(scanResult.nutrition).filter(([, v]) => v !== null).map(([key, val]) => (
                      <div key={key} className="bg-slate-50 rounded-lg p-2">
                        <div className="text-xs text-slate-400 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</div>
                        <div className="text-sm font-medium text-slate-700">{val}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-100">
                <button onClick={() => setScanMode('idle')} className="btn-secondary">Cancel</button>
                <button onClick={applyScanToForm} className="btn-primary">Apply to Supplement Form</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* === COACH TAB === */}
      {tab === 'coach' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">AI Coach</h2>
            <p className="text-xs text-slate-500 mb-4">Ask about supplement timing, food pairings, and absorption principles.</p>
            <form onSubmit={(e) => { e.preventDefault(); askCoach(); }} className="space-y-3">
              <textarea value={coachQuestion} onChange={(e) => setCoachQuestion(e.target.value)} placeholder="e.g., Why should I take Vitamin D with breakfast?" rows={2} className="input-field" />
              <button type="submit" disabled={coachLoading || !coachQuestion.trim()} className="btn-primary">{coachLoading ? 'Thinking...' : 'Ask Coach'}</button>
            </form>
            {coachAnswer && (
              <div className="mt-4 bg-sky-50 border border-sky-100 rounded-xl p-4">
                <div className="text-sm text-slate-700 whitespace-pre-wrap">{coachAnswer}</div>
              </div>
            )}
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Recent Questions</h2>
            {coachHistory.length === 0 ? (
              <p className="text-slate-500 text-center py-8 text-sm">No questions yet. Ask the coach above.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {coachHistory.map((h, i) => (
                  <div key={i} className="bg-white border border-slate-100 rounded-xl p-3 shadow-sm">
                    <div className="text-sm font-medium text-slate-700">Q: {h.q}</div>
                    <div className="text-xs text-slate-500 mt-1 whitespace-pre-wrap line-clamp-3">{h.a}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3 text-xs text-amber-700">
              The AI Coach explains only deterministic results from the interaction engine. Never changes dosages or prescribes. For personal medical advice, talk with your doctor or pharmacist.
            </div>
          </div>
        </div>
      )}

      {/* === HISTORY TAB === */}
      {tab === 'history' && (
        <div className="space-y-6">
          {mealAnalytics && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="text-slate-500 text-sm">Total Meals</div>
                  <div className="text-3xl font-bold text-slate-900 mt-1">{mealAnalytics.totalMeals}</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="text-slate-500 text-sm">Avg Calories</div>
                  <div className="text-3xl font-bold text-slate-900 mt-1">{mealAnalytics.avgCalories}</div>
                  <div className="text-xs text-slate-400">per meal</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="text-slate-500 text-sm">Supplements</div>
                  <div className="text-3xl font-bold text-slate-900 mt-1">{supplements.length}</div>
                  <div className="text-xs text-slate-400">tracked</div>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-5">
                  <div className="text-slate-500 text-sm">Daily Score</div>
                  <div className="text-3xl font-bold text-slate-900 mt-1">{dailyScore}</div>
                  <div className="text-xs text-slate-400">nutrient health</div>
                </div>
              </div>

              {mealAnalytics.missedNutrients.length > 0 && (
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-slate-800 mb-4">Most Missed Nutrients</h2>
                  <div className="space-y-3">
                    {mealAnalytics.missedNutrients.filter(n => n.status !== 'on_track').slice(0, 8).map((n, i) => (
                      <div key={i} className="flex items-center gap-4">
                        <span className="text-sm font-medium text-slate-700 w-32 capitalize">{n.nutrient.replace(/_/g, ' ')}</span>
                        <div className="flex-1 bg-slate-100 rounded-full h-2.5">
                          <div className={`h-2.5 rounded-full ${n.status === 'likely_gap' ? 'bg-red-400' : 'bg-amber-400'}`} style={{ width: `${Math.min((n.loggedCount / 5) * 100, 100)}%` }} />
                        </div>
                        <span className="text-xs text-slate-500 w-24 text-right">Logged {n.loggedCount}x</span>
                        <StatusBadge status={n.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {mealAnalytics.mostFrequentFoods.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Most Frequent Foods</h2>
                    <div className="space-y-2">
                      {mealAnalytics.mostFrequentFoods.slice(0, 10).map((f, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-xs text-slate-400 w-6">{i + 1}.</span>
                          <span className="text-sm text-slate-700 flex-1 capitalize">{f.food}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <div className="bg-sky-400 h-2 rounded-full" style={{ width: `${Math.min((f.count / mealAnalytics.mostFrequentFoods[0].count) * 100, 100)}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{f.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-slate-800 mb-4">Nutrient Frequency</h2>
                    <div className="space-y-2">
                      {mealAnalytics.nutrientFrequency.slice(0, 10).map((n, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-sm text-slate-700 flex-1 capitalize">{n.nutrient.replace(/_/g, ' ')}</span>
                          <div className="flex-1 bg-slate-100 rounded-full h-2">
                            <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${Math.min((n.count / mealAnalytics.nutrientFrequency[0]?.count || 1) * 100, 100)}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-8 text-right">{n.count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="bg-white border border-slate-100 rounded-xl p-4 text-center shadow-sm">
                <p className="text-amber-600 text-sm">Estimate based on logged food and supplements. Not a medical diagnosis.</p>
              </div>
            </>
          )}

          {!mealAnalytics && (
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-8 text-center">
              <p className="text-slate-500">Log some meals and supplements to see your history analytics.</p>
            </div>
          )}
        </div>
      )}

      {/* === REMINDERS TAB === */}
      {tab === 'reminders' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Add Reminder</h2>
            <form onSubmit={addReminderHandler} className="space-y-4">
              <select value={reminderForm.type} onChange={(e) => setReminderForm({ ...reminderForm, type: e.target.value as 'supplement' | 'meal' })} className="input-field">
                <option value="supplement">Supplement Reminder</option>
                <option value="meal">Meal Reminder</option>
              </select>
              <input type="text" value={reminderForm.title} onChange={(e) => setReminderForm({ ...reminderForm, title: e.target.value })} placeholder="e.g., Take Vitamin D with breakfast" className="input-field" />
              <input type="time" value={reminderForm.time} onChange={(e) => setReminderForm({ ...reminderForm, time: e.target.value })} className="input-field" />
              <div>
                <label className="text-xs text-slate-500 mb-2 block">Repeat on:</label>
                <div className="flex gap-2 flex-wrap">
                  {dayLabels.map((label, i) => (
                    <button key={dayNames[i]} type="button" onClick={() => toggleDay(dayNames[i])}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${reminderForm.days.includes(dayNames[i]) ? 'bg-sky-500 text-white border-sky-500' : 'bg-white text-slate-600 border-slate-200 hover:border-sky-300'}`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              <button type="submit" className="btn-primary">Add Reminder</button>
            </form>

            {permission !== 'granted' && 'Notification' in window && (
              <div className="mt-4 bg-amber-50 border border-amber-100 rounded-xl p-3">
                <p className="text-xs text-amber-700 mb-2">Browser notifications are not enabled. Enable them to receive reminder alerts.</p>
                <button onClick={requestPermission} className="text-xs bg-amber-500 text-white px-3 py-1 rounded-lg hover:bg-amber-600">Enable Notifications</button>
              </div>
            )}
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-slate-800 mb-4">Your Reminders</h2>
            {reminders.length === 0 ? (
              <p className="text-slate-500 text-center py-8">No reminders set.</p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {reminders.map((r) => (
                  <div key={r.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${r.type === 'supplement' ? 'bg-sky-400' : 'bg-emerald-400'}`} />
                        <div>
                          <div className="text-sm font-medium text-slate-700">{r.title}</div>
                          <div className="text-xs text-slate-400">{r.time} • {r.days.map(d => d.slice(0, 3)).join(', ')}</div>
                          <div className="text-xs text-slate-400 capitalize">{r.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => toggleReminder(r.id)} className={`px-2 py-1 rounded text-xs font-medium ${r.enabled ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{r.enabled ? 'On' : 'Off'}</button>
                        <button onClick={() => deleteReminder(r.id)} className="text-red-600 hover:text-red-700 text-xs">Delete</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* === ENTERPRISE TAB === */}
      {tab === 'enterprise' && (
        <EnterpriseDashboard openTab={(t) => setTab(t as Tab)} />
      )}

      {/* Bottom disclaimer always present */}
      <div className="bg-white border border-slate-100 rounded-xl p-3 text-center shadow-sm">
        <p className="text-amber-600 text-xs">General educational guidance only. Every recommendation uses "may improve" or "may reduce" phrasing — never exact percentages, diagnosis, or treatment. Consult your healthcare provider for personal medical advice.</p>
      </div>
    </div>
  );
}
