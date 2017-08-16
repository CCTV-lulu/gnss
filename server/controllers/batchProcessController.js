var child_process = require('child_process');
var BatchProcessModel = require('../data/batchProcess');
var StationConfig = require('../data/stationConfig');
var StatisticsProcess = require('../service/statisticsProcess');
var fs = require('fs');
var rimraf = require('rimraf');


function startBatchProcess(req, res) {
    var batchProcessInfo = req.body;
    var user = req.user;
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


}


function getBatchProcess(req, res) {
    var user = req.user;
    BatchProcessModel.findBatchProcess(user.username,req.params.processId).then(function (userBatchProcessStatus) {
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



module.exports = {
    startBatchProcess: startBatchProcess,
    getBatchProcess: getBatchProcess,
    //killUserBatchProcess: killUserBatchProcess,
    stopBatchProcess: stopBatchProcess
};