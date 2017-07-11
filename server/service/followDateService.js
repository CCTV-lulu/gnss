var child_process = require('child_process');
var FollowDate = require('../data/followData');
var fs = require('fs');
var followHandleProcess = {};
var path = require('path');
var taskManagement = require('../service/taskManagement.js');
var dataRootPath = path.resolve('../');
var StationConfig = require('../data/stationConfig.js');

function saveFollowProcess(stationId, child) {
    return taskManagement.addProcess({stationId: stationId, process: child})
}

function initProcess(stationId) {
    taskManagement.stopProcessByStation(stationId);
}

function sendInfoToProcess(processId, message) {
    taskManagement.getProcessById(processId).send(message)
}


function startBatchFollwData(stationId, config) {
    initProcess(stationId);

    var child = child_process.fork('./server/config/handleFollowData');
    child.on('message', function (message) {
        if (message.status === 'endOne') {
            startNext(processId, message, message)
        }
    });
    child.on('close', function (message) {
        if (message !== 2) {
            checkIsClose(stationId, processId)
        }

    });

    var processId = saveFollowProcess(stationId, child);

    startHandle(stationId, processId, config);


}


function reBatchHandleFollow() {
    FollowDate.all()
        .then(function (allNeedHandleFollowData) {
            for (var i = 0; i < allNeedHandleFollowData.length; i++) {
                var needHandleInfo = allNeedHandleFollowData[i];
                startHandleStationData(needHandleInfo.stationId)
            }

        }, function (err) {
            console.log(err)
        })
}


function batchHandleFollow(stationId) {
    getNeedHandleFiles(stationId, function () {
        startHandleStationData(stationId)

    })
}
reBatchHandleFollow();

module.exports = {
    reBatchHandleFollow: reBatchHandleFollow,
    batchHandleFollow: batchHandleFollow
};


function startHandleStationData(stationId) {
    StationConfig.findByStaId(stationId).then(function (result) {
        if (result.status) {
            startBatchFollwData(stationId, result.stationConfig.config)
        }
    })
}

function getNeedHandleFiles(stationId, cb) {
    var fileList = fs.readdirSync(dataRootPath + "/data");
    FollowDate.clearByStationId(stationId)
        .then(function () {
            var needHandleinfo = [];
            for (var i = 0; i < fileList.length; i++) {
                var fileStationId = fileList[i].split('.')[0];
                if (stationId === fileStationId) {
                    var logResolvePath = dataRootPath + '/data/' + fileList[i];
                    needHandleinfo.push(logResolvePath)
                }
            }
            FollowDate.saveStationNeedHandleInfo(stationId, needHandleinfo)
                .then(function (result) {
                    cb()
                })
        }, function (err) {
            console.log(err)
        })
}

function startNext(processId, message, config) {
    FollowDate.removeFilePath(message.stationId, message.filePath)
        .then(function () {
            startHandle(processId, message.stationId, config)
        }, function (err) {
            console.log(err)
        });
}

function checkIsClose(stationId, processId) {
    FollowDate.getHandleInfoByStationId(stationId).then(function (handleInfo) {
        if (handleInfo == null)  return;
        if (handleInfo.filePath.length > 0) {
            setTimeout(function () {
                startBatchFollwData(stationId)
            }, 3000)
        } else {
            taskManagement.stopProcessById(processId)
        }
    }, function (err) {
        console.log(err)
    })
}

function startHandle(stationId, processId, config) {
    FollowDate.getHandleInfoByStationId(stationId).then(function (result) {
        if (result.filePath.length > 0) {
            var info = {
                status: 'handleData',
                cwd: dataRootPath,
                stationId: result.stationId,
                filePath: result.filePath[0],
                config: config
            };
            sendInfoToProcess(processId, info)
        } else {
            FollowDate.clearByStationId(stationId)
                .then(function () {
                    child.send('close')
                }, function (err) {
                    console.log(err)
                })
        }
    }, function (err) {
        console.log(err)
    });
}

function getHandleInfo(stationId, config) {
    FollowDate.getHandleInfoByStationId(stationId).then(function (result) {
        var info = {
            status: 'handleData',
            cwd: dataRootPath,
            stationId: result.stationId,
            filePath: result.filePath[0],
            config: config
        };
    })
}

