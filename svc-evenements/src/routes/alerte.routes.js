const router = require('express').Router();
const ctrl = require('../controllers/alerte.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');

router.get('/',    authenticate, authorize('admin', 'manager', 'technicien', 'utilisateur'), ctrl.getAll);
router.get('/:id', authenticate, authorize('admin', 'manager', 'technicien', 'utilisateur'), ctrl.getById);
router.put('/:id/lu', authenticate, authorize('admin', 'manager', 'technicien', 'utilisateur'), ctrl.marquerLue);

module.exports = router;
