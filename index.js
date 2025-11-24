
import config from 'config';
import express from 'express';
import fs from 'fs';
import https from 'https';
import log from './utils/logger.js';
import { webscan } from './scanner.js';

const options = {
	key: fs.readFileSync(config.server.cert_dir + '/key.pem'),
	cert: fs.readFileSync(config.server.cert_dir + '/cert.pem'),
	passphrase: config.server.passphrase
};

const port = config.server.port || process.env.PORT;

log.api.debug("[webscan] properties:", config);

export const server = https.createServer(options, express).listen(port || 3000, function () {
	log.api.info('WebScan Server started ' + new Date() + ' on port ' + server.address().port);
	webscan();
});
