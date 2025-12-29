const { pingDatabase } = require('../config/database');
const config = require('../config');

class HealthController {
	static async health(_req, res) {
		res.json({ ok: true, env: config.nodeEnv });
	}

	static async healthDb(_req, res) {
		try {
			const ok = await pingDatabase();
			res.json({ ok });
		} catch (err) {
			res.status(500).json({ ok: false, error: err.message });
		}
	}
}

module.exports = HealthController;

