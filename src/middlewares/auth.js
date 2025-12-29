const { verifyJwt } = require('../config/jwt');

function requireAuth(req, res, next) {
	const hdr = req.headers.authorization || '';
	const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
	
	if (!token) {
		return res.status(401).json({ error: 'Unauthorized' });
	}
	
	try {
		const payload = verifyJwt(token);
		req.user = payload;
		next();
	} catch (e) {
		return res.status(401).json({ error: 'Invalid token' });
	}
}

module.exports = { requireAuth };

