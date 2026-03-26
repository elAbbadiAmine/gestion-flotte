const service = require('../services/vehicule.service');

const getAll = async (req, res) => {
  try {
    const vehicules = await service.getAllVehicules(req.query);
    res.json({ data: vehicules });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

const getById = async (req, res) => {
  try {
    const vehicule = await service.getVehiculeById(req.params.id);
    res.json({ data: vehicule });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
};

const create = async (req, res) => {
  try {
    const vehicule = await service.createVehicule(req.body);
    res.status(201).json({ data: vehicule });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
};

const update = async (req, res) => {
  try {
    const vehicule = await service.updateVehicule(req.params.id, req.body);
    res.json({ data: vehicule });
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
};

const remove = async (req, res) => {
  try {
    await service.deleteVehicule(req.params.id);
    res.status(204).send();
  } catch (e) {
    res.status(404).json({ error: e.message });
  }
};

module.exports = { getAll, getById, create, update, remove };