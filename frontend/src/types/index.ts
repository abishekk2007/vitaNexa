export type UserRole = 'USER' | 'ADMIN' | 'MODERATOR' | 'RESEARCHER' | 'NUTRITIONIST' | 'DOCTOR';
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
}

export const USER_ROLES: UserRole[] = ['USER', 'ADMIN', 'MODERATOR', 'RESEARCHER', 'NUTRITIONIST', 'DOCTOR'];
export const USER_STATUSES: UserStatus[] = ['active', 'inactive', 'suspended', 'pending'];

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface BacteriaResult {
  id: string;
  userId: string;
  bacteriaName: string;
  level: 'LOW' | 'NORMAL' | 'HIGH';
  recordedAt: string;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  fiberContent?: string;
  effect: string;
  prebiotic: boolean;
  probiotic: boolean;
}

export interface FoodLog {
  id: string;
  foodId?: string;
  foodName?: string;
  eatenAt: string;
  bloating: string;
  energy: string;
  mood: string;
  notes?: string;
  food?: FoodItem;
}

export interface PainLog {
  id: string;
  date: string;
  time?: string;
  location?: string;
  painLevel: number;
  weather?: string;
  food?: string;
  stress?: string;
  sleepHours?: number;
  exercise?: boolean;
  humidity?: number;
  temperature?: number;
  pressure?: number;
}

export interface Supplement {
  id: string;
  name: string;
  dosage?: string;
  frequency?: string;
  timeOfDay?: string;
  startDate: string;
  notes?: string;
}

export interface SpoonBudget {
  id: string;
  date: string;
  totalSpoons: number;
  remainingSpoons: number;
  activities: Activity[];
  recoveries: Recovery[];
}

export interface Activity {
  id: string;
  name: string;
  spoonCost: number;
  category?: string;
  completed: boolean;
  createdAt: string;
}

export interface Recovery {
  id: string;
  activity: string;
  spoonsGained: number;
  notes?: string;
  createdAt: string;
}

export interface ActivityPreset {
  id: string;
  name: string;
  spoonCost: number;
  category?: string;
  isDefault: boolean;
}

export interface PetProfile {
  id: string;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  photoUrl?: string;
}

export interface PetMoodLog {
  id: string;
  petId: string;
  mood: string;
  energyLevel: string;
  notes?: string;
  loggedAt: string;
  pet?: { name: string; species: string };
}

export interface Hospital {
  id: string;
  name: string;
  type: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export interface VolunteerDriver {
  id: string;
  name: string;
  phone: string;
  status: string;
  latitude?: number;
  longitude?: number;
  distance?: number;
}

export interface BloodDonor {
  id: string;
  bloodGroup: string;
  phone: string;
  location?: string;
  lastDonationDate?: string;
  isAvailable: boolean;
}

export interface BloodRequest {
  id: string;
  bloodGroupNeeded: string;
  hospital: string;
  urgency: string;
  requesterName: string;
  requesterPhone: string;
  status: string;
  createdAt: string;
}

export interface SavingsEntry {
  id: string;
  date: string;
  amount: number;
  runningTotal: number;
  notes?: string;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  reminderTime?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface MealLog {
  id: string;
  mealTime: string;
  foods: string;
  notes?: string;
}

export interface EmergencyContact {
  id: string;
  userId: string;
  name: string;
  phone: string;
  priority: number;
  relation?: string;
  isVerified: boolean;
  consentGiven: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmergencyEvent {
  id: string;
  userId: string;
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELLED';
  latitude?: number;
  longitude?: number;
  locationName?: string;
  medicalSnapshot?: string;
  symptoms?: string;
  description?: string;
  contactMethod?: string;
  resolvedBy?: string;
  resolvedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
  notifications?: EmergencyNotification[];
  user?: { id: string; name: string; email: string; phone?: string };
}

export interface EmergencyNotification {
  id: string;
  eventId: string;
  contactId?: string;
  method: string;
  status: string;
  message?: string;
  sentAt?: string;
  deliveredAt?: string;
  error?: string;
  createdAt: string;
  contact?: EmergencyContact;
}
