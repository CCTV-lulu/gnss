#!/usr/bin/env node

var fs = require('fs');
var os=require('os');
var parse=require('../follow_process');
var test_file=  '/home/long/document/data/rover_20170704';
var log_file= '/home/long/document/data/rover_20170704_log';
console.log('test file:' + test_file);
var stream;
var sta_id=0;
var len=300;
stream = fs.createReadStream(test_file);
/*stream.on('data',function (data) {
    //console.log('data event is strigger');
    parse.datatype(sta_id,data);
});*/
parse.procinit(0,[2017,6,4,0,0,0],[2017,6,4,23,59,59],400);
var fwrite=fs.createWriteStream(log_file);
stream.on('readable',function () {
    var data;
    while (null != (data = stream.read(len))) {
        var logpos=parse.parser_pos(data);
        logpos.forEach(function (log) {
            var obj={"time":log.time,"data":log.posR};
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
