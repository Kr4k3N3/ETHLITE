// This file starts a simple Express server for the app's API endpoints.
// It sets up CORS, JSON parsing, and mounts the /api/market and /api/proxy routes.
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const marketRoutes = require('./api/market-commonjs.cjs');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors()); // Allow cross-origin requests
app.use(bodyParser.json()); // Parse JSON request bodies

// Add the /api/market endpoints to the server
app.use('/api/market', marketRoutes);
// Add the /api/proxy endpoints to the server for direct access
app.use('/api/proxy', marketRoutes);

app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`);
});
