const fs = require('fs');
let content = fs.readFileSync('backend/prisma/schema.prisma', 'utf8');

// Insert User relations
const userRelations = `
  healthRecords       HealthRecord[]
  appointments        Appointment[]
  digitalTriages      DigitalTriage[]
  referrals           Referral[]
  emergencyEscalations EmergencyEscalation[]
  healthcareWorker    HealthcareWorker?
`;
const userModelEnd = content.indexOf('@@index([email])');
content = content.substring(0, userModelEnd) + userRelations + content.substring(userModelEnd);

// Append new models
const newModels = `
// ==========================================
// SIH26133 PUBLIC HEALTHCARE ACCESS MODELS
// ==========================================

model PublicHealthcareFacility {
  id                         String   @id @default(cuid())
  name                       String
  facility_code              String?  @unique
  facility_type              String
  ownership                  String   @default("Government")
  address                    String
  district                   String?
  state                      String?
  pincode                    String?
  latitude                   Float?
  longitude                  Float?
  phone                      String?
  email                      String?
  emergency_available        Boolean  @default(false)
  is_24x7                    Boolean  @default(false)
  specialist_services        String?
  diagnostic_services        String?
  medicine_services          String?
  bed_capacity               Int?
  available_beds             Int?
  ambulance_available        Boolean  @default(false)
  teleconsultation_available Boolean  @default(false)
  languages_supported        String?
  accessibility_features     String?
  opening_hours              String?
  status                     String   @default("ACTIVE")
  created_at                 DateTime @default(now())
  updated_at                 DateTime @updatedAt

  workers                    HealthcareWorker[]
  appointments               Appointment[]
  queues                     Queue[]
  healthRecords              HealthRecord[]
  referralsFrom              Referral[] @relation("ReferralFromFacility")
  referralsTo                Referral[] @relation("ReferralToFacility")
  diagnosticRequests         DiagnosticRequest[]
  medicineAvailability       MedicineAvailability[]
  highRiskPatients           HighRiskPatient[]
  teleconsultations          Teleconsultation[]
  emergencyEscalations       EmergencyEscalation[]
  facilityServices           FacilityService[]
  healthRecordAccesses       HealthRecordAccess[]
}

model HealthcareWorker {
  id                  String   @id @default(cuid())
  user_id             String   @unique
  facility_id         String
  name                String
  phone               String?
  email               String?
  role                String
  specialization      String?
  registration_number String?
  languages           String?
  status              String   @default("ACTIVE")
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  user                User     @relation(fields: [user_id], references: [id])
  facility            PublicHealthcareFacility @relation(fields: [facility_id], references: [id])
  appointments        Appointment[]
  highRiskPatients    HighRiskPatient[]
  followUps           FollowUp[]
  teleconsultations   Teleconsultation[]
}

model HealthRecord {
  id                  String   @id @default(cuid())
  patient_id          String
  created_by          String
  facility_id         String
  record_type         String
  title               String
  description         String?
  diagnosis           String?
  symptoms            String?
  observations        String?
  medications         String?
  allergies           String?
  vital_signs         String?
  attachments         String?
  record_date         DateTime @default(now())
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  user                User     @relation(fields: [patient_id], references: [id])
  facility            PublicHealthcareFacility @relation(fields: [facility_id], references: [id])
  accesses            HealthRecordAccess[]
}

model HealthRecordAccess {
  id                  String   @id @default(cuid())
  record_id           String
  user_id             String
  facility_id         String
  access_type         String
  granted_at          DateTime @default(now())
  expires_at          DateTime?
  revoked_at          DateTime?

  record              HealthRecord @relation(fields: [record_id], references: [id])
  facility            PublicHealthcareFacility @relation(fields: [facility_id], references: [id])
}

model Appointment {
  id                  String   @id @default(cuid())
  patient_id          String
  facility_id         String
  doctor_id           String?
  appointment_date    DateTime
  appointment_time    String
  appointment_type    String
  reason              String?
  status              String   @default("booked")
  token_number        String?
  queue_position      Int?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  user                User     @relation(fields: [patient_id], references: [id])
  facility            PublicHealthcareFacility @relation(fields: [facility_id], references: [id])
  doctor              HealthcareWorker? @relation(fields: [doctor_id], references: [id])
  queueEntries        QueueEntry[]
  teleconsultations   Teleconsultation[]
}

model Queue {
  id                  String   @id @default(cuid())
  facility_id         String
  department          String
  date                DateTime
  current_token       String?
  status              String   @default("active")
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  facility            PublicHealthcareFacility @relation(fields: [facility_id], references: [id])
  entries             QueueEntry[]
}

model QueueEntry {
  id                  String   @id @default(cuid())
  queue_id            String
  patient_id          String
  appointment_id      String?
  token_number        String
  priority            String   @default("normal")
  status              String   @default("waiting")
  check_in_time       DateTime @default(now())
  called_at           DateTime?
  completed_at        DateTime?

  queue               Queue @relation(fields: [queue_id], references: [id])
  appointment         Appointment? @relation(fields: [appointment_id], references: [id])
}

model DigitalTriage {
  id                  String   @id @default(cuid())
  patient_id          String
  symptoms            String
  symptom_duration    String
  severity            String
  risk_level          String
  recommended_action  String
  recommended_facility String?
  referred            Boolean  @default(false)
  created_at          DateTime @default(now())

  user                User     @relation(fields: [patient_id], references: [id])
}

model Referral {
  id                  String   @id @default(cuid())
  patient_id          String
  from_facility_id    String
  to_facility_id      String
  referred_by         String?
  reason              String
  clinical_summary    String?
  priority            String   @default("routine")
  status              String   @default("created")
  referral_date       DateTime @default(now())
  appointment_date    DateTime?
  completed_date      DateTime?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  user                User     @relation(fields: [patient_id], references: [id])
  fromFacility        PublicHealthcareFacility @relation("ReferralFromFacility", fields: [from_facility_id], references: [id])
  toFacility          PublicHealthcareFacility @relation("ReferralToFacility", fields: [to_facility_id], references: [id])
  statusHistory       ReferralStatusHistory[]
}

model ReferralStatusHistory {
  id                  String   @id @default(cuid())
  referral_id         String
  status              String
  notes               String?
  changed_by          String?
  created_at          DateTime @default(now())

  referral            Referral @relation(fields: [referral_id], references: [id])
}

model DiagnosticRequest {
  id                  String   @id @default(cuid())
  patient_id          String
  facility_id         String
  requested_by        String?
  test_name           String
  priority            String   @default("routine")
  status              String   @default("requested")
  scheduled_date      DateTime?
  completed_date      DateTime?
  result_summary      String?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  facility            PublicHealthcareFacility @relation(fields: [facility_id], references: [id])
}

model MedicineAvailability {
  id                  String   @id @default(cuid())
  facility_id         String
  medicine_name       String
  generic_name        String
  strength            String?
  form                String?
  available_quantity  Int?
  availability_status String   @default("available")
  last_updated        DateTime @default(now())
  updated_by          String?

  facility            PublicHealthcareFacility @relation(fields: [facility_id], references: [id])
}

model HighRiskPatient {
  id                  String   @id @default(cuid())
  patient_id          String
  assigned_worker_id  String?
  facility_id         String
  risk_category       String
  risk_level          String
  follow_up_frequency String?
  next_follow_up      DateTime?
  last_follow_up      DateTime?
  status              String   @default("active")
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  facility            PublicHealthcareFacility @relation(fields: [facility_id], references: [id])
  assignedWorker      HealthcareWorker? @relation(fields: [assigned_worker_id], references: [id])
  followUps           FollowUp[]
}

model FollowUp {
  id                  String   @id @default(cuid())
  high_risk_patient_id String
  assigned_worker_id  String?
  scheduled_date      DateTime
  completed_date      DateTime?
  notes               String?
  status              String   @default("scheduled")
  next_follow_up      DateTime?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  highRiskPatient     HighRiskPatient @relation(fields: [high_risk_patient_id], references: [id])
  assignedWorker      HealthcareWorker? @relation(fields: [assigned_worker_id], references: [id])
}

model Teleconsultation {
  id                  String   @id @default(cuid())
  patient_id          String
  facility_id         String
  doctor_id           String?
  appointment_id      String?
  scheduled_at        DateTime
  status              String   @default("scheduled")
  consultation_notes  String?
  started_at          DateTime?
  ended_at            DateTime?
  created_at          DateTime @default(now())
  updated_at          DateTime @updatedAt

  facility            PublicHealthcareFacility @relation(fields: [facility_id], references: [id])
  doctor              HealthcareWorker? @relation(fields: [doctor_id], references: [id])
  appointment         Appointment? @relation(fields: [appointment_id], references: [id])
}

model EmergencyEscalation {
  id                  String   @id @default(cuid())
  patient_id          String
  facility_id         String?
  triggered_by        String
  latitude            Float?
  longitude           Float?
  emergency_type      String
  description         String?
  severity            String
  status              String   @default("triggered")
  ambulance_required  Boolean  @default(false)
  ambulance_contact   String?
  created_at          DateTime @default(now())
  resolved_at         DateTime?

  user                User     @relation(fields: [patient_id], references: [id])
  facility            PublicHealthcareFacility? @relation(fields: [facility_id], references: [id])
}

model FacilityService {
  id                  String   @id @default(cuid())
  facility_id         String
  service_name        String
  available           Boolean  @default(true)
  availability_notes  String?
  last_updated        DateTime @default(now())

  facility            PublicHealthcareFacility @relation(fields: [facility_id], references: [id])
}
`;

fs.writeFileSync('backend/prisma/schema.prisma', content + newModels);
