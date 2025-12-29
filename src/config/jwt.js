const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_change_me';
const JWT_EXPIRES_IN = '1d';

function signJwt(payload, expiresIn = JWT_EXPIRES_IN) {
	return jwt.sign(payload, JWT_SECRET, { expiresIn });
}

function verifyJwt(token) {
	return jwt.verify(token, JWT_SECRET);
}

module.exports = { signJwt, verifyJwt, JWT_SECRET };

