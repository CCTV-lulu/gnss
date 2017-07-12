var lock = require('lockfile');

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

LogProcess.prototype.handleLogToData = function () {

};

LogProcess.prototype.handleFollowData = function () {

};
LogProcess.prototype.handleData = function(){
    var self = this;
    var logRecord = self.getLogRecord();
    if (logRecord.status || logRecord.infos.length === 0)  return;

    var info = self.update(true).then(function(info){
        if (info) {
            //removeOverTimeDate(info.logPath.split('/').pop());
            getStaData(info.cwd, info.logResolvePath, info.logPath, function () {
                self.update(false).then(function(){

                })
            })

        }else{
            self.update(false).then(function(){

            })
        }
    });

};