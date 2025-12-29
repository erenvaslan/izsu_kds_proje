const AdminModel = require('../models/AdminModel');
const { signJwt } = require('../config/jwt');

class AuthController {
	static async login(req, res) {
		const { email, password } = req.body || {};
		
		if (!email || !password) {
			return res.status(400).json({ error: 'Missing credentials' });
		}
		
		try {
			const admin = await AdminModel.findByEmail(email);
			
			if (!admin) {
				return res.status(401).json({ error: 'Invalid credentials' });
			}
			
			const passOk = String(admin.password) === String(password);
			
			if (!passOk) {
				return res.status(401).json({ error: 'Invalid credentials' });
			}
			
			const token = signJwt({ sub: String(admin.id), email: admin.email, role: 'admin' });
			return res.json({ token });
		} catch (e) {
			return res.status(500).json({ error: 'Login failed' });
		}
	}

	static async me(req, res) {
		res.json({ user: { role: 'admin', email: req.user.email } });
	}
}

module.exports = AuthController;

