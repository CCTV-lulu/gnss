var env = process.argv[2] || process.env.NODE_ENV || 'development';
var config = require('./config')[env];

var multer = require('multer'); // v1.0.5
var path = require('path');
var cwd = config.cwd;
var upload = multer({dest: cwd + '/uploads/'}); // for parsing multipart/form-data，
var StationConfig = require('../data/stationConfig.js');

var fs = require('fs');
var readLine = require('linebyline');

var parse = require('../canavprocess/follow_process.js');
var os = require('os');
var lock = require('lockfile')
var LogProcess = require('../service/LogProcess.js')

// var formidable = require('formidable');
// var file_op = require('../util/file_operate');

//
var logProcess = new LogProcess();
logProcess.init()



module.exports = function (app) {

    app.post('/logs',upload.single('log_file'),function (req, res, next) {


            //file_op.rm('uploads');
            var file_op    = require('../util/file_operate');
            var formidable = require('formidable');
            file_op.mkdirsSync('uploads');
            var form = new formidable.IncomingForm();
            form.maxFieldsSize = 20 * 1024 * 1024;
            form.maxFields = 0;
            form.uploadDir = 'uploads'
            form.parse(req, function(err, fields, files) {

                if(!err){
                    console.log(fields)
                    console.log(files.log_file.name)
                    return res.send('ok')
                }else{
                    res.status(404)
                             .send('Not Found')
                }
                //fs.rename(files.my_file.path, filePath,function(err){
                //    if(err){
                //        self.res.send(err+"");
                //    }else{
                //        self.unzip(filePath);
                //    }
                //});

            });

        //res.send('asdfas')
            // addLogResolve(cwd, logResolvePath, logPath,function(result){
            //     if(result.status){
            //      return res.send('ok')

            //     }
            //     //fs.rename(files.my_file.path, filePath,function(err){
            //     //    if(err){
            //     //        self.res.send(err+"");
            //     //    }else{
            //     //        self.unzip(filePath);
            //     //    }
            //     //});
            //
            // });

        res.send('asdfas')
            addLogResolve(cwd, logResolvePath, logPath,function(result){
                if(result.status){
                 return res.send('ok')
                }
                res.status(404)
                    .send('Not Found')

            })

            getStaData(cwd, logResolvePath,logPath,function(){
                ISHANDLELOLOG = false
            });

        //});


    });
};


