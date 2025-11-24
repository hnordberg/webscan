import config from "config";
import log from './utils/logger.js';
import * as cheerio from 'cheerio';
import nodemailer from 'nodemailer';
import notifier from 'node-notifier';
import rp from 'request-promise';

let sites = new Map();

let transport = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth: {
        type: 'OAuth2',
        clientId: config.email.auth.clientId,
        clientSecret: config.email.auth.clientSecret,
        user: config.email.to,
        accessToken: "<enter your access token here>"
    },
});

transport.on("token", token => {
    console.log("A new access token was generated.", token);
    console.log("User: %s", token.user);
    console.log("Access Token: %s", token.accessToken);
    console.log("Expires: %s", new Date(token.expires));
});

export const webscan = () => {
    console.log(config.sites);
    if (!config.sites || config.sites.length === 0) {
        log.api.warn('No sites to scan.');
        return;
    }
	log.api.info(`Scanning ${config.sites.length} site(s).`);
    for(const site of config.sites) {
        if (site.disabled)
            continue;
        sites.set(site.name, { prevProducts: new Set() } );
        setTimeout(scanSingleSite, 1, site);
    }
}

const scanSingleSite = async site => {
    log.api.debug(`Scanning ${site.name}.`);
    const response = await rp({
        uri: site.uri,
        gzip: true,
        headers: {
            Dnt: 1,
            Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'en-US,en;q=0.9,sv;q=0.8',
            'Cache-Control': 'max-age=0',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36'
        },
    });
    try {
        const html = cheerio.load(response);
        process(site, html);
    } catch(e) {
        log.api.error(`Error while scanning ${site.name}.`, e);
    }
    const nextinterval = site.intervalInSeconds * 1000 * (1 + Math.random(site.intervalInSeconds / 10));
    log.api.debug(`Will scan ${site.name} again in ${Math.floor(nextinterval / 1000)} s.`);
    setTimeout(scanSingleSite, nextinterval, site);
}

/**
 * Returns true if the product name includes any of the strings in `filters`.
 * @param {The product name} prod 
 * @param {An array of strings} filters 
 */
const filterOut = (prod, filters) => {
    if(filters) { 
        let skip = false;
        for(let filter of filters) {
            if(prod.indexOf(filter) !== -1)
                skip = true;
        }
        if(skip)
            return true;
    }
}

/**
 * 
 * @param {The product name} prod 
 * @param {An array of strings} includeOnly 
 * @returns true if the product name includes at least one string in `includeOnly`
 */
const include = (prod, includeOnly) => {
    if(includeOnly) { 
        let keep = false;
        for(let include of includeOnly) {
            if(prod.indexOf(include) !== -1) {
                keep = true;
                break;
            }
        }
        return keep;
    }
    return true;
}

const process = (site, html) => {
    let items = html(site.selector);
    if(site.printRawHtml)
        log.api.debug(`Bottle Republic RAW:\n\n` + items + '\n\n');
    let h = `Found ${items.length} products at ${site.name}: \n`, s = '';

    let newProducts = [];
    let prevProducts = sites.get(site.name).prevProducts;
    for(let j = 0; j<items.length && j<config.general.numberOfProductsToRemember; ++j) {
        let prod = html(items[j]).text().trim().replace(/\s+/g, ' ');
        newProducts.push(prod);
    }
    for(let i = 0; i<newProducts.length; ++i) {
        let prod = newProducts[i];
        if (filterOut(prod, site.filterOut))
            continue;
        if (! include(prod, site.includeOnly))
            continue;
        // if (! prevProducts.find(p => p === prod) )
        if ( !prevProducts.has(prod) ) {
            prevProducts.add(prod);
            s += `\t ${i+1}. ${prod}\n`;
        }
    }

    log.api.debug(`${site.name} -- prevProducts = ${prevProducts.entries()}`);
    log.api.debug(`${site.name} -- newProducts = \n${newProducts.map(p => p + '\n')}`);

    let body = h + s + '\n\n' + site.uri;
    if (s) {
        notifier.notify(body);
        email(site, body);
        log.api.info(body);
    } else
        log.api.info(`No new products at ${site.name}`);
}

const email = (site, body) => {
    /*
    transport.set("oauth2_provision_cb", (user, renew, callback) => {
        let accessToken = user;
        if (!accessToken) {
            log.api.error('Failed to get access token');
            return callback(new Error("Unknown user"));
        } else {
            log.api.info('Got access token: ', accessToken);
            return callback(null, accessToken);
        }
    });
    */

    let mailOptions = {
        from: config.email.to,
        to: config.email.to,
        subject: config.email.subject + site.name + ' -- change detected',
        text: body,
        auth: {
            user: config.email.to,
            refreshToken: config.email.auth.refreshToken,
            accessToken: config.email.auth.accessToken,
            expires: Date.now() + 3599,
        }
    };

    transport.sendMail(mailOptions, function(error, info){
        if (error) {
            log.api.error('Failed to send email: ' + error);
        } else {
            log.api.info('Email sent: ' + info.response);
        }
    });

}
