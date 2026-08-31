# VitaNexa AI - SIH26133 API Documentation

## Public Healthcare Facilities

### GET `/api/public-health/facilities`
Fetches all public healthcare facilities.
- **Query Params:** `type`, `district`, `state`
- **Response:** Array of `PublicHealthcareFacility` objects.

### GET `/api/public-health/facilities/nearby`
Fetches facilities near a specified location using Haversine distance.
- **Query Params:** `latitude` (required), `longitude` (required)
- **Response:** Array of facilities with `distance_km` appended, sorted by nearest.

### GET `/api/public-health/facilities/:id`
Fetches details of a specific facility including services, emergency capability, etc.

## Digital Triage

### POST `/api/public-health/triage`
Evaluates symptoms using rules-based decision support.
- **Body:** `{ symptoms, duration, severity }`
- **Response:** `{ risk_level, recommended_action, recommended_facility }`

## Appointments & Queues

### POST `/api/public-health/appointments`
Books an appointment at a public health facility.
- **Body:** `{ facility_id, appointment_date, appointment_time, appointment_type, reason }`
- **Response:** Created `Appointment` object.

### GET `/api/public-health/queues/:facilityId`
Fetches current queue status for a facility.
- **Response:** Queue information with waiting count.

## Health Records & Referrals

### GET `/api/public-health/health-record`
Fetches the longitudinal health record timeline for the authenticated patient.

### POST `/api/public-health/referrals`
Creates a referral from one facility to another.
- **Body:** `{ from_facility_id, to_facility_id, reason, priority }`

## High-Risk Patient Follow-Ups

### GET `/api/public-health/follow-ups`
Fetches scheduled follow-ups for high-risk patients (maternal, child, chronic, elderly).

## Healthcare Worker Portal

### GET `/api/public-health/health-worker/dashboard`
Fetches metrics for authorized healthcare workers at their assigned facility.
