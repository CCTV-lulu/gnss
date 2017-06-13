var child_process = require('child_process');
var BatchProcessModel = require('../data/batchProcess');

var AllUserBatchProcess = {};

function forkBatchProcess(username, batchProcessInfo, cb) {
    var batchChildProcess = child_process.fork('./server/config/batch_process');

    batchChildProcess.on('message', function (batchProcessResult) {

        if (batchProcessResult.status === 200) {
            updateBatchProcessDate(batchProcessResult.username, 0);
            batchChildProcess.send({message: 'close'})
        }
        if (batchProcessResult.status === 300) {
            AllUserBatchProcess[username] = batchChildProcess;
            saveBatchProcessStart(username, batchProcessResult).then(function (result) {
                cb({status: 200, effectiveTime: batchProcessResult.effectiveTime});
            })
        }
        if (batchProcessResult.status === 301) {
            cb({status: 202});
        }
        if (batchProcessResult.status === 404) {
            updateBatchProcessDate(batchProcessResult.username, -1);
            batchChildProcess.send({message: 'close'})
        }
    });
    batchProcessInfo.username = username;
    batchProcessInfo.sta_id = 'beijing-thu';
    batchChildProcess.send(batchProcessInfo);
}

function updateBatchProcessDate(username, isRunning) {
    BatchProcessModel.findBatchProcess(username).then(function (userBatchProcessStatus) {
        userBatchProcessStatus.isRunning = isRunning;
        userBatchProcessStatus.save(function (err, result) {
        });
    })
}
function saveBatchProcessStart(username, batchProcessStatus) {
    var defer = Promise.defer();
    var effectiveTime = parseInt(batchProcessStatus.effectiveTime);

    var newBatchProcess = {
        effectiveTime: effectiveTime,
        isRunning: 1,
        userName: username,
        createTime: new Date(),
        data: {}
    };
    BatchProcessModel.setBatchProcess(newBatchProcess).then(function () {
        defer.resolve()
    });
    return defer.promise

}


function batchProcessStatus(userBatchProcessStatus) {
    if (!userBatchProcessStatus || userBatchProcessStatus.isRunning === 0) return 1;


    if (userBatchProcessStatus.isRunning === 1) {
        return 0
    }
    return 1

}

function startBatchProcess(req, res) {
    var batchProcessInfo = req.body;
    var user = req.user;
    BatchProcessModel.findBatchProcess(user.username).then(function (userBatchProcessStatus) {
        var status = batchProcessStatus(userBatchProcessStatus);
        if (status === 0) {
            killUserBatchProcess(user.username, function () {
                forkBatchProcess(user.username, batchProcessInfo, function (result) {
                    res.send(result);
                })
            })
        }

        if (status === 1) {
            forkBatchProcess(user.username, batchProcessInfo, function (result) {
                res.send(result);
            })
        }


    })
}


function getBatchProcess(req, res) {
    var user = req.user;
    BatchProcessModel.findBatchProcess(user.username).then(function (userBatchProcessStatus) {
        if (userBatchProcessStatus) {
            res.send({status: 200, result: userBatchProcessStatus})
        } else {
            res.send({status: 400})
        }
    })
}

function killUserBatchProcess(username, cb) {
    if(AllUserBatchProcess[username]){
        AllUserBatchProcess[username].send({message: 'close'});
        BatchProcessModel.deleteBatchProcess(username).then(function () {
            if (cb) {
                cb()
            }
        });
        AllUserBatchProcess[username] = undefined;
    }else{
        if(cb){
            cb()
        }
    }



}


module.exports = {
    startBatchProcess: startBatchProcess,
    getBatchProcess: getBatchProcess,
    killUserBatchProcess: killUserBatchProcess
};