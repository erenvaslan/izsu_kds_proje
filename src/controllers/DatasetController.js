const DatasetModel = require('../models/DatasetModel');

class DatasetController {
	static async list(_req, res) {
		try {
			const tables = await DatasetModel.getAllTables();
			res.json(tables);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}

	static async getTable(req, res) {
		const table = req.params.table;
		const limit = req.query.limit || 50;
		
		try {
			const rows = await DatasetModel.getTableData(table, limit);
			res.json(rows);
		} catch (e) {
			res.status(500).json({ error: e.message });
		}
	}
}

module.exports = DatasetController;

