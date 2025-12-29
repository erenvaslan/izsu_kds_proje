require('dotenv').config();

const express = require('express');
const cors = require('cors');
const config = require('./config');
const routes = require('./routes');
const { initializeConnection } = require('./config/database');

// Create Express app
const app = express();

// Middleware
app.use(cors(config.cors));
app.use(express.json());

// Routes
app.use('/', routes);

// Start server
const port = config.port;
app.listen(port, async () => {
	const dbConnected = await initializeConnection();
	if (dbConnected) {
		console.log(`API listening on :${port}`);
	} else {
		console.error('DB connection failed on startup');
	}
});
