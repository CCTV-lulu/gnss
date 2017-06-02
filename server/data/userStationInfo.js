var UserStationInfo = require('mongoose').model('UserStationInfo');
var System = {
    'BDS': 2,
    'GPS': 0,
    'GLS': 1
};

module.exports = {
    findStaIdByName: function (username, callback) {
        UserStationInfo.findOne({userName: username}, function (err, userStationInfo) {
            if (err) {
                return callback(err)
            }
            if (!userStationInfo) {
                return callback(null, {status: 101, message: 'not userStationInfo'})
            }
            callback(null, {status: 200, data: userStationInfo})

        })
    },
    update: function (condition, newDate, callback) {
        UserStationInfo.update(condition, {$set: newDate}, function (err, userStationId) {
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
    },


    createUserStation: function (username, station) {
        var defer = Promise.defer();
        var newUserStationInfo = {
            username: username,
            realTimeStation: station,
            originalStation: station,
            originalSystem: {systemId: 0, systemName: 'GPS'}
        };
        UserStationInfo.create(newUserStationInfo, function (err, userStationInfo) {
            if(err){
                return defer.resolve({status:400})
            }
            return  defer.resolve({status:200, data: userStationInfo})
        });
        return defer.promise;
    }


};