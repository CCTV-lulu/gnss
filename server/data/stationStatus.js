var StationStatus = require('mongoose').model('StationStatus');
var fs = require("fs");
module.exports = {
    create: function (stationStatus, callback) {
        var staStatus = {
            station_id: stationStatus.station_id,
            signal_type: stationStatus.signal_type,
            updated_at: stationStatus.updated_at,
            data: stationStatus.data
        };
        StationStatus.create(stationStatus, callback);
    },
    where: function (condition, limit) {
        var defer = Promise.defer();
        console.log('where')
        console.log("../station"+condition.station_id)
        fs.readdir("../station"+condition.station_id, function (err, files) {

            if(err) {
                console.log('-------------err')
                fs.stat("../station"+condition.station_id, function (err, stat) {
                    if (err.code == 'ENOENT'){
                        defer.resolve(false);
                    }else{
                        return
                    }
                })
            }else {
                if (files.length > 0 && files.length < 2) {
                    console.log('--------files-----')
                    fs.readFile("../station" + condition.station_id + '/' + files[0], function (err, data) {
                        if (err) {
                            defer.reject('getStationStatus error');
                        }
                        var oneFileData = data.toString();
                        getLimitData(oneFileData);
                    });
                } else if (files.length > 1) {
                    console.log('--------files 1-----')
                    fs.readFile("../station" + condition.station_id + '/' + files[files.length - 1], function (err, data) {
                        if (err) {
                            defer.reject('getStationStatus error');
                        }
                        var lastFileData = fs.readFileSync("../station" + condition.station_id + '/' + files[files.length - 2]);
                        var twoFileData = lastFileData.toString() + data.toString();
                        getLimitData(twoFileData);
                    });
                }
            }
        });
        function getLimitData(data) {
            var stationItem = data.split("@qAq@");
            stationItem.pop();
            if(limit == 1){
                defer.resolve(stationItem.slice(-1));
            }else if(limit == 10&&stationItem.length<=10){
                defer.resolve(stationItem);
            }else if(limit == 10&&stationItem.length>10){
                defer.resolve(stationItem.slice(-10));
            }
            console.log('--------data-----')
            console.log(stationItem)
        }

        return defer.promise;
    }
};

