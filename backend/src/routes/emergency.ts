import { Router } from 'express';
import { authenticateUser } from '../middleware/authenticate';
import { authorizeAdmin } from '../middleware/authorize';
import {
  getContacts, getContact, createContact, updateContact, deleteContact,
  reorderContacts, sendTestAlert, sendTestAlertToAll, triggerEmergencySos,
  triggerSos, cancelSos, resolveSos, getEventStatus, getActiveEvent,
  getEventHistory, getNearbyResources, searchHospitals,
  getActiveEmergencies, getAllEvents, getEmergencyStats, getAuditLogs,
} from '../controllers/emergency';

const router = Router();

router.use(authenticateUser);

router.get('/contacts', getContacts);
router.get('/contacts/:id', getContact);
router.post('/contacts', createContact);
router.put('/contacts/:id', updateContact);
router.delete('/contacts/:id', deleteContact);
router.put('/contacts/reorder', reorderContacts);
router.post('/contacts/:id/test-alert', sendTestAlert);

router.post('/test-alert', sendTestAlertToAll);
router.post('/trigger', triggerEmergencySos);

router.post('/sos', triggerSos);
router.post('/sos/:id/cancel', cancelSos);
router.post('/sos/:id/resolve', resolveSos);
router.get('/sos/active', getActiveEvent);
router.get('/sos/:id', getEventStatus);
router.get('/sos', getEventHistory);

router.get('/nearby', getNearbyResources);
router.get('/hospitals/search', searchHospitals);

router.get('/admin/active', authorizeAdmin, getActiveEmergencies);
router.get('/admin/events', authorizeAdmin, getAllEvents);
router.get('/admin/stats', authorizeAdmin, getEmergencyStats);
router.get('/admin/audit-logs', authorizeAdmin, getAuditLogs);

export default router;