// function addLogResolve(cwd, logResolvePath, logPath,cb) {
//     lock.lock('logRecord.lock',{wait:100,retries:1,retryWait:100} ,function (err) {
//         if (err) return cb({status: false})
//         var logRecord = getLogRecord();
//         logRecord.infos.push({'cwd': cwd, 'logResolvePath': logResolvePath, 'logPath': logPath});
//         fs.writeFileSync('server/config/logRecord.json', JSON.stringify(logRecord))
//         lock.unlock('logRecord.lock',function(err){
//             if(err) return
//             cb({status: true})
//         })
//
//     })
//
// }
//
//
// function saveStartLog(isHandle) {
//     var logRecord = getLogRecord();
//     logRecord.status = isHandle||false;
//     var info = logRecord.infos[logRecord.infos.length-1];
//     if (isHandle === false) {
//         info = logRecord.infos.pop()
//     }
//     lock.lock('logRecord.lock',{wait:100,retries:1,retryWait:100},function (err) {
//         if (err) return;
//         fs.writeFileSync('server/config/logRecord.json', JSON.stringify(logRecord))
//         lock.unlock('logRecord.lock',function (err) {
//         })
//     });
//
//     return info
// }
//
// function getLogRecord() {
//     try {
//         return JSON.parse(fs.readFileSync('server/config/logRecord.json', {flag: 'r+', encoding: 'utf8'}))
//
//
//     } catch (err) {
//         return {"status": false, "infos": []}
//     }
//
//
// }
//
//
// startHandleLogFile();
//
// function startHandleLogFile() {
//
//     initLock(function(){
//         saveStartLog();
//         setInterval(function () {
//             handleLogFile()
//         }, 1000 * 30)
//     })
//
// }
//
// function initLock(cb){
//     lock.unlock('logRecord.lock', function (err) {
//
//         if(err) return initLock(cb);
//         cb()
//     });
// }
//
// function handleLogFile() {
//     var logRecord = getLogRecord();
//     if (logRecord.status || logRecord.infos.length === 0)  return;
//
//     var info = saveStartLog(true);
//     if (info) {
//         removeOverTimeDate(info.logPath.split('/').pop());
//         getStaData(info.cwd, info.logResolvePath, info.logPath, function () {
//             saveStartLog(false)
//         })
//
//     }else{
//         saveStartLog(false)
//     }
//
// }
//
// // removeOverTimeDate(req.file.originalname)
//
//
// function removeOverTimeDate(originalname) {
//     fs.readdir(cwd + "/logs", function (err, files) {
//         if (err) {
//             return
//         }
//         files.forEach(function (fileName) {
//             var startDate = fileName.slice(-10);
//             var endDate = originalname.slice(-10);//todo
//             var resultDays = GetDateDiff(startDate, endDate, "day");
//             if (resultDays > 180) {
//                 fs.unlink(cwd + "/logs" + '/' + fileName, function (err) {
//                     if (err) throw err;
//                 })//删除logs
//             }
//         })
//
//     })
//     fs.readdir(cwd + "/data", function (err, files) {
//         if (err) {
//             return
//         }
//         files.forEach(function (fileName) {
//             var startDate = fileName.slice(-10);
//             var endDate = originalname.slice(-10); //todo
//             var resultDays = GetDateDiff(startDate, endDate, "day");//半年删除一次log,data
//             if (resultDays > 180) {
//                 fs.unlink(cwd + "/data" + '/' + fileName, function (err) {
//                     if (err) throw err;
//                 })//删除data
//             }
//         })
//
//     })
//
//
// }
// //getStaData('./logs/shanghai-dev.log-2017-03-14');
//
//
//  //getStaData(cwd,cwd+"/logs/hangkeyuan-11.log-2017-07-09","./logs/hangkeyuan-11.log-2017-07-09")
//
// function getStaData(cwd, logResolvePath, log_path, cb) {
//     var dataPath = cwd + '/data/' + log_path.split('/').pop().replace('log-', 'data-');
//     var allData = [];
//     var rl = readLine(logResolvePath);
//     rl.on('line', function (line, idx) {
//         var send = line.replace(/" "/g, "").replace(/:/g, "");
//         var sendInfo = send.split("'");
//         if (sendInfo[0].indexOf('data') > -1) {
//             var info = sendInfo[1];
//             var data = Buffer.from(info, 'base64');
//             allData.push(data)
//         }
//     });
//     rl.on('end', function () {
//         var buff = Buffer.concat(allData);
//         fs.writeFile(dataPath, buff, function () {
//             console.log('-------------------------------------------ok')
//             followProcess(cwd, dataPath, cb)
//
//         });
//     });
//
// }
//
// function GetDateDiff(startTime, endTime, diffType) {
//     startTime = startTime.replace(/\-/g, "/");
//     endTime = endTime.replace(/\-/g, "/");
//
//     diffType = diffType.toLowerCase();
//     var sTime = new Date(startTime);
//     var eTime = new Date(endTime);  //结束时间
//     //作为除数的数字
//     var divNum = 1;
//     switch (diffType) {
//         case "second":
//             divNum = 1000;
//             break;
//         case "minute":
//             divNum = 1000 * 60;
//             break;
//         case "hour":
//             divNum = 1000 * 3600;
//             break;
//         case "day":
//             divNum = 1000 * 3600 * 24;
//             break;
//         default:
//             break;
//     }
//     return parseInt((eTime.getTime() - sTime.getTime()) / parseInt(divNum));
// }
//
//
// function followProcess(cwd, dataPath, cb) {
//     var stream;
//     var len = 300;
//     var maxLen = 400;
//     var followDataPath = cwd + '/followData/' + dataPath.split('/').pop();
//     console.log('----------datapath------'+dataPath)
//     console.log('---------followData-------'+followDataPath)
//     var fileName = followDataPath.split('/').pop();
//     var stationId = fileName.split('.data-')[0];
//     var timeInfo = fileName.split('.data-')[1];
//     var startTime;
//     var endTime;
//     var now = new Date(timeInfo);
//     startTime = [
//         now.getYear() + 1900,
//         now.getMonth(),
//         now.getDate(), 0, 0, 0
//     ];
//     endTime = [
//         now.getYear() + 1900,
//         now.getMonth(),
//         now.getDate(), 23, 59, 59
//     ];
//
//     //
//     StationConfig.findByStaId(stationId).then(function (result) {
//
//         if (result.status) {
//             stream = fs.createReadStream(dataPath);
//             parse.procinit(stationId, startTime, endTime, maxLen, result.stationConfig.config);
//
//             var fwrite = fs.createWriteStream(followDataPath);
//             stream.on('readable', function () {
//                 var data;
//                 while (null != (data = stream.read(len))) {
//                     var logpos = parse.parser_pos(data);
//                     logpos.forEach(function (log) {
//                         console.log('------------')
//                         var obj = {"time": log.time, "data": log.posR};
//                         fwrite.write(JSON.stringify(obj) + os.EOL);
//                     });
//                 }
//             });
//             stream.on("end", function () {
//                 console.log('the file process end');
//             });
//             stream.on("close", function () {
//                 console.log('the file process close');
//                 fwrite.close();
//                 // cb()
//             });
//         }
//     });
//
//
//     /*stream.on('data',function (data) {
//      //console.log('data event is strigger');
//      parse.datatype(sta_id,data);
//      });*/
//
// }
// followProcess(cwd,cwd+"/data/beijing-thu.data-2017-06-27",function(){
//
// });

