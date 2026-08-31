# VitaNexa AI 

VitaNexa AI is a comprehensive healthcare continuity platform, upgraded with robust Public Healthcare Accessibility features specifically designed for SIH26133.

## SIH26133 Upgrade Details
The platform has been enhanced to address accessibility and quality in rural and underserved areas. Features include:
- Geographic discovery of government hospitals via Haversine distance
- Digital Triage with emergency escalation (108 integration)
- Longitudinal Health Records following the patient across facilities
- Referral & Queue tracking
- High-risk patient follow-ups (maternal, child care)
- Healthcare Worker dashboards
- **Offline Mode:** PWA-ready with Service Worker caching

*Note: The Pet Care module has been completely and permanently removed as per requirements.*

## Getting Started

### Prerequisites
- Node.js (v18+)
- npm or yarn

### Installation
1. Clone the repository
2. Install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```

3. Setup environment variables:
   - Copy `.env.example` to `.env` in the backend folder.
   - Configure `DATABASE_URL` (defaults to SQLite for dev) and `JWT_SECRET`.

4. Initialize the Database:
   ```bash
   cd backend
   npx prisma generate
   npx prisma db push
   ```

5. Run the Application:
   ```bash
   # Start backend
   cd backend && npm run dev

   # Start frontend
   cd frontend && npm run dev
   ```

## Documentation
- [API Documentation](./API_DOCUMENTATION.md)
- [Database Documentation](./DATABASE_DOCUMENTATION.md)
- [SIH26133 Feature Mapping](./SIH26133_FEATURE_MAPPING.md)
