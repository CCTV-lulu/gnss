
var mongoose = require('mongoose');
var stationConfig = require('../data/Models/StationConfig');
var followData = require('../data/Models/followData');
mongoose.Promise = global.Promise;
var env = process.argv[2] || process.env.NODE_ENV || 'development';
var config = require('./config')[env];


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
followData.init()

var FollowDate = require('../data/followData');
var StationConfig = require('../data/stationConfig.js');

var fs = require('fs');
var os = require('os');
var config = require('./config')[env];
var cwd = config.cwd;
var parse = require('../canavprocess/follow_process.js')

function HandleData(stationName,filePath,cb) {
    followProcess(cwd, filePath, function (err) {
        console.log('------------------------')
        cb()
    })

}

function followProcess(cwd, dataPath, cb) {
    var stream;
    var len = 300;
    var maxLen = 500;
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
            console.log(startTime)
            console.log(endTime)
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

function startHandleData(stationName,filePath, cb) {

        HandleData(stationName,filePath,function () {
        console.log("-=-=-=-==-==-=")
        cb()
    })

}

process.on('message', function (message) {
    if (message == 'close') {
        return process.exit()
    }
    startHandleData(message.stationName,message.filePath, function () {
        process.send({status: 'endOne',stationName: message.stationName,filePath:message.filePath})
    })
});




