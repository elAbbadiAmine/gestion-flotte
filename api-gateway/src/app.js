const express = require('express');
const app = express();
app.use(express.json());
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'api-gateway' });
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`[api-gateway] Port ${PORT}`));
