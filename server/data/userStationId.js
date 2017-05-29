var UserStationId = require('mongoose').model('UserStationId');

function createStationIdForUser(username, callback) {
    UserStationId.create({
        userName: username, staId: "2", staName: "北京", signalType: "GPS", signalTypeId: "0",
        startBaseStation: "北京", startStaId: "2"
    }, callback)
}

function initUserStationId(userStationId, key, value) {
    var defer = Promise.defer();
    userStationId[key] = value;
    userStationId.save(function (err, userStationId) {
        defer.resolve(userStationId)
    })
    return defer.promise
}
module.exports = {
    findStaIdByName: function (username, callback) {
        UserStationId.findOne({userName: username}, function (err, userStationId) {
            if (err) {
                return callback(err)
            }
            if (!userStationId) {
                createStationIdForUser(username, function (err, userStationId) {
                    if (err) {
                        return callback(err)
                    }
                    return callback(null, userStationId)
                })
            } else {
                callback(null, userStationId)
            }
        })
    },
    update: function (query, Id, callback) {
        UserStationId.update(query, {$set: Id}, function (err, userStationId) {
            if (err) {
                return callback(err)
            } else {
                callback(null, userStationId)
            }
        })
    },
    deleteUserStation: function (query) {
        var defer = Promise.defer();//定义回调函数，与cd()一样
        UserStationId.find({staName: query}).exec(function (err, userStation) {
            if (err) {
                return defer.reject('delete station error')
            }
            if (!userStation) {
                return defer.resolve({
                    status: false,
                    message: 'station not exist'
                })
                //基站不存在，数据库错误
            } else {
                UserStationId.remove({staName: query}).exec(function (err) {
                    //console.log(222)
                    defer.resolve({status: true})
                })
            }
        });
        return defer.promise;
    }

};