var Station = require('mongoose').model('Station');

module.exports = {
    create: function (station) {
        var defer = Promise.defer();
        Station.findOne({name: station.name}).exec(function (err, name) {
            if (err) {
                return defer.reject('add station error')
            }
            Station.findOne({staId: station.staId}).exec(function (err, staId) {
                if (name || staId) {
                    return defer.resolve({
                        status: false,
                        message: 'station name had exist'
                    })
                } else {
                    Station.create(station, function (err, data) {
                        if (err) {
                            return defer.reject('创建失败')
                        }
                        defer.resolve({status: true, station: data})
                    });
                }
            })
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
    find: function (condition) {
        return Station.findOne(condition).exec()
    }

};