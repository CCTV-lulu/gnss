/**
 * Created by xiaopingfeng on 12/28/16.
 */
var env = process.argv[2] || process.env.NODE_ENV || 'development';

var config = require('./config')[env];

var fs = require("fs");
var express = require('express');
var app = express();
var server = require('http').Server(app);

var io = require('socket.io')(server);
var statINFO ={2:[]}
var amqp = require('amqp-connection-manager');
//var parser = require('../parser');
var parse=require('../canavprocess/realtime_process.js');

Date.prototype.Format = function (fmt) { //author: meizz
    var o = {
        "M+": this.getMonth() + 1, //月份
        "d+": this.getDate(), //日
        "h+": this.getHours(), //小时
        "m+": this.getMinutes(), //分
        "s+": this.getSeconds(), //秒
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度
        "S": this.getMilliseconds() //毫秒
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

function changeTimestamp(data) {


    var receiveTime = data.time.replace(new RegExp('-', 'gm'), ',')
        .replace(new RegExp(' ', 'gm'), ',')
        .replace(new RegExp(':', 'gm'), ',');
    var dateArr = receiveTime.split(',')
    return Date.UTC(parseInt(dateArr[0]), parseInt(dateArr[1]) - 1, parseInt(dateArr[2]), parseInt(dateArr[3]), parseInt(dateArr[4]), parseInt(dateArr[5])) - 18000;
}

function saveStaInfo(data) {
    if (data.posR && data.posR.Lat == 0 && data.posR.Lon == 0) return 0;
    var updated_at = changeTimestamp(data);
    var staInfoId = Math.random().toString(36).substr(2) + Date.parse(new Date());
    var staInfo = {
        _id: staInfoId,
        station_id: data.station_id,
        signal_type: data.signal_type || 0,
        updated_at: updated_at,
        data: data
    };
    statINFO[2].push(staInfo);
    if(statINFO[2].length>300){
        statINFO[2].shift()
    }

    fs.stat("../station" + data.station_id, function (err, stat) {
        if (err == null) {
            if (stat.isDirectory()) {
                fs.readdir("../station" + data.station_id, function (err, files) {
                    if (err) return console.log(err);
                    if (files.length > 5) {
                        for (var n = 0; n < files.length - 5; n++) {
                            fs.unlink("../station" + data.station_id + '/' + files[n], function (err) {
                                if (err) throw err;
                            })
                        }
                    }
                    //console.log(staInfo)
                    writeFileSync(data, staInfo);
                })
            }
        } else if (err.code == 'ENOENT') {
            fs.mkdir("../station" + data.station_id, '0777', function (err) {
                if (err) return console.log(err);
                writeFileSync(data, staInfo);
            });
        } else {
            console.log('错误：' + err);
        }
    });
}

function writeFileSync(data, staInfo) {
    var fileDate = new Date();
    var dir_name = fileDate.Format("yyyy-MM-dd-hh");
    dir_name = dir_name + '-' + parseInt(fileDate.getMinutes() / 10);
    fs.writeFileSync("../station" + data.station_id + "/" + dir_name, JSON.stringify(staInfo) + "@qAq@", {flag: 'a'});
    //console.log('save station success')
}


function getCacheBuffer(station, buf) {
    if (station in allBuffers) {
        allBuffers[station].length = (allBuffers[station].length || 0) + buf.length;
        allBuffers[station].buffers.push(buf)
    } else {
        allBuffers[station] = {};
        allBuffers[station].length = buf.length;
        allBuffers[station].buffers = [buf];
    }
    return {
        buffLength: allBuffers[station].length,
        buffers: allBuffers[station].buffers
    }
}

function releaseCacheBuffer(station) {
    allBuffers[station].length = 0;
    allBuffers[station].buffers = [];
}

var allBuffers = {};


function getStationId(station, station_id) {
    var stationIds = {
        'beijing-test': 3,
        'beijing-thu': 2,
        'guangzhou-dev': 0,
        'shanghai-dev': 4,
        'hangkeyuan-04':5
    };
    return (stationIds[station] === undefined) ? (station_id || 0) : stationIds[station];
}

// Handle an incomming message.
function onMessage(data) {
    var message = data;
    var buf = Buffer.from(message.data, 'base64');
    var cacheBuffers = getCacheBuffer(message.station, buf);
    var buffLength = cacheBuffers.buffLength;
    var buffers = cacheBuffers.buffers;
    var bigBuff = Buffer.concat(buffers);
    var results = parse.parser_pos(0, bigBuff);
    releaseCacheBuffer(message.station);
    results.forEach(function (sta_data) {
        try {
            sta_data.station_id =  message.sta_id;
            saveStaInfo(sta_data)
        } catch (err) {
            console.log(err.message);
        }
    });

}

var StationSocketStatus = {};
io.on('connection', function (socket) {
    var stationName = socket.handshake.query.station
    socket.on('disconnect', function () {
        StationSocketStatus[stationName] = false
    });
    StationSocketStatus[stationName] = true;

    socket.on('' + stationName, function (data) {
        if (!StationSocketStatus[stationName]) {
            StationSocketStatus[stationName] = true;
        }

        onMessage(data)
        //console.log('receive')
    }, function (error) {
        console.log(error)
    });
});


function getstatINFO(number,id){
    if(number>1){
        return statINFO[id]
    }else{
        return [statINFO[id][statINFO[id].length-1]]
    }

}
module.exports = {
    StationSocketStatus: StationSocketStatus,
    getstatINFO: getstatINFO
};


server.listen(33666);

