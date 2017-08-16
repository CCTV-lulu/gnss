var taskManagement = require('../service/taskManagement.js');
var child_process = require('child_process');
var BatchProcessModel = require('../data/batchProcess');
var StationConfig = require('../data/stationConfig');
var fs = require('fs')
var rimraf = require('rimraf');


function StatisticsProcess(username, stationId, config, filter) {
    this.config = config;
    this.filter = filter;
    this.stationId = stationId;
    this.username = username;
    this.processId = null;
}

StatisticsProcess.initProcess = function (username) {
    taskManagement.stopProcessByUsername(username);
};

StatisticsProcess.getProcessById = function (id) {
    return taskManagement.getProcessById(id)
};
StatisticsProcess.stopById = function (processId) {
    taskManagement.stopProcessById(this.processId);
};

StatisticsProcess.prototype.saveProcess = function (chlid) {
    return taskManagement.addProcess({stationId: this.stationId, process: chlid, username: this.username})
};
StatisticsProcess.prototype.stop = function () {
    taskManagement.stopProcessById(this.processId);
};

// StatisticsProcess.prototype.isHandleFollow = function (cb) {
//     FollowData.getHandleInfoByStationId(this.stationId).then(function (result) {
//         return cb(result !== null)
//     })
// };

StatisticsProcess.prototype.init = function (cb) {
    var self = this;
    self.checkFile(function () {
        StatisticsProcess.initProcess(self.username);
        var batchChildProcess = child_process.fork('./server/service/handleProcess/batch_process');
        batchChildProcess.on('message', function (batchProcessResult) {
            if (batchProcessResult.status === 200) {
                self.updateBatchProcessDate(0, function () {
                    self.stop()
                });
            }
            if (batchProcessResult.status === 300) {
                self.start(batchProcessResult, cb)
            }


            if (batchProcessResult.status === 301) {
                self.noFile(cb);
            }
        });
        batchChildProcess.on('close', function (message) {
            if (message == 0) {

            } else if (message === 2) {
                return self.updateBatchProcessDate(-2, function () {
                    self.stop()
                });
            } else {
                self.updateBatchProcessDate(-1, function () {
                    self.stop()
                });
            }


        });

        self.processId = self.saveProcess(batchChildProcess);
        self.chlid = batchChildProcess;
        self.sendInfoToProcess({config: self.config, filter: self.filter, processId: self.processId})
    })


};

StatisticsProcess.prototype.checkFile = function (cb) {
    fs.mkdir("./public/batchHandleResult/" + this.username, function (err) {
        cb()
    })
};

StatisticsProcess.prototype.start = function (batchProcessResult, cb) {
    var self = this;
    this.saveBatchProcessStart(batchProcessResult).then(function (result) {
        cb({status: 200, effectiveTime: batchProcessResult.effectiveTime, processId: self.processId});
    })
};

StatisticsProcess.prototype.noFile = function (cb) {
    this.stop();
    cb({status: 202});
};

StatisticsProcess.prototype.sendInfoToProcess = function (info) {
    this.chlid.send(info)
};

StatisticsProcess.prototype.updateBatchProcessDate = function (isRunning) {
    console.log('-------------------------------------------------------')
    console.log(this.processId)
    BatchProcessModel.findBatchProcess(this.username,this.processId).then(function (userBatchProcessStatus) {
        userBatchProcessStatus.isRunning = isRunning;
        userBatchProcessStatus.save(function (err, result) {
        });
    })
};

StatisticsProcess.prototype.saveBatchProcessStart = function (batchProcessResult) {
    var defer = Promise.defer();
    var effectiveTime = parseInt(batchProcessResult.effectiveTime);
    var self = this;
    var newBatchProcess = {
        effectiveTime: effectiveTime,
        isRunning: 1,
        userName: self.username,
        createTime: new Date(),
        data: {},
        processId: self.processId
    };
    BatchProcessModel.setBatchProcess(newBatchProcess).then(function () {
        defer.resolve()
    });
    return defer.promise
};


module.exports = StatisticsProcess;


