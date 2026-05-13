const router = require('express').Router();
const service = require('../services/localisation.service');

router.get('/dernieres', async (req, res) => {
  try {
    const data = await service.getToutesDernieresPositions();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:vehicule_id/historique', async (req, res) => {
  try {
    const { vehicule_id } = req.params;
    const { debut, fin } = req.query;
    const data = await service.getHistorique(vehicule_id, debut, fin);
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.get('/:vehicule_id/derniere', async (req, res) => {
  try {
    const data = await service.getDernierePosition(req.params.vehicule_id);
    if (!data) return res.status(404).json({ success: false, error: 'Aucune position trouvée' });
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
