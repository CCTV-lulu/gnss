var child_process = require('child_process');
var FollowDate = require('../data/followData');
var fs = require('fs');
var followHandleProcess = {};
var path = require('path');
var taskManagement = require('../service/taskManagement.js');
var dataRootPath = path.resolve('../')
var StationConfig = require('../data/stationConfig.js');

function saveFollowProcess(stationName, child) {
    var processId = taskManagement.addProcess({stationName: stationName, process: child})
}


function initProcess(stationName) {
    taskManagement.stopProcessByUsername(stationName);
}
function startBatchFollwData(stationName, config) {
    initProcess(stationName);

    var child = child_process.fork('./server/config/handleFollowData');
    child.on('message', function (message) {
        if (message.status === 'endOne') {
            startNext(message)
        }
    });
    child.on('close', function () {
        checkIsClose(stationName, processId)
    });

    function checkIsClose() {
        FollowDate.getHandleInfoByStaionName(stationName).then(function (handleInfo) {
            if (handleInfo == null)  return;
            if (handleInfo.filePath.length > 0) {
                setTimeout(function () {
                    startBatchFollwData(stationName)
                }, 3000)
            } else {
                taskManagement.stopProcessById(processId)
            }
        }, function (err) {
            console.log(err)
        })
    }

    var processId = saveFollowProcess(stationName, child);
    startHandle();

    function startHandle() {
        FollowDate.getHandleInfoByStaionName(stationName).then(function (result) {
            if (result.filePath.length > 0) {
                child.send({
                    status: 'handleData',
                    cwd: dataRootPath,
                    stationName: result.stationName,
                    filePath: result.filePath[0],
                    config: config
                })
            } else {
                FollowDate.clearByStationName(stationName)
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

    function startNext(message) {
        FollowDate.removeFilePath(message.stationName, message.filePath)
            .then(function () {
                startHandle()
            }, function (err) {
                console.log(err)
            });
    }

}


function getNeedHandleFiles(stationName, cb) {
    var fileList = fs.readdirSync(dataRootPath + "/data");
    FollowDate.clearByStationName(stationName)
        .then(function () {
            var needHandleinfo = [];
            for (var i = 0; i < fileList.length; i++) {
                var fileStationName = fileList[i].split('.')[0];
                if (stationName === fileStationName) {
                    var logResolvePath = dataRootPath + '/data/' + fileList[i];
                    needHandleinfo.push(logResolvePath)
                }
            }
            FollowDate.saveStationNeedHandleInfo(stationName, needHandleinfo)
                .then(function (result) {
                    cb()
                })
        }, function (err) {
            console.log(err)
        })


}


function reBatchHandleFollow() {
    FollowDate.all()
        .then(function (allNeedHandleFollowData) {
            for (var i = 0; i < allNeedHandleFollowData.length; i++) {
                var needHandleInfo = allNeedHandleFollowData[i];
                StationConfig.findByStaId(needHandleInfo.stationName).then(function (result) {
                    if (result.status) {
                        startBatchFollwData(needHandleInfo.stationName, result.stationConfig.config)
                    }
                })
            }

        }, function (err) {
            console.log(err)
        })
}

function batchHandleFollow(stationName) {
    getNeedHandleFiles(stationName, function () {
        StationConfig.findByStaId(stationName).then(function (result) {
            if (result.status) {
                startBatchFollwData(stationName, result.stationConfig.config)
            }
        })

    })
}
reBatchHandleFollow();

module.exports = {
    reBatchHandleFollow: reBatchHandleFollow,
    batchHandleFollow: batchHandleFollow
};
