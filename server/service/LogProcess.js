var lock = require('lockfile');
var child_process = require('child_process');
var path = require('path');
var StationConfig = require('../data/stationConfig');
var taskManagement = require('../service/taskManagement.js');
var dataRootPath = path.resolve('../');

function LogProcess(logPath) {
    this.lockFile = 'logRecord.lock';
    this.logSaveFile = 'server/config/logRecord.json';


}
LogProcess.prototype.addLogPath = function (logPath) {
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

LogProcess.prototype.removeLogPath = function () {

};
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
    setInterval(function () {

    }, 1000 * 30)
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
    var batchChildProcess = child_process.fork('./service/handleProcess/logProcess.js');
    var self = this;
    batchChildProcess.on('message', function (result) {
        if (result.status == 'endOne') {
            batchChildProcess.send('close')
            return cb(result.dataPath);
        }

    });
    batchChildProcess.on('close', function (message) {
        if (message == 0) {

        } else {
            self.handleLogToData(logPath)
        }
    });
    batchChildProcess.send({logPath: logPath})

};
LogProcess.prototype.handleFollowData = function (dataPath, cb) {
    var child = child_process.fork('./service/handleProcess/handleFollowData.js');
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
    var processId = this.saveFollowProcess(stationId, child);
    this.getHandleInfo(stationId, dataPath, function (info) {
        child.send(info)
    })

};

LogProcess.saveFollowProcess = function (stationId, chlid) {
    return taskManagement.addProcess({stationId: stationId, process: chlid})
};

LogProcess.prototype.getHandleInfo = function (stationId,filePath, cb) {
    var config //todo;
    StationConfig.findByStaId(stationId).then(function(){
        var info = {
            status: 'handleData',
            cwd: dataRootPath,
            stationId: result.stationId,
            filePath: filePath,
            config: config
        };
        return info;
    })

};
LogProcess.prototype.handleData = function () {
    var self = this;
    var logRecord = self.getLogRecord();
    if (logRecord.status || logRecord.infos.length === 0)  return;

    var info = self.update(true).then(function (info) {
        if (info) {
            //removeOverTimeDate(info.logPath.split('/').pop());
            getStaData(info.cwd, info.logResolvePath, info.logPath, function () {
                self.update(false).then(function () {

                })
            })

        } else {
            self.update(false).then(function () {

            })
        }
    });

};