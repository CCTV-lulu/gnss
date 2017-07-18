var lock = require('lockfile');
var child_process = require('child_process');
var path = require('path');
var StationConfig = require('../data/stationConfig');
var taskManagement = require('../service/taskManagement.js');
var dataRootPath = path.resolve('../');
var fs = require('fs');
var path = require('path');
var cwd = path.resolve('../');


function LogProcess() {
    this.lockFile = 'logRecord.lock';
    this.logSaveFile = 'server/config/logRecord.json';


}
LogProcess.prototype.addLogPath = function (logPath,cb) {
    var self = this;
    lock.lock(self.lockFile, {wait: 100, retries: 1, retryWait: 100}, function (err) {
        if (err) return cb({status: false})
        var logRecord = self.getLogRecord();
        logRecord.infos.push({logPath: logPath});
        fs.writeFileSync(self.logSaveFile, JSON.stringify(logRecord));
        lock.unlock(self.lockFile, function (err) {
            if (err) return
            cb({status: true})
        })

    })

};
LogProcess.prototype.getLogRecord = function () {
    var self = this;
    try {
        return JSON.parse(fs.readFileSync(self.logSaveFile, {flag: 'r+', encoding: 'utf8'}))

    } catch (err) {
        return {"status": false, "infos": []}
    }
};

LogProcess.prototype.removeLogPath = function (originalname) {
    var self = this;
    fs.readdir(cwd + "/logs", function (err, files) {
        if (err) {
            return
        }
        files.forEach(function (fileName) {
            var startDate = fileName.slice(-10);
            var endDate = originalname.slice(-10);//todo
            var resultDays = self.GetDateDiff(startDate, endDate, "day");
            if (resultDays > 180) {
                fs.unlink(cwd + "/logs" + '/' + fileName, function (err) {
                    if (err) throw err;
                })//删除logs
            }
        })

    })
    fs.readdir(cwd + "/data", function (err, files) {
        if (err) {
            return
        }
        files.forEach(function (fileName) {
            var startDate = fileName.slice(-10);
            var endDate = originalname.slice(-10); //todo
            var resultDays = self.GetDateDiff(startDate, endDate, "day");//半年删除一次log,data
            if (resultDays > 180) {
                fs.unlink(cwd + "/data" + '/' + fileName, function (err) {
                    if (err) throw err;
                })//删除data
            }
        })

    })

};

LogProcess.prototype.GetDateDiff = function (startTime, endTime, diffType) {
    startTime = startTime.replace(/\-/g, "/");
    endTime = endTime.replace(/\-/g, "/");

    diffType = diffType.toLowerCase();
    var sTime = new Date(startTime);
    var eTime = new Date(endTime);  //结束时间
    //作为除数的数字
    var divNum = 1;
    switch (diffType) {
        case "second":
            divNum = 1000;
            break;
        case "minute":
            divNum = 1000 * 60;
            break;
        case "hour":
            divNum = 1000 * 3600;
            break;
        case "day":
            divNum = 1000 * 3600 * 24;
            break;
        default:
            break;
    }
    return parseInt((eTime.getTime() - sTime.getTime()) / parseInt(divNum));
}

LogProcess.prototype.init = function () {
    var self = this;
    self.unlock(function () {
        self.update()
            .then(function () {
                self.start()
            });
    })

};
LogProcess.prototype.start = function () {
    var self = this;
    setInterval(function () {
        self.handleData()
    }, 1000 * 10)
};

LogProcess.prototype.update = function (isHandle) {
    var defer = Promise.defer();
    var logRecord = this.getLogRecord();
    var self = this
    logRecord.status = isHandle || false;
    var info = logRecord.infos[logRecord.infos.length - 1];
    if (isHandle === false) {
        info = logRecord.infos.pop()
    }

    lock.lock(self.lockFile, {wait: 100, retries: 1, retryWait: 100}, function (err) {
        if (err) return defer.resolve(info);
        fs.writeFileSync(self.logSaveFile, JSON.stringify(logRecord));
        lock.unlock(self.lockFile, function (err) {
            defer.resolve(info)
        })
    });
    return defer.promise

};

LogProcess.prototype.unlock = function (cb) {
    var self = this;
    lock.unlock(this.lockFile, function (err) {
        if (err) return self.unlock(cb);
        cb()
    });
};

LogProcess.prototype.handleLogToData = function (logPath, cb) {

    var batchChildProcess = child_process.fork('./server/service/handleProcess/logProcess.js');
    var self = this;
    batchChildProcess.on('message', function (result) {
        if (result.status == 'endOne') {
            batchChildProcess.send('close')
            return cb(result.message);
        }

    });
    batchChildProcess.on('close', function (message) {
        if (message == 0) {

        } else {
            self.handleLogToData(logPath)
        }
    });
    batchChildProcess.send({logPath: logPath,cwd:cwd})

};
LogProcess.prototype.handleFollowData = function (dataPath, cb) {
    var child = child_process.fork('./server/service/handleProcess/handleFollowData.js');
    child.on('message', function (message) {
        if (message.status === 'endOne') {
            return cb({status: true})
        }
    });
    child.on('close', function (message) {
        if (message !== 2) {
            return cb({status: false})
        }

    });
    var stationInfo = dataPath.split('.data')[0].split('/');
    var stationId = stationInfo[stationInfo.length - 1];
    var processId = LogProcess.saveFollowProcess(stationId, child);
    this.getHandleInfo(stationId.split('.')[0], dataPath, function (info) {
        child.send(info)
    })

};

LogProcess.saveFollowProcess = function (stationId, chlid) {
    return taskManagement.addProcess({stationId: stationId, process: chlid})
};

LogProcess.prototype.getHandleInfo = function (stationId, filePath, cb) {

    StationConfig.findByStaId(stationId).then(function (result) {
        var info = {
            status: 'handleData',
            cwd: dataRootPath,
            stationId: result.stationConfig.staId,
            filePath: filePath,
            config: result.stationConfig.config
        };
        cb(info);
    })

};


LogProcess.prototype.handleData = function () {
    var self = this;
    var logRecord = self.getLogRecord();
    if (logRecord.status || logRecord.infos.length === 0)  return;

    var info = self.update(true).then(function (info) {
        if (info) {
            self.removeLogPath(info.logPath.split('/').pop());
            self.handleLogToData(cwd+info.logPath, function (result) {
                    self.handleFollowData(result, function (handleResult) {
                        if(handleResult.status){
                            self.update(false).then(function () {
                            })
                        }else {
                            self.update()
                        }
                    })

                }
            )

        } else {
            self.update(false).then(function () {

            })
        }
    });

};

module.exports = LogProcess;