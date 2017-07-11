//var child_process = require('child_process');
//var FollowDate = require('../data/followData');
//var fs = require('fs');
//var followHandleProcess = {};
// var env = process.argv[2] || process.env.NODE_ENV || 'development';
// var config = require('../config/config')[env];
// var cwd = config.cwd;
//function saveFollowProcess(stationName, child) {
//    followHandleProcess[stationName] = child;
//}
//function getFollowProcess(stationName) {
//    return followHandleProcess[stationName]
//}
//
//
//function initProcess(stationName) {
//    if (getFollowProcess(stationName)) {
//        try {
//            getFollowProcess(stationName).send('close')
//        } catch (err) {
//            saveFollowProcess(stationName, undefined)
//        }
//
//    }
//}
//function startBatchFollwData(stationName) {
//    initProcess(stationName);
//    console.log('--------start')
//
//    var child = child_process.fork('./server/config/handleFollowData');
//    child.on('message', function (message) {
//        if (message.status === 'endOne') {
//            startNext(message)
//        }
//    });
//    child.on('close', function () {
//        FollowDate.getHandleInfoByStaionName(stationName).then(function (handleInfo) {
//            if (handleInfo == null)  return;
//            if (handleInfo.filePath.length > 0) {
//                setTimeout(function () {
//                    startBatchFollwData(stationName)
//                }, 3000)
//            } else {
//                saveFollowProcess(stationName, undefined)
//            }
//        }, function (err) {
//            console.log(err)
//        })
//
//    });
//
//    saveFollowProcess(stationName, child);
//    startHandle();
//
//    function startHandle() {
//        FollowDate.getHandleInfoByStaionName(stationName).then(function (result) {
//            if (result.filePath.length > 0) {
//                child.send({status: 'handleData',cwd:cwd, stationName: result.stationName, filePath: result.filePath[0]})
//            } else {
//                FollowDate.clearByStationName(stationName)
//                    .then(function () {
//                        child.send('close')
//                    }, function (err) {
//                        console.log(err)
//                    })
//            }
//        }, function (err) {
//            console.log(err)
//        });
//    }
//
//    function startNext(message) {
//        FollowDate.removeFilePath(message.stationName, message.filePath)
//            .then(function () {
//                startHandle()
//            }, function (err) {
//                console.log(err)
//            });
//    }
//
//
//    // child.send({stationName: stationName, filePath: filePath})
//}
//
//
//function getNeedHandleFiles(stationName, cb) {
//    var fileList = fs.readdirSync(cwd + "/data");
//    FollowDate.clearByStationName(stationName)
//        .then(function () {
//            var needHandleinfo = [];
//            for (var i = 0; i < fileList.length; i++) {
//                var fileStationName = fileList[i].split('.')[0];
//                if (stationName === fileStationName) {
//                    var logResolvePath = cwd + '/data/' + fileList[i];
//                    needHandleinfo.push(logResolvePath)
//                }
//            }
//            FollowDate.saveStationNeedHandleInfo(stationName, needHandleinfo)
//                .then(function (result) {
//                    cb()
//                })
//        }, function (err) {
//            console.log(err)
//        })
//
//
//}
//
//
//function reBatchHandleFollow() {
//    FollowDate.all()
//        .then(function (allNeedHandleFollowData) {
//            for (var i = 0; i < allNeedHandleFollowData.length; i++) {
//                var needHandleInfo = allNeedHandleFollowData[i];
//                startBatchFollwData(needHandleInfo.stationName)
//            }
//
//        }, function (err) {
//            console.log(err)
//        })
//}
//
//function batchHandleFollow(stationName) {
//    getNeedHandleFiles(stationName, function () {
//        startBatchFollwData(stationName)
//    })
//}
//reBatchHandleFollow();
//
//module.exports = {
//    reBatchHandleFollow: reBatchHandleFollow,
//    batchHandleFollow: batchHandleFollow
//};
