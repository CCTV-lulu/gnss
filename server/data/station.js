var Station = require('mongoose').model('Station');

module.exports = {
    create: function (station) {
        var defer = Promise.defer();
        var newStation = {
            name: station.name,
            staId:station.staId
        }
        Station.where({ $or : [ {name: station.name}, {staId: station.staId} ] }).exec()
            .then(function(result){
                if(result.length ===0){
                    Station.create(newStation, function (err, data) {
                        if (err) {
                            return defer.reject('创建失败')
                        }
                        defer.resolve({status: true, station: data})
                    });
                }else{
                    defer.resolve({status: false, message: '基站已存在'})
                }

            });

        return defer.promise;
    },
    deleteByName: function (name) {
        var defer = Promise.defer();
        Station.findOne({name: name}).exec(function (err, data) {
            if (err) {
                return defer.reject('delete station error')
            }
            if (!data) {
                return defer.resolve({
                    status: false,
                    message: 'station not exist'
                })
            } else {
                data.remove(function (err) {
                    defer.resolve({status: true})
                })
            }
        });
        return defer.promise;
    },
    all: function () {
        var defer = Promise.defer();
        Station.where().exec(function (err, data) {
            if (err) {
                defer.reject('find all station error')
            } else {
                defer.resolve(data)
            }
        });
        return defer.promise;

    },
    findByStaId: function (staId) {
        var defer = Promise.defer();
        Station.findOne({staId: staId}).exec(function (err, station) {
            if (err) {
                return defer.reject('find all station error')
            }
            defer.resolve(station)
        });
        return defer.promise;
    },
    findOne: function (condition) {
        var defer = Promise.defer();
        Station.findOne(condition).exec(function(err, station){
             if (err) {
                 return defer.reject('find all station error')
             }
             defer.resolve(station)
        });
        return defer.promise;
    }

};