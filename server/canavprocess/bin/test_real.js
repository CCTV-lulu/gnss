#!/usr/bin/env node

var fs = require('fs');
var os=require('os');
var parse=require('../realtime_process.js');
var test_file= 'D:/nodejs/data/rover_20170531.txt';
var log_file= 'D:/nodejs/data/rover_20170531_real_log.txt';
var stream;
var sta_id=0;
var len=300;
stream = fs.createReadStream(test_file);
var fwrite=fs.createWriteStream(log_file);
/*stream.on('data',function (data) {
 //console.log('data event is strigger');
 parse.datatype(sta_id,data);
 });*/

stream.on('readable',function () {
    var data;
    while (null != (data = stream.read(len))) {
        var logpos=parse.parser_pos(sta_id,data);
        logpos.forEach(function (obj) {
            fwrite.write(JSON.stringify(obj)+os.EOL);
        });
    }
});
stream.on("end",function () {
    console.log('the file process end');
});
stream.on("close", function () {
    console.log('the file process close');
    fwrite.close();
    process.emit(1);
});
