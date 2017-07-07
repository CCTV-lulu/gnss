var mongoose = require('mongoose');
var stationConfig = require('../data/Models/StationConfig');
mongoose.Promise = global.Promise;
var env = process.argv[2] || process.env.NODE_ENV || 'development';
var config = require('./config')[env];

var fs = require('fs');
var os = require('os');
var cwd = config.cwd;
var parse = require('../canavprocess/follow_process.js');
var readLine = require('linebyline');

    mongoose.connect(config.db);
    var db = mongoose.connection;

    db.once('open', function (err) {
        if (err) {
            console.log('Database could not be opened: ' + err);
            return;
        }
        console.log('Database up and running...')
    });

    db.on('error', function (err) {
        console.log('Database error: ' + err);
    });

    stationConfig.init();

var StationConfig = require('../data/stationConfig.js');




function followProcess(cwd, dataPath, cb) {
    var stream;
    var len = 300;
    var maxLen = 400;
    var followDataPath = cwd + '/followData/' + dataPath.split('/').pop();
    var fileName = followDataPath.split('/').pop();
    var stationId = fileName.split('.data-')[0];
    var timeInfo = fileName.split('.data-')[1];
    var startTime;
    var endTime;
    var now = new Date(timeInfo);
    startTime = [
        now.getYear() + 1900,
        now.getMonth(),
        now.getDate(), 0, 0, 0
    ];
    endTime = [
        now.getYear() + 1900,
        now.getMonth(),
        now.getDate(), 23, 59, 59
    ];

    StationConfig.findByStaId(stationId).then(function (result) {

        if (result.status) {
            stream = fs.createReadStream(dataPath);
            parse.procinit(stationId, startTime, endTime, maxLen, result.stationConfig.config);
            var fwrite = fs.createWriteStream(followDataPath);
            stream.on('readable', function () {
                var data;
                while (null != (data = stream.read(len))) {
                    var logpos = parse.parser_pos(data);
                    logpos.forEach(function (log) {

                        var obj = {"time": log.time, "data": log.posR};
                        fwrite.write(JSON.stringify(obj) + os.EOL);
                    });
                }
            });
            stream.on("end", function () {
                console.log('the file process end');
            });
            stream.on("close", function () {
                console.log('the file process close');
                fwrite.close();
                cb()
            });
        }
    });
}



function getDateFromLog(cwd, logResolvePath, cb){
        var dataPath = cwd + '/data/' + logResolvePath.split('/').pop().replace('log-', 'data-');
        var allData = [];
        var rl = readLine(logResolvePath);
        rl.on('line', function (line, idx) {
            var send = line.replace(/" "/g, "").replace(/:/g, "");
            var sendInfo = send.split("'");
            if (sendInfo[0].indexOf('data') > -1) {
                var info = sendInfo[1];
                var data = Buffer.from(info, 'base64');
                allData.push(data)
            }
        });
        rl.on('end', function () {
            var buff = Buffer.concat(allData);
            fs.writeFile(dataPath, buff, function () {
                cb({filePath: dataPath})
            });
        });
}


process.on('message', function (message) {
    if (message == 'close') {
        return process.exit()
    }
    if (message.status === 'handleData') {
        followProcess(message.cwd, message.filePath, function () {
            process.send({status: 'endOne', stationName: message.stationName, filePath: message.filePath})
        })
    }
    if (message.status === 'handleLog') {
        getDateFromLog(message.cwd, message.logPath,function(result){
            followProcess(message.cwd,result.filePath , function () {
                process.send({status: 'endOne', stationName: message.stationName, logPath: message.logPath})
            })
        })
    }
});




