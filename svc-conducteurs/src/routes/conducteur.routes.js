const router = require('express').Router();
const ctrl = require('../controllers/conducteur.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/', authenticate, authorize('admin', 'gestionnaire'), ctrl.getAll);
router.get('/:id', authenticate, authorize('admin', 'gestionnaire', 'conducteur'), ctrl.getById);
router.post('/', authenticate, authorize('admin', 'gestionnaire'), ctrl.create);
router.put('/:id', authenticate, authorize('admin', 'gestionnaire'), ctrl.update);
router.delete('/:id', authenticate, authorize('admin'), ctrl.remove);
router.post('/:id/assigner-mission', authenticate, authorize('admin', 'gestionnaire'), ctrl.assignerMission);
router.post('/:id/terminer-mission', authenticate, authorize('admin', 'gestionnaire'), ctrl.terminerMission);
router.post('/:id/echouer-mission', authenticate, authorize('admin', 'gestionnaire'), ctrl.echouerMission);

module.exports = router;
