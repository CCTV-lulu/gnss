/**
 * Created by dell on 17-2-14.
 */
var BatchProcessData = require('mongoose').model('BatchProcessData');

module.exports = {
    findBatchProcess: function (username) {
        var defer = Promise.defer();
        BatchProcessData.findOne({userName: username}).exec(function (err, data) {
            if (err) {
                return defer.reject('find station threshold error')
            }
            defer.resolve(data)
        });
        return defer.promise
    },
    setBatchProcess: function (condition) {
        var defer = Promise.defer();
        BatchProcessData.findOne({userName: condition.userName}).exec(function (err, batchProcessData) {
            if (err) {
                return defer.reject('')
            }
            if(!batchProcessData){
                BatchProcessData.create(condition, function (err, result) {
                    if (err) {
                        return defer.reject('creat error')
                    } else {
                       defer.resolve(result)
                    }
                });
            }else{
                batchProcessData.status = condition.status;
                batchProcessData.effectiveTime = condition.effectiveTime;
                batchProcessData.createTime =  condition.createTime;
                batchProcessData.data =  condition.data;
                batchProcessData.save(function(){
                    defer.resolve()
                })
            }
        });
        return defer.promise;
    },
    deleteBatchProcess: function (username) {
        var defer = Promise.defer();
        BatchProcessData.remove({userName:username}).exec(function(err,data){
            if (err) {
                return defer.reject('')
            }
            if(!data){
                return defer.resolve({status:true})
            }
            defer.resolve({status:true})
        });
        return defer.promise;
    }
};