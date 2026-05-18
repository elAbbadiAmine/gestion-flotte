const router = require('express').Router();
const ctrl = require('../controllers/maintenance.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

// routes fixes avant /:id pour eviter les conflits de matching
router.get('/alertes',              authenticate, authorize('admin', 'manager', 'technicien'), ctrl.getAlertes);
router.get('/vehicule/:vehiculeId', authenticate, authorize('admin', 'manager', 'technicien'), ctrl.getHistorique);

router.get('/',    authenticate, authorize('admin', 'manager', 'technicien', 'utilisateur'), ctrl.getAll);
router.get('/:id', authenticate, authorize('admin', 'manager', 'technicien', 'utilisateur'), ctrl.getById);
router.post('/',   authenticate, authorize('admin', 'manager', 'technicien'), ctrl.create);
router.put('/:id', authenticate, authorize('admin', 'manager', 'technicien'), ctrl.update);

router.post('/:id/demarrer', authenticate, authorize('admin', 'manager', 'technicien'), ctrl.demarrer);
router.post('/:id/terminer', authenticate, authorize('admin', 'manager', 'technicien'), ctrl.terminer);
router.post('/:id/annuler',  authenticate, authorize('admin', 'manager'), ctrl.annuler);
router.delete('/:id',        authenticate, authorize('admin', 'manager'), ctrl.remove);

module.exports = router;
