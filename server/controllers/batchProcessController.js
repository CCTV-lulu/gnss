var child_process = require('child_process');
var BatchProcessModel = require('../data/batchProcess');
var StationConfig = require('../data/stationConfig');
var FollowData = require('../data/followData');
var StatisticsProcess = require('../service/statisticsProcess');
var FollowProcess = require('../service/followProcess.js');
var fs = require('fs');
var rimraf = require('rimraf');


function startBatchProcess(req, res) {
    var batchProcessInfo = req.body;
    var user = req.user;
    FollowData.getHandleInfoByStationId(batchProcessInfo.sta_id)
        .then(function (result) {

            if (result !== null) {
                return res.send({status: 'isFollow'})
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

function reBatchHandleFollow() {
    FollowData.all()
        .then(function (allNeedHandleFollowData) {
            for (var i = 0; i < allNeedHandleFollowData.length; i++) {
                var needHandleInfo = allNeedHandleFollowData[i];
                startBatchFollwData(needHandleInfo.stationId)
            }

        }, function (err) {
            console.log(err)
        })
}
//
//function batchHandleFollow(stationName) {
//    getNeedHandleFiles(stationName, function () {
//        startBatchFollwData(stationName)
//    })
//}

function startBatchFollwData(stationId){
    StationConfig.findByStaId(stationId).then(function(config){
        var newFollowProcess = new FollowProcess(stationId, config.stationConfig.config)//todo
        newFollowProcess.init()
    })
}
reBatchHandleFollow();

module.exports = {
    startBatchProcess: startBatchProcess,
    getBatchProcess: getBatchProcess,
    //killUserBatchProcess: killUserBatchProcess,
    stopBatchProcess: stopBatchProcess
};