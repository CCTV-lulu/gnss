var child_process = require('child_process');
var FollowDate = require('../data/followData');
var fs = require('fs');
var path = require('path');
var taskManagement = require('../service/taskManagement.js');
var dataRootPath = path.resolve('../');
//var StationConfig = require('../data/stationConfig.js');



function FollowProcess(stationId, config) {
    this.stationId = stationId;
    this.config = config;
    //this.cwd = dataRootPath;
    this.processId = null;
}
FollowProcess.initProcess = function (stationId) {
    taskManagement.stopProcessByStation(stationId);
};
FollowProcess.saveFollowProcess = function (stationId, chlid) {
    return taskManagement.addProcess({stationId: stationId, process: chlid})
};

FollowProcess.prototype.init = function () {

    var self = this;
    FollowProcess.initProcess(self.stationId);
    var child = child_process.fork('./server/config/handleFollowData');
    child.on('message', function (message) {
        if (message.status === 'endOne') {
            self.startNext(processId, message, message)
        }
    });
    child.on('close', function (message) {
        if (message !== 2) {
            self.checkIsClose(self.stationId, processId)
        }

    });

    var processId = FollowProcess.saveFollowProcess(self.stationId, child);
    self.processId = processId;
    self.child = child
    self.getHandleFile(function(){
        self.startHandle();
    })


};

FollowProcess.prototype.startHandle = function () {
    var self = this;

    this.getHandleInfo(function (result) {
        if (result) {
            self.sendInfoToProcess(result)
        } else {
            FollowDate.clearByStationId(self.stationId)
                .then(function () {
                    self.sendInfoToProcess('close')
                }, function (err) {
                })
        }
    }, function () {
    });
};

FollowProcess.prototype.getHandleFile =  function(cb){
        var self = this;
        var fileList = fs.readdirSync(dataRootPath + "/data");
        FollowDate.clearByStationId(self.stationId)
            .then(function () {
                var needHandleinfo = [];
                for (var i = 0; i < fileList.length; i++) {
                    var fileStationId = fileList[i].split('.')[0];
                    if (self.stationId === fileStationId) {
                        var logResolvePath = dataRootPath + '/data/' + fileList[i];
                        needHandleinfo.push(logResolvePath)
                    }
                }
                FollowDate.saveStationNeedHandleInfo(self.stationId, needHandleinfo)
                    .then(function (result) {
                        cb()
                    })
            }, function (err) {
                console.log(err)
            })
}

FollowProcess.prototype.closeProcess = function () {
    try {
        self.sendInfoToProcess('close');
    } catch (err) {
        console.log(err)
    }
    taskManagement.clearProcessById(this.processId)

};

FollowProcess.prototype.checkIsClose = function () {

};

FollowProcess.prototype.startNext = function (filePath) {
    var self = this;
    FollowDate.removeFilePath(this.stationId, filePath)
        .then(function () {
            self.startHandle()
        }, function (err) {
            console.log(err)
        });
};


FollowProcess.prototype.getHandleInfo = function (cb) {
    var self = this;
    FollowDate.getHandleInfoByStationId(self.stationId).then(function (result) {
        if (result && result.filePath.length > 0) {
            var info = {
                status: 'handleData',
                cwd: dataRootPath,
                stationId: result.stationId,
                filePath: result.filePath[0],
                config: self.config
            };
            cb(info)
        } else {
            cb(false)
        }
    }, function (err) {
    })
};

FollowProcess.prototype.sendInfoToProcess = function (info) {
    this.child.send(info)
};
module.exports = FollowProcess;
