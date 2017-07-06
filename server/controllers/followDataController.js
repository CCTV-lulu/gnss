var child_process = require('child_process');
var FollowDate = require('../data/followData');
var fs = require('fs');
var followHandleProcess = {};
// var env = process.argv[2] || process.env.NODE_ENV || 'development';
// var config = require('./config')[env];
// var cwd = config.cwd;
var cwd = "/home/lulu";
function saveFollowProcess(stationName, child) {
    followHandleProcess[stationName] = child;
}
function getFollowProcess(stationName) {
    return followHandleProcess[stationName]
}

function startBatchFollwData(stationName) {


    if (getFollowProcess(stationName)) {
        try {
            getFollowProcess(stationName).send('close')
        } catch (err) {
            saveFollowProcess(stationName, undefined)
        }

    }

    var child = child_process.fork('./server/config/handleFollowData');
    child.on('message', function (message) {
        // if (message.status === 'end') {
        //     child.send('close')
        // }
        if (message.status === 'endOne') {
            console.log("-----------endOne")
            console.log(message)
            FollowDate.removeFilePath(message.stationName, message.filePath).then(function () {
                FollowDate.getHandleInfoByStaionName(message.stationName).then(function (result) {
                    if (result.filePath.length > 0) {
                        child.send({stationName: result.stationName, filePath: result.filePath[0]})
                    } else {
                        FollowDate.clearByStationName(stationName).then(function () {
                            child.send('close')
                        })
                    }

                })
            });


        }
    });
    child.on('close', function () {
        console.log('-----------------------close')
        FollowDate.getHandleInfoByStaionName(stationName).then(function (handleInfo) {
            if (handleInfo == null)  return
            if (handleInfo.filesPath.length > 0) {
                setTimeout(function () {
                    startBatchFollwData(stationName, handleInfo.filePath[0])
                }, 3000)
            } else {
                saveFollowProcess(stationName, undefined)
            }
        })

    });

    saveFollowProcess(stationName, child);

    FollowDate.getHandleInfoByStaionName(stationName).then(function (result) {
        child.send({stationName: result.stationName, filePath: result.filePath[0]})
    })

    // child.send({stationName: stationName, filePath: filePath})
}


function getNeedHandleFiles(stationName, cb) {
    var fileList = fs.readdirSync(cwd + "/data");
    FollowDate.clearByStationName(stationName).then(function () {
        var needHandleinfo = [];
        for (var i = 0; i < fileList.length; i++) {
            var fileStationName = fileList[i].split('.')[0];
            if (stationName === fileStationName) {
                var logResolvePath = cwd + '/data/' + fileList[i];
                needHandleinfo.push(logResolvePath)
            }
        }
        FollowDate.saveStationNeedHandleInfo(stationName, needHandleinfo)
            .then(function (result) {
                cb()
            })
    })


}


function reBatchHandleFollow() {
    console.log('-------------------------------res')
    FollowDate.all().then(function (allNeedHandleFollowData) {
        for (var i = 0; i < allNeedHandleFollowData.length; i++) {
            var needHandleInfo = allNeedHandleFollowData[i];
            startBatchFollwData(needHandleInfo.stationName)
        }

    })
}

function batchHandleFollow(stationName) {
    getNeedHandleFiles(stationName, function () {
            startBatchFollwData(stationName)
    })
}
reBatchHandleFollow();

module.exports = {
    reBatchHandleFollow: reBatchHandleFollow,
    batchHandleFollow: batchHandleFollow
};
