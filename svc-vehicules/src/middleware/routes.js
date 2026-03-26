const router = require('express').Router();
const ctrl = require('../controllers/vehicule.controller');

router.get('/vehicules', ctrl.getAll);
router.get('/vehicules/:id', ctrl.getById);
router.post('/vehicules', ctrl.create);
router.put('/vehicules/:id', ctrl.update);
router.delete('/vehicules/:id', ctrl.remove);

module.exports = router;