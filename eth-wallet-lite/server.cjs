// Minimal Express server to serve /api/market endpoints
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const marketRoutes = require('./api/market-commonjs.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

// Mount the /api/market routes
app.use('/api/market', marketRoutes);
// Mount proxy endpoints at /api/proxy/* for direct access
app.use('/api/proxy', marketRoutes);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
