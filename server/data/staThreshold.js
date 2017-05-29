var StaThreshold = require('mongoose').model('StaThreshold');

var defaultStaThreshold = {
    "staNumThresholdMax": undefined,
    "staNumThresholdMin": undefined,
    "pdopThresholdMax": undefined,
    "pdopThresholdMin": undefined,
    "absoluteThresholdMax": undefined,
    "absoluteThresholdMin": undefined,
    "posaccThresholdMax": undefined,
    "posaccThresholdMin": undefined,
    "protectionLevelThresholdMax": undefined,
    "protectionLevelThresholdMin": undefined
};


module.exports = {
    findStaThresholdByName: function (username, staName) {
        var defer = Promise.defer();
        StaThreshold.findOne({userName: username, staName: staName}).exec(function (err, staThreshold) {
            if (err) {
                return defer.reject('find station threshold error')
            }
            if (!staThreshold) {
                var newStaThreshold = {
                    userName: username,
                    staName: staName,
                    staThreshold: defaultStaThreshold
                };
                StaThreshold.create(newStaThreshold, function (err, data) {
                    if (err) {
                        defer.reject('first creat station threshold error')
                    } else {
                        defer.resolve(data)
                    }
                });
            } else {
                defer.resolve(staThreshold)
            }
        });
        return defer.promise
    },
    setStaThreshold: function (userStaThreshold) {
        var defer = Promise.defer();
        var condition = {
            userName: userStaThreshold.userName,
            staName: userStaThreshold.staName
        };
        StaThreshold.findOne(condition).exec(function (err, staThreshold) {
            if(err){
                return defer.reject('find station threshold error in update')
            }
            if (staThreshold) {
                staThreshold.update(userStaThreshold).exec(function (err, data) {
                    if (err) {
                        return defer.reject('update station threshold error')
                    } else {
                        return defer.resolve(data)
                    }
                })
            } else {
                StaThreshold.create(userStaThreshold, function (err, data) {
                    if (err) {
                        return defer.reject('creat station threshold error')
                    } else {
                        return defer.resolve(data)
                    }
                });
            }
        });
        return defer.promise;
    },
    deleteUserStaThreshold: function (query) {
        var defer = Promise.defer();
        StaThreshold.find({staName: query}).exec(function (err, userStaThreshold) {
            if (err) {
                return defer.reject('delete station error')
            }
            if (!userStaThreshold) {
                return defer.resolve({
                    status: false,
                    message: 'station not exist'
                })
            } else {
                StaThreshold.remove({staName: query}).exec(function (err) {
                    defer.resolve({status: true})
                })
            }
        });
        return defer.promise;
    }
};