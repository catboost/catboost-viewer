var fs = require('fs'),
    path = require('path'),
    nodeEval = require('node-eval'),
    config = require('./config'),

    bundleName = 'index',
    pathToBundle = path.resolve(__dirname, '..', 'desktop.bundles', bundleName),

    isDev = process.env.NODE_ENV === 'development',
    templates = getTemplates(),
    useCache = !isDev,
    cacheTTL = config.cacheTTL,
    cache = {};

function render(req, res, data, context) {
    var query = req.query,
        user = req.user,
        cacheKey = req.originalUrl + (context ? JSON.stringify(context) : '') + (user ? JSON.stringify(user) : ''),
        cached = cache[cacheKey];

    if(useCache && cached && (new Date() - cached.timestamp < cacheTTL))
        return res.send(cached.html);


    if(isDev && query.json) return res.send('<pre>' + JSON.stringify(data, null, 4) + '</pre>');

    var bemtreeCtx = {
        block : 'root',
        context : context,
        // extend with data needed for all routes
        data : Object.assign({}, {
            url : req._parsedUrl,
            csrf : req.csrfToken()
        }, data)
    };

    if(isDev) templates = getTemplates();

    try {
        var bemjson = templates.BEMTREE.apply(bemtreeCtx);
    } catch(err) {
        console.error('BEMTREE error', err.stack);
        console.trace('server stack');
        return res.sendStatus(500);
    }

    if(isDev && query.bemjson) return res.send('<pre>' + JSON.stringify(bemjson, null, 4) + '</pre>');

    try {
        var html = templates.BEMHTML.apply(bemjson);
    } catch(err) {
        console.error('BEMHTML error', err.stack);
        return res.sendStatus(500);
    }

    useCache && (cache[cacheKey] = {
        timestamp : new Date(),
        html : html
    });

    res.send(html);
}

function dropCache() {
    cache = {};
}

function evalFile(filename) {
    return nodeEval(fs.readFileSync(filename, 'utf8'), filename);
}

function getTemplates() {
    return {
        BEMTREE : evalFile(path.join(pathToBundle, bundleName + '.bemtree.js')).BEMTREE,
        BEMHTML : evalFile(path.join(pathToBundle, bundleName + '.bemhtml.js')).BEMHTML
    };
}

module.exports = {
    render : render,
    dropCache : dropCache
};
