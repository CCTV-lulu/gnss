var encryption = require('../utilities/cripto'),
    User = require('../data/usersData');
    fs = require("fs");
module.exports = {
    getRegister: function (req, res, next) {
        if (req.user) {
            res.redirect('/');
        } else {
            res.redirect('users/register');
        }
    },
    createUser: function (req, res, next) {
        var newUserData = req.body;
        if (newUserData.password !== newUserData.confirmPassword) {
            req.session.error = 'Passwords do not match!';
            res.redirect('/register');
        } else {
            newUserData.salt = encryption.generateSalt();
            newUserData.hashPass = encryption.generateHashedPassword(newUserData.salt, newUserData.password);
            User.createUser(newUserData, function (err, user) {
                if (err) {
                    req.session.error = 'Username exists!';
                    res.redirect('/register');
                    return;
                }
                req.logIn(user, function (err) {
                    if (err) {
                        res.status(400);
                        return res.send({reason: err.toString()});
                    }
                    else {
                        res.redirect('/');
                    }
                });
            });
        }
    },
    updateUser: function (req, res, next) {
        if (req.user._id == req.body._id || req.user.roles.indexOf('admin') > -1) {
            var updatedUserData = req.body;
            if (updatedUserData.password && updatedUserData.password.length > 0) {
                updatedUserData.salt = encryption.generateSalt();
                updatedUserData.hashPass = encryption.generateHashedPassword(updatedUserData.salt, updatedUserData.password);
            }

            if (updatedUserData.password !== updatedUserData.confirmPassword) {
                req.session.error = 'Passwords do not match!';
                res.redirect('/profile');
            } else {
                User.updateUser({_id: req.body._id}, updatedUserData, function (err, user) {
                    res.redirect('/profile');
                })
            }
        }
        else {
            res.send({reason: 'You do not have permissions!'})
        }
    },
    getStationConfig: function (req, res) {
        var files = fs.readdirSync('./server/parser/pvtpos/config');
        var stations = {
            'beijing':'opt0.json',
            'shanghai': 'opt1.json',
            'hefei': 'opt2.json',
            'station_3': 'opt3.json'
        }
        var station_setting_path = stations[req.body.station]||stations['beijing'];
        var station_setting = fs.readFileSync('./server/parser/pvtpos/config/'+station_setting_path, 'utf8')
        res.send(station_setting)
    },
    changePassword:function(req, res){
        res.send('')
    },
    getAllUser: function (req, res) {
        User.all().then(function (users) {
            res.send(users)
        }, function (error) {
            res.send({
                status: 400,
                message: error
            })
        })
    },
    addAdmin :function (req, res) {
        //console.log(req.body.station)
        var data = {
            username: req.body.username,
            password: req.body.password,
        };

        data.roles = (req.body.type == 'true') ? ['admin', 'user'] : ['user'];
        data.salt = encryption.generateSalt();
        data.hashPass = encryption.generateHashedPassword(data.salt, data.password);
        User.createAdmin(data, function (err, user) {
            if (err) {
                return res.send({status: false, message: '添加用户失败'})
            }
            res.send(user)
        })
    },
    addUser: function (req, res) {
        //console.log(req.body.station)
        var data = {
            username: req.body.username,
            password: req.body.password,
            station: req.body.station
        };

        data.roles = (req.body.type == 'true') ? ['admin', 'user'] : ['user'];
        data.salt = encryption.generateSalt();
        data.hashPass = encryption.generateHashedPassword(data.salt, data.password);
        User.createUser(data, function (err, user) {
            if (err) {
                return res.send({status: false, message: '添加用户失败'})
            }
            res.send(user)
        })
    },
    deleteUser: function (req, res) {
        User.deleteByName(req.body.username, function (err, user) {
            if (err) {
                res.send({status: false, message: '删除用户失败'})
            }
            res.send(user)
        })
    }
};