const express = require('express');
const app = express();
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'svc-conducteurs' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[svc-conducteurs] Port ${PORT}`));
