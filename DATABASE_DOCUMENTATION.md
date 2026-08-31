# VitaNexa AI - Database Documentation

## Architecture
The VitaNexa AI platform uses Prisma ORM with SQLite (development) and can be easily migrated to PostgreSQL (production). The schema is additive, preserving all original tables while extending capabilities for SIH26133.

## Core Models
- **User:** The central identity for patients, admins, and health workers.
- **PublicHealthcareFacility:** Stores facility type (PHC, CHC, District Hospital), geographic coordinates, services, bed capacity, and emergency capabilities.
- **HealthcareWorker:** Links a `User` to a `PublicHealthcareFacility` with role-based authorization (ASHA, ANM, Medical Officer).
- **HealthRecord:** Longitudinal patient history (prescriptions, diagnoses, observations) linked across facilities.
- **Referral:** Tracks patient transfer between facilities, capturing priority and status.
- **Appointment & QueueEntry:** Digital tokens for facility visits to manage wait times.
- **HighRiskPatient & FollowUp:** Identifies patients requiring continuous monitoring (e.g., maternal care).
- **MedicineAvailability:** Real-time visibility into drug stock levels at government pharmacies.

## Migrations
Migrations are maintained via Prisma. Destructive commands (`migrate reset`) are strictly prohibited in production. All SIH schemas were appended safely via `db push`.
