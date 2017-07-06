var WarningInfo = require('mongoose').model('WarningInfo');
module.exports = {
    create: function (warning) {
        var defer = Promise.defer();
        var newWarningInfo = {
            happendTime:warning.happendTime,
            stationName: warning.stationName,
            staId: warning.staId,
            sys:warning.sys,
            warningContent:warning.warningContent,
            warningValue:warning.warningValue,
            threshold:warning.threshold
        };
        WarningInfo.create(newWarningInfo, function (err, data) {
            if (err) {
                return defer.reject({status: false, message: err})
            }
            return defer.resolve({status: true, message: data})
        });
        return defer.promise;
    },
    where: function(condition){
        var defer = Promise.defer();
        WarningInfo.where(condition).exec(function(err,data){
            console.log(err)
            if(err){
                return defer.resolve({status:false})
            }
            defer.resolve({status:true,result: data})
        })
        return defer.promise;
    }


}