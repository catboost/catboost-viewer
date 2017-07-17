Object.assign || (Object.assign = require('object-assign'));

var fs = require('fs'),
    path = require('path'),
    app = require('express')(),
    bodyParser = require('body-parser'),
    favicon = require('serve-favicon'),
    morgan = require('morgan'),
    serveStatic = require('serve-static'),
    cookieParser = require('cookie-parser'),
    expressSession = require('express-session'),
    slashes = require('connect-slashes'),
    passport = require('passport'),
    // LocalStrategy = require('passport-local').Strategy,
    csrf = require('csurf'),
    compression = require('compression'),

    config = require('./config'),
    staticFolder = path.resolve(__dirname, '..', config.staticFolder),

    Render = require('./render'),
    render = Render.render,
    dropCache = Render.dropCache, // eslint-disable-line no-unused-vars

    port = process.env.PORT || config.defaultPort,
    isSocket = isNaN(port),
    isDev = process.env.NODE_ENV === 'development',

    sourceDir = process.env.CATBOOST_DIR;

if(!fs.statSync(sourceDir).isDirectory()) throw Error('CATBOOST_DIR is not directory');

require('debug-http')();

function serveStaticFile(path) { return function(req, res, next) { res.sendFile(path); }; }

app
    .disable('x-powered-by')
    .enable('trust proxy')
    .use(compression())
    .use(favicon(path.join(staticFolder, 'favicon.ico')))
    .use(serveStatic(staticFolder))
    .get('/plotly-basic.js', serveStaticFile(require.resolve('plotly.js/dist/plotly-basic')))
    .get('/logo.png', serveStaticFile(path.resolve(__dirname, '..', 'common.blocks', 'logo', 'logo.png')))
    .use(morgan('combined'))
    .use(cookieParser())
    .use(bodyParser.urlencoded({ extended : true }))
    .use(expressSession({
        resave : true,
        saveUninitialized : true,
        secret : config.sessionSecret
    }))
    .use(passport.initialize())
    .use(passport.session())
    .use(csrf());

// NOTE: conflicts with livereload
isDev || app.use(slashes());

passport.serializeUser(function(user, done) {
    done(null, JSON.stringify(user));
});

passport.deserializeUser(function(user, done) {
    done(null, JSON.parse(user));
});

app
    .get('/ping/', function(req, res) {
        res.send('ok');
    })
    .get('/', function(req, res) {
        render(req, res, {
            view : 'page-index',
            title : 'CatBoost Viewer',
            meta : {
                description : 'CatBoost Viewer',
                og : {
                    url : 'https://tech.yandex.ru',
                    siteName : 'Yandex.Tech'
                }
            },
            sourceDir : sourceDir
        });
    });

isDev && require('./rebuild')(app);

app.get('*', function(req, res) {
    res.status(404);
    return render(req, res, { view : '404' });
});

if(isDev)
    app
        .get('/error/', function() {
            throw new Error('Uncaught exception from /error');
        })
        .use(require('errorhandler')());


isSocket && fs.existsSync(port) && fs.unlinkSync(port);

var server = require('http').Server(app),
    socketIO = require('socket.io')(server);

server.listen(port, function() {
    isSocket && fs.chmod(port, '0777');
    console.log('server is listening on', port);
});

var GrowingFile = require('growing-file');

socketIO.on('connection', function (socket) {
    var files = {
        meta : 'meta.tsv',
        learnErrorLog : 'learn_error.tsv',
        testErrorLog : 'test_error.tsv',
        timeLeft : 'time_left.tsv'
    };

    function streamFile(dir, subDir, file, fields, callback) {
        var filePath = path.join(dir, subDir, files[file]);

        // TODO we need to fix broken chunks if current chunk contains a part of line
        fs.existsSync(filePath) ?
            GrowingFile.open(filePath)
                .on('data', function(chunk) {
                    var chunks = [];

                    String(chunk).split('\n').forEach(function(chunk) {
                        if(!chunk) return;
                        chunk = chunk.split('\t').map(function(i) {
                            var n = Number(i);
                            return isNaN(n)? i : n;
                        });

                        if(!fields) {
                            fields = chunk;
                            return;
                        }

                        file === 'meta' &&
                            files.hasOwnProperty(chunk[0]) &&
                                (files[chunk[0]] = chunk[1]);

                        chunks.push(chunk);
                    });

                    socket.emit(file, subDir, fields, chunks);

                    callback && callback();
                }) :
            console.log('Failed to open ' + filePath);
    }

    fs.readdirSync(sourceDir).forEach(function(subDir) {
        if(!fs.statSync(path.join(sourceDir, subDir)).isDirectory()) return;

        streamFile(sourceDir, subDir, 'meta', ['name', 'value'], function() {
            streamFile(sourceDir, subDir, 'learnErrorLog');
            streamFile(sourceDir, subDir, 'testErrorLog');
            streamFile(sourceDir, subDir, 'timeLeft', ['iter', 'timeLeft', 'timeSpend']);
        });
    });
});

module.exports = new Promise(function(resolve) {
    server.on('close', resolve);
});
