require('dotenv').config();

module.exports = {
	port: Number(process.env.PORT || 4000),
	nodeEnv: process.env.NODE_ENV || 'dev',
	cors: {
		origin: '*'
	}
};

