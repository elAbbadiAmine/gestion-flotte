const service = require('../services/conducteur.service');
const logger = require('../config/logger');

const ERREURS_400 = ['Permis', 'Catégories', 'non disponible', 'Rollback'];

const isErreur400 = (msg) => ERREURS_400.some((s) => msg.includes(s));

const getAll = async (req, res) => {
  const conducteurs = await service.getAllConducteurs(req.query);
  res.json({ success: true, data: conducteurs });
};

const getById = async (req, res) => {
  try {
    const conducteur = await service.getConducteurById(req.params.id);
    res.json({ success: true, data: conducteur });
  } catch (err) {
    if (err.message === 'Conducteur non trouvé') return res.status(404).json({ success: false, error: err.message });
    throw err;
  }
};

const create = async (req, res) => {
  try {
    const conducteur = await service.createConducteur(req.body);
    res.status(201).json({ success: true, data: conducteur });
  } catch (err) {
    if (isErreur400(err.message)) return res.status(400).json({ success: false, error: err.message });
    throw err;
  }
};

const update = async (req, res) => {
  try {
    const conducteur = await service.updateConducteur(req.params.id, req.body);
    res.json({ success: true, data: conducteur });
  } catch (err) {
    if (err.message === 'Conducteur non trouvé') return res.status(404).json({ success: false, error: err.message });
    if (isErreur400(err.message)) return res.status(400).json({ success: false, error: err.message });
    throw err;
  }
};

const remove = async (req, res) => {
  try {
    await service.deleteConducteur(req.params.id);
    res.status(204).send();
  } catch (err) {
    if (err.message === 'Conducteur non trouvé') return res.status(404).json({ success: false, error: err.message });
    throw err;
  }
};

const assignerMission = async (req, res) => {
  try {
    const { vehiculeId, missionId } = req.body;
    if (!vehiculeId || !missionId) return res.status(400).json({ success: false, error: 'vehiculeId et missionId requis' });
    await service.assignerMission(req.params.id, vehiculeId, missionId);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'Conducteur non trouvé') return res.status(404).json({ success: false, error: err.message });
    if (isErreur400(err.message)) return res.status(400).json({ success: false, error: err.message });
    throw err;
  }
};

const terminerMission = async (req, res) => {
  try {
    const { vehiculeId, missionId } = req.body;
    await service.terminerMission(req.params.id, vehiculeId, missionId);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'Conducteur non trouvé') return res.status(404).json({ success: false, error: err.message });
    throw err;
  }
};

const echouerMission = async (req, res) => {
  try {
    const { vehiculeId, missionId, motif } = req.body;
    await service.echouerMission(req.params.id, vehiculeId, missionId, motif);
    res.json({ success: true });
  } catch (err) {
    if (err.message === 'Conducteur non trouvé') return res.status(404).json({ success: false, error: err.message });
    throw err;
  }
};

module.exports = { getAll, getById, create, update, remove, assignerMission, terminerMission, echouerMission };