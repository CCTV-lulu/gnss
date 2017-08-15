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

    app.post('/logs',function (req, res, next) {
            var formidable = require('formidable');
            var form = new formidable.IncomingForm();
            var name
            form.maxFieldsSize = 100 * 1024 * 1024;
            form.maxFields = 0;
            form.uploadDir = '../uploads'
            form.parse(req, function(err, fields, files) {
                if(!err){
                     name = fs.rename(files.log_file.path, cwd+'/logs/'+files.log_file.name, function (err) {
                         if(err){
                             res.status(404)
                                 .send('Not Found')
                         }else {
                             logProcess.addLogPath('/logs/' + files.log_file.name, function (result) {
                                 if (result.status) {
                                     return res.send('ok')
                                 }
                                 res.status(404)
                                     .send('Not Found')
                             })
                         }

                     })

                }else{
                    console.log('---------------err')
                    console.log(err)
                    res.status(404)
                             .send('Not Found')
                }

            });



    });
    // app.post('/logs', upload.single('log_file'), function (req, res, next) {
    //     var logPath = config.logPath.toString() + req.file.originalname;
    //     var logResolvePath = cwd + logPath;
    //     var name = fs.rename(req.file.path, logResolvePath, function () {
    //         logProcess.addLogPath(logPath, function (result) {
    //             if (result.status) {
    //                 return res.send('ok')
    //             }
    //             res.status(404)
    //                 .send('Not Found')
    //         })
    //     })
    // })

};







