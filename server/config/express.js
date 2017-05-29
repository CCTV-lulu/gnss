var express = require('express'),
    bodyParser = require('body-parser'),
    cookieParser = require('cookie-parser'),
    session = require('express-session'),
    passport = require('passport');

module.exports = function (app, config) {
    app.set('view engine', 'jade');
    app.set('views', config.rootPath + '/server/views');
    app.use(cookieParser());
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({extended: true}));
    app.use(session({secret: '56950fe494af8e88204adf6d', resave: true, saveUninitialized: true, cookie: { maxAge: 3600000*48 }}));

    app.use(passport.initialize());
    app.use(passport.session());
        app.use(express.static(config.rootPath + '/public'));

    app.get('/', function(req, res){
        res.redirect('/www/index.html');
    });

    app.use(function(req, res, next) {
        res.setHeader('Access-Control-Allow-Origin', 'http://localhost:63342');
        res.setHeader('Access-Control-Allow-Credentials', true);
        res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,Content-type','Accept');
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET, PUT, DELETE, OPTIONS');
        next();
    });

    app.use(function (req, res, next) {
        if (req.session&&req.session.error) {
            var msg = req.session.error;
            req.session.error = undefined;
            app.locals.errorMessage = msg;
        }

        else {
            app.locals.errorMessage = undefined;
        }

        next();
    });
}