var User = require('mongoose').model('User');
var Station = require('mongoose').model('Station');
module.exports = {
    createUser: function (user, callback) {
        User.findOne({username: user.username}, function (err, users) {
            if (err) {
                return callback(err)
            }
            if (users) {
                return callback(null, "用户名已存在！")
            } else {
                if (user.roles.length > 1) {
                    User.create(user, function (err, user) {
                        if (err) {
                            return callback(err)
                        } else {
                            return callback(null, user)
                        }
                    })
                } else {
                    Station.findOne({staId: user.station}, function (err, station) {
                        if (err) {
                            return callback(err)
                        }
                        if (!station) {
                            return callback(null, {status: false, message: "基站不存在！"})
                        }
                        else {
                            User.create(user, function (err, user) {
                                if (err) {
                                    return callback(err)
                                } else {
                                    return callback(null, user)
                                }
                            })
                        }
                    })
                }

            }
        })

    },
    createAdmin: function (user, callback) {
        User.findOne({username: user.username}, function (err, users) {
            if (err) {
                return callback(err)
            }
            if (users) {
                return callback(null, "用户名已存在！")
            } else {
                if (user.roles.length > 1) {
                    User.create(user, function (err, user) {
                        if (err) {
                            return callback(err)
                        } else {
                            return callback(null, user)
                        }
                    })
                } else {
                    User.create(user, function (err, user) {
                        if (err) {
                            return callback(err)
                        } else {
                            return callback(null, user)
                        }
                    })
                }

            }
        })

    },
    updateUser: function (query, user, callback) {
        User.update(query, user, callback);
    },

    where: function (condition, limit) {
        return User.where(condition).limit(limit).exec()
    },
    all: function () {
        var defer = Promise.defer();
        User.where().exec(function (err, data) {
            if (err) {
                defer.reject('do not find all users')
            } else {
                defer.resolve(data)
            }
        });
        return defer.promise;
    },
    deleteByName: function (username, callback) {
        User.remove({username: username}, function (err, data) {
            if (err) {
                return callback(err)
            } else {
                return callback(null, '成功删除用户！！')
            }
        });
    },
    deleteUserStationList: function (query) {
        var defer = Promise.defer();
        User.find({station: query}).exec(function (err, UserStationList) {
            if (err) {
                return defer.reject('delete station error')
            }
            if (!UserStationList) {
                return defer.resolve({
                    status: false,
                    message: 'station not exist'
                })
            } else {
                User.remove({station: query}).exec(function (err) {
                    defer.resolve({status: true})
                })
            }
        });
        return defer.promise;
    }
};