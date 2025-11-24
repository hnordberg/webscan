import log4js from 'log4js';
import config from 'config';
import path from 'path';

log4js.configure({
    appenders: {
        file: { type: 'file', filename: path.join(config.server.log_dir, 'webscan.log') },

        collect: { type: 'file', filename: path.join(config.server.log_dir, 'collect-api.log') },
        collect_internal: { type: 'file', filename: path.join(config.server.log_dir, 'collect-internal-api.log') },

        console: { type: 'console' }
    },
    categories: {
        api: { appenders: ['file', 'console'], level: config.server.log_level },

        collect: { appenders: ['collect', 'console'], level: 'info' },
        collect_internal: { appenders: ['collect_internal'], level: 'info' },

        default: { appenders: ['console', 'file'], level: config.server.log_level }
    }
});

// Bind console.log() to log4js. This causes console.log() to be written to our webscan.log file.
const logger = log4js.getLogger('console');
console.log = logger.info.bind(logger);

export default {
    default: log4js.getLogger('default'),
    collect: log4js.getLogger('collect'),
    collect_internal: log4js.getLogger('collect_internal'),
    internal: log4js.getLogger('internal'),
    api: log4js.getLogger('api')
};