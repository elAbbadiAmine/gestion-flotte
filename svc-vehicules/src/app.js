const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'svc-vehicules' });
});
app.get('/api/v1/vehicules', (req, res) => {
  res.json({ data: [], message: 'Service Véhicules opérationnel' });
});
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`[svc-vehicules] Port ${PORT}`));
