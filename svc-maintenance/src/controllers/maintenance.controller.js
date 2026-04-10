const service = require('../services/maintenance.service');
const logger = require('../config/logger');

const ERREURS_400 = ['Statut invalide', 'date réelle', 'terminée'];

const isErreur400 = (msg) => ERREURS_400.some((s) => msg.includes(s));

const getAll = async (req, res) => {
  const interventions = await service.getAllInterventions(req.query);
  res.json({ success: true, data: interventions });
};

const getById = async (req, res) => {
  try {
    const intervention = await service.getInterventionById(req.params.id);
    res.json({ success: true, data: intervention });
  } catch (err) {
    if (err.message === 'Intervention non trouvée') return res.status(404).json({ success: false, error: err.message });
    throw err;
  }
};

const getHistorique = async (req, res) => {
  const historique = await service.getHistoriqueVehicule(req.params.vehiculeId);
  res.json({ success: true, data: historique });
};

const getAlertes = async (req, res) => {
  const { kilometrage, marge } = req.query;
  if (!kilometrage) return res.status(400).json({ success: false, error: 'kilometrage requis' });
  const alertes = await service.getAlertes(kilometrage, marge);
  res.json({ success: true, data: alertes });
};

const create = async (req, res) => {
  try {
    const intervention = await service.createIntervention(req.body);
    res.status(201).json({ success: true, data: intervention });
  } catch (err) {
    if (isErreur400(err.message)) return res.status(400).json({ success: false, error: err.message });
    throw err;
  }
};

const demarrer = async (req, res) => {
  try {
    const intervention = await service.demarrerIntervention(req.params.id);
    res.json({ success: true, data: intervention });
  } catch (err) {
    if (err.message === 'Intervention non trouvée') return res.status(404).json({ success: false, error: err.message });
    if (isErreur400(err.message)) return res.status(400).json({ success: false, error: err.message });
    throw err;
  }
};

const terminer = async (req, res) => {
  try {
    const intervention = await service.terminerIntervention(req.params.id, req.body);
    res.json({ success: true, data: intervention });
  } catch (err) {
    if (err.message === 'Intervention non trouvée') return res.status(404).json({ success: false, error: err.message });
    if (isErreur400(err.message)) return res.status(400).json({ success: false, error: err.message });
    throw err;
  }
};

const annuler = async (req, res) => {
  try {
    const intervention = await service.annulerIntervention(req.params.id, req.body.motif);
    res.json({ success: true, data: intervention });
  } catch (err) {
    if (err.message === 'Intervention non trouvée') return res.status(404).json({ success: false, error: err.message });
    if (isErreur400(err.message)) return res.status(400).json({ success: false, error: err.message });
    throw err;
  }
};

const update = async (req, res) => {
  try {
    const intervention = await service.updateIntervention(req.params.id, req.body);
    res.json({ success: true, data: intervention });
  } catch (err) {
    if (err.message === 'Intervention non trouvée') return res.status(404).json({ success: false, error: err.message });
    if (isErreur400(err.message)) return res.status(400).json({ success: false, error: err.message });
    throw err;
  }
};

module.exports = { getAll, getById, getHistorique, getAlertes, create, demarrer, terminer, annuler, update };