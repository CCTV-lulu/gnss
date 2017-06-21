var WarningInfo = require('mongoose').model('WarningInfo');
module.exports = {
    create: function (warning) {
        var defer = Promise.defer();
        var newWarningInfo = {
            happendTime:warning.time,
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
    }

}