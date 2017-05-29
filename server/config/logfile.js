var env = process.argv[2] || process.env.NODE_ENV || 'development';
var config = require('./config')[env];

var multer = require('multer'); // v1.0.5
var path = require('path');
var cwd = config.cwd

var upload = multer({dest:cwd+ '/uploads/'}); // for parsing multipart/form-data，


const fs = require('fs');
var readLine = require('linebyline');

module.exports = function (app) {
    app.post('/logs', upload.single('log_file'), function (req, res, next) {
        var logPath = config.logPath.toString() + req.file.originalname
        var logResolvePath = cwd+logPath;
        var name = fs.rename(req.file.path, logResolvePath);
        getStaData(cwd,logResolvePath,logPath);
        // TODO verify the file received is right
        fs.readdir(cwd+"/logs", function (err, files) {
            if (err) {
                return
            }
            files.forEach(function (fileName) {
                var startDate = fileName.slice(-10);
                var endDate = req.file.originalname.slice(-10);
                var resultDays = GetDateDiff(startDate, endDate, "day");
                if (resultDays > 180) {
                    fs.unlink(cwd+"/logs" + '/' + fileName, function (err) {
                        if (err) throw err;
                    })//删除logs
                }
            })

        })
        fs.readdir(cwd+"/data", function (err, files) {
            if (err) {
                return
            }
            files.forEach(function (fileName) {
                var startDate = fileName.slice(-10);
                var endDate = req.file.originalname.slice(-10);
                var resultDays = GetDateDiff(startDate, endDate, "day");//半年删除一次log,data
                if (resultDays > 180) {
                    fs.unlink(cwd+"/data" + '/' + fileName, function (err) {
                        if (err) throw err;
                    })//删除data
                }
            })

        })
        // TODO convert to binary data log
        console.log(req.file.path);

        res.send("ok");
    });
};
//getStaData('./logs/shanghai-dev.log-2017-03-14');

//getStaData(cwd,cwd+"/logs/beijing-thu.log-2017-04-28","./logs/beijing-thu.log-2017-04-28")

function getStaData(cwd,logResolvePath,log_path) {
    var dataPath = cwd + '/data/' + log_path.split('/').pop().replace('log-', 'data-');
    var testStation = log_path.replace("./logs/", "").replace(".log-2017-04-28", "")
    //console.log(testPath)
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
        fs.writeFile(dataPath, buff,function () {
            console.log('-------------------------------------------ok')

        });
    });

}

function GetDateDiff(startTime, endTime, diffType) {
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
