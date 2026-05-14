const service = require('../services/alerte.service');

const getAll = async (req, res) => {
  try {
    const alertes = await service.getAlertes(req.query);
    res.json({ success: true, data: alertes });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const getById = async (req, res) => {
  try {
    const alerte = await service.getAlerteById(req.params.id);
    res.json({ success: true, data: alerte });
  } catch (err) {
    const status = err.message === 'Alerte non trouvée' ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

const marquerLue = async (req, res) => {
  try {
    const alerte = await service.marquerLue(req.params.id);
    res.json({ success: true, data: alerte });
  } catch (err) {
    const status = err.message === 'Alerte non trouvée' ? 404 : 500;
    res.status(status).json({ success: false, error: err.message });
  }
};

module.exports = { getAll, getById, marquerLue };
