const fetch = require('node-fetch');
const { pool } = require('../config/database');

async function upsertIzsuDataset(datasetUrl) {
	const res = await fetch(datasetUrl);
	if (!res.ok) throw new Error(`Failed to fetch dataset: ${res.status}`);
	const rows = await res.json();
	if (!Array.isArray(rows)) throw new Error('Expected JSON array');

	const conn = await pool.getConnection();
	try {
		await conn.beginTransaction();
		for (const r of rows) {
			// Adjust fields to your staging table structure
			await conn.query(
				"INSERT INTO staging_izsu_generic (id, payload) VALUES (?, JSON_OBJECT('data', ?)) ON DUPLICATE KEY UPDATE payload = VALUES(payload)",
				[r.id || r.uuid || r.Id || null, JSON.stringify(r)]
			);
		}
		await conn.commit();
	} catch (e) {
		await conn.rollback();
		throw e;
	} finally {
		conn.release();
	}
}

module.exports = { upsertIzsuDataset };



