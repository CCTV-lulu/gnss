var child_process = require('child_process');
var BatchProcessModel = require('../data/batchProcess');

var AllUserBatchProcess = {};

function startBatchProcess(req, res, cb){
    var batchChildProcess = child_process.fork('../config/batchProcess');
    var username = req.body.username;
    batchChildProcess.on('message', function (batchProcessResult) {
        if(batchProcessResult.status === 200){
            succssGetBatchProcessDate(batchProcessResult);
            batchChildProcess.send({message: 'close'})
        }
        if(batchProcessResult.status === 300){
            AllUserBatchProcess[username] = batchChildProcess;
            saveBatchProcessStart(username, batchProcessResult).then(function(){
                cb(); //todo
            })

        }
        if(batchProcessResult.status === 301){
            cb(); //todo
        }
    });

    batchChildProcess.send();//todo send data
}

function succssGetBatchProcessDate(batchProcessResult){
    BatchProcessModel.findBatchProcess(batchProcessResult.userName).then(function (userBatchProcessStatus) {
        userBatchProcessStatus.data = batchProcessResult;
        userBatchProcessStatus.isRuning = false;
        userBatchProcessStatus.save(function (err, result) {

        });
    })
}
function saveBatchProcessStart(username, batchProcessStatus){
    var defer = Promise.defer();
    var effectiveTime = batchProcessStatus.effectiveTime;
    var usersTime = Object.keys(AllUserBatchProcess).length;
    var waitTime = (parseInt(Number(effectiveTime) * (1 + usersTime * 0.3)) * 0.7);
    var newBatchProcess = {
        effectiveTime: waitTime,
        isRunning: true,
        userName: username,
        createTime: new Date(),
        data: {}
    };
    BatchProcessModel.setBatchProcess(newBatchProcess).then(function () {
        defer.resolve()
    });
    return defer.promise

}






function getBatchProcessStatus(userBatchProcessStatus) {
    var currentTime = new Date();
    if (!userBatchProcessStatus || !(userBatchProcessStatus.status)) {
        return { isRunning: false }
    }
    return {
        isRunning: true,
        waitTime: (userBatchProcessStatus.effectiveTime * 1000) - (currentTime - userBatchProcessStatus.createTime)
    }
}

function getBatchProcessDate(req, res) {
    var batchProcessInfo = req.body;
    var user = req.user;
    BatchProcessModel.findBatchProcess(user.username).then(function (userBatchProcessStatus) {
        userBatchProcessStatus = getBatchProcessStatus(userBatchProcessStatus);
        if (userBatchProcessStatus.isRunning) { //todo
            return res.send({
                status: 202,
                waitTime: parseInt(Number(userBatchProcessStatus.waitTime) / 1000) * 0.6,//todo creteTime,effectiveTime
                message: 'Continue wait'
            })
        }
        startBatchProcess(user,username, batchProcessInfo, function(){
            res.send({}); //todo
        })

    })
}
module.exports = {

};