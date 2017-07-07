var User = require('mongoose').model('User');
var Station = require('mongoose').model('Station');
module.exports = {
    createUser: function (user, callback) {


        User.findOne({username: user.username}, function (err, users) {
            if (err) {
                return callback(err)
            }
            if (users) {
                return callback(null, {status: false, message: "用户名已存在"})
            }

            User.create(user, function (err, user) {
                if (err) {
                    return callback(err)
                } else {
                    return callback(null, user)
                }
            })

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
                defer.resolve({status:true, users: data})
            }
        });
        return defer.promise;
    },
    deleteByName: function (username, callback) {
        User.remove({username: username}, function (err, data) {
            if (err) {
                return callback(err)
            } else {
                return callback(null, {status:true, message:'成功删除用户！！'})
            }
        });
    },

    deleteUserStationList: function (query) {
        var defer = Promise.defer();
        User.remove({station: query}).exec(function (err) {
            defer.resolve({status: true})
        })
        return defer.promise;
    },
    findByName:function(username){
        return User.findOne({username: username}).exec()
    }

};