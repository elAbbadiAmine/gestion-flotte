const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'svc-evenements' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[svc-evenements] Port ${PORT}`));
