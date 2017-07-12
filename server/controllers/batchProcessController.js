var child_process = require('child_process');
var BatchProcessModel = require('../data/batchProcess');
var StationConfig = require('../data/stationConfig');
var FollowData = require('../data/followData');
var StatisticsProcess = require('../service/statisticsProcess');
var fs = require('fs');
var rimraf = require('rimraf');

//<<<<<<< HEAD
//var AllUserBatchProcess = {};
//
//function forkBatchProcess(username, batchProcessInfo, cb) {
//    var batchChildProcess = child_process.fork('./server/config/batch_process');
//
//    batchChildProcess.on('message', function (batchProcessResult) {
//
//        if (batchProcessResult.status === 200) {
//            updateBatchProcessDate(batchProcessResult.username, 0);
//            batchChildProcess.send({message: 'close'});
//            AllUserBatchProcess[username] = undefined;
//        }
//        if (batchProcessResult.status === 300) {
//            AllUserBatchProcess[username] = batchChildProcess;
//            saveBatchProcessStart(username, batchProcessResult).then(function (result) {
//                cb({status: 200, effectiveTime: batchProcessResult.effectiveTime, filePath: batchProcessResult.filePath});
//            })
//        }
//        if (batchProcessResult.status === 301) {
//            cb({status: 202});
//        }
//        if (batchProcessResult.status === 404) {
//            updateBatchProcessDate(batchProcessResult.username, -1);
//            batchChildProcess.send({message: 'close'})
//        }
//    });
//    batchChildProcess.send(batchProcessInfo);
//}
//
//function updateBatchProcessDate(username, isRunning) {
//    BatchProcessModel.findBatchProcess(username).then(function (userBatchProcessStatus) {
//        userBatchProcessStatus.isRunning = isRunning;
//        userBatchProcessStatus.save(function (err, result) {
//        });
//    })
//}
//function saveBatchProcessStart(username, batchProcessStatus) {
//    var defer = Promise.defer();
//    var effectiveTime = parseInt(batchProcessStatus.effectiveTime);
//
//    var newBatchProcess = {
//        effectiveTime: effectiveTime,
//        isRunning: 1,
//        userName: username,
//        createTime: new Date(),
//        data: {}
//    };
//    BatchProcessModel.setBatchProcess(newBatchProcess).then(function () {
//        defer.resolve()
//    });
//    return defer.promise
//
//}
//
//
//function batchProcessStatus(userBatchProcessStatus) {
//    if (!userBatchProcessStatus || userBatchProcessStatus.isRunning === 0) return 1;
//
//    if (userBatchProcessStatus.isRunning === 1) {
//        return 0
//    }
//    return 1
//}
//=======
//>>>>>>> blank

function startBatchProcess(req, res) {
    var batchProcessInfo = req.body;
    var user = req.user;
    FollowData.getHandleInfoByStationId(batchProcessInfo.sta_id)
        .then(function (result) {
//<<<<<<< HEAD
//            if(result!==null){
//                res.send({status:'chechkStop'})
//            }else {
//                BatchProcessModel.findBatchProcess(user.username).then(function (userBatchProcessStatus) {
//                    StationConfig.findByStaId(batchProcessInfo.sta_id)
//                        .then(function(result){
//                            batchProcessInfo.username = user.username
//                            if(result.stationConfig==undefined){
//                                res.send({status:'unFind'})
//                            }else{
//                                var info = {filter:batchProcessInfo, config: result.stationConfig}
//                                var status = batchProcessStatus(userBatchProcessStatus);
//                                if (status === 0) {
//                                    killUserBatchProcess(false,user.username, function () {
//                                        forkBatchProcess(user.username, info, function (result) {
//                                            res.send(result);
//                                        })
//                                    })
//                                }
//
//                                if (status === 1) {
//                                    forkBatchProcess(user.username, info, function (result) {
//                                        res.send(result);
//                                    })
//                                }
//                            }
//
//                        });
//                })
//=======
            if (result !== null) {
                return res.send({status: 'isFollow'})
//>>>>>>> blank
            }
            StationConfig.findByStaId(batchProcessInfo.sta_id)
                .then(function (result) {
                    if(result.stationConfig===undefined){
                        return res.send({status:'unFind'})
                    }
                    batchProcessInfo.username = user.username;
                    var statisticsProcess = new StatisticsProcess(user.username, batchProcessInfo.sta_id, result.stationConfig, batchProcessInfo);
                    statisticsProcess.init(function (result) {
                        res.send(result);
                    });
                })

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

//<<<<<<<
//HEAD
//function killUserBatchProcess(isremove, username, cb) {
//    if (isremove) {
//        rimraf("./public/chartImage/" + username, function (err) {
//            killBatchPricess()
//        })
//
//    } else {
//        killBatchPricess()
//    }
//
//    function killBatchPricess() {
//        fs.mkdir("./public/chartImage/" + username, function (err) {
//            if (AllUserBatchProcess[username]) {
//                AllUserBatchProcess[username].send({message: 'close'});
//                BatchProcessModel.deleteBatchProcess(username).then(function () {
//                    if (cb) {
//                        cb()
//                    }
//                });
//                AllUserBatchProcess[username] = undefined;
//            } else {
//                if (cb) {
//                    cb()
//                }
//            }
//        })
//    }
//}
//======
//=
//>>>>>>>
//blank


function stopBatchProcess(req, res) {
    var username = req.user.username;
    var process = StatisticsProcess.getProcessById(req.param.processId);
    if (process) {
        StatisticsProcess.stopById(req.param.processId);
        BatchProcessModel.deleteBatchProcess(username).then(function () {
            res.send({message: 'success'})
        });
    } else {
        res.send({message: 'warning'})
    }
}

module.exports = {
    startBatchProcess: startBatchProcess,
    getBatchProcess: getBatchProcess,
    //killUserBatchProcess: killUserBatchProcess,
    stopBatchProcess: stopBatchProcess
};