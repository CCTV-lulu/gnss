var FollowData = require('mongoose').model('FollowData');


module.exports = {
    getHandleInfoByStationId:function (stationId) {
        var defer = Promise.defer();
        FollowData.findOne({stationId:stationId}).exec(function (err,data) {
            if(err){
                return defer.resolve('find stationId error')
            }

            defer.resolve(data)
        });
        return defer.promise
    },
    removeFilePath:function (stationId,logResolvePath) {
        var defer = Promise.defer();
        FollowData.findOne({stationId:stationId}).exec(function (err,data) {
            if(err){
                return defer.resolve({status: false})
            }
            var index = data.filePath.indexOf(logResolvePath);
            if(index>=0){
                data.filePath.splice(index,1);
            }

            FollowData.update({stationId:stationId},{$set:{filePath: data.filePath}},function (err,result) {
                if(err){
                    return defer.resolve({status: false, message: '保存失败'})
                }
                return defer.resolve(result)

            })

        });
        return defer.promise;
    },
    clearByStationId:function (stationId) {
        var defer = Promise.defer();
        FollowData.remove({stationId:stationId}).exec(function (err,data) {
            if (err){
                return defer.resolve('find stationId error')
            }
            defer.resolve({status:true})
        });
        return defer.promise;
    },
    saveStationNeedHandleInfo:function (stationId,needHandleinfo) {
        var defer = Promise.defer();
        var newFolloeData = {
            stationId: stationId,
            filePath:needHandleinfo
        };
        FollowData.create(newFolloeData, function (err, data) {
            if (err) {
                return defer.resolve({status: false, message: err})
            }
            return defer.resolve({status: true, message: data})
        });
        return defer.promise;
    },
     all: function () {
        var defer = Promise.defer();
        FollowData.where().exec(function (err, data) {
            if (err) {
                defer.resolve('do not find all stationId')
            } else {

                defer.resolve(data)
            }
        });
        return defer.promise;
    }
}