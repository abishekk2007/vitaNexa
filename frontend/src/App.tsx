import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import AdminLayout from './components/layout/AdminLayout';
import PublicLayout from './components/layout/PublicLayout';
import ToastContainer from './components/ui/Toast';

import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import NotFound from './pages/public/NotFound';
import DashboardHome from './pages/dashboard/DashboardHome';
import Microbiome from './pages/modules/Microbiome';

import NutrientOptimizer from './pages/modules/NutrientOptimizer';
import EnergyLedger from './pages/modules/EnergyLedger';
import EmergencyHelp from './pages/modules/EmergencyHelp';
import BloodBank from './pages/modules/BloodBank';
import BudgetSaver from './pages/modules/BudgetSaver';
import MedoraInsights from './pages/modules/MedoraInsights';
import PainPatternPredictor from './pages/modules/pain-predictor/PainPatternPredictor';
import MoodJournal from './pages/modules/MoodJournal';
import DailySchedule from './pages/modules/DailySchedule';
import AchievementsPage from './pages/modules/Achievements';
import NotificationsPage from './pages/modules/NotificationsPage';
import ReportsPage from './pages/modules/ReportsPage';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminVolunteers from './pages/admin/AdminVolunteers';
import AdminBlood from './pages/admin/AdminBlood';
import AdminAnalytics from './pages/admin/AdminAnalytics';
import AdminMicrobiomeSpecies from './pages/admin/AdminMicrobiomeSpecies';
import AdminMicrobiomeFoods from './pages/admin/AdminMicrobiomeFoods';
import AdminMicrobiomeEffects from './pages/admin/AdminMicrobiomeEffects';
import AdminMicrobiomeRules from './pages/admin/AdminMicrobiomeRules';
import AdminMicrobiomeReview from './pages/admin/AdminMicrobiomeReview';
import AdminMicrobiomeImport from './pages/admin/AdminMicrobiomeImport';
import AdminMicrobiomeReports from './pages/admin/AdminMicrobiomeReports';
import AdminPainManagement from './pages/admin/AdminPainManagement';
import AdminNutrientAnalytics from './pages/admin/AdminNutrientAnalytics';
import EmergencyContacts from './pages/settings/EmergencyContacts';
// SIH26133 Modules
import PublicHealthcare from './pages/modules/PublicHealthcare';
import DigitalTriage from './pages/modules/DigitalTriage';
import Appointments from './pages/modules/Appointments';
import HealthRecord from './pages/modules/HealthRecord';
import Referrals from './pages/modules/Referrals';
import FollowUps from './pages/modules/FollowUps';
import HealthWorkerPortal from './pages/modules/HealthWorkerPortal';
import AdminEmergency from './pages/admin/AdminEmergency';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />
              </Route>

              {/* Protected user routes with sidebar */}
              <Route path="/dashboard" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<DashboardHome />} />
                <Route path="profile" element={<DashboardHome />} />
              </Route>
              <Route path="/microbiome" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Microbiome />} />
              </Route>

              <Route path="/nutrient" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<NutrientOptimizer />} />
              </Route>
              <Route path="/energy" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<EnergyLedger />} />
              </Route>

              <Route path="/emergency" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<EmergencyHelp />} />
              </Route>
              <Route path="/bloodbank" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<BloodBank />} />
              </Route>
              <Route path="/budget" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<BudgetSaver />} />
              </Route>
              <Route path="/medora" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<MedoraInsights />} />
              </Route>
              <Route path="/pain-predictor" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<PainPatternPredictor />} />
              </Route>
              <Route path="/mood-journal" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<MoodJournal />} />
              </Route>
              <Route path="/daily-schedule" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<DailySchedule />} />
              </Route>
              <Route path="/achievements" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<AchievementsPage />} />
              </Route>
              <Route path="/notifications" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<NotificationsPage />} />
              </Route>
              <Route path="/reports" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<ReportsPage />} />
              </Route>
              <Route path="/settings/emergency-contacts" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<EmergencyContacts />} />
              </Route>

              {/* SIH26133 Routes */}
              <Route path="/public-health" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<PublicHealthcare />} />
              </Route>
              <Route path="/digital-triage" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<DigitalTriage />} />
              </Route>
              <Route path="/appointments" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Appointments />} />
              </Route>
              <Route path="/health-record" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<HealthRecord />} />
              </Route>
              <Route path="/referrals" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<Referrals />} />
              </Route>
              <Route path="/follow-ups" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<FollowUps />} />
              </Route>
              <Route path="/health-worker" element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                <Route index element={<HealthWorkerPortal />} />
              </Route>

              {/* Admin routes */}
              <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
                <Route index element={<AdminDashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="volunteers" element={<AdminVolunteers />} />
                <Route path="blood" element={<AdminBlood />} />
                <Route path="analytics" element={<AdminAnalytics />} />
                <Route path="microbiome-species" element={<AdminMicrobiomeSpecies />} />
                <Route path="microbiome-foods" element={<AdminMicrobiomeFoods />} />
                <Route path="microbiome-effects" element={<AdminMicrobiomeEffects />} />
                <Route path="microbiome-rules" element={<AdminMicrobiomeRules />} />
                <Route path="microbiome-review" element={<AdminMicrobiomeReview />} />
                <Route path="microbiome-import" element={<AdminMicrobiomeImport />} />
                <Route path="reports" element={<AdminMicrobiomeReports />} />
                <Route path="pain" element={<AdminPainManagement />} />
                <Route path="nutrient-analytics" element={<AdminNutrientAnalytics />} />

                <Route path="emergency" element={<AdminEmergency />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<PublicLayout />}>
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
            <ToastContainer />
          </AuthProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
