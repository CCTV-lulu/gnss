var passport = require('passport');
var BatchProcess = require('../data/batchProcess.js');
var batchProcessController = require('../controllers/batchProcessController');
var stationController = require('../controllers/stationController');

module.exports = {
    login: function (req, res, next) {
        var auth = passport.authenticate('local', function (err, user) {
            if (err) return next(err);

            if (!user) {
                return res.send(user);
            }
            req.logIn(user, function(err) {
                if (err) return next(err);
                //batchProcessController.killUserBatchProcess(true,user.username);
                // stationController.removeCSV(req.user.username);
                //BatchProcess.deleteBatchProcess(user.username).then(function () {
                //    console.log(user.username+'success')
                //});
                return res.send(user);
            })
        });
        auth(req, res, next);
    },
//登录验证完后登录
    logout: function (req, res, next) {
        //batchProcessController.killUserBatchProcess(true,req.user.username);
        // stationController.removeCSV(req.user.username);
        //killChild.killChild(req.user.username)
        //BatchProcess.deleteBatchProcess(req.user.username).then(function () {
        //    console.log('delete success')
        //});

       req.session.destroy();
        req.logout();
        res.send('logout')
    },
    isAuthenticated: function (req, res, next) {
        //console.log(req.session)
        if (!req.isAuthenticated()) {
            return res.send({bool: false})
        }else{
            return res.send({roles: req.user.roles, bool: true, user: req.user})
        }
    },
    isInRole: function (role) {
        return function (req, res, next) {
            if (req.isAuthenticated() && req.user.roles.indexOf(role) > -1) {
                next()
            }else {
                return res.send({bool: false});
            }
        }
    }

};
