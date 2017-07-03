var MongoClient = require('mongodb').MongoClient;
var DB_CONN_STR = 'mongodb://localhost:27017/wang'; //数据库名为wang
var readLine = require('linebyline');
var fs = require('fs');

var cwd="/home/lulu";
var stationName="beijing-thu";

// var logResolvePath="/home/lulu/logs/beijing-thu.log-2017-06-07";
// var logPath="/logs/beijing-thu.log-2017-07"

var insertData=function (db,filter,cb) {
    var collection=db.collection('stationconfigs');
    collection.find(filter).toArray(function (err,result) {
        if(err){
            console.log(err)
            return
        }
        cb(result)
    })
}
function getMongosData(filter,cb) {
    MongoClient.connect(DB_CONN_STR,function (err,db) {
        console.log('连接成功')
        insertData(db,filter,function (result) {
            db.close();
            cb(result)
        })

    })
}
//获取数据库数据

var fileList=fs.readdirSync(cwd + "/data")
var index=0;
function findStaNameData(stationName) {

    if(stationName == (fileList[index]).split('.')[0]){
            var logResolvePath=cwd+'/data/'+fileList[index];
            var logPath='/data/'+fileList[0];
            getStaData(cwd,logResolvePath,logPath,function () {
                if(index<fileList.length-1){
                    index++;
                    findStaNameData(stationName,index)
                }
            })
        }

}
findStaNameData(stationName,index)
// findStaNameData(stationName,function (result) {
//     var logResolvePath=cwd+'/data/'+result;
//     var logPath='/data/'+result
//     getStaData(cwd,logResolvePath,logPath,function () {
//         console.log("=============")
//     })
// })
// getStaData(cwd,logResolvePath,logPath,function () {
//     console.log("++++++++++++")
// })

function getStaData(cwd, logResolvePath,dataPath,cb) {
    // console.log(log_path)
    // var dataPath = cwd + '/data/' + log_path.split('/').pop().replace('log-', 'data-');
    // console.log(dataPath)
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
        fs.writeFile(logResolvePath, buff, function () {
            console.log('-------------------------------------------ok')
            followProcess(cwd, logResolvePath, cb)

        });
    });

}


function followProcess(cwd, dataPath, cb) {
    var stream;
    var len = 300;
    var maxLen = 400;
    var followDataPath = cwd + '/followData/' + dataPath.split('/').pop();
    var fileName = followDataPath.split('/').pop();
    var stationId = fileName.split('.data-')[0];
    var timeInfo = fileName.replace("data-", '');
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

    //
     function findByStaId(staId,cb) {

        getMongosData({staId: staId},function (result) {
            // console.log(result)
            // result.findOne().exec(function (err, stationConfig) {
            if (!result[0]) {
                cb({status: false})
            }
            cb({status: true, stationConfig: result[0]})

        // });


        })

    }

    findByStaId(stationId,function (result) {
        var parse = require('../canavprocess/follow_process.js');

        if (result.status) {
            stream = fs.createReadStream(dataPath);
            parse.procinit(stationId, startTime, endTime, maxLen, result.stationConfig.config);
            var fwrite = fs.createWriteStream(followDataPath);
            stream.on('readable', function () {
                var data;
                while (null != (data = stream.read(len))) {
                    var logpos = parse.parser_pos(data);
                    // console.log('------------------')
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
    })

}

module.exports={
    findStaNameData:findStaNameData
}

