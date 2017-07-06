var FollowData = require('mongoose').model('FollowData');


module.exports = {
    getHandleInfoByStaionName:function (stationName) {
        var defer = Promise.defer();
        FollowData.findOne({stationName:stationName}).exec(function (err,data) {
            if(err){
                return defer.reject('find stationName error')
            }

            defer.resolve(data)
        });
        return defer.promise
    },
    removeFilePath:function (stationName,logResolvePath) {
        var defer = Promise.defer();
        FollowData.findOne({stationName:stationName}).exec(function (err,data) {
            console.log('-----------------------serrr')
            console.log(err)
            if(err){
                return defer.reject({status: false})
            }
            var index = data.filePath.indexOf(logResolvePath)
            var  newFilePath=data.filePath.slice(index+1,data.filePath.length)
            FollowData.update({stationName:stationName},{$set:{filePath: newFilePath}},function (err,result) {
                if(err){
                    return defer.resolve({status: false, message: '保存失败'})
                }
                return defer.resolve(result)

            })

        });
        return defer.promise;
    },
    clearByStationName:function (stationName) {
        var defer = Promise.defer();
        FollowData.remove({stationName:stationName}).exec(function (err,data) {
            if (err){
                return defer.reject('find stationName error')
            }
            if(!data){
                return defer.resolve({status:true})
            }
            defer.resolve({status:true})
        });
        return defer.promise;
    },
    saveStationNeedHandleInfo:function (stationName,needHandleinfo) {
        var defer = Promise.defer();
        var newFolloeData = {
            stationName: stationName,
            filePath:needHandleinfo
        };
        FollowData.create(newFolloeData, function (err, data) {
            if (err) {
                return defer.reject({status: false, message: err})
            }
            return defer.resolve({status: true, message: data})
        });
        return defer.promise;
    },
     all: function () {
        var defer = Promise.defer();
        FollowData.where().exec(function (err, data) {
            if (err) {
                defer.reject('do not find all stationName')
            } else {

                defer.resolve(data)
            }
        });
        return defer.promise;
    }
}